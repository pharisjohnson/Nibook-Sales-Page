import { Router, type IRouter, type Request, type Response } from "express";
import { getInsforgeAdmin } from "../lib/insforge.js";
import {
  jengaPost, jengaGet, normalizePhone, makeReference, splitAmount,
  MERCHANT_CODE, NIBOOK_ACCOUNT,
} from "../lib/jenga.js";

const router: IRouter = Router();

// ─── IMPORTANT: Confirm these endpoint paths from your JengaHQ dashboard ─────
// After signing up at https://jengahq.typeform.com/to/acVeS3 and accessing
// the API Explorer, verify these paths match your sandbox/production docs.
const ENDPOINTS = {
  // M-Pesa STK push (request payment from client's phone)
  collectMpesa: "/account-api/v3.0/transaction/sendmobilemoneyrequest",
  // Query STK push status
  collectStatus: "/account-api/v3.0/transaction/sendmobilemoneyrequest/status",
  // Send money to business M-Pesa/mobile wallet
  disburseMobile: "/account-api/v3.0/transaction/sendmoneymobilerequest",
  // Send money to business bank account
  disburseBank: "/account-api/v3.0/transaction/sendmoneytobankaccount",
} as const;

// ─── POST /api/jenga/collect ──────────────────────────────────────────────────
// Client initiates M-Pesa payment for a booking.
// Body: { booking_id, phone, amount, business_name }
router.post("/jenga/collect", async (req: Request, res: Response) => {
  const { booking_id, phone, amount, business_name } = req.body as {
    booking_id?: string;
    phone?: string;
    amount?: number;
    business_name?: string;
  };

  if (!booking_id || !phone || !amount) {
    res.status(400).json({ success: false, message: "booking_id, phone, and amount are required" });
    return;
  }

  if (!process.env.JENGA_API_KEY || !MERCHANT_CODE) {
    res.status(500).json({ success: false, message: "Jenga credentials not configured" });
    return;
  }

  const reference = makeReference();
  const msisdn = normalizePhone(phone);
  const callbackUrl = `${process.env.APP_URL ?? "https://nibook.noonstudio.africa"}/api/jenga/callback`;

  const body = {
    merchantCode: MERCHANT_CODE,
    orderReference: reference,
    amount: String(amount),
    currencyCode: "KES",
    customerMSISDN: msisdn,
    callbackUrl,
    description: `Payment for ${business_name ?? "booking"}`,
  };

  // Signature fields for M-Pesa STK push (confirm order from Jenga docs)
  const signatureFields = `${MERCHANT_CODE}${reference}${amount}KES${msisdn}`;

  const db = getInsforgeAdmin();

  try {
    // Record intent before calling Jenga
    await db.database.from("booking_payments").insert({
      booking_id,
      reference,
      phone: msisdn,
      amount,
      status: "pending",
    });

    const { ok, data } = await jengaPost(ENDPOINTS.collectMpesa, body, signatureFields);

    if (!ok) {
      await db.database.from("booking_payments").update({ status: "failed" }).eq("reference", reference);
      res.status(502).json({ success: false, message: "Jenga STK push failed", details: data });
      return;
    }

    res.json({ success: true, reference, message: "Check your phone and confirm the M-Pesa prompt" });
  } catch (err) {
    res.status(502).json({ success: false, message: "Failed to reach Jenga", error: String(err) });
  }
});

// ─── GET /api/jenga/collect/status/:reference ─────────────────────────────────
// Poll payment status (client polls this after STK push while waiting for user to confirm).
router.get("/jenga/collect/status/:reference", async (req: Request, res: Response) => {
  const { reference } = req.params;

  const db = getInsforgeAdmin();
  const { data: row } = await db.database
    .from("booking_payments").select("*").eq("reference", reference).single();

  // If already marked paid/failed in DB (by webhook), return that immediately
  if (row?.status === "paid") {
    res.json({ success: true, status: "paid" });
    return;
  }
  if (row?.status === "failed") {
    res.json({ success: true, status: "failed" });
    return;
  }

  // Otherwise query Jenga directly
  const signatureFields = `${MERCHANT_CODE}${reference}`;
  try {
    const { ok, data } = await jengaGet(
      `${ENDPOINTS.collectStatus}/${encodeURIComponent(reference)}`,
      signatureFields,
    );

    if (!ok) {
      res.json({ success: true, status: "pending" });
      return;
    }

    const jenga = data as Record<string, unknown>;
    const jenga_status = String(jenga.status ?? jenga.transactionStatus ?? "PENDING").toUpperCase();
    const paid = ["SUCCESS", "COMPLETE", "COMPLETED"].includes(jenga_status);
    const failed = ["FAILED", "CANCELLED", "CANCELED"].includes(jenga_status);

    if (paid || failed) {
      await db.database.from("booking_payments")
        .update({ status: paid ? "paid" : "failed", jenga_response: data })
        .eq("reference", reference);
    }

    res.json({ success: true, status: paid ? "paid" : failed ? "failed" : "pending" });
  } catch {
    res.json({ success: true, status: "pending" });
  }
});

// ─── POST /api/jenga/callback ─────────────────────────────────────────────────
// Jenga posts payment outcomes here. Must be publicly reachable.
// Register this URL in your JengaHQ dashboard as the callback/webhook URL.
router.post("/jenga/callback", async (req: Request, res: Response) => {
  // Acknowledge immediately — Jenga may retry if we're slow
  res.json({ received: true });

  const payload = req.body as Record<string, unknown>;
  const reference = String(payload.orderReference ?? payload.reference ?? "");
  const rawStatus = String(payload.status ?? payload.transactionStatus ?? "").toUpperCase();

  if (!reference) return;

  const paid = ["SUCCESS", "COMPLETE", "COMPLETED"].includes(rawStatus);
  const failed = ["FAILED", "CANCELLED", "CANCELED"].includes(rawStatus);
  if (!paid && !failed) return;

  const db = getInsforgeAdmin();

  try {
    // Update payment record
    await db.database.from("booking_payments")
      .update({
        status: paid ? "paid" : "failed",
        callback_payload: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference);

    if (!paid) return;

    // Fetch payment + booking + business profile to trigger disbursement
    const { data: payment } = await db.database
      .from("booking_payments").select("booking_id, amount").eq("reference", reference).single();

    if (!payment) return;

    await db.database.from("bookings")
      .update({ payment_status: "paid" })
      .eq("id", payment.booking_id);

    const { data: booking } = await db.database
      .from("bookings").select("owner_id").eq("id", payment.booking_id).single();

    if (!booking?.owner_id) return;

    const { data: profile } = await db.database
      .from("profiles")
      .select("business_name, payout_mobile, payout_bank_account, payout_bank_name")
      .eq("id", booking.owner_id)
      .single();

    if (!profile) return;

    // Disburse to business — prefer mobile money, fall back to bank
    const { businessAmount } = splitAmount(Number(payment.amount));

    if (profile.payout_mobile) {
      await disburseMobile({
        businessName: profile.business_name ?? "Business",
        mobile: profile.payout_mobile,
        amount: businessAmount,
        reference: `PAYOUT-${reference}`,
      });
    } else if (profile.payout_bank_account && profile.payout_bank_name) {
      await disburseBank({
        businessName: profile.business_name ?? "Business",
        accountNumber: profile.payout_bank_account,
        bankCode: profile.payout_bank_name,
        amount: businessAmount,
        reference: `PAYOUT-${reference}`,
      });
    }

    // Record the payout
    await db.database.from("booking_payments").update({
      payout_amount: businessAmount,
      payout_status: "sent",
    }).eq("reference", reference);

  } catch (err) {
    console.error("[Jenga callback] processing error", err);
  }
});

// ─── Internal: disburse to mobile wallet ─────────────────────────────────────
async function disburseMobile({ businessName, mobile, amount, reference }: {
  businessName: string; mobile: string; amount: number; reference: string;
}) {
  const msisdn = normalizePhone(mobile);
  const body = {
    source: { countryCode: "KE", name: "Nibook", accountNumber: NIBOOK_ACCOUNT },
    destination: { type: "mobile", countryCode: "KE", name: businessName, mobileNumber: msisdn },
    transfer: {
      type: "PesaLink",
      amount: String(amount),
      currencyCode: "KES",
      reference,
      description: "Booking payout from Nibook",
    },
  };
  // Signature fields: amount + currencyCode + reference + merchantCode (confirm from Jenga docs)
  const signatureFields = `${amount}KES${reference}${MERCHANT_CODE}`;
  await jengaPost(ENDPOINTS.disburseMobile, body, signatureFields);
}

// ─── Internal: disburse to bank account ──────────────────────────────────────
async function disburseBank({ businessName, accountNumber, bankCode, amount, reference }: {
  businessName: string; accountNumber: string; bankCode: string; amount: number; reference: string;
}) {
  const body = {
    source: { countryCode: "KE", name: "Nibook", accountNumber: NIBOOK_ACCOUNT },
    destination: {
      type: "bank",
      countryCode: "KE",
      name: businessName,
      accountNumber,
      bankCode,
    },
    transfer: {
      type: "EFT",
      amount: String(amount),
      currencyCode: "KES",
      reference,
      description: "Booking payout from Nibook",
    },
  };
  const signatureFields = `${amount}KES${reference}${MERCHANT_CODE}`;
  await jengaPost(ENDPOINTS.disburseBank, body, signatureFields);
}

export default router;
