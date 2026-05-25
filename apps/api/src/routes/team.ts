import { Router, type Request, type Response } from "express";
import { getInsforgeAdmin, createUserClient } from "../lib/insforge.js";

const router = Router();

router.get("/team/:owner_id", async (req: Request, res: Response) => {
  const { owner_id } = req.params;
  try {
    const authHeader = req.headers.authorization;
    const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const db = userToken ? createUserClient(userToken) : getInsforgeAdmin();

    const [membersRes, invitesRes] = await Promise.all([
      db.database.from("team_members").select("*").eq("owner_id", owner_id).order("created_at"),
      db.database.from("team_invites").select("*").eq("owner_id", owner_id).order("created_at", { ascending: false }),
    ]);
    res.json({ members: membersRes.data ?? [], invites: invitesRes.data ?? [] });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/team/:owner_id/invite", async (req: Request, res: Response) => {
  const { owner_id } = req.params;
  const { email, role } = req.body as { email?: string; role?: string };
  if (!email || !role) { res.status(400).json({ error: "email and role required" }); return; }
  try {
    const authHeader = req.headers.authorization;
    const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const db = userToken ? createUserClient(userToken) : getInsforgeAdmin();

    const { data: existing } = await db.database
      .from("team_invites").select("id").eq("owner_id", owner_id).eq("email", email).single();
    if (existing) { res.status(409).json({ error: "Invite already sent to this email" }); return; }
    const { data, error } = await db.database
      .from("team_invites").insert({ owner_id, email, role }).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/team/:owner_id/invites/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const authHeader = req.headers.authorization;
    const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const db = userToken ? createUserClient(userToken) : getInsforgeAdmin();

    const { error } = await db.database.from("team_invites").delete().eq("id", id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch("/team/:owner_id/members/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body as { role?: string };
  if (!role) { res.status(400).json({ error: "role required" }); return; }
  try {
    const authHeader = req.headers.authorization;
    const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const db = userToken ? createUserClient(userToken) : getInsforgeAdmin();

    const { data, error } = await db.database
      .from("team_members").update({ role }).eq("id", id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/team/:owner_id/members/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const authHeader = req.headers.authorization;
    const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const db = userToken ? createUserClient(userToken) : getInsforgeAdmin();

    const { error } = await db.database.from("team_members").delete().eq("id", id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
