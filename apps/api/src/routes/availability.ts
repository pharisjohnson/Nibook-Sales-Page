import { Router, type Request, type Response } from "express";
import { getInsforgeAdmin, createUserClient } from "../lib/insforge.js";
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
    async function writeSchedule(db: ReturnType<typeof getInsforgeAdmin>) {
      await db.database.from("availability_schedules").delete().eq("owner_id", owner_id);
      return db.database.from("availability_schedules").insert(
        schedule.map(s => ({ ...s, owner_id })),
      );
    }
    let { error } = await writeSchedule(createUserClient(userToken));
    if (error) {
      ({ error } = await writeSchedule(getInsforgeAdmin()));
    }
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
    async function writeBlackout(db: ReturnType<typeof getInsforgeAdmin>) {
      return db.database
        .from("availability_blackouts")
        .insert({ owner_id, date, reason: reason ?? "Time off" })
        .select().single();
    }
    let { data, error } = await writeBlackout(createUserClient(userToken));
    if (error) {
      ({ data, error } = await writeBlackout(getInsforgeAdmin()));
    }
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
    async function removeBlackout(db: ReturnType<typeof getInsforgeAdmin>) {
      return db.database.from("availability_blackouts").delete().eq("id", id).eq("owner_id", owner_id);
    }
    let { error } = await removeBlackout(createUserClient(userToken));
    if (error) {
      ({ error } = await removeBlackout(getInsforgeAdmin()));
    }
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
    async function writeRules(db: ReturnType<typeof getInsforgeAdmin>) {
      await db.database.from("availability_rules").delete().eq("owner_id", owner_id);
      return db.database.from("availability_rules").insert({
        owner_id,
        buffer_minutes: (rules as any).buffer_minutes ?? 15,
        min_notice_hours: (rules as any).min_notice_hours ?? 2,
        max_advance_days: (rules as any).max_advance_days ?? 30,
        cancellation_window_hours: (rules as any).cancellation_window_hours ?? 24,
      });
    }
    let { error } = await writeRules(createUserClient(userToken));
    if (error) {
      ({ error } = await writeRules(getInsforgeAdmin()));
    }
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
