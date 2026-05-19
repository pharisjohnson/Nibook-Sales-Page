import { Router, type IRouter, type Request, type Response } from "express";
import { getInsforgeAdmin } from "../lib/insforge.js";

const router: IRouter = Router();

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
  const updates = req.body as Record<string, unknown>;
  const allowed = [
    "business_name", "slug", "phone", "location", "bio", "category",
    "logo_url", "cover_url", "onboarding_completed", "plan", "avatar_url",
    "mpesa_paybill", "mpesa_account", "whatsapp_enabled", "whatsapp_phone",
    "reminder_hours", "cancellation_policy", "booking_widget_theme",
  ];
  const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
  try {
    const db = getInsforgeAdmin();
    const { data, error } = await db.database.from("profiles").update(safe).eq("id", id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
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
