import { Router, type IRouter, type Request, type Response } from "express";
import { getInsforgeAdmin } from "../lib/insforge.js";

const router: IRouter = Router();

router.get("/bookings", async (req: Request, res: Response) => {
  const { owner_id, status, limit = "100", offset = "0" } = req.query as Record<string, string>;
  if (!owner_id) { res.status(400).json({ error: "owner_id required" }); return; }
  try {
    const db = getInsforgeAdmin();
    let q = db.database
      .from("bookings")
      .select("*, services(name, price)")
      .eq("owner_id", owner_id)
      .order("scheduled_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/bookings", async (req: Request, res: Response) => {
  const {
    owner_id, service_id, client_name, client_phone, client_email,
    scheduled_at, duration_minutes, notes, amount, payment_status,
  } = req.body as Record<string, unknown>;
  if (!owner_id || !client_name || !scheduled_at) {
    res.status(400).json({ error: "owner_id, client_name, and scheduled_at are required" });
    return;
  }
  try {
    const db = getInsforgeAdmin();
    const { data, error } = await db.database.from("bookings").insert({
      owner_id, service_id: service_id ?? null, client_name, client_phone: client_phone ?? null,
      client_email: client_email ?? null, scheduled_at, duration_minutes: duration_minutes ?? 60,
      notes: notes ?? null, amount: amount ?? null, payment_status: payment_status ?? "unpaid",
      status: "pending",
    }).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch("/bookings/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body as Record<string, unknown>;
  try {
    const db = getInsforgeAdmin();
    const { data, error } = await db.database
      .from("bookings").update(updates).eq("id", id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/bookings/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const db = getInsforgeAdmin();
    const { error } = await db.database.from("bookings").delete().eq("id", id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
