const TOKEN_KEY = "nibook_auth_token";
const USER_KEY = "nibook_auth_user";

export function setSession(user: { id: string; email: string; displayName?: string | null }, token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): { id: string; email: string; displayName?: string | null } | null {
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function uploadFile(
  file: File,
  folder: "profiles" | "services" | "team",
): Promise<{ url: string | null; error: string | null }> {
  const token = localStorage.getItem(TOKEN_KEY);
  try {
    const res = await fetch(`/api/upload?folder=${folder}`, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: file,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { url: null, error: body.error ?? `HTTP ${res.status}` };
    }
    const body = await res.json();
    return { url: body.url as string, error: null };
  } catch (err) {
    return { url: null, error: String(err) };
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers ?? {}) as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch(`/api${path}`, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: body.error ?? `HTTP ${res.status}` };
    }
    const body = await res.json();
    return { data: body as T, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}
