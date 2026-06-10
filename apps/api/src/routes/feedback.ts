import { Router } from "express";
import { getInsforgeAdmin, createUserClient } from "../lib/insforge";

const router = Router();

// POST /feedback - Public submit feedback
router.post("/", async (req, res) => {
  const { user_id, category, content, priority } = req.body;

  if (!category || !content) {
    return res.status(400).json({ error: "category and content are required" });
  }

  const client = getInsforgeAdmin();
  const { data, error } = await client.database
    .from("feedback")
    .insert([{
      user_id,
      category,
      content,
      priority,
    }]);

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET /feedback - Admin only (via service role)
router.get("/", async (req, res) => {
  // In a real app, you'd check if the requesting user is a super-admin.
  // For now, we use getInsforgeAdmin to fetch all.
  const client = getInsforgeAdmin();
  const { data, error } = await client.database
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /feedback/:id - Admin manage feedback status
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const client = getInsforgeAdmin();
  const { data, error } = await client.database
    .from("feedback")
    .update({ status })
    .eq("id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
