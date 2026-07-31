import { db, insforgeAuth, storage } from "./_lib/insforge";
import { json, error, handleOptions, corsHeaders } from "./_lib/response";

const PAYHERO_BASE = "https://backend.payhero.co.ke/api/v2";
const PAYSTACK_BASE = "https://api.paystack.co";

function getEnv(key: string): string {
  return (globalThis as any).env?.[key] ?? (process as any).env?.[key] ?? "";
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

function decodeJwtSub(token: string): string | null {
  try { return JSON.parse(atob(token.split(".")[1])).sub ?? null; }
  catch { return null; }
}

async function sha512Hmac(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function requireAuth(request: Request): Promise<{ id: string; email: string }> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new AuthError("Not authenticated");
  const { data, error: err } = await insforgeAuth.getUser(auth.slice(7));
  if (err) throw new AuthError("Invalid or expired token");
  const u = (data as any)?.user ?? data;
  if (!u?.id) throw new AuthError("Invalid or expired token");
  return { id: u.id, email: u.email ?? "" };
}

class AuthError extends Error { constructor(m: string) { super(m); this.name = "AuthError"; } }

export async function onRequest(context: { request: Request; env: Record<string, string> }): Promise<Response> {
  const { request, env } = context;
  (globalThis as any).env = env;

  const cors = handleOptions(request);
  if (cors) return cors;

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";
  const method = request.method;

  const addCors = (r: Response) => { Object.entries(corsHeaders()).forEach(([k, v]) => r.headers.set(k, v)); return r; };

  try {
    return addCors(await route(method, path, url, request));
  } catch (err: any) {
    if (err.name === "AuthError") return addCors(json({ error: err.message }, 401));
    console.error("Unhandled:", err);
    return addCors(error(err.message ?? "Internal error"));
  }
}

async function route(method: string, path: string, url: URL, request: Request): Promise<Response> {
  const body = ["POST", "PATCH", "PUT"].includes(method) ? await request.json().catch(() => ({})) : {};

  // Health
  if ((path === "/" || path === "/healthz") && method === "GET") return json({ status: "ok" });

  // Auth
  const origin = "https://nibook.pages.dev";
  if (path === "/auth/signup" && method === "POST") return handleSignup(body, origin);
  if (path === "/auth/signin" && method === "POST") return handleSignin(body);
  if (path === "/auth/signout" && method === "POST") return json({ success: true });
  if (path === "/auth/me" && method === "GET") return handleAuthMe(request);

  // Welcome email
  if (path === "/email/welcome" && method === "POST") return handleWelcomeEmail(body);

  // Waitlist
  if (path === "/waitlist" && method === "POST") return handleWaitlist(body);

  // Payments
  if (path === "/payments/initiate" && method === "POST") return handlePaymentInitiate(request, body);
  if (/^\/payments\/status\//.test(path) && method === "GET") return handlePaymentStatus(path.split("/").pop()!);
  if (path === "/payments/callback" && method === "POST") return handlePaymentCallback(body);

  // Subscriptions
  if (path === "/subscriptions/initialize" && method === "POST") return handleSubInit(request, body);
  if (/^\/subscriptions\/verify\//.test(path) && method === "GET") return handleSubVerify(path.split("/").pop()!);
  if (path === "/subscriptions/webhook" && method === "POST") return handleSubWebhook(request);

  // Bookings
  if (path === "/bookings" && method === "GET") return handleBookingsGet(url);
  if (path === "/bookings" && method === "POST") return handleBookingsCreate(request, body);
  const bId = path.match(/^\/bookings\/([^/]+)$/);
  if (bId && method === "PATCH") return handleBookingsUpdate(bId[1], body);
  if (bId && method === "DELETE") return handleBookingsDelete(bId[1]);

  // Availability
  const avOwner = path.match(/^\/availability\/([^/]+)$/);
  if (avOwner && method === "GET") return handleAvGet(avOwner[1]);
  if (path.match(/^\/availability\/([^/]+)\/schedule$/) && method === "PUT") return handleAvSchedule(path.split("/")[2], body);
  if (path.match(/^\/availability\/([^/]+)\/blackouts$/) && method === "POST") return handleAvBlackoutCreate(path.split("/")[2], body);
  const avBd = path.match(/^\/availability\/([^/]+)\/blackouts\/([^/]+)$/);
  if (avBd && method === "DELETE") return handleAvBlackoutDelete(avBd[2]);
  if (path.match(/^\/availability\/([^/]+)\/rules$/) && method === "PUT") return handleAvRules(path.split("/")[2], body);

  // Services
  if (path === "/services" && method === "GET") return handleServicesGet(url);
  if (path === "/services" && method === "POST") return handleServicesCreate(body);
  const sId = path.match(/^\/services\/([^/]+)$/);
  if (sId && method === "PATCH") return handleServicesUpdate(sId[1], body);
  if (sId && method === "DELETE") return handleServicesDelete(sId[1]);

  // Profile
  const pId = path.match(/^\/profile\/([^/]+)$/);
  if (pId && method === "GET") return handleProfileGet(pId[1]);
  if (pId && method === "PATCH") return handleProfileUpdate(pId[1], request, body);
  const slugM = path.match(/^\/profile\/by-slug\/([^/]+)$/);
  if (slugM && method === "GET") return handleProfileBySlug(slugM[1]);

  // Directory
  if (path === "/directory" && method === "GET") return handleDirectory();

  // Analytics
  const anM = path.match(/^\/analytics\/([^/]+)$/);
  if (anM && method === "GET") return handleAnalytics(anM[1], url, request);

  // Team
  const tOwner = path.match(/^\/team\/([^/]+)$/);
  if (tOwner && method === "GET") return handleTeamGet(tOwner[1]);
  if (path.match(/^\/team\/([^/]+)\/invite$/) && method === "POST") return handleTeamInvite(path.split("/")[2], body);
  const tiD = path.match(/^\/team\/([^/]+)\/invites\/([^/]+)$/);
  if (tiD && method === "DELETE") return handleTeamInviteDelete(tiD[2]);
  const tmM = path.match(/^\/team\/([^/]+)\/members\/([^/]+)$/);
  if (tmM && method === "PATCH") return handleTeamMemberUpdate(tmM[2], body);
  if (tmM && method === "DELETE") return handleTeamMemberDelete(tmM[2]);

  // Upload
  if (path === "/upload" && method === "POST") return handleUpload(request);

  // Image serving (from R2)
  const img = path.match(/^\/images\/(.+)$/);
  if (img && method === "GET") return handleServeImage(img[1]);

  // Admin
  if (path === "/admin/stats" && method === "GET") return handleAdminStats(request);
  if (path === "/admin/users" && method === "GET") return handleAdminUsers(request, url);
  if (path === "/admin/churned" && method === "GET") return handleAdminChurned(request, url);

  return error("Not found", 404);
}

// ---- Auth ----

async function handleSignup(body: any, origin: string): Promise<Response> {
  const { email, password, businessName } = body;
  if (!email || !password) return json({ error: "email and password required" }, 400);
  const { data, error: err } = await insforgeAuth.signUp({ email, password, name: businessName ?? "" });
  if (err) return json({ error: err?.message ?? String(err) }, 400);
  const raw = data as any;
  const token = raw?.accessToken ?? null;
  const user = raw?.user ?? null;
  return json({ user: { id: user?.id ?? null, email: user?.email ?? email, displayName: businessName ?? null }, token, requireEmailVerification: raw?.requireEmailVerification ?? false });
}

async function handleSignin(body: any): Promise<Response> {
  const { email, password } = body;
  if (!email || !password) return json({ error: "email and password required" }, 400);
  const { data, error: err } = await insforgeAuth.signInWithPassword({ email, password });
  if (err) return json({ error: err?.message ?? String(err) }, 401);
  const raw = data as any;
  const token = raw?.accessToken ?? null;
  const user = raw?.user ?? raw;
  return json({ user: { id: user?.id ?? null, email: user?.email ?? email, displayName: user?.name ?? user?.displayName ?? null }, token });
}

async function handleAuthMe(request: Request): Promise<Response> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Not authenticated" }, 401);
  const userId = decodeJwtSub(auth.slice(7));
  if (!userId) return json({ error: "Invalid token" }, 401);
  const { data } = await db.from("profiles").select("user_id, business_name").eq("user_id", userId).single();
  return json({ user: { id: userId, email: "", displayName: (data as any)?.business_name ?? null } });
}

// ---- Waitlist ----

async function handleWaitlist(body: any): Promise<Response> {
  const { email, name } = body;
  if (!email) return json({ error: "email required" }, 400);
  const { data, error: err } = await db.from("waitlist").insert({ email: email.trim().toLowerCase(), name: name?.trim() || null });
  if (err) {
    const errObj = typeof err === "object" ? err : {};
    if (errObj?.code === "23505" || String(errObj?.message ?? "").includes("duplicate")) return json({ success: true, duplicate: true });
    return json({ error: errObj?.message ?? String(err) }, 500);
  }
  return json({ success: true }, 201);
}

// ---- Payments ----

function payheroAuth(): string {
  const u = getEnv("PAYHERO_USERNAME") ?? "";
  const p = getEnv("PAYHERO_PASSWORD") ?? "";
  const t = getEnv("PAYHERO_AUTH_TOKEN") ?? "";
  if (t.startsWith("Basic ")) return t;
  if (u && p) return "Basic " + btoa(`${u}:${p}`);
  if (t) return `Basic ${t}`;
  return "";
}

async function handlePaymentInitiate(request: Request, body: any): Promise<Response> {
  const user = await requireAuth(request);
  const { phone, amount, plan, reference, owner_id } = body;
  if (!phone || !amount || !plan) return json({ success: false, message: "phone, amount and plan are required" }, 400);
  const auth = payheroAuth();
  if (!auth) return json({ success: false, message: "PayHero credentials not configured" }, 500);
  const channelId = Number(getEnv("PAYHERO_CHANNEL_ID") ?? "0");
  if (!channelId) return json({ success: false, message: "PAYHERO_CHANNEL_ID not configured" }, 500);

  const ref = reference ?? `NIBOOK-${String(plan).toUpperCase()}-${Date.now()}`;
  const phoneN = normalizePhone(phone);
  const callbackUrl = getEnv("PAYHERO_CALLBACK_URL") ?? `${new URL(request.url).origin}/api/payments/callback`;

  await db.from("payments").insert({ reference: ref, phone: phoneN, amount, plan, owner_id: owner_id ?? null, status: "pending" });

  try {
    const payRes = await fetch(`${PAYHERO_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({ amount, phone_number: phoneN, channel_id: channelId, external_reference: ref, provider: "m-pesa", callback_url: callbackUrl }),
    });
    const payData = await payRes.json();
    await db.from("payments").update({ payhero_response: payData }).eq("reference", ref);
    if (!payRes.ok) {
      await db.from("payments").update({ status: "failed" }).eq("reference", ref);
      return json({ success: false, message: payData.message ?? "PayHero request failed", details: payData }, payRes.status);
    }
    return json({ success: true, reference: ref, message: "STK Push sent — check your phone", data: payData });
  } catch (err: any) {
    await db.from("payments").update({ status: "failed" }).eq("reference", ref);
    return json({ success: false, message: "Failed to reach PayHero", error: String(err) }, 502);
  }
}

async function handlePaymentStatus(reference: string): Promise<Response> {
  if (!reference) return json({ success: false, message: "reference is required" }, 400);
  const auth = payheroAuth();
  try {
    const payRes = await fetch(`${PAYHERO_BASE}/transaction-status?reference=${encodeURIComponent(reference)}`, { headers: { Authorization: auth } });
    const data = await payRes.json();
    if (!payRes.ok) return json({ success: false, message: "Status check failed", details: data }, payRes.status);
    const status = String(data.status ?? "PENDING").toUpperCase();
    const now = new Date().toISOString();
    if (["SUCCESS", "COMPLETE", "COMPLETED"].includes(status)) await db.from("payments").update({ status: "success", updated_at: now }).eq("reference", reference);
    else if (["FAILED", "CANCELLED", "CANCELED"].includes(status)) await db.from("payments").update({ status: "failed", updated_at: now }).eq("reference", reference);
    return json({ success: true, status, data });
  } catch (err: any) { return json({ success: false, message: "Failed to reach PayHero", error: String(err) }, 502); }
}

async function handlePaymentCallback(body: any): Promise<Response> {
  const ref = body.reference ?? body.external_reference ?? body.ExternalReference;
  if (ref) {
    const s = String(body.status ?? "").toUpperCase();
    const st = ["SUCCESS", "COMPLETE", "COMPLETED"].includes(s) ? "success" : ["FAILED", "CANCELLED", "CANCELED"].includes(s) ? "failed" : "pending";
    await db.from("payments").update({ status: st, callback_payload: body, updated_at: new Date().toISOString() }).eq("reference", ref);
  }
  return json({ received: true });
}

// ---- Subscriptions ----

async function handleSubInit(request: Request, body: any): Promise<Response> {
  const user = await requireAuth(request);
  const { email, plan_code, owner_id } = body;
  if (!email || !plan_code) return json({ success: false, message: "email and plan_code are required" }, 400);
  const sk = getEnv("PAYSTACK_SECRET_KEY");
  if (!sk) return json({ success: false, message: "PAYSTACK_SECRET_KEY is not configured" }, 500);
  const ref = `NIBOOK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const appUrl = getEnv("APP_URL") ?? "https://nibook.com";
  try {
    const psRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${sk}` },
      body: JSON.stringify({ email, plan: plan_code, reference: ref, callback_url: `${appUrl}/subscription/callback`, metadata: { owner_id: owner_id ?? null, custom_fields: [{ display_name: "Owner ID", variable_name: "owner_id", value: owner_id ?? "" }] } }),
    });
    const data = await psRes.json();
    if (!psRes.ok || !data.status || !data.data) return json({ success: false, message: data.message ?? "Paystack init failed" }, psRes.status);
    try { await db.from("payments").insert({ reference: ref, amount: 0, plan: plan_code, owner_id: owner_id ?? null, status: "pending" }); } catch {}
    return json({ success: true, authorization_url: data.data.authorization_url, reference: data.data.reference, access_code: data.data.access_code });
  } catch (err: any) { return json({ success: false, message: "Failed to reach Paystack", error: String(err) }, 502); }
}

async function handleSubVerify(reference: string): Promise<Response> {
  if (!reference) return json({ success: false, message: "reference is required" }, 400);
  const sk = getEnv("PAYSTACK_SECRET_KEY");
  if (!sk) return json({ success: false, message: "PAYSTACK_SECRET_KEY not configured" }, 500);
  try {
    const psRes = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${sk}` } });
    const d = await psRes.json();
    if (!psRes.ok || !d.status) return json({ success: false, message: d.message ?? "Verification failed" }, psRes.status);
    const tx = d.data;
    const ok = tx.status === "success";
    if (ok) {
      const now = new Date().toISOString();
      await db.from("payments").update({ status: "success", amount: tx.amount / 100, updated_at: now }).eq("reference", reference);
      if (tx.metadata?.owner_id) await db.from("profiles").update({ subscription_plan: tx.plan_object?.name ?? "paid", subscription_status: "active", paystack_customer_code: tx.customer.customer_code, subscription_code: tx.subscription_code ?? null, subscription_started_at: tx.paid_at ?? now }).eq("user_id", tx.metadata.owner_id);
    }
    return json({ success: true, paid: ok, status: tx.status, plan: tx.plan_object?.name ?? null, interval: tx.plan_object?.interval ?? null, customer_email: tx.customer.email, amount: tx.amount / 100, currency: tx.currency });
  } catch (err: any) { return json({ success: false, message: "Failed to reach Paystack", error: String(err) }, 502); }
}

async function handleSubWebhook(request: Request): Promise<Response> {
  const sk = getEnv("PAYSTACK_SECRET_KEY");
  const raw = await request.text();
  const sig = request.headers.get("x-paystack-signature") ?? "";
  if ((await sha512Hmac(sk, raw)) !== sig) return json({ message: "Invalid signature" }, 401);
  const ev = JSON.parse(raw);
  try {
    const ins = db;
    switch (ev.event) {
      case "charge.success": { const ref = ev.data.reference; if (ref) await ins.from("payments").update({ status: "success", updated_at: new Date().toISOString() }).eq("reference", ref); break; }
      case "customer.subscription.updated": { const cc = ev.data.customer?.customer_code; if (cc) await ins.from("profiles").update({ subscription_status: ev.data.status ?? "active" }).eq("paystack_customer_code", cc); break; }
      case "subscription.create": { const cc = ev.data.customer?.customer_code; if (cc) await ins.from("profiles").update({ subscription_status: "active", subscription_code: ev.data.subscription_code ?? null, subscription_plan: ev.data.plan?.name ?? "paid", paystack_customer_code: cc }).eq("paystack_customer_code", cc); break; }
      case "invoice.payment_failed": { const cc = ev.data.customer?.customer_code; if (cc) await ins.from("profiles").update({ subscription_status: "attention" }).eq("paystack_customer_code", cc); break; }
      case "subscription.disable": { const cc = ev.data.customer?.customer_code; if (cc) await ins.from("profiles").update({ subscription_status: "cancelled" }).eq("paystack_customer_code", cc); break; }
      case "subscription.not_renew": { const cc = ev.data.customer?.customer_code; if (cc) await ins.from("profiles").update({ subscription_status: "non-renewing" }).eq("paystack_customer_code", cc); break; }
    }
  } catch (e) { console.error("[Paystack webhook]", ev.event, e); }
  return json({ received: true });
}

// ---- Bookings ----

async function handleBookingsGet(url: URL): Promise<Response> {
  const owner_id = url.searchParams.get("owner_id");
  if (!owner_id) return json({ error: "owner_id required" }, 400);
  const status = url.searchParams.get("status");
  const limit = url.searchParams.get("limit") ?? "100";
  const offset = url.searchParams.get("offset") ?? "0";
  try {
    let q = db.from("bookings").select("*, services(name, price)").eq("owner_id", owner_id).order("scheduled_at", false).range(Number(offset), Number(offset) + Number(limit) - 1);
    if (status) q = q.eq("status", status);
    const { data, error: err } = await q.all();
    if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
    return json({ data });
  } catch (err: any) { return error(String(err)); }
}

async function handleBookingsCreate(request: Request, body: any): Promise<Response> {
  const { owner_id, service_id, client_name, client_phone, client_email, scheduled_at, duration_minutes, notes, amount, payment_status } = body;
  if (!owner_id || !client_name || !scheduled_at) return json({ error: "owner_id, client_name, and scheduled_at required" }, 400);
  const { data, error: err } = await db.from("bookings").insert({ owner_id, service_id: service_id ?? null, client_name, client_phone: client_phone ?? null, client_email: client_email ?? null, scheduled_at, duration_minutes: duration_minutes ?? 60, notes: notes ?? null, amount: amount ?? null, payment_status: payment_status ?? "unpaid", status: "pending" });
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ data: (Array.isArray(data) ? data[0] : data) ?? data }, 201);
}

async function handleBookingsUpdate(id: string, body: any): Promise<Response> {
  const { data, error: err } = await db.from("bookings").update(body).eq("id", id);
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ data: Array.isArray(data) ? data[0] : data ?? data });
}

async function handleBookingsDelete(id: string): Promise<Response> {
  const { error: err } = await db.from("bookings").delete().eq("id", id);
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ success: true });
}

// ---- Availability ----

async function handleAvGet(owner_id: string): Promise<Response> {
  try {
    const [schedule, blackouts, rules] = await Promise.all([
      db.from("availability_schedules").select("*").eq("owner_id", owner_id).order("sort_order").all(),
      db.from("availability_blackouts").select("*").eq("owner_id", owner_id).order("date").all(),
      db.from("availability_rules").select("*").eq("owner_id", owner_id).single(),
    ]);
    return json({ schedule: schedule.data ?? [], blackouts: blackouts.data ?? [], rules: rules.data ?? null });
  } catch (err: any) { return error(String(err)); }
}

async function handleAvSchedule(owner_id: string, body: any): Promise<Response> {
  const { schedule } = body;
  if (!schedule) return json({ error: "schedule required" }, 400);
  try {
    await db.from("availability_schedules").delete().eq("owner_id", owner_id);
    const { error: err } = await db.from("availability_schedules").insert(schedule.map((s: any) => ({ ...s, owner_id })));
    if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
    return json({ success: true });
  } catch (err: any) { return error(String(err)); }
}

async function handleAvBlackoutCreate(owner_id: string, body: any): Promise<Response> {
  const { date, reason } = body;
  if (!date) return json({ error: "date required" }, 400);
  const { data, error: err } = await db.from("availability_blackouts").insert({ owner_id, date, reason: reason ?? "Time off" });
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ data: Array.isArray(data) ? data[0] : data }, 201);
}

async function handleAvBlackoutDelete(id: string): Promise<Response> {
  const { error: err } = await db.from("availability_blackouts").delete().eq("id", id);
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ success: true });
}

async function handleAvRules(owner_id: string, body: any): Promise<Response> {
  try {
    const existing = await db.from("availability_rules").select("id").eq("owner_id", owner_id).single();
    const { error: err } = existing.data
      ? await db.from("availability_rules").update(body).eq("owner_id", owner_id)
      : await db.from("availability_rules").insert({ ...body, owner_id });
    if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
    return json({ success: true });
  } catch (err: any) { return error(String(err)); }
}

// ---- Services ----

async function handleServicesGet(url: URL): Promise<Response> {
  const owner_id = url.searchParams.get("owner_id");
  if (!owner_id) return json({ error: "owner_id required" }, 400);
  const { data, error: err } = await db.from("services").select("*").eq("owner_id", owner_id).order("created_at").all();
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ data });
}

async function handleServicesCreate(body: any): Promise<Response> {
  const { owner_id, name, price, duration_minutes, image_url, is_active } = body;
  if (!owner_id || !name) return json({ error: "owner_id and name required" }, 400);
  const { data, error: err } = await db.from("services").insert({ owner_id, name, price: price ?? 0, duration_minutes: duration_minutes ?? 60, image_url: image_url ?? null, is_active: is_active ?? true });
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ data: Array.isArray(data) ? data[0] : data }, 201);
}

async function handleServicesUpdate(id: string, body: any): Promise<Response> {
  const { data, error: err } = await db.from("services").update(body).eq("id", id);
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ data: Array.isArray(data) ? data[0] : data });
}

async function handleServicesDelete(id: string): Promise<Response> {
  const { error: err } = await db.from("services").delete().eq("id", id);
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ success: true });
}

// ---- Profile ----

async function handleProfileGet(id: string): Promise<Response> {
  const { data, error: err } = await db.from("profiles").select("*").eq("user_id", id).single();
  if (err) return json({ error: "Profile not found" }, 404);
  return json({ data });
}

async function handleProfileUpdate(id: string, request: Request, body: any): Promise<Response> {
  await requireAuth(request);
  const allowed = ["business_name", "slug", "phone", "location", "bio", "category", "logo_url", "cover_url", "onboarding_completed", "subscription_plan", "avatar_url", "mpesa_paybill", "mpesa_account", "whatsapp_enabled", "whatsapp_phone", "reminder_hours", "cancellation_policy", "booking_widget_theme"];
  const safe = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  const { data: existing } = await db.from("profiles").select("user_id").eq("user_id", id).single();
  let result;
  if (existing) {
    result = await db.from("profiles").update(safe).eq("user_id", id);
  } else {
    result = await db.from("profiles").insert({ user_id: id, ...safe });
  }
  if (result.error) return json({ error: (result.error as any)?.message ?? String(result.error) }, 500);
  return json({ data: Array.isArray(result.data) ? result.data[0] : result.data });
}

async function handleProfileBySlug(slug: string): Promise<Response> {
  const { data, error: err } = await db.from("profiles").select("*").eq("slug", slug).single();
  if (err) return json({ error: "Business not found" }, 404);
  return json({ data });
}

// ---- Welcome Email ----

async function handleWelcomeEmail(body: any): Promise<Response> {
  const { email, businessName } = body;
  if (!email) return json({ error: "email required" }, 400);
  const { error: err } = await sendEmail(email, "Welcome to Nibook!",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <img src="https://nibook.pages.dev/nibook-icon.png" alt="Nibook" style="width:64px;height:64px;border-radius:12px"/>
      <h1 style="margin:24px 0 8px">Welcome to Nibook${businessName ? `, ${businessName}` : ''}!</h1>
      <p style="color:#666;line-height:1.6">Your account is ready. You can now <a href="https://nibook.pages.dev/dashboard" style="color:#2563eb">log in</a> to manage your bookings, services, and availability.</p>
      <p style="color:#666;line-height:1.6">If you ever need to reset your password, go to the sign-in page and click "Forgot Password".</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="color:#999;font-size:12px">Nibook — Online booking for Kenyan service businesses</p>
    </div>`);
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ success: true });
}

async function handleDirectory(): Promise<Response> {
  const { data, error: err } = await db.from("profiles").select("user_id, business_name, slug, category, location, bio, logo_url, cover_url, avatar_url").eq("onboarding_completed", true).order("business_name").all();
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ data });
}

// ---- Analytics ----

async function handleAnalytics(owner_id: string, url: URL, request: Request): Promise<Response> {
  await requireAuth(request);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  try {
    let q = db.from("bookings").select("*, services(name, price)").eq("owner_id", owner_id);
    if (from) q = q.gte("scheduled_at", from);
    if (to) q = q.lte("scheduled_at", to);
    const { data: rows, error: err } = await q.all();
    if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);

    const r = (rows ?? []) as any[];
    const totalRevenue = r.filter((b: any) => b.status === "completed").reduce((s: number, b: any) => s + Number(b.amount ?? 0), 0);
    const totalBookings = r.length;
    const completed = r.filter((b: any) => b.status === "completed").length;
    const completionRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0;

    const sm: Record<string, any> = {};
    r.forEach((b: any) => { const n = b.services?.name ?? "Unknown"; if (!sm[n]) sm[n] = { name: n, bookings: 0, revenue: 0 }; sm[n].bookings++; if (b.status === "completed") sm[n].revenue += Number(b.amount ?? 0); });
    const tc: Record<string, any> = {};
    r.forEach((b: any) => { const k = b.client_phone ?? b.client_name; if (!tc[k]) tc[k] = { name: b.client_name, phone: b.client_phone ?? "", bookings: 0, spend: 0 }; tc[k].bookings++; if (b.status === "completed") tc[k].spend += Number(b.amount ?? 0); });
    const sc = { completed: 0, cancelled: 0, "no-show": 0, pending: 0 };
    r.forEach((b: any) => { if (b.status in sc) (sc as any)[b.status]++; });

    return json({ totalRevenue, totalBookings, completionRate, serviceStats: Object.values(sm).sort((a: any, b: any) => b.revenue - a.revenue), topClients: Object.values(tc).sort((a: any, b: any) => b.spend - a.spend).slice(0, 10), statusCounts: sc, raw: r });
  } catch (err: any) { return error(String(err)); }
}

// ---- Team ----

async function handleTeamGet(owner_id: string): Promise<Response> {
  try {
    const [members, invites] = await Promise.all([
      db.from("team_members").select("*").eq("owner_id", owner_id).order("created_at").all(),
      db.from("team_invites").select("*").eq("owner_id", owner_id).order("created_at", false).all(),
    ]);
    return json({ members: members.data ?? [], invites: invites.data ?? [] });
  } catch (err: any) { return error(String(err)); }
}

async function handleTeamInvite(owner_id: string, body: any): Promise<Response> {
  const { email, role } = body;
  if (!email || !role) return json({ error: "email and role required" }, 400);
  const existing = await db.from("team_invites").select("id").eq("owner_id", owner_id).eq("email", email).single();
  if (existing.data) return json({ error: "Invite already sent to this email" }, 409);
  const { data, error: err } = await db.from("team_invites").insert({ owner_id, email, role });
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ data: Array.isArray(data) ? data[0] : data }, 201);
}

async function handleTeamInviteDelete(id: string): Promise<Response> {
  const { error: err } = await db.from("team_invites").delete().eq("id", id);
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ success: true });
}

async function handleTeamMemberUpdate(id: string, body: any): Promise<Response> {
  const { role } = body;
  if (!role) return json({ error: "role required" }, 400);
  const { data, error: err } = await db.from("team_members").update({ role }).eq("id", id);
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ data: Array.isArray(data) ? data[0] : data });
}

async function handleTeamMemberDelete(id: string): Promise<Response> {
  const { error: err } = await db.from("team_members").delete().eq("id", id);
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ success: true });
}

// ---- Upload & Image Serving ----

const ALLOWED_IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

async function handleUpload(request: Request): Promise<Response> {
  const { id: userId } = await requireAuth(request);

  const ct = (request.headers.get("Content-Type") ?? "").split(";")[0].trim();
  const ext = ALLOWED_IMAGE_TYPES[ct];
  if (!ext) return json({ error: `Unsupported image type: ${ct}` }, 400);

  const url = new URL(request.url);
  const rawFolder = url.searchParams.get("folder") ?? "misc";
  // Map frontend folder names to storage paths
  const folderMap: Record<string, string> = {
    "profiles": "logos", "logos": "logos",
    "covers": "covers",
    "services": "services",
    "team": "team",
  };
  const folder = (folderMap[rawFolder] ?? "misc").replace(/[^a-z0-9-_]/gi, "");
  const uuid = crypto.randomUUID();
  const filepath = `${folder}/${userId}_${uuid}.${ext}`;

  const buf = await request.arrayBuffer();
  if (!buf || buf.byteLength === 0) return json({ error: "Empty file body" }, 400);
  if (buf.byteLength > 10 * 1024 * 1024) return json({ error: "File too large (max 10 MB)" }, 413);

  // Try R2 first
  const r2 = (globalThis as any).env?.NIBOOK_IMAGES;
  if (r2) {
    await r2.put(filepath, new Uint8Array(buf), { httpMetadata: { contentType: ct } });
    return json({ url: `/api/images/${filepath}` });
  }

  // Fallback to InsForge storage
  const { data, error: err } = await storage.from("nibook-media").upload(filepath, new Blob([new Uint8Array(buf)], { type: ct }));
  if (err || !data) return json({ error: (err as any)?.message ?? "Upload failed" }, 500);
  return json({ url: storage.from("nibook-media").getPublicUrl(filepath) });
}

async function handleServeImage(imagePath: string): Promise<Response> {
  // Sanitise path — allow only alphanumeric, underscores, hyphens, slashes, dots
  if (!/^[a-z0-9_\-\.\/]+$/i.test(imagePath)) return new Response("Invalid path", { status: 400 });

  const r2 = (globalThis as any).env?.NIBOOK_IMAGES;
  if (!r2) return new Response("Image storage not available", { status: 503 });

  try {
    const obj = await r2.get(imagePath);
    if (!obj) return new Response("Not found", { status: 404 });

    const headers = new Headers({
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    // Support conditional requests
    if (obj.etag) headers.set("ETag", obj.etag);

    return new Response(obj.body, { headers });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}

// ---- Admin ----

function requireAdmin(request: Request): boolean {
  const key = getEnv("ADMIN_SECRET_KEY");
  return !!key && (request.headers.get("x-admin-key") ?? request.headers.get("X-Admin-Key")) === key;
}

async function handleAdminStats(request: Request): Promise<Response> {
  if (!requireAdmin(request)) return json({ error: "Unauthorized" }, 401);
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();
  const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
  try {
    const [total, active, b30, b7, signups, plans] = await Promise.all([
      db.from("profiles").select("id").count(),
      db.from("profiles").select("id").eq("subscription_status", "active").count(),
      db.from("bookings").select("id").gte("scheduled_at", d30).count(),
      db.from("bookings").select("id").gte("scheduled_at", d7).count(),
      db.from("profiles").select("id,created_at").gte("created_at", d7).order("created_at", false).all(),
      db.from("profiles").select("subscription_plan,subscription_status").not("subscription_plan", "is", null).all(),
    ]);
    const pc: Record<string, number> = {};
    (plans.data ?? []).forEach((r: any) => { const p = r.subscription_plan ?? "unknown"; pc[p] = (pc[p] ?? 0) + 1; });
    return json({ totalBusinesses: total.count ?? 0, activeSubscriptions: active.count ?? 0, bookingsLast30Days: b30.count ?? 0, bookingsLast7Days: b7.count ?? 0, newSignupsLast7Days: (signups.data ?? []).length, conversionRate: total.count ? Math.round(((active.count ?? 0) / total.count) * 100) : 0, planBreakdown: pc });
  } catch (err: any) { return error(String(err)); }
}

async function handleAdminUsers(request: Request, url: URL): Promise<Response> {
  if (!requireAdmin(request)) return json({ error: "Unauthorized" }, 401);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
  const page = Number(url.searchParams.get("page") ?? 0);
  const { data, error: err, count } = await db.from("profiles").select("id,email,business_name,subscription_plan,subscription_status,subscription_started_at,created_at").order("created_at", false).range(page * limit, page * limit + limit - 1).all();
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ data, total: count ?? 0, page, limit });
}

async function handleAdminChurned(request: Request, url: URL): Promise<Response> {
  if (!requireAdmin(request)) return json({ error: "Unauthorized" }, 401);
  const days = Math.min(Number(url.searchParams.get("days") ?? 30), 90);
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error: err } = await db.from("profiles").select("id,email,business_name,subscription_plan,subscription_started_at,created_at").eq("subscription_status", "cancelled").gte("created_at", since).order("created_at", false).all();
  if (err) return json({ error: (err as any)?.message ?? String(err) }, 500);
  return json({ data, days });
}
