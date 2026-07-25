# RoleRadar

Live software engineering job postings aggregated straight from company ATS
APIs, refreshed on a schedule, filterable without an account. No sign-in, no
saved preferences, no fake data — every listing shown was returned by a real
call to a real company's careers API.

## How it works

**Live site:** https://roleradar.pages.dev
**Live Worker (API):** https://roleradar-worker.calvinvping.workers.dev

RoleRadar is two deployables in one repo, built for Cloudflare's free tier:

- **`worker/`** — a Cloudflare Worker. A Cron Trigger calls `scheduled()` on
  a schedule, which fetches every company's ATS API, filters postings down to
  actual software engineering roles, dedupes them, and writes the result to
  Workers KV. `fetch()` exposes `GET /api/jobs` (serves the cached data — it
  never calls an ATS API on a request) and `POST /api/refresh` (an on-demand
  trigger, used by local dev and available for manual reruns).
- **`frontend/`** — a static Vite + React + TypeScript + Tailwind SPA, deployed
  to Cloudflare Pages. It fetches `GET /api/jobs` from the Worker and does all
  filtering client-side.

Data sources, all free and public, no API key or cost of any kind:
- **Greenhouse, Lever, Ashby** — public ATS board APIs that companies already
  expose for their own careers pages, not onesecondswe.dev's API and not
  scraping. See [`worker/src/config/companies.ts`](worker/src/config/companies.ts)
  for the seed list (151 companies); every entry was verified with a live
  HTTP call before being added.
- **The Muse** (`worker/src/lib/sources/themuse.ts`) and **RemoteOK**
  (`worker/src/lib/sources/remoteok.ts`) — public jobs aggregator APIs, no
  key required. These surface postings from companies outside our curated
  list; the same title classifier decides what's actually a SWE role.

Other platforms were researched and deliberately left out — see
[Sources considered and skipped](#sources-considered-and-skipped) below.

## Run it locally

```bash
npm install
npm run dev
```

That starts three things together: the Worker on `http://localhost:8787`
(Wrangler simulates KV on disk, no Cloudflare account needed), the frontend
on `http://localhost:5173`, and a small dev-only scheduler
(`worker/scripts/dev-scheduler.mjs`). Open the frontend URL.

Cloudflare's Cron Trigger doesn't fire under local `wrangler dev` at all
(a Miniflare limitation) - without something else driving it, the cache
would just sit at whatever it was last refreshed to, and "Updated Xm ago"
would keep climbing forever no matter how long you leave the dev server
running. The dev-scheduler exists to stand in for the Cron Trigger locally:
it refreshes once on startup, then on the same cadence as
`worker/wrangler.toml`'s cron (every 5 min by default). It's dev-only,
not part of the deployed Worker.

To force an extra refresh on demand at any point:

```bash
curl -X POST http://localhost:8787/api/refresh
```

## Refresh cadence — and why it's sharded

Configured in [`worker/wrangler.toml`](worker/wrangler.toml):

```toml
[triggers]
crons = ["*/1 * * * *"]   # every 1 minute - the finest Cloudflare allows

[vars]
REFRESH_INTERVAL_MINUTES = "32"   # full cycle across all sources
```

With 151 companies + 2 aggregators, one cron tick can't refresh everything -
and it turned out **two** separate Workers Free limits forced sharding, not
the one originally designed around:

- **50 outbound `fetch()` subrequests per invocation** - anticipated from
  the start.
- **10ms CPU time per invocation** - discovered the hard way, in production.
  The first deploy sharded only by subrequest count (4 shards of ~38
  companies) and immediately started throwing `error code: 1102 - Worker
  exceeded resources` on the heaviest shard. CPU time is pure compute, not
  wall-clock - waiting on `fetch()` doesn't count against it, but classifying
  every raw posting's title (originally ~80 separate regex `.test()` calls
  per posting) and decoding a company's full HTML descriptions absolutely
  does, and it adds up fast across a shard with several thousand raw
  postings in it.

Three fixes, all in `worker/src/lib/cache.ts` and `worker/src/lib/classify.ts`:

1. **The Muse and RemoteOK each get their own dedicated shard**, never
   bundled with companies - their pagination and parsing alone was enough to
   tip a shard over the CPU limit.
2. **Company shards are assigned round-robin, not by contiguous slicing.**
   `COMPANIES` is ordered by when each was added to the seed list, which
   happened to cluster several of the highest-volume companies (Databricks,
   Stripe, DoorDash, MongoDB) at the start of the array - a contiguous
   `chunk()` put all of them in shard 0, and that one shard alone kept
   failing regardless of how small the shard count made every other shard.
   Round-robin (`index % NUM_COMPANY_SHARDS`) spreads high- and low-volume
   companies across shards independent of list position.
3. **Classification and entity-decoding got faster, not just smaller-batched.**
   `isSoftwareEngineeringRole`'s ~80 individual regex patterns are now
   compiled into single alternation regexes (one engine pass instead of ~40
   separate `.test()` calls per posting), and HTML entity decoding went from
   12 sequential full-string `.replace()` scans to one combined-pattern pass.
   Same behavior, meaningfully less CPU time per posting.

Even with all three fixes, sharding still matters: `NUM_COMPANY_SHARDS = 30`
in `lib/cache.ts` (companies split ~5 per shard) plus the 2 dedicated
aggregator shards = 32 total slots, rotating deterministically off
wall-clock time so no coordination is needed between invocations. The cron
fires every `REFRESH_INTERVAL_MINUTES / 32` minutes (1 min, the floor), so a
full pass over every source completes roughly once per
`REFRESH_INTERVAL_MINUTES` (32 min - longer than the original 20-minute
target, a direct consequence of Free tier's CPU budget for this much data).
Each tick reads the existing KV cache, replaces only the jobs for sources it
just fetched, and writes back - so the merged dataset never disappears
mid-cycle, it just grows shard by shard. If a source fails, its previously
cached jobs are left in place (shown stale rather than dropped) while its
status in `companyResults` updates immediately to reflect the failure - this
is also what makes an occasional real transient failure (a slow upstream
API, a dropped connection) a non-event: it just retries on the next 1-minute
tick.

If you change `REFRESH_INTERVAL_MINUTES` or the shard counts in
`lib/cache.ts`, update the cron expression to match
(`interval / total slots`).

For local dev, `POST /api/refresh` defaults to the same time-computed shard
the cron would use, but accepts `?shard=N` to target a specific one (0-29
are company shards, 30 is The Muse, 31 is RemoteOK) - to populate a fresh
local KV store quickly:

```bash
for i in $(seq 0 31); do curl -X POST "http://localhost:8787/api/refresh?shard=$i"; done
```

(Local `wrangler dev` doesn't enforce the production CPU limit, so all 32
succeed instantly there regardless - the sharding exists for production.)

## Data pipeline details

- **ATS clients** (`worker/src/lib/ats/{greenhouse,lever,ashby}.ts`) fetch
  each company's board, normalize postings to a common `Job` shape, and pull
  a plain-text excerpt of the description for keyword search.
- **Classification** (`worker/src/lib/classify.ts`) filters to actual
  software engineering roles using title keyword matching plus the ATS's own
  department/team field where available (this is what keeps "Sales
  Engineer," "Solutions Architect," etc. out), then derives a role category
  (Frontend/Backend/Full Stack/Mobile/ML-AI/Data/DevOps-Infra/Security/Other)
  and seniority level (Intern/New Grad/Entry/Mid/Senior/Staff+) from the
  title.
- **Dedup** (`worker/src/lib/dedupe.ts`) keys on
  `company + normalized title + normalized location`, so the same role
  reposted over time collapses to one entry (the most recent posting date
  wins).
- **Per-source failure isolation**: every source in a shard fetches
  independently via `Promise.allSettled` in `worker/src/lib/cache.ts`. A
  timeout, 4xx/5xx, or malformed response is reported in `companyResults`
  and leaves that source's previously cached jobs untouched — the rest of
  the listing (and that source's own stale-but-real data) is unaffected.

## Structured fields (salary, employment type, hiring cohort, qualifications)

Every field below is only ever populated from real source data — never
estimated or inferred from thin evidence. If a posting doesn't have it, the
field is simply absent (checked live across ~3,200 real postings; see
`worker/src/lib/extract/`):

- **Salary** (`extract/salary.ts`) — ~49% of postings. Lever's structured
  `salaryRange` field and Ashby's `compensation` object (requires
  `?includeCompensation=true` on the request, which we now pass) are used
  directly when present. Greenhouse has no first-class field; we check for a
  custom `metadata` entry shaped like a currency range, then fall back to
  regex-matching a literal `"$X - $Y"` range in the description text, but
  only when it appears near salary-related wording ("salary", "pay range",
  "compensation") — never just any two dollar figures.
- **Employment type** (`extract/employmentType.ts`) — Ashby's `employmentType`
  enum and Lever's `categories.commitment` field are normalized through a
  lookup table (each platform/company uses its own vocabulary - "Regular",
  "Permanent", "Fixed-Term", etc. all map to the same 4 buckets). Greenhouse
  sometimes has an "Employment Type" metadata field; where it's missing, we
  only ever infer "Internship" from an explicit "Intern"/"Internship" in the
  title - never Part-time/Contract, which have no reliable title signal.
- **Hiring cohort** (`extract/cohort.ts`) — regex for an explicit `Season
  YYYY` mention (e.g. "(Fall 2026)") in the title, falling back to the
  description. Never inferred from the posting date - most internship
  postings actually have no cohort mentioned at all, and those are left
  blank.
- **Qualifications** (`extract/qualifications.ts`) — looks for a
  requirements/qualifications-style heading in the description (or, for
  Lever, its structured `lists` field) and returns the bullets under it. If
  no matching section exists, shows the full description instead of forcing
  a bad split.
- **Company size** — hand-curated per company in `config/companies.ts`
  (`size: "startup" | "midsize" | "enterprise"`), not sourced from any API -
  there's no reliable free headcount data source. It's a rough judgment call
  (funding stage / public vs private / general reputation), documented as
  such in that file. Only companies in our curated seed list have it;
  aggregator-sourced companies don't.

Fixed along the way: Greenhouse's `content` field turned out to be
**double** HTML-entity-encoded (`&lt;strong&gt;` instead of `<strong>`),
which was silently leaving garbled markup in the search-text index before
this pass. `worker/src/lib/ats/common.ts` now decodes twice before
stripping tags.

## UX additions

- **Freshness + stat bar** (`StatusBar.tsx`): "Updated Xm ago" pulled from
  the real cache timestamp, shown prominently at the top, plus total listing
  count and "new today" - both computed from the full unfiltered dataset so
  they read as system-health stats, distinct from the filter-reactive "N
  shown" stats below them.
- **Qualifications disclosure** (`JobRow.tsx`): a "Reqs" toggle per row
  expands the bullets/fallback text inline without navigating away - the
  row's apply-link anchor and the toggle button are siblings, not nested, so
  they don't fight over the click.
- **Feedback widget** (`FeedbackWidget.tsx` + `POST /api/feedback`): a 1-5
  rating and optional comment. Stored as an append-only, size-capped
  (500 entries) list in KV under the key `feedback` - there's no dashboard
  for it yet, this is just v1 "don't lose the data" storage.

## Extending the company list

Before adding a company, verify its board actually returns postings:

```bash
# Greenhouse
curl -s "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs" | head -c 500

# Lever
curl -s "https://api.lever.co/v0/postings/{slug}?mode=json" | head -c 500

# Ashby
curl -s "https://api.ashbyhq.com/posting-api/job-board/{slug}" | head -c 500
```

If it 404s or returns an empty `jobs` array, don't add it. Otherwise add a
row to `worker/src/config/companies.ts` with a `name`, `slug`, `ats`, a
`size` (`startup`/`midsize`/`enterprise` - your best judgment, it's not
sourced from anywhere), and a short `ticker` (shown as the company tag in
the job list).

## Deploying

**Worker:**

```bash
cd worker
npx wrangler kv namespace create JOBS_KV
# paste the returned id + preview_id into wrangler.toml
npx wrangler deploy
```

**Frontend** (point it at the deployed Worker's URL first):

```bash
cd frontend
echo "VITE_API_BASE_URL=https://roleradar-worker.<your-subdomain>.workers.dev" > .env.production
npm run build
npx wrangler pages deploy dist
```

## Sources considered and skipped

Researched but not integrated, with the reason:

| Source | Why not |
|---|---|
| **SmartRecruiters** | Real public API, but `companyId` is an opaque internal ID, not a guessable slug — blind name-guessing had a ~5% hit rate and even hits returned suspiciously tiny counts. A wrong ID also returns HTTP 200 with an empty list, same as a real company with zero postings, so there's no reliable way to verify a guess. |
| **Workable, Recruitee** | Real public APIs, no auth, but almost all well-known companies guessed by name resolve with zero jobs (moved to other ATS, or never had the public-widget tier). Confirmed real, current data for a handful of companies found via web search instead of guessing (Suade, MLabs, Teltonika, bunq, channable) — low volume, would need per-company manual discovery to grow. |
| **Breezy HR** | Docs describe a public JSON endpoint; confirmed the pattern works for Breezy's own account, but every guessed customer subdomain 403'd and no real customer example could be found to verify against. |
| **JazzHR** | Every endpoint requires a per-customer API key from that company's own JazzHR admin — no public unauthenticated board feed exists at all. |
| **Remotive** | API responds with no key, but its own embedded terms explicitly prohibit exactly this use case ("do not submit Remotive jobs to third party websites... we offer a private, paid-for API, starting budget is $5k/mo") and cap polling at 4 requests/day. |
| **Adzuna** | Genuinely free, no credit card on the signup form — but requires its own account (can't be created on your behalf) and the free tier is ~1,000 calls/month (~33/day), too tight for a 20-minute refresh cycle without a separate, much slower schedule just for it. |
| **USAJobs** | Genuinely free federal API, but government roles only — poor fit for a tech-company SWE board. |
| **Arbeitnow** | Works, no key, real data — but skipped for now since it's mostly EU/German-market postings; revisit if you want that geographic coverage. |

## Explicitly out of scope (v1)

Sign-in/accounts, saved/custom filters, a company hiring-trends page, a
curated-companies browsing page, and any admin/moderation tooling.
