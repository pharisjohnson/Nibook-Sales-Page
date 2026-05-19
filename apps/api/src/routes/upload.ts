import { Router, type IRouter, type Request, type Response } from "express";
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
  (req: Request, res: Response, next) => {
    // Parse as raw buffer before route handler
    express_raw(req, res, next);
  },
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
      res.status(400).json({ error: "Empty file body" });
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

      const url = insforge.storage.from(BUCKET).getPublicUrl(data.key);
      res.json({ url });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },
);

// Inline raw-body parser (avoids adding multer as a dep)
function express_raw(req: Request, res: Response, next: () => void) {
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", () => {
    (req as any).body = Buffer.concat(chunks);
    next();
  });
  req.on("error", () => res.status(400).json({ error: "Stream error" }));
}

export default router;
