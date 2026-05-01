import { Router, type IRouter, type Request, type Response } from "express";
import { getSupabaseAdmin } from "../lib/supabase.js";

const router: IRouter = Router();

function generateBadgeNumber(): string {
  const prefix = "VIS";
  const timestamp = Date.now().toString().slice(-5);
  const rand = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
  return `${prefix}-${timestamp}-${rand}`;
}

router.post("/visitors/check-in", async (req: Request, res: Response) => {
  const {
    full_name,
    email,
    phone,
    company,
    host_id,
    purpose,
    consent_marketing,
    consent_data_sharing,
  } = req.body as {
    full_name?: string;
    email?: string;
    phone?: string;
    company?: string;
    host_id?: string;
    purpose?: string;
    consent_marketing?: boolean;
    consent_data_sharing?: boolean;
  };

  if (!full_name || !email) {
    res.status(400).json({ success: false, message: "full_name and email are required" });
    return;
  }

  const badgeNumber = generateBadgeNumber();
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("visitors").insert({
    full_name,
    email,
    phone: phone ?? null,
    company: company ?? null,
    host_id: host_id ?? null,
    purpose: purpose ?? null,
    consent_marketing: consent_marketing ?? false,
    consent_data_sharing: consent_data_sharing ?? false,
    badge_number: badgeNumber,
    checked_in_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[visitors/check-in] Supabase error:", error);
    res.status(500).json({ success: false, message: "Failed to record check-in" });
    return;
  }

  res.json({ success: true, badgeNumber });
});

router.get("/visitors/hosts", async (_req: Request, res: Response) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, business_name")
    .not("business_name", "is", null);

  if (error) {
    res.status(500).json({ success: false, message: "Failed to fetch hosts" });
    return;
  }

  res.json({ success: true, hosts: data ?? [] });
});

export default router;
