#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_URL = (process.env.NIBOOK_API_URL ?? "https://nibook.noonstudio.africa/api").replace(/\/$/, "");
const OWNER_ID = process.env.NIBOOK_OWNER_ID ?? "";

if (!OWNER_ID) {
  process.stderr.write("Error: NIBOOK_OWNER_ID environment variable is required.\n");
  process.exit(1);
}

// ─── API client ───────────────────────────────────────────────────────────────
async function api<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Formatters ───────────────────────────────────────────────────────────────
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

// ─── MCP Server ───────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "nibook",
  version: "1.0.0",
});

// ── list_bookings ─────────────────────────────────────────────────────────────
server.tool(
  "list_bookings",
  "List bookings for the business. Filter by status or date range. Returns client name, phone, service, datetime, and booking ID.",
  {
    status: z.enum(["pending", "confirmed", "completed", "cancelled", "no-show"])
      .optional()
      .describe("Filter by booking status. Omit to get all statuses."),
    date: z.string()
      .optional()
      .describe("Filter to a specific date — ISO 8601 (e.g. 2025-05-25). Returns bookings on that day."),
    limit: z.number().int().min(1).max(100).default(30)
      .describe("Maximum number of results to return."),
  },
  async ({ status, date, limit }) => {
    const params = new URLSearchParams({ owner_id: OWNER_ID, limit: String(limit) });
    if (status) params.set("status", status);
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      params.set("from", d.toISOString());
      params.set("to", next.toISOString());
    }

    const { data } = await api<{ data: any[] }>(`/bookings?${params}`);
    if (!data?.length) {
      return { content: [{ type: "text" as const, text: "No bookings found." }] };
    }

    const lines = data.map(b => [
      `📅 ${fmtDate(b.scheduled_at)}`,
      `   Client: ${b.client_name}${b.client_phone ? ` (${b.client_phone})` : ""}`,
      `   Service: ${b.services?.name ?? "—"} | ${fmtKES(b.amount)}`,
      `   Status: ${b.status} | ID: ${b.id}`,
      b.notes ? `   Notes: ${b.notes}` : null,
    ].filter(Boolean).join("\n")).join("\n\n");

    return {
      content: [{
        type: "text" as const,
        text: `Found ${data.length} booking(s):\n\n${lines}`,
      }],
    };
  },
);

// ── create_booking ────────────────────────────────────────────────────────────
server.tool(
  "create_booking",
  "Create a new booking for a client. Use list_services to find service IDs and prices.",
  {
    client_name: z.string().describe("Client's full name"),
    client_phone: z.string().optional().describe("Client phone number, e.g. +254700000000"),
    client_email: z.string().email().optional().describe("Client email address"),
    service_id: z.string().optional().describe("Service ID from list_services. Optional but recommended."),
    scheduled_at: z.string().describe(
      "Appointment start time in ISO 8601, Africa/Nairobi timezone, e.g. 2025-05-25T14:00:00+03:00"
    ),
    duration_minutes: z.number().int().optional().describe("Duration in minutes. Defaults to service duration or 60."),
    amount: z.number().optional().describe("Charge amount in KES. Defaults to service price."),
    notes: z.string().optional().describe("Any notes about this booking"),
    payment_status: z.enum(["unpaid", "paid", "partial"]).default("unpaid")
      .describe("Payment status for the booking"),
  },
  async (args) => {
    const { data } = await api<{ data: any }>("/bookings", {
      method: "POST",
      body: JSON.stringify({ owner_id: OWNER_ID, ...args }),
    });
    return {
      content: [{
        type: "text" as const,
        text: [
          "✅ Booking created!",
          `ID: ${data.id}`,
          `Client: ${data.client_name}`,
          `Date: ${fmtDate(data.scheduled_at)}`,
          `Status: ${data.status}`,
          data.amount ? `Amount: ${fmtKES(data.amount)}` : null,
        ].filter(Boolean).join("\n"),
      }],
    };
  },
);

// ── update_booking ────────────────────────────────────────────────────────────
server.tool(
  "update_booking",
  "Update a booking's status or details. Use list_bookings to find booking IDs.",
  {
    booking_id: z.string().describe("Booking ID to update"),
    status: z.enum(["confirmed", "completed", "cancelled", "no-show", "pending"])
      .optional()
      .describe("New booking status"),
    payment_status: z.enum(["unpaid", "paid", "partial"])
      .optional()
      .describe("New payment status"),
    notes: z.string().optional().describe("Update the booking notes"),
    amount: z.number().optional().describe("Update the charge amount in KES"),
  },
  async ({ booking_id, ...updates }) => {
    const payload = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );
    if (!Object.keys(payload).length) {
      return { content: [{ type: "text" as const, text: "No updates provided." }] };
    }
    await api(`/bookings/${booking_id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const changes = Object.entries(payload).map(([k, v]) => `  ${k}: ${v}`).join("\n");
    return {
      content: [{
        type: "text" as const,
        text: `✅ Booking ${booking_id} updated:\n${changes}`,
      }],
    };
  },
);

// ── list_services ─────────────────────────────────────────────────────────────
server.tool(
  "list_services",
  "List all services the business offers, with prices, durations, and IDs.",
  {},
  async () => {
    const { data } = await api<{ data: any[] }>(`/services?owner_id=${OWNER_ID}`);
    if (!data?.length) {
      return {
        content: [{
          type: "text" as const,
          text: "No services found. Add services in your Nibook dashboard or use create_service.",
        }],
      };
    }
    const lines = data.map(s =>
      `• ${s.name} — ${fmtKES(s.price)} | ${s.duration_minutes} min | ${s.is_active ? "Active" : "Inactive"}\n  ID: ${s.id}`,
    ).join("\n\n");
    return { content: [{ type: "text" as const, text: `Services (${data.length}):\n\n${lines}` }] };
  },
);

// ── create_service ────────────────────────────────────────────────────────────
server.tool(
  "create_service",
  "Add a new service to the business.",
  {
    name: z.string().describe("Service name, e.g. 'Beard Trim', 'Deep Tissue Massage'"),
    price: z.number().min(0).describe("Price in KES"),
    duration_minutes: z.number().int().min(5).describe("Duration in minutes"),
    description: z.string().optional().describe("Short description shown to clients"),
  },
  async (args) => {
    const { data } = await api<{ data: any }>("/services", {
      method: "POST",
      body: JSON.stringify({ owner_id: OWNER_ID, is_active: true, ...args }),
    });
    return {
      content: [{
        type: "text" as const,
        text: [
          "✅ Service created!",
          `ID: ${data.id}`,
          `Name: ${data.name}`,
          `Price: ${fmtKES(data.price)}`,
          `Duration: ${data.duration_minutes} min`,
        ].join("\n"),
      }],
    };
  },
);

// ── update_service ────────────────────────────────────────────────────────────
server.tool(
  "update_service",
  "Update an existing service — change price, duration, name, or toggle it active/inactive.",
  {
    service_id: z.string().describe("Service ID from list_services"),
    name: z.string().optional().describe("New service name"),
    price: z.number().min(0).optional().describe("New price in KES"),
    duration_minutes: z.number().int().min(5).optional().describe("New duration in minutes"),
    is_active: z.boolean().optional().describe("Set to false to hide the service from clients"),
    description: z.string().optional().describe("Updated description"),
  },
  async ({ service_id, ...updates }) => {
    const payload = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );
    await api(`/services/${service_id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const changes = Object.entries(payload).map(([k, v]) => `  ${k}: ${v}`).join("\n");
    return {
      content: [{
        type: "text" as const,
        text: `✅ Service ${service_id} updated:\n${changes}`,
      }],
    };
  },
);

// ── get_analytics ─────────────────────────────────────────────────────────────
server.tool(
  "get_analytics",
  "Get revenue, booking counts, completion rate, top services, and top clients. Optionally filter by date range.",
  {
    from: z.string().optional().describe("Start date, ISO 8601, e.g. 2025-05-01"),
    to: z.string().optional().describe("End date, ISO 8601, e.g. 2025-05-31"),
    period: z.enum(["today", "this_week", "this_month", "last_30_days"])
      .optional()
      .describe("Shorthand period. Overrides from/to if provided."),
  },
  async ({ from, to, period }) => {
    if (period) {
      const now = new Date();
      if (period === "today") {
        from = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        to = new Date().toISOString();
      } else if (period === "this_week") {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        from = new Date(now.setDate(diff)).toISOString();
        to = new Date().toISOString();
      } else if (period === "this_month") {
        from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        to = new Date().toISOString();
      } else if (period === "last_30_days") {
        from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        to = new Date().toISOString();
      }
    }

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const data = await api<any>(`/analytics/${OWNER_ID}?${params}`);

    const serviceLines = (data.serviceStats ?? []).slice(0, 5)
      .map((s: any) => `  • ${s.name}: ${s.bookings} bookings, ${fmtKES(s.revenue)}`)
      .join("\n") || "  None";

    const clientLines = (data.topClients ?? []).slice(0, 5)
      .map((c: any) => `  • ${c.name}${c.phone ? ` (${c.phone})` : ""}: ${c.bookings} bookings, ${fmtKES(c.spend)}`)
      .join("\n") || "  None";

    const statusLines = data.statusCounts
      ? Object.entries(data.statusCounts as Record<string, number>)
          .map(([s, n]) => `  ${s}: ${n}`).join("\n")
      : "  No data";

    const periodLabel = period ?? (from ? `${from.slice(0, 10)} → ${(to ?? "now").slice(0, 10)}` : "All time");

    return {
      content: [{
        type: "text" as const,
        text: [
          `📊 Analytics — ${periodLabel}`,
          "",
          `Revenue:        ${fmtKES(data.totalRevenue)}`,
          `Total bookings: ${data.totalBookings}`,
          `Completion rate: ${data.completionRate}%`,
          "",
          "By status:",
          statusLines,
          "",
          "Top services:",
          serviceLines,
          "",
          "Top clients:",
          clientLines,
        ].join("\n"),
      }],
    };
  },
);

// ── get_profile ───────────────────────────────────────────────────────────────
server.tool(
  "get_profile",
  "Get the business profile — name, slug, category, location, plan, and booking link.",
  {},
  async () => {
    const { data } = await api<{ data: any }>(`/profile/${OWNER_ID}`);
    return {
      content: [{
        type: "text" as const,
        text: [
          `🏪 ${data.business_name ?? "Unnamed business"}`,
          `Category:     ${data.category ?? "Not set"}`,
          `Location:     ${data.location ?? "Not set"}`,
          `Phone:        ${data.phone ?? "Not set"}`,
          `Plan:         ${data.plan ?? "trial"}`,
          `Booking link: ${API_URL.replace("/api", "")}/${data.slug ?? ""}`,
          `Google Cal:   ${data.google_calendar_email ?? "Not connected"}`,
        ].join("\n"),
      }],
    };
  },
);

// ── list_clients ──────────────────────────────────────────────────────────────
server.tool(
  "list_clients",
  "List unique clients derived from booking history — name, phone, number of visits, and total spend.",
  {
    limit: z.number().int().min(1).max(200).default(50)
      .describe("Maximum number of clients to return, sorted by total spend."),
  },
  async ({ limit }) => {
    const { data } = await api<{ data: any[] }>(
      `/bookings?owner_id=${OWNER_ID}&limit=500`,
    );
    if (!data?.length) {
      return { content: [{ type: "text" as const, text: "No clients found yet." }] };
    }

    const map = new Map<string, { name: string; phone: string; bookings: number; spend: number }>();
    for (const b of data) {
      const key = (b.client_phone ?? b.client_name).trim();
      const existing = map.get(key) ?? { name: b.client_name, phone: b.client_phone ?? "", bookings: 0, spend: 0 };
      existing.bookings++;
      if (b.status === "completed") existing.spend += Number(b.amount ?? 0);
      map.set(key, existing);
    }

    const sorted = [...map.values()]
      .sort((a, b) => b.spend - a.spend)
      .slice(0, limit);

    const lines = sorted.map((c, i) =>
      `${i + 1}. ${c.name}${c.phone ? ` (${c.phone})` : ""} — ${c.bookings} visit(s), ${fmtKES(c.spend)} total`,
    ).join("\n");

    return {
      content: [{
        type: "text" as const,
        text: `Clients (${sorted.length}):\n\n${lines}`,
      }],
    };
  },
);

// ─── Start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
