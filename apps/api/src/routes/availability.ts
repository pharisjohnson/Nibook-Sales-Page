import { Router, type Request, type Response } from "express";
import { getInsforgeAdmin } from "../lib/insforge.js";
import { decodeJwtSub } from "../lib/jwt.js";

const router = Router();

router.get("/availability/:owner_id", async (req: Request, res: Response) => {
  const { owner_id } = req.params;
  try {
    const db = getInsforgeAdmin();
    const [scheduleRes, blackoutsRes, rulesRes] = await Promise.all([
      db.database.from("availability_schedules").select("*").eq("owner_id", owner_id).order("sort_order"),
      db.database.from("availability_blackouts").select("*").eq("owner_id", owner_id).order("date"),
      db.database.from("availability_rules").select("*").eq("owner_id", owner_id).single(),
    ]);
    res.json({
      schedule: scheduleRes.data ?? [],
      blackouts: blackoutsRes.data ?? [],
      rules: rulesRes.data ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put("/availability/:owner_id/schedule", async (req: Request, res: Response) => {
  const { owner_id } = req.params;
  const { schedule } = req.body as { schedule: Array<{ day_name: string; is_active: boolean; start_time: string; end_time: string; sort_order: number }> };
  if (!schedule) { res.status(400).json({ error: "schedule required" }); return; }

  const authHeader = req.headers.authorization;
  const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!userToken) { res.status(401).json({ error: "Authorization required" }); return; }
  const userId = decodeJwtSub(userToken);
  if (!userId || userId !== owner_id) { res.status(403).json({ error: "Cannot modify another user's availability" }); return; }

  try {
    const db = getInsforgeAdmin();
    await db.database.from("availability_schedules").delete().eq("owner_id", owner_id);
    const { error } = await db.database.from("availability_schedules").insert(
      schedule.map(s => ({ ...s, owner_id })),
    );
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/availability/:owner_id/blackouts", async (req: Request, res: Response) => {
  const { owner_id } = req.params;
  const { date, reason } = req.body as { date: string; reason?: string };
  if (!date) { res.status(400).json({ error: "date required" }); return; }

  const authHeader = req.headers.authorization;
  const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!userToken) { res.status(401).json({ error: "Authorization required" }); return; }
  const userId = decodeJwtSub(userToken);
  if (!userId || userId !== owner_id) { res.status(403).json({ error: "Cannot modify another user's availability" }); return; }

  try {
    const db = getInsforgeAdmin();
    const { data, error } = await db.database
      .from("availability_blackouts")
      .insert({ owner_id, date, reason: reason ?? "Time off" })
      .select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/availability/:owner_id/blackouts/:id", async (req: Request, res: Response) => {
  const { owner_id, id } = req.params;

  const authHeader = req.headers.authorization;
  const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!userToken) { res.status(401).json({ error: "Authorization required" }); return; }
  const userId = decodeJwtSub(userToken);
  if (!userId || userId !== owner_id) { res.status(403).json({ error: "Cannot modify another user's availability" }); return; }

  try {
    const db = getInsforgeAdmin();
    const { error } = await db.database.from("availability_blackouts").delete().eq("id", id).eq("owner_id", owner_id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put("/availability/:owner_id/rules", async (req: Request, res: Response) => {
  const { owner_id } = req.params;
  const rules = req.body as Record<string, unknown>;

  const authHeader = req.headers.authorization;
  const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!userToken) { res.status(401).json({ error: "Authorization required" }); return; }
  const userId = decodeJwtSub(userToken);
  if (!userId || userId !== owner_id) { res.status(403).json({ error: "Cannot modify another user's availability" }); return; }

  try {
    const db = getInsforgeAdmin();
