import { useState } from "react";
import { formatSalary, relativeTime } from "../lib/format";
import { EMPLOYMENT_TYPE_LABELS, LEVEL_LABELS } from "../lib/labels";
import type { Job } from "../types";

const FRESH_MS = 24 * 60 * 60 * 1000;

export function JobRow({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);
  const isFresh = Date.now() - new Date(job.postedAt).getTime() < FRESH_MS;
  const hasQualifications = !!(job.qualifications?.bullets?.length || job.qualifications?.fallbackText);
  // Full-time is the default assumption - only call it out when it's something else.
  const showEmploymentType = job.employmentType && job.employmentType !== "full_time";

  return (
    <div className="group relative border-b border-line">
      {isFresh && (
        <span
          className="absolute left-0 top-0 h-full w-0.5 bg-cyan"
          aria-hidden
          title="Posted in the last 24 hours"
        />
      )}

      <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-panel sm:gap-4 sm:px-6">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
        >
          <span className="w-14 shrink-0 rounded border border-line bg-panel-raised px-1.5 py-1 text-center font-mono text-[11px] font-semibold tracking-wide text-ink-dim group-hover:border-amber/50 group-hover:text-amber">
            {job.companyTicker}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-ink">{job.title}</span>
            <span className="block truncate font-mono text-xs text-ink-dim">
              {job.company} · {job.location}
            </span>
            {(job.salary || job.hiringCohort) && (
              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-amber">
                {job.salary && <span>{formatSalary(job.salary)}</span>}
                {job.hiringCohort && <span className="text-cyan">{job.hiringCohort}</span>}
              </span>
            )}
          </span>

          <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
            {showEmploymentType && (
              <span className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-ink-dim">
                {EMPLOYMENT_TYPE_LABELS[job.employmentType!]}
              </span>
            )}
            <span className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-ink-dim">
              {LEVEL_LABELS[job.level]}
            </span>
          </span>

          <span
            className={`w-14 shrink-0 text-right font-mono text-xs ${
              isFresh ? "text-cyan" : "text-ink-dim"
            }`}
          >
            {relativeTime(job.postedAt)}
          </span>

          <span className="shrink-0 text-ink-faint transition-colors group-hover:text-amber" aria-hidden>
            →
          </span>
        </a>

        {hasQualifications && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="shrink-0 rounded border border-line px-2 py-1 font-mono text-[11px] text-ink-faint transition-colors hover:border-amber hover:text-amber"
          >
            {expanded ? "Hide" : "Reqs"}
          </button>
        )}
      </div>

      {expanded && job.qualifications && (
        <div className="border-t border-line bg-panel px-4 py-3 pl-[4.5rem] sm:px-6 sm:pl-[5.5rem]">
          {job.qualifications.bullets ? (
            <ul className="list-disc space-y-1 pl-4 font-mono text-xs text-ink-dim">
              {job.qualifications.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          ) : (
            <p className="whitespace-pre-line font-mono text-xs text-ink-dim">
              {job.qualifications.fallbackText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
