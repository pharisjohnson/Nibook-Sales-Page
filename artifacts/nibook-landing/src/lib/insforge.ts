import { createClient } from "@insforge/sdk";

const insforgeUrl = import.meta.env.VITE_INSFORGE_URL as string;
const insforgeKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string;

if (!insforgeUrl || !insforgeKey) {
  throw new Error("Missing VITE_INSFORGE_URL or VITE_INSFORGE_ANON_KEY");
}

export const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeKey,
});
