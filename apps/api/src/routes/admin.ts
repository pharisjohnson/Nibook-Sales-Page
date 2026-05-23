import { Router, type Request, type Response, type NextFunction } from "express";
import { getInsforgeAdmin } from "../lib/insforge.js";

const router = Router();

function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const key = process.env["ADMIN_SECRET_KEY"];
  if (!key) { res.status(503).json({ error: "Admin access not configured" }); return; }
  if (req.headers["x-admin-key"] !== key) { res.status(401).json({ error: "Unauthorized" }); return; }
  next();
}

router.use("/admin", requireAdminKey);

// GET /api/admin/stats — platform-level aggregate metrics
router.get("/admin/stats", async (_req: Request, res: Response) => {
  try {
    const db = getInsforgeAdmin();

    const now = new Date();
    const startOf30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const startOf7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      profilesRes,
      activeSubsRes,
      bookings30Res,
      bookings7Res,
      recentSignupsRes,
      planBreakdownRes,
    ] = await Promise.all([
      db.database.from("profiles").select("id", { count: "exact", head: true }),
      db.database.from("profiles").select("id", { count: "exact", head: true })
        .eq("subscription_status", "active"),
      db.database.from("bookings").select("id", { count: "exact", head: true })
        .gte("scheduled_at", startOf30Days),
      db.database.from("bookings").select("id", { count: "exact", head: true })
        .gte("scheduled_at", startOf7Days),
      db.database.from("profiles").select("id,created_at")
        .gte("created_at", startOf7Days)
        .order("created_at", { ascending: false }),
      db.database.from("profiles").select("subscription_plan,subscription_status")
        .not("subscription_plan", "is", null),
    ]);

    const planCounts: Record<string, number> = {};
    for (const row of (planBreakdownRes.data ?? [])) {
      const plan = (row as any).subscription_plan ?? "unknown";
      planCounts[plan] = (planCounts[plan] ?? 0) + 1;
    }

    res.json({
      totalBusinesses: profilesRes.count ?? 0,
      activeSubscriptions: activeSubsRes.count ?? 0,
      bookingsLast30Days: bookings30Res.count ?? 0,
      bookingsLast7Days: bookings7Res.count ?? 0,
      newSignupsLast7Days: recentSignupsRes.data?.length ?? 0,
      conversionRate: profilesRes.count
        ? Math.round(((activeSubsRes.count ?? 0) / profilesRes.count) * 100)
        : 0,
      planBreakdown: planCounts,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/admin/users?page=0&limit=50 — paginated user list
router.get("/admin/users", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query["limit"] ?? 50), 100);
  const page = Number(req.query["page"] ?? 0);

  try {
    const db = getInsforgeAdmin();
    const { data, error, count } = await db.database
      .from("profiles")
      .select("id,email,business_name,subscription_plan,subscription_status,subscription_started_at,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * limit, page * limit + limit - 1);

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data, total: count ?? 0, page, limit });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/admin/churned?days=30 — recently cancelled subscriptions
router.get("/admin/churned", async (req: Request, res: Response) => {
  const days = Math.min(Number(req.query["days"] ?? 30), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const db = getInsforgeAdmin();
    const { data, error } = await db.database
      .from("profiles")
      .select("id,email,business_name,subscription_plan,subscription_started_at,created_at")
      .eq("subscription_status", "cancelled")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data, days });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
