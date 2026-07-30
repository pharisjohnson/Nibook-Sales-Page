function getEnv(key: string): string {
  return (globalThis as any).env?.[key] ?? (process as any).env?.[key] ?? "";
}

function base(): string { return getEnv("INSFORGE_URL") || getEnv("VITE_INSFORGE_URL") || ""; }
function key(): string { return getEnv("INSFORGE_SERVICE_KEY") || getEnv("VITE_INSFORGE_ANON_KEY") || ""; }

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const k = key();
  const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
  if (k) h["Authorization"] = `Bearer ${k}`;
  return h;
}

async function postgrest(method: string, table: string, params: URLSearchParams, body?: any, accept?: string): Promise<Response> {
  const url = `${base()}/api/database/records/${table}?${params.toString()}`;
  const headers: Record<string, string> = authHeaders();
  if (accept) headers["Accept"] = accept;
  return fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

class Query {
  private params = new URLSearchParams();
  private table: string;

  constructor(table: string, select = "*") { this.table = table; this.params.set("select", select); }

  eq(col: string, val: any): this { this.params.set(col, `eq.${val}`); return this; }
  gte(col: string, val: any): this { this.params.set(col, `gte.${val}`); return this; }
  lte(col: string, val: any): this { this.params.set(col, `lte.${val}`); return this; }
  not(col: string, val: string): this { this.params.set(col, `not.${val}`); return this; }
  order(col: string, asc = true): this { this.params.set("order", `${col}.${asc ? "asc" : "desc"}`); return this; }
  range(from: number, to: number): this { this.params.set("offset", String(from)); this.params.set("limit", String(to - from + 1)); return this; }

  async all(): Promise<{ data: any; error: any; count?: number }> {
    const res = await postgrest("GET", this.table, this.params);
    if (!res.ok) { const t = await res.text(); return { data: null, error: parseErr(t) }; }
    const count = res.headers.get("content-range")?.split("/")[1];
    const text = await res.text();
    return { data: text ? JSON.parse(text) : [], error: null, count: count ? Number(count) : undefined };
  }

  async single(): Promise<{ data: any; error: any }> {
    const res = await postgrest("GET", this.table, this.params);
    if (!res.ok) { const t = await res.text(); return { data: null, error: parseErr(t) }; }
    const text = await res.text();
    const d = text ? JSON.parse(text) : null;
    if (Array.isArray(d) && d.length === 0) return { data: null, error: { message: "Not found" } };
    return { data: Array.isArray(d) ? d[0] : d, error: null };
  }

  async count(): Promise<{ count: number; error: any }> {
    this.params.set("select", "id");
    const url = `${base()}/api/database/records/${this.table}?${this.params.toString()}`;
    const res = await fetch(url, { method: "HEAD", headers: authHeaders() });
    if (!res.ok) { const t = await res.text(); return { count: 0, error: parseErr(t) }; }
    return { count: Number(res.headers.get("content-range")?.split("/")[1] ?? 0), error: null };
  }
}

async function insert(table: string, values: any): Promise<{ data: any; error: any }> {
  const url = `${base()}/api/database/records/${table}`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(Array.isArray(values) ? values : [values]),
  });
  if (!res.ok) { const e = await res.text(); return { data: null, error: e ? JSON.parse(e) : { message: `Insert failed (${res.status})` } }; }
  const text = await res.text();
  return { data: text ? JSON.parse(text) : { success: true }, error: null };
}

function parseErr(text: string): any {
  try { return JSON.parse(text); } catch { return { message: text || "Request failed" }; }
}

function updater(table: string) {
  return {
    eq: async (col: string, val: any, updates: any): Promise<{ data: any; error: any }> => {
      const p = new URLSearchParams([[col, `eq.${val}`]]);
      const res = await postgrest("PATCH", table, p, updates);
      if (!res.ok) { const t = await res.text(); return { data: null, error: parseErr(t) }; }
      const text = await res.text();
      return { data: text ? JSON.parse(text) : { success: true }, error: null };
    },
  };
}

function deleter(table: string) {
  return {
    eq: async (col: string, val: any): Promise<{ data: any; error: any }> => {
      const p = new URLSearchParams([[col, `eq.${val}`]]);
      const res = await postgrest("DELETE", table, p);
      if (!res.ok) { const t = await res.text(); return { data: null, error: parseErr(t) }; }
      return { data: { success: true }, error: null };
    },
  };
}

export const db = {
  from: (table: string) => ({
    select: (columns = "*") => new Query(table, columns),
    insert: (values: any) => insert(table, values),
    update: (updates: any) => ({
      eq: (col: string, val: any) => updater(table).eq(col, val, updates),
    }),
    delete: () => deleter(table),
  }),
};

export const insforgeAuth = {
  signUp: async (params: { email: string; password: string; name?: string; redirectTo?: string }) => {
    const body: any = { email: params.email, password: params.password, data: { name: params.name ?? "" } };
    if (params.redirectTo) body.redirectTo = params.redirectTo;
    const res = await fetch(`${base()}/api/auth/users`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { data, error: res.ok ? null : data };
  },
  signInWithPassword: async (params: { email: string; password: string }) => {
    const res = await fetch(`${base()}/api/auth/sessions`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ email: params.email, password: params.password }),
    });
    const data = await res.json();
    return { data, error: res.ok ? null : data };
  },
  getUser: async (token: string) => {
    const res = await fetch(`${base()}/api/auth/sessions/current`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return { data, error: res.ok ? null : data };
  },
};

export const storage = {
  from: (bucket: string) => ({
    upload: async (path: string, blob: Blob) => {
      const key = encodeURIComponent(path);
      const res = await fetch(`${base()}/api/storage/buckets/${bucket}/objects/${key}`, {
        method: "PUT",
        headers: authHeaders(),
        body: blob,
      });
      const data = await res.json();
      return { data: res.ok ? { key: path, ...data } : null, error: res.ok ? null : data };
    },
    getPublicUrl: (path: string) => `${base()}/api/storage/buckets/${bucket}/objects/${encodeURIComponent(path)}`,
  }),
};
