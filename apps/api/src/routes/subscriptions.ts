import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { getInsforgeAdmin } from "../lib/insforge.js";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();
const PAYSTACK_BASE = "https://api.paystack.co";

function paystackHeaders() {
  const key = process.env.PAYSTACK_SECRET_KEY ?? "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
}

// POST /api/subscriptions/initialize
// Initializes a Paystack transaction tied to a subscription plan.
// Body: { email, plan_code, owner_id? }
// Returns: { authorization_url, reference, access_code }
router.post("/subscriptions/initialize", requireAuth, async (req: Request, res: Response) => {
  const { email, plan_code, owner_id } = req.body as {
    email?: string;
    plan_code?: string;
    owner_id?: string;
  };

  if (!email || !plan_code) {
    res.status(400).json({ success: false, message: "email and plan_code are required" });
    return;
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    res.status(500).json({ success: false, message: "PAYSTACK_SECRET_KEY is not configured" });
    return;
  }

  const reference = `NIBOOK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const appUrl = process.env.APP_URL ?? "http://localhost:5173";
  const callbackUrl = `${appUrl}/subscription/callback`;

  try {
    const paystackRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: paystackHeaders(),
      body: JSON.stringify({
        email,
        plan: plan_code,
        reference,
        callback_url: callbackUrl,
        metadata: {
          owner_id: owner_id ?? null,
          custom_fields: [
            { display_name: "Owner ID", variable_name: "owner_id", value: owner_id ?? "" },
          ],
        },
      }),
    });

    const data = (await paystackRes.json()) as {
      status: boolean;
      message: string;
      data?: { authorization_url: string; access_code: string; reference: string };
    };

    if (!paystackRes.ok || !data.status || !data.data) {
      res.status(paystackRes.status).json({ success: false, message: data.message ?? "Paystack initialization failed" });
      return;
    }

    // Record pending subscription intent — best-effort, don't block on failure
    const insforge = getInsforgeAdmin();
    try {
      await insforge.database.from("payments").insert({
        reference,
        amount: 0,
        plan: plan_code,
        owner_id: owner_id ?? null,
        status: "pending",
      });
    } catch { /* non-fatal */ }

    res.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      access_code: data.data.access_code,
    });
  } catch (err) {
    res.status(502).json({ success: false, message: "Failed to reach Paystack", error: String(err) });
  }
});

// GET /api/subscriptions/verify/:reference
// Verifies a completed Paystack transaction and activates subscription in DB.
router.get("/subscriptions/verify/:reference", async (req: Request, res: Response) => {
  const { reference } = req.params;

  if (!reference) {
    res.status(400).json({ success: false, message: "reference is required" });
    return;
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    res.status(500).json({ success: false, message: "PAYSTACK_SECRET_KEY is not configured" });
    return;
  }

  try {
    const paystackRes = await fetch(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(String(reference))}`,
      { headers: paystackHeaders() },
    );

    const data = (await paystackRes.json()) as {
      status: boolean;
      message: string;
      data?: {
        status: string;
        amount: number;
        currency: string;
        reference: string;
        customer: { email: string; customer_code: string };
        plan_object?: { name: string; plan_code: string; interval: string };
        subscription_code?: string;
        paid_at?: string;
        metadata?: { owner_id?: string };
      };
    };

    if (!paystackRes.ok || !data.status || !data.data) {
      res.status(paystackRes.status).json({ success: false, message: data.message ?? "Verification failed" });
      return;
    }

    const tx = data.data;
    const succeeded = tx.status === "success";

    if (succeeded) {
      const insforge = getInsforgeAdmin();
      const ownerId = tx.metadata?.owner_id;

      await insforge.database.from("payments").update({
        status: "success",
        amount: tx.amount / 100,
        updated_at: new Date().toISOString(),
      }).eq("reference", reference);

      if (ownerId) {
        await insforge.database.from("profiles").update({
          subscription_plan: tx.plan_object?.name ?? "paid",
          subscription_status: "active",
          paystack_customer_code: tx.customer.customer_code,
          subscription_code: tx.subscription_code ?? null,
          subscription_started_at: tx.paid_at ?? new Date().toISOString(),
        }).eq("id", ownerId);
      }
    }

    res.json({
      success: true,
      paid: succeeded,
      status: tx.status,
      plan: tx.plan_object?.name ?? null,
      interval: tx.plan_object?.interval ?? null,
      customer_email: tx.customer.email,
      amount: tx.amount / 100,
      currency: tx.currency,
    });
  } catch (err) {
    res.status(502).json({ success: false, message: "Failed to reach Paystack", error: String(err) });
  }
});

// POST /api/subscriptions/webhook
// Paystack posts events here. We verify the HMAC-SHA512 signature before processing.
router.post("/subscriptions/webhook", async (req: Request, res: Response) => {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  const signature = req.headers["x-paystack-signature"] as string | undefined;

  const expectedHash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (!signature || expectedHash !== signature) {
    res.status(401).json({ message: "Invalid signature" });
    return;
  }

  // Acknowledge immediately — Paystack retries for 72h if we don't respond fast
  res.status(200).json({ received: true });

  const event = req.body as { event: string; data: Record<string, unknown> };
  const insforge = getInsforgeAdmin();

  try {
    switch (event.event) {
      case "charge.success": {
        const ref = event.data.reference as string | undefined;
        if (ref) {
          await insforge.database.from("payments")
            .update({ status: "success", updated_at: new Date().toISOString() })
            .eq("reference", ref);
        }
        break;
      }

      case "subscription.create": {
        const customerCode = (event.data.customer as Record<string, unknown>)?.customer_code as string | undefined;
        const subscriptionCode = event.data.subscription_code as string | undefined;
        const planObj = event.data.plan as Record<string, unknown> | undefined;
        if (customerCode) {
          await insforge.database.from("profiles")
            .update({
              subscription_status: "active",
              subscription_code: subscriptionCode ?? null,
              subscription_plan: planObj?.name ?? "paid",
              paystack_customer_code: customerCode,
            })
            .eq("paystack_customer_code", customerCode);
        }
        break;
      }

      case "invoice.payment_failed": {
        const customerCode = (event.data.customer as Record<string, unknown>)?.customer_code as string | undefined;
        if (customerCode) {
          await insforge.database.from("profiles")
            .update({ subscription_status: "attention" })
            .eq("paystack_customer_code", customerCode);
        }
        break;
      }

      case "subscription.disable": {
        const customerCode = (event.data.customer as Record<string, unknown>)?.customer_code as string | undefined;
        if (customerCode) {
          await insforge.database.from("profiles")
            .update({ subscription_status: "cancelled" })
            .eq("paystack_customer_code", customerCode);
        }
        break;
      }

      case "subscription.not_renew": {
        const customerCode = (event.data.customer as Record<string, unknown>)?.customer_code as string | undefined;
        if (customerCode) {
          await insforge.database.from("profiles")
            .update({ subscription_status: "non-renewing" })
            .eq("paystack_customer_code", customerCode);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[Paystack webhook] processing error", event.event, err);
  }
});

export default router;
