#!/usr/bin/env node
// Local-dev-only stand-in for the Cron Trigger. `wrangler dev` never fires
// scheduled() on its own (Miniflare limitation) - without this, the cache
// only updates when someone manually hits POST /api/refresh, and the
// "Updated Xm ago" indicator just sits there getting staler forever.
// Keep TICK_MINUTES in sync with the cron expression in wrangler.toml.
// Not used in production - Cloudflare's real Cron Trigger handles it there.

const WORKER_URL = process.env.WORKER_URL || "http://localhost:8787";
const TICK_MINUTES = Number(process.env.DEV_SCHEDULER_TICK_MINUTES || 1);

async function waitForWorker() {
  for (;;) {
    try {
      const res = await fetch(`${WORKER_URL}/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function tick() {
  try {
    const res = await fetch(`${WORKER_URL}/api/refresh`, { method: "POST" });
    const data = await res.json();
    const ok = data.companyResults?.filter((c) => c.ok).length ?? 0;
    const total = data.companyResults?.length ?? 0;
    console.log(`[dev-scheduler] refreshed: ${data.jobCount ?? "?"} jobs, ${ok}/${total} sources ok`);
  } catch (err) {
    console.error("[dev-scheduler] refresh failed:", err instanceof Error ? err.message : err);
  }
}

await waitForWorker();
console.log(`[dev-scheduler] worker is up - refreshing every ${TICK_MINUTES}m (mimics the production Cron Trigger)`);
await tick();
setInterval(tick, TICK_MINUTES * 60 * 1000);
