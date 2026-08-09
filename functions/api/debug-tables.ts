import { json } from "./_lib/response";

// TEMP debug endpoint — try migration with X-API-Key auth instead of Bearer. REMOVE after use.
export const onRequestPost: any = async (context: any) => {
  const env: Record<string, string> = context.env ?? {};
  const key = context.request.headers.get("x-admin-key") ?? "";
  const expected = env["TRIAL_SWEEP_KEY"] || env["ADMIN_SECRET_KEY"];
  if (!key || !expected || key !== expected) return json({ error: "forbidden" }, 403);
  const url = `${env["INSFORGE_URL"]}/api/database/migrations`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-Key": env["INSFORGE_SERVICE_KEY"],
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "20260731140000",
      name: "relax-service-booking-not-null",
      sql: `
ALTER TABLE services ALTER COLUMN provider_id DROP NOT NULL;
ALTER TABLE services ALTER COLUMN slug DROP NOT NULL;
ALTER TABLE services ALTER COLUMN duration_min DROP NOT NULL;
ALTER TABLE services ALTER COLUMN price_cents DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN provider_id DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN start_at DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN end_at DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN total_cents DROP NOT NULL;
`,
    }),
  });
  const data = await res.json();
  return json(data, res.status);
};
