import { useMemo, useState } from "react";
import { FeedbackWidget } from "./components/FeedbackWidget";
import { FilterConsole } from "./components/FilterConsole";
import { JobList } from "./components/JobList";
import { StatusBar } from "./components/StatusBar";
import { EmptyState, LoadingState } from "./components/StatusMessages";
import { useJobs } from "./hooks/useJobs";
import { applyFilters, countWithinHours } from "./lib/filters";
import { DEFAULT_FILTERS, type Filters } from "./types";

function App() {
  const { data, error, loading } = useJobs();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const jobs = data?.jobs ?? [];

  const locations = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.location))).sort(),
    [jobs],
  );

  const companies = useMemo(() => {
    const map = new Map<string, string>();
    for (const job of jobs) map.set(job.companySlug, job.company);
    return Array.from(map, ([slug, name]) => ({ slug, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [jobs]);

  const hiringCohorts = useMemo(
    () =>
      Array.from(new Set(jobs.map((j) => j.hiringCohort).filter((c): c is string => !!c))).sort(),
    [jobs],
  );

  const filteredJobs = useMemo(() => applyFilters(jobs, filters), [jobs, filters]);
  const last24hCount = useMemo(() => countWithinHours(filteredJobs, 24), [filteredJobs]);
  const newTodayCount = useMemo(() => countWithinHours(jobs, 24), [jobs]);

  const isDefaultFilters = useMemo(
    () => JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS),
    [filters],
  );

  const showInitialLoading = loading && !data;
  const sourcesTotal = data ? data.companyResults.length : 0;

  return (
    <div className="min-h-screen">
      <StatusBar
        displayedCount={filteredJobs.length}
        last24hCount={last24hCount}
        totalCount={jobs.length}
        newTodayCount={newTodayCount}
        timeWindow={filters.timeWindow}
        lastRefreshedAt={data?.lastRefreshedAt ?? null}
        refreshIntervalMinutes={data?.refreshIntervalMinutes ?? null}
        companyResults={data?.companyResults ?? []}
        connectionError={error}
      />

      <FilterConsole
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        locations={locations}
        companies={companies}
        hiringCohorts={hiringCohorts}
        isDefault={isDefaultFilters}
      />

      <main>
        {showInitialLoading ? (
          <LoadingState sourcesTotal={sourcesTotal} />
        ) : filteredJobs.length === 0 ? (
          <EmptyState onReset={() => setFilters(DEFAULT_FILTERS)} />
        ) : (
          <JobList jobs={filteredJobs} />
        )}
      </main>

      <FeedbackWidget />

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center font-mono text-xs text-ink-faint sm:px-6">
        <p>
          Postings pulled directly from each company's public careers API, plus{" "}
          <a
            href="https://www.themuse.com/jobs"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber"
          >
            The Muse
          </a>{" "}
          and{" "}
          <a
            href="https://remoteok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber"
          >
            Remote OK
          </a>
          . No accounts, no tracking, nothing saved.
        </p>
      </footer>
    </div>
  );
}

export default App;
