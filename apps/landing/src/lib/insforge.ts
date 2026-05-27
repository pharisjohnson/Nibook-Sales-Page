/**
 * Global InsForge client (brief: lib/insforge.ts).
 * Vite env: VITE_INSFORGE_URL, VITE_INSFORGE_ANON_KEY
 */
import { createClient } from "@insforge/sdk";

const insforgeUrl = import.meta.env.VITE_INSFORGE_URL as string;
const insforgeKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string;

if (!insforgeUrl || !insforgeKey) {
  console.error("Missing VITE_INSFORGE_URL or VITE_INSFORGE_ANON_KEY. Please check your .env file.");
}

export const insforge = createClient({
  baseUrl: insforgeUrl || "https://placeholder.insforge.app",
  anonKey: insforgeKey || "placeholder",
});
