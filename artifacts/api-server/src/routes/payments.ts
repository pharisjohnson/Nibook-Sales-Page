import { Router, type IRouter, type Request, type Response } from "express";
import { getInsforgeAdmin } from "../lib/insforge.js";

const router: IRouter = Router();

const PAYHERO_BASE = "https://backend.payhero.co.ke/api/v2";
const CHANNEL_ID = Number(process.env.PAYHERO_CHANNEL_ID ?? "0");

function buildAuthHeader(): string {
  const u = process.env.PAYHERO_USERNAME ?? "";
  const p = process.env.PAYHERO_PASSWORD ?? "";
  const t = process.env.PAYHERO_AUTH_TOKEN ?? "";

  if (u.startsWith("Basic ")) return u;
  if (t && p && !t.startsWith("Basic") && !t.includes(" ")) {
    return "Basic " + Buffer.from(`${t}:${p}`).toString("base64");
  }
  if (u && p && !u.includes(" ")) {
    return "Basic " + Buffer.from(`${u}:${p}`).toString("base64");
  }
  if (t.startsWith("Basic ")) return t;
  if (t) return `Basic ${t}`;
  return "";
}

function payheroHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: buildAuthHeader(),
  };
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

router.post("/payments/initiate", async (req: Request, res: Response) => {
  const { phone, amount, plan, reference, owner_id } = req.body as {
    phone?: string;
    amount?: number;
    plan?: string;
    reference?: string;
    owner_id?: string;
  };

  if (!phone || !amount || !plan) {
    res.status(400).json({ success: false, message: "phone, amount and plan are required" });
    return;
  }

  if (!buildAuthHeader()) {
    res.status(500).json({ success: false, message: "PayHero credentials not configured" });
    return;
  }

  if (!CHANNEL_ID) {
    res.status(500).json({ success: false, message: "PAYHERO_CHANNEL_ID not configured" });
    return;
  }

  const externalRef = reference ?? `NIBOOK-${plan.toUpperCase()}-${Date.now()}`;
  const phoneNormalized = normalizePhone(phone);

  const callbackUrl =
    process.env.PAYHERO_CALLBACK_URL ??
    `https://${process.env.REPLIT_DEV_DOMAIN ?? "localhost"}/api/payments/callback`;

  // Save payment record in Supabase before initiating
  const insforge = getInsforgeAdmin();
  await insforge.database.from("payments").insert({
    reference: externalRef,
    phone: phoneNormalized,
    amount,
    plan,
    owner_id: owner_id ?? null,
    status: "pending",
  });

  try {
    const payheroRes = await fetch(`${PAYHERO_BASE}/payments`, {
      method: "POST",
      headers: payheroHeaders(),
      body: JSON.stringify({
        amount,
        phone_number: phoneNormalized,
        channel_id: CHANNEL_ID,
        external_reference: externalRef,
        provider: "m-pesa",
        callback_url: callbackUrl,
      }),
    });

    const data = (await payheroRes.json()) as Record<string, unknown>;

    // Store PayHero response
    await insforge.database.from("payments").update({ payhero_response: data }).eq("reference", externalRef);

    if (!payheroRes.ok) {
      await insforge.database.from("payments").update({ status: "failed" }).eq("reference", externalRef);
      res.status(payheroRes.status).json({
        success: false,
        message: (data.message as string) ?? "PayHero request failed",
        details: data,
      });
      return;
    }

    res.json({
      success: true,
      reference: externalRef,
      message: "STK Push sent — check your phone",
      data,
    });
  } catch (err) {
    await insforge.database.from("payments").update({ status: "failed" }).eq("reference", externalRef);
    res.status(502).json({ success: false, message: "Failed to reach PayHero", error: String(err) });
  }
});

router.get("/payments/status/:reference", async (req: Request, res: Response) => {
  const { reference } = req.params;

  if (!reference) {
    res.status(400).json({ success: false, message: "reference is required" });
    return;
  }

  try {
    const payheroRes = await fetch(
      `${PAYHERO_BASE}/transaction-status?reference=${encodeURIComponent(reference)}`,
      { headers: payheroHeaders() },
    );

    const data = (await payheroRes.json()) as Record<string, unknown>;

    if (!payheroRes.ok) {
      res.status(payheroRes.status).json({ success: false, message: "Status check failed", details: data });
      return;
    }

    const status = (data.status as string) ?? "PENDING";

    // Update payment status in Supabase
    const insforge = getInsforgeAdmin();
    const normalizedStatus = status.toUpperCase();
    if (["SUCCESS", "COMPLETE", "COMPLETED"].includes(normalizedStatus)) {
      await insforge.database.from("payments").update({ status: "success", updated_at: new Date().toISOString() }).eq("reference", reference);
    } else if (["FAILED", "CANCELLED", "CANCELED"].includes(normalizedStatus)) {
      await insforge.database.from("payments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("reference", reference);
    }

    res.json({ success: true, status, data });
  } catch (err) {
    res.status(502).json({ success: false, message: "Failed to reach PayHero", error: String(err) });
  }
});

router.post("/payments/callback", async (req: Request, res: Response) => {
  const payload = req.body as Record<string, unknown>;
  console.log("[PayHero callback]", JSON.stringify(payload));

  const reference = (payload.reference ?? payload.external_reference ?? payload.ExternalReference) as string | undefined;
  const statusRaw = (payload.status ?? payload.Status ?? "") as string;

  if (reference) {
    const insforge = getInsforgeAdmin();
    const normalizedStatus = statusRaw.toUpperCase();
    let dbStatus = "pending";
    if (["SUCCESS", "COMPLETE", "COMPLETED"].includes(normalizedStatus)) dbStatus = "success";
    else if (["FAILED", "CANCELLED", "CANCELED"].includes(normalizedStatus)) dbStatus = "failed";

    await insforge.database.from("payments")
      .update({ status: dbStatus, callback_payload: payload, updated_at: new Date().toISOString() })
      .eq("reference", reference);
  }

  res.json({ received: true });
});

export default router;
