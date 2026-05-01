import { createClient } from "@insforge/sdk";

const insforgeUrl = (import.meta.env.VITE_INSFORGE_URL as string) ?? "";
const insforgeAnonKey = (import.meta.env.VITE_INSFORGE_ANON_KEY as string) ?? "";

if (!insforgeUrl) {
  console.warn(
    "[Insforge] VITE_INSFORGE_URL is not set. Database features will not work until these are configured.",
  );
}

export const insforge = createClient({
  baseUrl: insforgeUrl || "https://placeholder.insforge.app",
  anonKey: insforgeAnonKey || undefined,
});
