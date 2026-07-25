import { COMPANIES, type CompanyConfig } from "../config/companies";
import { fetchAshbyJobs } from "./ats/ashby";
import { fetchGreenhouseJobs } from "./ats/greenhouse";
import { fetchLeverJobs } from "./ats/lever";
import { fetchTheMuseJobs } from "./sources/themuse";
import { fetchRemoteOkJobs } from "./sources/remoteok";
import type { CompanyFetchResult, Job, JobsCache, JobSource } from "./types";
import type { Env } from "../env";

// Full-cycle refresh interval across ALL sources. Two Workers Free limits
// drive the sharding below, not just one:
//   - 50 outbound fetch() subrequests per invocation
//   - 10ms CPU time per invocation (this is the tighter one in practice -
//     classifying/parsing a shard's worth of companies plus the aggregators'
//     pagination burned past 10ms and triggered error 1102 "exceeded
//     resources" in production, even though subrequest count was fine)
// So a "refresh" is actually TOTAL_SLOTS separate cron ticks: NUM_COMPANY_SHARDS
// slices of the company list, each kept small on purpose, plus one dedicated
// slot each for The Muse and RemoteOK (their pagination/parsing is too heavy
// to piggyback on a company shard - that's what caused the 1102s). The shard
// index rotates deterministically off wall-clock time.
export const DEFAULT_REFRESH_INTERVAL_MINUTES = 20;
const NUM_COMPANY_SHARDS = 30;
const TOTAL_SLOTS = NUM_COMPANY_SHARDS + 2; // + The Muse slot + RemoteOK slot
const KV_KEY = "jobs-cache";

export function getRefreshIntervalMinutes(env: Env): number {
  const raw = env.REFRESH_INTERVAL_MINUTES;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_REFRESH_INTERVAL_MINUTES;
}

/**
 * Round-robin, not contiguous slicing. COMPANIES is ordered by when each
 * company was added to the seed list, which clusters several of the
 * largest, highest-volume companies (Databricks, Stripe, DoorDash, MongoDB)
 * right at the start - a contiguous chunk() put all of them in one shard
 * and that shard alone blew the CPU budget. Round-robin spreads high- and
 * low-volume companies across shards regardless of list position.
 */
function roundRobinChunks<T>(items: T[], parts: number): T[][] {
  const buckets: T[][] = Array.from({ length: parts }, () => []);
  items.forEach((item, i) => buckets[i % parts].push(item));
  return buckets;
}

/** Deterministic, stateless shard selection from wall-clock time - no coordination needed between invocations. */
export function getShardIndex(env: Env, now: number = Date.now()): number {
  const tickMs = (getRefreshIntervalMinutes(env) / TOTAL_SLOTS) * 60 * 1000;
  return Math.floor(now / tickMs) % TOTAL_SLOTS;
}

/** Identifies "the same source" across refresh cycles for incremental merging. Aggregators are one source regardless of which company a given job is about. */
function sourceIdFor(ats: JobSource, companySlug: string): string {
  return ats === "themuse" || ats === "remoteok" ? ats : `${ats}:${companySlug}`;
}

async function fetchForCompany(company: CompanyConfig): Promise<Job[]> {
  switch (company.ats) {
    case "greenhouse":
      return fetchGreenhouseJobs(company);
    case "lever":
      return fetchLeverJobs(company);
    case "ashby":
      return fetchAshbyJobs(company);
  }
}

interface Task {
  sourceId: string;
  reportAs: { company: string; slug: string; ats: JobSource };
  run: () => Promise<Job[]>;
}

function buildShardTasks(shardIndex: number): Task[] {
  // Last two slots are the aggregators, alone - see the CPU-limit note above.
  if (shardIndex === NUM_COMPANY_SHARDS) {
    return [
      {
        sourceId: "themuse",
        reportAs: { company: "The Muse", slug: "themuse", ats: "themuse" },
        run: fetchTheMuseJobs,
      },
    ];
  }
  if (shardIndex === NUM_COMPANY_SHARDS + 1) {
    return [
      {
        sourceId: "remoteok",
        reportAs: { company: "RemoteOK", slug: "remoteok", ats: "remoteok" },
        run: fetchRemoteOkJobs,
      },
    ];
  }

  const shards = roundRobinChunks(COMPANIES, NUM_COMPANY_SHARDS);
  return (shards[shardIndex] ?? []).map((company) => ({
    sourceId: sourceIdFor(company.ats, company.slug),
    reportAs: { company: company.name, slug: company.slug, ats: company.ats },
    run: () => fetchForCompany(company),
  }));
}

function dedupe(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>();
  for (const job of jobs) {
    const existing = seen.get(job.dedupeKey);
    if (!existing || new Date(job.postedAt) > new Date(existing.postedAt)) {
      seen.set(job.dedupeKey, job);
    }
  }
  return Array.from(seen.values()).sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
  );
}

let refreshInFlight: Promise<JobsCache> | null = null;

/**
 * Refreshes one shard of sources and merges the result into the existing
 * cache. On a per-source failure this cycle, that source's previously
 * cached jobs are left untouched (shown stale rather than dropped) while
 * its companyResults entry still updates to reflect the failure - so the
 * "N/M sources ok" count is always current even though job data lags for
 * that one source until it next succeeds.
 */
export async function refreshJobsCache(env: Env, shardIndexOverride?: number): Promise<JobsCache> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const shardIndex = shardIndexOverride ?? getShardIndex(env);
    const tasks = buildShardTasks(shardIndex);

    const settled = await Promise.allSettled(tasks.map((t) => t.run()));

    const newJobs: Job[] = [];
    const succeededSourceIds = new Set<string>();
    const freshResults = new Map<string, CompanyFetchResult>();

    settled.forEach((result, i) => {
      const task = tasks[i];
      if (result.status === "fulfilled") {
        newJobs.push(...result.value);
        succeededSourceIds.add(task.sourceId);
        freshResults.set(task.sourceId, {
          ...task.reportAs,
          ok: true,
          jobCount: result.value.length,
        });
      } else {
        const message =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        console.error(`[roleradar] refresh failed for ${task.reportAs.company} (${task.sourceId}): ${message}`);
        freshResults.set(task.sourceId, {
          ...task.reportAs,
          ok: false,
          jobCount: 0,
          error: message,
        });
      }
    });

    const existingRaw = await env.JOBS_KV.get(KV_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as JobsCache) : null;

    const keptJobs = (existing?.jobs ?? []).filter(
      (j) => !succeededSourceIds.has(sourceIdFor(j.ats, j.companySlug)),
    );

    const resultsById = new Map<string, CompanyFetchResult>();
    for (const r of existing?.companyResults ?? []) {
      resultsById.set(sourceIdFor(r.ats, r.slug), r);
    }
    for (const [id, r] of freshResults) resultsById.set(id, r);

    const cache: JobsCache = {
      jobs: dedupe([...keptJobs, ...newJobs]),
      lastRefreshedAt: new Date().toISOString(),
      refreshIntervalMinutes: getRefreshIntervalMinutes(env),
      companyResults: Array.from(resultsById.values()),
    };

    await env.JOBS_KV.put(KV_KEY, JSON.stringify(cache));
    return cache;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function getJobsCache(env: Env): Promise<JobsCache | null> {
  const raw = await env.JOBS_KV.get(KV_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as JobsCache;
}
