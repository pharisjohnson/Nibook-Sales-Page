import { Router } from "express";
import { getInsforgeAdmin, createUserClient } from "../lib/insforge";

const router = Router();

// GET /referrals/my-referrals - Owner's referrals
router.get("/my-referrals", async (req, res) => {
  const userToken = req.headers.authorization?.split(" ")[1];
  if (!userToken) return res.status(401).json({ error: "Unauthorized" });

  const client = createUserClient(userToken);
  const { data, error } = await client.database
    .from("referrals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /referrals - Create a referral
router.post("/", async (req, res) => {
  const { referrer_id, referred_email, referral_code } = req.body;

  if (!referrer_id || !referred_email) {
    return res.status(400).json({ error: "referrer_id and referred_email are required" });
  }

  const client = getInsforgeAdmin();
  const { data, error } = await client.database
    .from("referrals")
    .insert([{
      referrer_id,
      referred_email,
      referral_code,
    }]);

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
