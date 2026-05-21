import { createClient } from "@insforge/sdk";

const url =
  process.env.INSFORGE_URL ??
  process.env.VITE_INSFORGE_URL ??
  "";

const serviceKey =
  process.env.INSFORGE_SERVICE_KEY ??
  process.env.VITE_INSFORGE_ANON_KEY ??
  "";

let _client: ReturnType<typeof createClient> | null = null;

export function getInsforgeAdmin() {
  if (!_client) {
    if (!url || !serviceKey) {
      throw new Error(
        "Set INSFORGE_URL and INSFORGE_SERVICE_KEY (or VITE_INSFORGE_URL / VITE_INSFORGE_ANON_KEY) env vars.",
      );
    }
    _client = createClient({ baseUrl: url, anonKey: serviceKey });
  }
  return _client;
}

/**
 * Creates a per-request InsForge client authenticated as the calling user.
 * The edgeFunctionToken makes PostgREST evaluate RLS as the user (auth.uid() = user id),
 * which satisfies UPDATE/INSERT policies without needing a service-role bypass.
 */
export function createUserClient(userToken: string) {
  return createClient({ baseUrl: url, anonKey: serviceKey, edgeFunctionToken: userToken });
}
