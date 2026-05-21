import { Router, type IRouter, type Request, type Response } from "express";
import { getInsforgeAdmin } from "../lib/insforge.js";

const router: IRouter = Router();

router.get("/services", async (req: Request, res: Response) => {
  const { owner_id } = req.query as Record<string, string>;
  if (!owner_id) { res.status(400).json({ error: "owner_id required" }); return; }
  try {
    const { data, error } = await getInsforgeAdmin().database
      .from("services").select("*").eq("owner_id", owner_id).order("created_at", { ascending: true });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/services", async (req: Request, res: Response) => {
  const { owner_id, name, price, duration_minutes, image_url, is_active, description } = req.body as Record<string, unknown>;
  if (!owner_id || !name) { res.status(400).json({ error: "owner_id and name required" }); return; }
  try {
    const { data, error } = await getInsforgeAdmin().database
      .from("services")
      .insert({ owner_id, name, price: price ?? 0, duration_minutes: duration_minutes ?? 60, image_url: image_url ?? null, is_active: is_active ?? true, description: description ?? null })
      .select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch("/services/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body as Record<string, unknown>;
  try {
    const { data, error } = await getInsforgeAdmin().database
      .from("services").update(updates).eq("id", id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/services/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await getInsforgeAdmin().database.from("services").delete().eq("id", id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
