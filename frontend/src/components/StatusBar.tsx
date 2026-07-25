import { relativeTimeShort } from "../lib/format";
import { TIME_WINDOW_LABELS } from "../lib/labels";
import type { CompanyFetchResult, TimeWindow } from "../types";

interface StatusBarProps {
  displayedCount: number;
  last24hCount: number;
  totalCount: number;
  newTodayCount: number;
  timeWindow: TimeWindow;
  lastRefreshedAt: string | null;
  refreshIntervalMinutes: number | null;
  companyResults: CompanyFetchResult[];
  connectionError: string | null;
}

export function StatusBar({
  displayedCount,
  last24hCount,
  totalCount,
  newTodayCount,
  timeWindow,
  lastRefreshedAt,
  refreshIntervalMinutes,
  companyResults,
  connectionError,
}: StatusBarProps) {
  const okSources = companyResults.filter((c) => c.ok).length;
  const totalSources = companyResults.length;

  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionError ? "bg-danger" : "bg-cyan live-pulse"
                }`}
                aria-hidden
              />
              <span className="font-mono text-xs font-medium tracking-[0.2em] text-ink-dim">
                {connectionError ? "OFFLINE" : "LIVE"}
              </span>
            </span>
            <h1 className="font-mono text-lg font-semibold tracking-tight text-ink">
              ROLE<span className="text-amber">RADAR</span>
            </h1>
          </div>
          <div className="font-mono text-xs text-ink-dim">
            {totalSources > 0 ? (
              <span>
                Updated <span className="font-semibold text-amber">{relativeTimeShort(lastRefreshedAt)}</span>
                {" · "}
                {okSources}/{totalSources} sources
                {refreshIntervalMinutes ? ` · every ${refreshIntervalMinutes}m` : ""}
              </span>
            ) : (
              <span>connecting to sources…</span>
            )}
          </div>
        </div>

        {connectionError && (
          <p className="rounded border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
            Can't reach the data source right now ({connectionError}). Showing the last data
            loaded in this session, if any.
          </p>
        )}

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-sm">
          <Stat value={totalCount} label="total listings" />
          <span className="text-ink-faint">·</span>
          <Stat value={newTodayCount} label="new today" accent />
        </div>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-xs text-ink-dim">
          <Stat value={displayedCount} label="shown" small />
          <span className="text-ink-faint">·</span>
          <Stat value={last24hCount} label="posted in last 24h" accent small />
          <span className="text-ink-faint">·</span>
          <span>
            window: <span className="text-ink">{TIME_WINDOW_LABELS[timeWindow]}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

function Stat({
  value,
  label,
  accent,
  small,
}: {
  value: number;
  label: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <span className="text-ink-dim">
      <span className={`font-semibold ${accent ? "text-cyan" : "text-ink"} ${small ? "text-xs" : ""}`}>
        {value}
      </span>{" "}
      {label}
    </span>
  );
}
