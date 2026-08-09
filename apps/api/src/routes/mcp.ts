import { Router, type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { getInsforgeAdmin } from "../lib/insforge.js";
import { randomBytes } from "crypto";

const router = Router();

function generateApiKey() {
  return "nk_" + randomBytes(24).toString("hex");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function fmtKES(amount: number | null | undefined) {
  return `KES ${Number(amount ?? 0).toLocaleString("en-KE")}`;
}

const PAID_PLANS = ["starter", "premium"];

// ─── POST /mcp/generate-key ──────────────────────────────────────────────────
router.post("/mcp/generate-key", async (req: Request, res: Response) => {
  const { user_id } = req.body as { user_id?: string };
  if (!user_id) { res.status(400).json({ error: "user_id required" }); return; }

  const db = getInsforgeAdmin();
  const { data: profile, error } = await db.database
    .from("profiles")
    .select("subscription_plan")
    .eq("user_id", user_id)
    .single();

  if (error || !profile) { res.status(404).json({ error: "Profile not found" }); return; }
  if (!PAID_PLANS.includes((profile as any).subscription_plan ?? "")) {
    res.status(403).json({ error: "MCP access requires a Starter or Premium plan" });
    return;
  }

  const api_key = generateApiKey();
  const { error: updErr } = await db.database.from("profiles").update({ api_key }).eq("user_id", user_id);
  if (updErr) {
    res.status(500).json({ error: `Could not store API key: ${updErr.message}` });
    return;
  }
  res.json({ api_key });
});

// ─── POST /mcp (Streamable HTTP — stateless per request) ─────────────────────
router.post("/mcp", async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"] as string | undefined;
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!apiKey) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Authorization header with Bearer token required" },
      id: null,
    });
    return;
  }

  const db = getInsforgeAdmin();
  const { data: profile, error: profileErr } = await db.database
    .from("profiles")
    .select("id, plan, business_name, slug")
    .eq("api_key", apiKey)
    .single();

  if (profileErr || !profile) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Invalid API key" },
      id: null,
    });
    return;
  }

  if (!PAID_PLANS.includes((profile as any).plan ?? "")) {
    res.status(403).json({
      jsonrpc: "2.0",
      error: { code: -32003, message: "MCP access requires a paid plan" },
      id: null,
    });
    return;
  }

  const OWNER_ID = (profile as any).id as string;
  const server = new McpServer({ name: "nibook", version: "1.0.0" });

  // ── list_bookings ────────────────────────────────────────────────────────────
  server.tool(
    "list_bookings",
    "List bookings. Filter by status or date. Returns client, service, datetime, status, and ID.",
    {
      status: z.enum(["pending", "confirmed", "completed", "cancelled", "no-show"]).optional(),
      date: z.string().optional().describe("ISO date, e.g. 2025-05-25"),
      limit: z.number().int().min(1).max(100).default(30),
    },
    async ({ status, date, limit }) => {
      let q = db.database.from("bookings").select("*, services(name)").eq("owner_id", OWNER_ID).limit(limit);
      if (status) q = (q as any).eq("status", status);
      if (date) {
        const d = new Date(date);
        const next = new Date(d);
        next.setDate(d.getDate() + 1);
        q = (q as any).gte("scheduled_at", d.toISOString()).lt("scheduled_at", next.toISOString());
      }
      const { data } = await q;
      if (!(data as any)?.length) return { content: [{ type: "text" as const, text: "No bookings found." }] };
      const lines = (data as any[]).map(b => [
        `📅 ${fmtDate(b.scheduled_at)}`,
        `   Client: ${b.client_name}${b.client_phone ? ` (${b.client_phone})` : ""}`,
        `   Service: ${(b.services as any)?.name ?? "—"} | ${fmtKES(b.amount)}`,
        `   Status: ${b.status} | ID: ${b.id}`,
        b.notes ? `   Notes: ${b.notes}` : null,
      ].filter(Boolean).join("\n")).join("\n\n");
      return { content: [{ type: "text" as const, text: `Found ${(data as any[]).length} booking(s):\n\n${lines}` }] };
    },
  );

  // ── create_booking ───────────────────────────────────────────────────────────
  server.tool(
    "create_booking",
    "Create a new booking. Use list_services to find service IDs.",
    {
      client_name: z.string(),
      client_phone: z.string().optional(),
      client_email: z.string().email().optional(),
      service_id: z.string().optional(),
      scheduled_at: z.string().describe("ISO 8601 e.g. 2025-05-25T14:00:00+03:00"),
      duration_minutes: z.number().int().optional(),
      amount: z.number().optional(),
      notes: z.string().optional(),
      payment_status: z.enum(["unpaid", "paid", "partial"]).default("unpaid"),
    },
    async (args) => {
      const { data, error: bookErr } = await db.database.from("bookings").insert({
        owner_id: OWNER_ID,
        status: "pending",
        ...args,
      }).select().single();
      if (bookErr) throw new Error(bookErr.message);
      const b = data as any;
      return {
        content: [{
          type: "text" as const,
          text: ["✅ Booking created!", `ID: ${b.id}`, `Client: ${b.client_name}`, `Date: ${fmtDate(b.scheduled_at)}`, `Status: ${b.status}`, b.amount ? `Amount: ${fmtKES(b.amount)}` : null].filter(Boolean).join("\n"),
        }],
      };
    },
  );

  // ── update_booking ───────────────────────────────────────────────────────────
  server.tool(
    "update_booking",
    "Update a booking status, payment, notes, or amount. Use list_bookings to find IDs.",
    {
      booking_id: z.string(),
      status: z.enum(["confirmed", "completed", "cancelled", "no-show", "pending"]).optional(),
      payment_status: z.enum(["unpaid", "paid", "partial"]).optional(),
      notes: z.string().optional(),
      amount: z.number().optional(),
    },
    async ({ booking_id, ...updates }) => {
      const payload = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      if (!Object.keys(payload).length) return { content: [{ type: "text" as const, text: "No updates provided." }] };
      const { error: updErr } = await db.database.from("bookings").update(payload).eq("id", booking_id).eq("owner_id", OWNER_ID);
      if (updErr) throw new Error(updErr.message);
      return {
        content: [{
          type: "text" as const,
          text: `✅ Booking ${booking_id} updated:\n${Object.entries(payload).map(([k, v]) => `  ${k}: ${v}`).join("\n")}`,
        }],
      };
    },
  );

  // ── list_services ────────────────────────────────────────────────────────────
  server.tool("list_services", "List all services with prices, durations, and IDs.", {}, async () => {
    const { data } = await db.database.from("services").select("*").eq("owner_id", OWNER_ID);
    if (!(data as any)?.length) return { content: [{ type: "text" as const, text: "No services found." }] };
    const lines = (data as any[]).map(s =>
      `• ${s.name} — ${fmtKES(s.price)} | ${s.duration_minutes} min | ${s.is_active ? "Active" : "Inactive"}\n  ID: ${s.id}`,
    ).join("\n\n");
    return { content: [{ type: "text" as const, text: `Services (${(data as any[]).length}):\n\n${lines}` }] };
  });

  // ── create_service ───────────────────────────────────────────────────────────
  server.tool(
    "create_service",
    "Add a new service.",
    {
      name: z.string(),
      price: z.number().min(0),
      duration_minutes: z.number().int().min(5),
      description: z.string().optional(),
    },
    async (args) => {
      const { data, error: svcErr } = await db.database.from("services").insert({ owner_id: OWNER_ID, is_active: true, ...args }).select().single();
      if (svcErr) throw new Error(svcErr.message);
      const s = data as any;
      return {
        content: [{
          type: "text" as const,
          text: ["✅ Service created!", `ID: ${s.id}`, `Name: ${s.name}`, `Price: ${fmtKES(s.price)}`, `Duration: ${s.duration_minutes} min`].join("\n"),
        }],
      };
    },
  );

  // ── update_service ───────────────────────────────────────────────────────────
  server.tool(
    "update_service",
    "Update a service — price, duration, name, or active status. Use list_services for IDs.",
    {
      service_id: z.string(),
      name: z.string().optional(),
      price: z.number().min(0).optional(),
      duration_minutes: z.number().int().min(5).optional(),
      is_active: z.boolean().optional(),
      description: z.string().optional(),
    },
    async ({ service_id, ...updates }) => {
      const payload = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      const { error: svcErr } = await db.database.from("services").update(payload).eq("id", service_id).eq("owner_id", OWNER_ID);
      if (svcErr) throw new Error(svcErr.message);
      return {
        content: [{
          type: "text" as const,
          text: `✅ Service ${service_id} updated:\n${Object.entries(payload).map(([k, v]) => `  ${k}: ${v}`).join("\n")}`,
        }],
      };
    },
  );

  // ── get_analytics ────────────────────────────────────────────────────────────
  server.tool(
    "get_analytics",
    "Get revenue, booking counts, completion rate, top services, and top clients.",
    {
      from: z.string().optional(),
      to: z.string().optional(),
      period: z.enum(["today", "this_week", "this_month", "last_30_days"]).optional(),
    },
    async ({ from, to, period }) => {
      let f = from, t = to;
      if (period) {
        const now = new Date();
        if (period === "today") { f = new Date(now.setHours(0,0,0,0)).toISOString(); t = new Date().toISOString(); }
        else if (period === "this_week") { const d=now.getDay(); const diff=now.getDate()-d+(d===0?-6:1); f=new Date(now.setDate(diff)).toISOString(); t=new Date().toISOString(); }
        else if (period === "this_month") { f=new Date(now.getFullYear(),now.getMonth(),1).toISOString(); t=new Date().toISOString(); }
        else if (period === "last_30_days") { f=new Date(Date.now()-30*24*60*60*1000).toISOString(); t=new Date().toISOString(); }
      }
      let q = db.database.from("bookings").select("*, services(name, price)").eq("owner_id", OWNER_ID);
      if (f) q = (q as any).gte("scheduled_at", f);
      if (t) q = (q as any).lte("scheduled_at", t);
      const { data: rows } = await q;
      const bookings = (rows ?? []) as any[];
      const totalRevenue = bookings.filter(b => b.status === "completed").reduce((s, b) => s + Number(b.amount ?? 0), 0);
      const completed = bookings.filter(b => b.status === "completed").length;
      const completionRate = bookings.length ? Math.round((completed / bookings.length) * 100) : 0;
      const svcMap: Record<string, { name: string; bookings: number; revenue: number }> = {};
      bookings.forEach(b => { const n = b.services?.name ?? "Unknown"; if (!svcMap[n]) svcMap[n] = { name: n, bookings: 0, revenue: 0 }; svcMap[n].bookings++; if (b.status === "completed") svcMap[n].revenue += Number(b.amount ?? 0); });
      const clientMap: Record<string, { name: string; phone: string; bookings: number; spend: number }> = {};
      bookings.forEach(b => { const key = b.client_phone ?? b.client_name; if (!clientMap[key]) clientMap[key] = { name: b.client_name, phone: b.client_phone ?? "", bookings: 0, spend: 0 }; clientMap[key].bookings++; if (b.status === "completed") clientMap[key].spend += Number(b.amount ?? 0); });
      const serviceLines = Object.values(svcMap).sort((a,b)=>b.revenue-a.revenue).slice(0,5).map(s => `  • ${s.name}: ${s.bookings} bookings, ${fmtKES(s.revenue)}`).join("\n") || "  None";
      const clientLines = Object.values(clientMap).sort((a,b)=>b.spend-a.spend).slice(0,5).map(c => `  • ${c.name}${c.phone ? ` (${c.phone})` : ""}: ${c.bookings} bookings, ${fmtKES(c.spend)}`).join("\n") || "  None";
      return {
        content: [{
          type: "text" as const,
          text: [`📊 Analytics — ${period ?? (f ? `${f.slice(0,10)} → ${(t ?? "now").slice(0,10)}` : "All time")}`, "", `Revenue:        ${fmtKES(totalRevenue)}`, `Total bookings: ${bookings.length}`, `Completion rate: ${completionRate}%`, "", "Top services:", serviceLines, "", "Top clients:", clientLines].join("\n"),
        }],
      };
    },
  );

  // ── get_profile ──────────────────────────────────────────────────────────────
  server.tool("get_profile", "Get business profile — name, slug, category, location, and plan.", {}, async () => {
    const { data: p } = await db.database.from("profiles").select("business_name, category, location, phone, subscription_plan, slug").eq("user_id", OWNER_ID).single();
    const pr = p as any;
    const APP_URL = process.env.APP_URL ?? "https://nibook.pages.dev";
    return {
      content: [{
        type: "text" as const,
        text: [`🏪 ${pr?.business_name ?? "Unnamed business"}`, `Category:     ${pr?.category ?? "Not set"}`, `Location:     ${pr?.location ?? "Not set"}`, `Phone:        ${pr?.phone ?? "Not set"}`, `Plan:         ${pr?.subscription_plan ?? "trial"}`, `Booking link: ${APP_URL}/${pr?.slug ?? ""}`].join("\n"),
      }],
    };
  });

  // ── list_clients ─────────────────────────────────────────────────────────────
  server.tool(
    "list_clients",
    "List unique clients ranked by total spend.",
    { limit: z.number().int().min(1).max(200).default(50) },
    async ({ limit }) => {
      const { data } = await db.database.from("bookings").select("client_name, client_phone, status, amount").eq("owner_id", OWNER_ID).limit(500);
      if (!(data as any)?.length) return { content: [{ type: "text" as const, text: "No clients found yet." }] };
      const map = new Map<string, { name: string; phone: string; bookings: number; spend: number }>();
      for (const b of data as any[]) {
        const key = (b.client_phone ?? b.client_name).trim();
        const existing = map.get(key) ?? { name: b.client_name, phone: b.client_phone ?? "", bookings: 0, spend: 0 };
        existing.bookings++;
        if (b.status === "completed") existing.spend += Number(b.amount ?? 0);
        map.set(key, existing);
      }
      const sorted = [...map.values()].sort((a, b) => b.spend - a.spend).slice(0, limit);
      const lines = sorted.map((c, i) => `${i + 1}. ${c.name}${c.phone ? ` (${c.phone})` : ""} — ${c.bookings} visit(s), ${fmtKES(c.spend)} total`).join("\n");
      return { content: [{ type: "text" as const, text: `Clients (${sorted.length}):\n\n${lines}` }] };
    },
  );

  // ─── Handle the MCP request with stateless transport ─────────────────────────
  try {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("finish", () => { server.close().catch(() => {}); });
    await server.connect(transport);
    await transport.handleRequest(req as any, res as any, req.body);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32000, message: String(err) }, id: null });
    }
  }
});

// ─── GET /mcp — helpful error for browsers/curl ──────────────────────────────
router.get("/mcp", (_req: Request, res: Response) => {
  res.status(405).json({
    error: "Use POST with Authorization: Bearer <api_key> and a JSON-RPC body",
    docs: "https://nibook.noonstudio.africa/settings?tab=connections",
  });
});

export default router;
