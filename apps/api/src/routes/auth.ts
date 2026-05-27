import { Router, type Request, type Response } from "express";
import { getInsforgeAdmin } from "../lib/insforge.js";
import { decodeJwtSub } from "../lib/jwt.js";

const router = Router();

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "nibook_token";
const COOKIE_MAX_AGE = Number(process.env.SESSION_MAX_AGE_MS ?? String(7 * 24 * 60 * 60 * 1000)); // 7 days default

function parseCookieHeader(cookieHeader?: string) {
  if (!cookieHeader) return {} as Record<string, string>;
  return Object.fromEntries(cookieHeader.split(";").map((s) => {
    const [k, ...v] = s.split("=");
    return [k?.trim(), decodeURIComponent((v || []).join("=") || "")];
  }));
}

router.post("/auth/signup", async (req: Request, res: Response) => {
  const { email, password, businessName } = req.body as { email?: string; password?: string; businessName?: string };
  if (!email || !password) { res.status(400).json({ error: "email and password required" }); return; }
  try {
    const client = getInsforgeAdmin();
    const { data, error } = await client.auth.signUp({ email, password, name: businessName ?? "" });
    if (error) { res.status(400).json({ error: (error as any).message ?? String(error) }); return; }
    const raw = data as any;
    const user = raw?.user ?? raw;
    const token = raw?.session?.access_token ?? raw?.access_token ?? null;
    // Set HttpOnly cookie for session token when available
    if (token) {
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
    }
    res.json({ user: { id: user.id, email: user.email, displayName: businessName ?? null }, token });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/auth/signin", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) { res.status(400).json({ error: "email and password required" }); return; }
  try {
    const client = getInsforgeAdmin();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) { res.status(401).json({ error: (error as any).message ?? String(error) }); return; }
    const raw = data as any;
    const user = raw?.user ?? raw;
    const token = raw?.session?.access_token ?? raw?.access_token ?? null;
    if (token) {
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
    }
    res.json({ user: { id: user.id, email: user.email, displayName: user.name ?? user.user_metadata?.business_name ?? null }, token });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/auth/signout", (req: Request, res: Response) => {
  // Clear the auth cookie
  res.clearCookie(COOKIE_NAME, { path: "/" });
  // Also attempt to clear by setting an expired cookie for good measure
  res.cookie(COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
  res.json({ success: true });
});

router.get("/auth/me", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    // Try cookie header if present
    const cookies = parseCookieHeader(req.headers.cookie);
    token = cookies[COOKIE_NAME] ?? null;
  }
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const userId = decodeJwtSub(token);
    if (!userId) { res.status(401).json({ error: "Invalid token" }); return; }
    const client = getInsforgeAdmin();
    const { data } = await client.database.from("profiles").select("id, business_name").eq("id", userId).single();
    res.json({ user: { id: userId, email: "", displayName: (data as any)?.business_name ?? null } });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
