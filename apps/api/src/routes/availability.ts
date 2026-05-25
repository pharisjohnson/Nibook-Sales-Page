import { Router, type Request, type Response } from "express";
import { getInsforgeAdmin, createUserClient } from "../lib/insforge.js";

const router = Router();

router.get("/availability/:owner_id", async (req: Request, res: Response) => {
  const { owner_id } = req.params;
  try {
    const authHeader = req.headers.authorization;
    const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const db = userToken ? createUserClient(userToken) : getInsforgeAdmin();
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
  try {
    const authHeader = req.headers.authorization;
    const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const db = userToken ? createUserClient(userToken) : getInsforgeAdmin();
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
  try {
    const authHeader = req.headers.authorization;
    const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const db = userToken ? createUserClient(userToken) : getInsforgeAdmin();
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
  const { id } = req.params;
  try {
    const authHeader = req.headers.authorization;
    const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const db = userToken ? createUserClient(userToken) : getInsforgeAdmin();
    const { error } = await db.database.from("availability_blackouts").delete().eq("id", id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put("/availability/:owner_id/rules", async (req: Request, res: Response) => {
  const { owner_id } = req.params;
  const rules = req.body as Record<string, unknown>;
  try {
    const authHeader = req.headers.authorization;
    const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const db = userToken ? createUserClient(userToken) : getInsforgeAdmin();
    const { data: existing } = await db.database.from("availability_rules").select("id").eq("owner_id", owner_id).single();
    const { error } = existing
      ? await db.database.from("availability_rules").update(rules).eq("owner_id", owner_id)
      : await db.database.from("availability_rules").insert({ ...rules, owner_id });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
