import { Router } from "express";
import { getInsforgeAdmin, createUserClient } from "../lib/insforge";

const router = Router();

// GET /reviews?business_id=... - Public list of published reviews
router.get("/reviews", async (req, res) => {
  const { business_id } = req.query;
  if (!business_id) return res.status(400).json({ error: "business_id is required" });

  const client = getInsforgeAdmin();
  const { data, error } = await client.database
    .from("reviews")
    .select("*")
    .eq("business_id", business_id)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /reviews - Public submit a review
router.post("/reviews", async (req, res) => {
  const { business_id, service_id, client_name, client_email, rating, comment } = req.body;

  if (!business_id || !client_name || !rating) {
    return res.status(400).json({ error: "business_id, client_name, and rating are required" });
  }

  const client = getInsforgeAdmin();
  const { data, error } = await client.database
    .from("reviews")
    .insert([{
      business_id,
      service_id,
      client_name,
      client_email,
      rating,
      comment,
    }]);

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET /reviews/my-business - Owner's own reviews
router.get("/reviews/my-business", async (req, res) => {
  const userToken = req.headers.authorization?.split(" ")[1];
  if (!userToken) return res.status(401).json({ error: "Unauthorized" });

  const client = createUserClient(userToken);
  // RLS handles the filter based on auth.uid() = business_id
  const { data, error } = await client.database
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /reviews/:id - Owner manages review (published status)
router.patch("/reviews/:id", async (req, res) => {
  const { id } = req.params;
  const { is_published } = req.body;
  const userToken = req.headers.authorization?.split(" ")[1];
  if (!userToken) return res.status(401).json({ error: "Unauthorized" });

  const client = createUserClient(userToken);
  const { data, error } = await client.database
    .from("reviews")
    .update({ is_published })
    .eq("id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
