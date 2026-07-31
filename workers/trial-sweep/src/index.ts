/**
 * Nibook trial-alert sweep trigger.
 *
 * Runs on a cron schedule and POSTs to the Pages Functions sweep endpoint.
 * The sweep endpoint requires the TRIAL_SWEEP_KEY secret, which this Worker
 * holds in its own secret binding. Keep them in sync if rotated.
 */
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const url = (env.TRIAL_SWEEP_URL || "https://nibook.pages.dev").replace(/\/$/, "");
    const key = env.TRIAL_SWEEP_KEY;
    if (!key) {
      console.error("TRIAL_SWEEP_KEY missing on worker");
      return;
    }
    try {
      const res = await fetch(`${url}/api/trial/sweep`, {
        method: "POST",
        headers: { "x-admin-key": key },
      });
      const text = await res.text();
      console.log(`sweep status ${res.status}: ${text.slice(0, 500)}`);
    } catch (err: unknown) {
      console.error("sweep call failed", (err as Error)?.message ?? String(err));
    }
  },
} satisfies ExportedHandler<Env>;
