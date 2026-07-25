export function LoadingState({ sourcesTotal }: { sourcesTotal: number }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-24 text-center">
      <span className="h-2 w-2 animate-pulse rounded-full bg-amber" aria-hidden />
      <p className="font-mono text-sm text-ink-dim">
        {sourcesTotal > 0
          ? `scanning ${sourcesTotal} sources…`
          : "connecting to the data source…"}
      </p>
    </div>
  );
}

export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-24 text-center">
      <p className="font-mono text-sm text-ink-dim">no signals matching your filters</p>
      <button
        type="button"
        onClick={onReset}
        className="rounded border border-line px-3 py-1.5 font-mono text-xs text-amber transition-colors hover:border-amber"
      >
        Reset filters
      </button>
    </div>
  );
}
