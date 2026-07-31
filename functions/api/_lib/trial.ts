import { db, sendEmail } from "./insforge";

const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface TrialStatus {
  onTrial: boolean;
  daysLeft: number;
  trialEndsAt: string;
  expired: boolean;
  stage: "none" | "3d" | "1d" | "0d" | "expired";
}

/** Trial runs for 7 days from profile creation; paying users are not on trial. */
export function computeTrialStatus(profile: any): TrialStatus {
  const paid = profile?.subscription_status === "active" || !!profile?.subscription_plan;
  const created = profile?.created_at ? new Date(profile.created_at).getTime() : Date.now();
  const endsAt = created + TRIAL_DAYS * DAY_MS;
  const msLeft = endsAt - Date.now();
  const daysLeft = Math.ceil(msLeft / DAY_MS);
  const expired = msLeft <= 0;
  let stage: TrialStatus["stage"] = "none";
  if (!paid) {
    if (expired) stage = "expired";
    else if (daysLeft <= 1) stage = "0d";
    else if (daysLeft <= 3) stage = "3d";
  }
  return { onTrial: !paid, daysLeft: Math.max(daysLeft, 0), trialEndsAt: new Date(endsAt).toISOString(), expired, stage };
}

function getEnv(key: string): string {
  return (globalThis as any).env?.[key] ?? (process as any).env?.[key] ?? "";
}

function base(): string { return getEnv("INSFORGE_URL") || getEnv("VITE_INSFORGE_URL") || ""; }
function key(): string { return getEnv("INSFORGE_SERVICE_KEY") || getEnv("VITE_INSFORGE_ANON_KEY") || ""; }

/**
 * Build a userId -> email map from the InsForge auth users list (admin-only,
 * works with the service key). Returns {} on any failure.
 */
async function fetchUserEmails(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const b = base(), k = key();
  if (!b || !k) return out;
  try {
    let offset = 0;
    const limit = 100;
    for (let page = 0; page < 10; page++) {
      const res = await fetch(`${b}/api/auth/users?offset=${offset}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${k}` },
      });
      if (!res.ok) break;
      const json = await res.json();
      const list: any[] = json?.data ?? [];
      for (const u of list) {
        if (u?.id && u?.email) out[u.id] = u.email;
      }
      const total: number = json?.pagination?.total ?? list.length;
      offset += limit;
      if (list.length < limit || offset >= total) break;
    }
  } catch {
    // best-effort
  }
  return out;
}

function bucket(): any {
  return (globalThis as any).env?.NIBOOK_IMAGES;
}

const STAGE_LABEL: Record<string, string> = {
  "3d": "3 days left",
  "1d": "1 day left",
  "0d": "ends today",
  expired: "trial ended",
};

async function markerKey(userId: string, stage: string): Promise<string> {
  return `trial-alerts/${userId}-${stage}.json`;
}

async function alreadySent(userId: string, stage: string): Promise<boolean> {
  const b = bucket();
  if (!b) return false;
  try {
    const obj = await b.get(await markerKey(userId, stage));
    return !!obj;
  } catch {
    return false;
  }
}

async function markSent(userId: string, stage: string): Promise<void> {
  const b = bucket();
  if (!b) return;
  try {
    await b.put(await markerKey(userId, stage), JSON.stringify({ stage, sentAt: new Date().toISOString() }));
  } catch {
    // dedup markers are best-effort
  }
}

function buildAlertEmail(businessName: string | null, daysLeft: number, expired: boolean): { subject: string; html: string } {
  const appUrl = getEnv("APP_URL") || "https://nibook.pages.dev";
  const name = businessName ? ` for ${businessName}` : "";
  let subject: string;
  let headline: string;
  let body: string;
  if (expired) {
    subject = `Your Nibook free trial has ended`;
    headline = `Your free trial has ended${name}`;
    body = `Your 7-day free trial has ended. Upgrade now to keep your booking page live and your services, bookings, and customer data safe.`;
  } else if (daysLeft <= 1) {
    subject = `Your Nibook free trial ends tomorrow`;
    headline = `Your free trial ends tomorrow${name}`;
    body = `Tomorrow is the last day of your free trial. Upgrade now and your booking page keeps running without interruption.`;
  } else {
    subject = `Your Nibook free trial ends in ${daysLeft} days`;
    headline = `Your free trial ends in ${daysLeft} days${name}`;
    body = `You are enjoying the free trial of Nibook, and it ends in ${daysLeft} days. Upgrade to keep your booking page live, take unlimited bookings, and keep all your data.`;
  }
  const html = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <img src="${appUrl}/nibook-icon.png" alt="Nibook" style="width:64px;height:64px;border-radius:12px"/>
    <h1 style="margin:24px 0 8px">${headline}</h1>
    <p style="color:#666;line-height:1.6">${body}</p>
    <a href="${appUrl}/upgrade" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Upgrade my plan</a>
    <p style="color:#999;font-size:12px">Questions? Reply to this email, we are happy to help.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#999;font-size:12px">Nibook — Online booking for Kenyan service businesses</p>
  </div>`;
  return { subject, html };
}

/**
 * Send a trial-expiry alert email for one profile, deduped per stage via R2 markers.
 * Returns the result of the attempt.
 */
export async function sendTrialAlert(profile: any, email: string): Promise<{ sent: boolean; stage: string; reason?: string }> {
  const info = computeTrialStatus(profile);
  if (info.stage === "none") return { sent: false, stage: "none", reason: "not in alert window" };
  const userId = profile.user_id ?? profile.id;
  if (!userId) return { sent: false, stage: info.stage, reason: "no user id" };
  if (await alreadySent(userId, info.stage)) return { sent: false, stage: info.stage, reason: "already sent" };
  const { subject, html } = buildAlertEmail(profile?.business_name ?? null, info.daysLeft, info.expired);
  const { error: err } = await sendEmail(email, subject, html);
  if (err) return { sent: false, stage: info.stage, reason: "email send failed" };
  await markSent(userId, info.stage);
  return { sent: true, stage: info.stage };
}

/**
 * Sweep all profiles and send due trial alerts. Used by the daily scheduled
 * function and by the admin-gated sweep endpoint.
 */
export async function sweepTrialAlerts(): Promise<{ scanned: number; sent: number; skipped: number; errors: string[] }> {
  const out = { scanned: 0, sent: 0, skipped: 0, errors: [] as string[] };
  const emails = await fetchUserEmails();
  let from = 0;
  const pageSize = 100;
  for (let page = 0; page < 20; page++) {
    const { data, error } = await db
      .from("profiles")
      .select("user_id, business_name, subscription_plan, subscription_status, created_at")
      .range(from, from + pageSize - 1)
      .all();
    if (error || !data?.length) break;
    for (const p of data) {
      out.scanned++;
      const email = p?.email ?? emails[p?.user_id] ?? "";
      if (!email) { out.skipped++; continue; }
      const r = await sendTrialAlert(p, email);
      if (r.sent) out.sent++;
      else if (r.reason !== "already sent" && r.reason !== "not in alert window") {
        out.skipped++;
        out.errors.push(`${email}: ${r.reason ?? r.stage}`);
      } else out.skipped++;
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

export { STAGE_LABEL };
