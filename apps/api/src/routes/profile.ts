import { Router, type Request, type Response } from "express";
import { getInsforgeAdmin, createUserClient } from "../lib/insforge.js";
import { decodeJwtSub } from "../lib/jwt.js";

const router = Router();

router.get("/profile/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const db = getInsforgeAdmin();
    const { data, error } = await db.database.from("profiles").select("*").eq("id", id).single();
    if (error) { res.status(404).json({ error: "Profile not found" }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch("/profile/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization;
  const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!userToken) {
    res.status(401).json({ error: "Authorization required" });
    return;
  }
  const tokenUserId = decodeJwtSub(userToken);
  if (!tokenUserId || tokenUserId !== id) {
    res.status(403).json({ error: "Cannot update another user's profile" });
    return;
  }

  const updates = req.body as Record<string, unknown>;
  const allowed = [
    "business_name", "slug", "phone", "location", "bio", "category",
    "logo_url", "cover_url", "onboarding_completed", "plan", "avatar_url",
    "mpesa_paybill", "mpesa_account", "whatsapp_enabled", "whatsapp_phone",
    "reminder_hours", "cancellation_policy", "booking_widget_theme",
    "payout_mobile", "payout_bank_name", "payout_bank_account", "payout_account_name",
    "google_refresh_token", "google_access_token", "google_token_expiry", "google_calendar_email",
  ];
  const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

  if (typeof safe.slug === "string" && !safe.slug.trim()) {
    delete safe.slug;
  }

  try {
    const admin = getInsforgeAdmin();

    // Ensure the requested slug is unique — auto-suffix with -1, -2, … if taken by another profile
    if (safe.slug && typeof safe.slug === "string") {
      const baseSlug = safe.slug as string;
      let slug = baseSlug;
      let attempt = 0;
      while (attempt < 50) {
        const { data: existing } = await admin.database
          .from("profiles").select("id").eq("slug", slug).neq("id", id).limit(1);
        if (!Array.isArray(existing) || existing.length === 0) { safe.slug = slug; break; }
        attempt++;
        slug = `${baseSlug}-${attempt}`;
      }
    }

    async function writeProfile(db: ReturnType<typeof getInsforgeAdmin>) {
      const { data: updated, error: updateError } = await db.database
        .from("profiles")
        .update(safe)
        .eq("id", id)
        .select()
        .single();

      if (!updateError && updated) return { data: updated, error: null };

      const { data: inserted, error: insertError } = await db.database
        .from("profiles")
        .insert({ id, ...safe })
        .select()
        .single();

      return { data: inserted, error: insertError ?? updateError };
    }

    // Prefer user JWT (RLS); fall back to server admin key if configured
    let { data, error } = await writeProfile(createUserClient(userToken));
    if (error) {
      ({ data, error } = await writeProfile(admin));
    }

    if (error) {
      const message =
        (error as { message?: string }).message ??
        (error as { details?: string }).details ??
        JSON.stringify(error);
      res.status(500).json({ error: message });
      return;
    }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/profile/by-slug/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const db = getInsforgeAdmin();
    const { data, error } = await db.database
      .from("profiles")
      .select("id, slug, business_name, category, location, phone, bio, logo_url, cover_url, avatar_url, plan, booking_widget_theme, cancellation_policy, whatsapp_enabled, whatsapp_phone, mpesa_paybill, mpesa_account")
      .eq("slug", slug)
      .single();
    if (error) { res.status(404).json({ error: "Business not found" }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/directory", async (_req: Request, res: Response) => {
  try {
    const db = getInsforgeAdmin();
    const { data, error } = await db.database
      .from("profiles")
      .select("id, business_name, slug, category, location, bio, logo_url, cover_url, avatar_url")
      .eq("onboarding_completed", true)
      .order("business_name");
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/categories", async (_req: Request, res: Response) => {
  try {
    const db = getInsforgeAdmin();
    const { data } = await db.database.from("categories").select("name").order("name");
    res.json({ data: (data ?? []).map((r: any) => r.name) });
  } catch {
    res.json({ data: [] });
  }
});

router.post("/categories", async (req: Request, res: Response) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }
  try {
    const db = getInsforgeAdmin();
    await db.database.from("categories").upsert({ name: name.trim() }, { onConflict: "name" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/analytics/:owner_id", async (req: Request, res: Response) => {
  const { owner_id } = req.params;
  const { from, to } = req.query as { from?: string; to?: string };
  try {
    const db = getInsforgeAdmin();
    let q = db.database
      .from("bookings")
      .select("*, services(name, price)")
      .eq("owner_id", owner_id);
    if (from) q = q.gte("scheduled_at", from);
    if (to) q = q.lte("scheduled_at", to);
    const { data: bookings, error } = await q;
    if (error) { res.status(500).json({ error: error.message }); return; }

    const rows = bookings ?? [];
    const totalRevenue = rows.filter(b => b.status === "completed").reduce((s: number, b: any) => s + Number(b.amount ?? 0), 0);
    const totalBookings = rows.length;
    const completed = rows.filter((b: any) => b.status === "completed").length;
    const completionRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0;

    const serviceMap: Record<string, { name: string; bookings: number; revenue: number }> = {};
    rows.forEach((b: any) => {
      const name = b.services?.name ?? "Unknown";
      if (!serviceMap[name]) serviceMap[name] = { name, bookings: 0, revenue: 0 };
      serviceMap[name].bookings++;
      if (b.status === "completed") serviceMap[name].revenue += Number(b.amount ?? 0);
    });
    const serviceStats = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);

    const clientMap: Record<string, { name: string; phone: string; bookings: number; spend: number }> = {};
    rows.forEach((b: any) => {
      const key = b.client_phone ?? b.client_name;
      if (!clientMap[key]) clientMap[key] = { name: b.client_name, phone: b.client_phone ?? "", bookings: 0, spend: 0 };
      clientMap[key].bookings++;
      if (b.status === "completed") clientMap[key].spend += Number(b.amount ?? 0);
    });
    const topClients = Object.values(clientMap).sort((a, b) => b.spend - a.spend).slice(0, 10);

    const statusCounts = { completed: 0, cancelled: 0, "no-show": 0, pending: 0 };
    rows.forEach((b: any) => { if (b.status in statusCounts) (statusCounts as any)[b.status]++; });

    res.json({ totalRevenue, totalBookings, completionRate, serviceStats, topClients, statusCounts, raw: rows });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
