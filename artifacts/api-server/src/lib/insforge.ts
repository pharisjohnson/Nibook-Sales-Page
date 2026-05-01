import { createClient, type InsForgeClient } from "@insforge/sdk";

let _client: InsForgeClient | null = null;

export function getInsforgeAdmin(): InsForgeClient {
  if (_client) return _client;

  const insforgeUrl = process.env.INSFORGE_URL ?? "";
  const insforgeApiKey = process.env.INSFORGE_API_KEY ?? "";

  if (!insforgeUrl) {
    throw new Error(
      "Missing INSFORGE_URL environment variable. " +
      "Please configure this to enable database features.",
    );
  }

  _client = createClient({
    baseUrl: insforgeUrl,
    anonKey: insforgeApiKey || undefined,
    isServerMode: true,
  });
  return _client;
}
