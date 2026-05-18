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
    _client = createClient(url, serviceKey);
  }
  return _client;
}
