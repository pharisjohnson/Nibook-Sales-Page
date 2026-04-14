import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const PAYHERO_BASE = "https://backend.payhero.co.ke/api/v2";
const AUTH_TOKEN = process.env.PAYHERO_AUTH_TOKEN ?? "";
const CHANNEL_ID = Number(process.env.PAYHERO_CHANNEL_ID ?? "0");

function payheroHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: AUTH_TOKEN.startsWith("Basic ")
      ? AUTH_TOKEN
      : `Basic ${AUTH_TOKEN}`,
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
  const { phone, amount, plan, reference } = req.body as {
    phone?: string;
    amount?: number;
    plan?: string;
    reference?: string;
  };

  if (!phone || !amount || !plan) {
    res.status(400).json({ success: false, message: "phone, amount and plan are required" });
    return;
  }

  if (!AUTH_TOKEN) {
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

    if (!payheroRes.ok) {
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
    res.json({ success: true, status, data });
  } catch (err) {
    res.status(502).json({ success: false, message: "Failed to reach PayHero", error: String(err) });
  }
});

router.post("/payments/callback", (req: Request, res: Response) => {
  const payload = req.body as Record<string, unknown>;
  console.log("[PayHero callback]", JSON.stringify(payload));
  res.json({ received: true });
});

export default router;
