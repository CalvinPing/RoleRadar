import { getJobsCache, getRefreshIntervalMinutes, refreshJobsCache } from "./lib/cache";
import { recordFeedback, validateFeedback } from "./lib/feedback";
import type { Env } from "./env";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...(init.headers ?? {}),
    },
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/api/jobs" && request.method === "GET") {
      const cache = await getJobsCache(env);
      if (!cache) {
        return json({
          jobs: [],
          lastRefreshedAt: null,
          refreshIntervalMinutes: getRefreshIntervalMinutes(env),
          companyResults: [],
          status: "loading",
        });
      }
      return json({ ...cache, status: "ready" });
    }

    if (url.pathname === "/api/refresh" && request.method === "POST") {
      if (env.CRON_SECRET) {
        const header = request.headers.get("authorization");
        if (header !== `Bearer ${env.CRON_SECRET}`) {
          return json({ error: "Unauthorized" }, { status: 401 });
        }
      }
      // Defaults to whichever shard scheduled() would run right now, so this
      // stays subrequest-safe in production too. Pass ?shard=0..3 to target
      // a specific shard (e.g. to populate a fresh local KV store quickly).
      const shardParam = url.searchParams.get("shard");
      const shardIndex = shardParam !== null ? Number(shardParam) : undefined;
      const cache = await refreshJobsCache(env, shardIndex);
      return json({
        ok: true,
        jobCount: cache.jobs.length,
        lastRefreshedAt: cache.lastRefreshedAt,
        companyResults: cache.companyResults,
      });
    }

    if (url.pathname === "/api/feedback" && request.method === "POST") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON body" }, { status: 400 });
      }
      const feedback = validateFeedback(body);
      if (!feedback) {
        return json({ error: "Expected { rating: 1-5, comment?: string }" }, { status: 400 });
      }
      await recordFeedback(env, feedback);
      return json({ ok: true });
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ ok: true, service: "roleradar-worker" });
    }

    return json({ error: "Not found" }, { status: 404 });
  },

  async scheduled(_event, env, ctx): Promise<void> {
    ctx.waitUntil(
      refreshJobsCache(env)
        .then((cache) => {
          const okCount = cache.companyResults.filter((c) => c.ok).length;
          console.log(
            `[roleradar] scheduled refresh done: ${cache.jobs.length} jobs from ${okCount}/${cache.companyResults.length} companies`,
          );
        })
        .catch((err) => console.error("[roleradar] scheduled refresh failed:", err)),
    );
  },
} satisfies ExportedHandler<Env>;
