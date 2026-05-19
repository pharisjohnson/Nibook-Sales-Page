import { Router, type IRouter, type Request, type Response } from "express";
import { getInsforgeAdmin } from "../lib/insforge.js";

const router: IRouter = Router();

router.post("/waitlist", async (req: Request, res: Response) => {
  const { email, name } = req.body as { email?: string; name?: string };
  if (!email) { res.status(400).json({ error: "email required" }); return; }
  try {
    const { error } = await getInsforgeAdmin().database
      .from("waitlist")
      .insert({ email: email.trim().toLowerCase(), name: name?.trim() || null });
    if (error) {
      if ((error as any).code === "23505") {
        res.json({ success: true, duplicate: true });
        return;
      }
      res.status(500).json({ error: (error as any).message ?? String(error) });
      return;
    }
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
