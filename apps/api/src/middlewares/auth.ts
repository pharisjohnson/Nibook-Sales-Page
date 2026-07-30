import { Request, Response, NextFunction } from "express";
import { getInsforgeAdmin } from "../lib/insforge.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const token = authHeader.slice(7);
  try {
    const client = getInsforgeAdmin();
    const { data, error } = await client.auth.getUser(token);

    if (error || !(data as any)?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = (data as any).user;
    req.user = {
      id: user.id,
      email: user.email ?? "",
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}