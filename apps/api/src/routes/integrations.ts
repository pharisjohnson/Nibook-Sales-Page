import { Router, type IRouter, type Request, type Response } from "express";
import { google } from "googleapis";
import { getInsforgeAdmin } from "../lib/insforge.js";

const router: IRouter = Router();

const APP_URL = process.env.APP_URL ?? "https://nibook.noonstudio.africa";
const REDIRECT_URI = `${APP_URL}/api/integrations/google/callback`;

function makeOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );
}

// ─── GET /api/integrations/google/auth-url?user_id=xxx ───────────────────────
router.get("/integrations/google/auth-url", (req: Request, res: Response) => {
  const { user_id } = req.query as { user_id?: string };
  if (!user_id) { res.status(400).json({ error: "user_id required" }); return; }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    res.status(500).json({ error: "Google OAuth not configured" }); return;
  }

  const client = makeOAuth2Client();
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state: user_id,
  });

  res.json({ url });
});

// ─── GET /api/integrations/google/callback ───────────────────────────────────
router.get("/integrations/google/callback", async (req: Request, res: Response) => {
  const { code, state: user_id, error: oauthError } = req.query as Record<string, string>;
  const settingsUrl = `${APP_URL}/settings?tab=connections`;

  if (oauthError || !code || !user_id) {
    res.redirect(`${settingsUrl}&google=error`);
    return;
  }

  try {
    const client = makeOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get the connected Google account email
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data: googleUser } = await oauth2.userinfo.get();

    const db = getInsforgeAdmin();
    await db.database
      .from("profiles")
      .upsert({
        id: user_id,
        google_refresh_token: tokens.refresh_token ?? null,
        google_access_token: tokens.access_token ?? null,
        google_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        google_calendar_email: googleUser.email ?? null,
      }, { onConflict: "id" });

    res.redirect(`${settingsUrl}&google=connected`);
  } catch (err) {
    console.error("[Google OAuth callback]", err);
    res.redirect(`${settingsUrl}&google=error`);
  }
});

// ─── DELETE /api/integrations/google/:user_id ────────────────────────────────
router.delete("/integrations/google/:user_id", async (req: Request, res: Response) => {
  const { user_id } = req.params;
  try {
    const db = getInsforgeAdmin();
    await db.database.from("profiles").update({
      google_refresh_token: null,
      google_access_token: null,
      google_token_expiry: null,
      google_calendar_email: null,
    }).eq("id", user_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Shared helper: add a booking event to Google Calendar ───────────────────
export async function syncBookingToCalendar(booking: {
  id: string;
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;
  scheduled_at: string;
  duration_minutes?: number | null;
  notes?: string | null;
  services?: { name: string; price: number } | null;
}, profile: {
  google_refresh_token?: string | null;
  google_access_token?: string | null;
  business_name?: string | null;
}) {
  if (!profile.google_refresh_token) return;
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return;

  const client = makeOAuth2Client();
  client.setCredentials({
    refresh_token: profile.google_refresh_token,
    access_token: profile.google_access_token ?? undefined,
  });

  const calendar = google.calendar({ version: "v3", auth: client });
  const start = new Date(booking.scheduled_at);
  const end = new Date(start.getTime() + (booking.duration_minutes ?? 60) * 60_000);

  const serviceName = booking.services?.name ?? "Appointment";
  const descLines = [
    `Service: ${serviceName}`,
    booking.client_phone ? `Phone: ${booking.client_phone}` : null,
    booking.client_email ? `Email: ${booking.client_email}` : null,
    booking.notes ? `Notes: ${booking.notes}` : null,
    `\nBooking ID: ${booking.id}`,
    `Managed via Nibook`,
  ].filter(Boolean).join("\n");

  await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `${serviceName} — ${booking.client_name}`,
      description: descLines,
      start: { dateTime: start.toISOString(), timeZone: "Africa/Nairobi" },
      end: { dateTime: end.toISOString(), timeZone: "Africa/Nairobi" },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    },
  });
}

export default router;
