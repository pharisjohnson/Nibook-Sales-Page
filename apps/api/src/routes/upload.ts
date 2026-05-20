import express, { Router, type IRouter, type Request, type Response } from "express";
import { getInsforgeAdmin } from "../lib/insforge.js";

const router: IRouter = Router();
const BUCKET = "nibook-media";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// POST /api/upload
// Body: raw binary of the image file
// Query: folder=profiles|services|team (default: misc)
// Headers: Content-Type (image mime type), Authorization: Bearer <token>
// Returns: { url: string }
router.post(
  "/upload",
  express.raw({ type: Object.keys(ALLOWED_TYPES), limit: "10mb" }),
  async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const contentType = (req.headers["content-type"] ?? "").split(";")[0].trim();
    const ext = ALLOWED_TYPES[contentType];
    if (!ext) {
      res.status(400).json({ error: `Unsupported image type: ${contentType}` });
      return;
    }

    const folder = String(req.query.folder ?? "misc").replace(/[^a-z0-9-_]/gi, "");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${folder}/${filename}`;

    const body = req.body as Buffer;
    if (!body || body.length === 0) {
      res.status(400).json({ error: "Empty or invalid file body. Ensure Content-Type is set to one of: " + Object.keys(ALLOWED_TYPES).join(", ") });
      return;
    }

    if (body.length > 10 * 1024 * 1024) {
      res.status(413).json({ error: "File too large (max 10 MB)" });
      return;
    }

    try {
      const insforge = getInsforgeAdmin();
      const blob = new Blob([new Uint8Array(body)], { type: contentType });
      const { data, error } = await insforge.storage.from(BUCKET).upload(path, blob);

      if (error || !data) {
        res.status(500).json({ error: error?.message ?? "Upload failed" });
        return;
      }

      // data.key is the path in the bucket
      const url = insforge.storage.from(BUCKET).getPublicUrl(data.key);
      res.json({ url });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },
);

export default router;
