import type { Filters, Job, TimeWindow } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

const WINDOW_MS: Record<TimeWindow, number | null> = {
  "24h": DAY_MS,
  "3d": 3 * DAY_MS,
  "7d": 7 * DAY_MS,
  "30d": 30 * DAY_MS,
  all: null,
};

export function applyFilters(jobs: Job[], filters: Filters): Job[] {
  const windowMs = WINDOW_MS[filters.timeWindow];
  const cutoff = windowMs ? Date.now() - windowMs : null;
  const keyword = filters.keyword.trim().toLowerCase();

  return jobs.filter((job) => {
    if (cutoff !== null && new Date(job.postedAt).getTime() < cutoff) return false;
    if (filters.category !== "all" && job.category !== filters.category) return false;
    if (filters.level !== "all" && job.level !== filters.level) return false;
    if (filters.location !== "all" && job.location !== filters.location) return false;
    if (filters.company !== "all" && job.companySlug !== filters.company) return false;
    if (filters.employmentType !== "all" && job.employmentType !== filters.employmentType) return false;
    if (filters.companySize !== "all" && job.companySize !== filters.companySize) return false;
    if (filters.hiringCohort !== "all" && job.hiringCohort !== filters.hiringCohort) return false;
    if (keyword && !job.searchText.includes(keyword)) return false;
    return true;
  });
}

export function countWithinHours(jobs: Job[], hours: number): number {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return jobs.filter((job) => new Date(job.postedAt).getTime() >= cutoff).length;
}
