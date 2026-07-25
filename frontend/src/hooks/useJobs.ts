import { useEffect, useRef, useState } from "react";
import type { JobsResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const POLL_INTERVAL_MS = 60_000;

interface UseJobsState {
  data: JobsResponse | null;
  error: string | null;
  loading: boolean;
}

export function useJobs(): UseJobsState {
  const [state, setState] = useState<UseJobsState>({
    data: null,
    error: null,
    loading: true,
  });
  const isFirstLoad = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/jobs`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as JobsResponse;
        if (cancelled) return;
        setState({ data, error: null, loading: false });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          data: prev.data,
          error: err instanceof Error ? err.message : "Failed to reach the data source",
          loading: false,
        }));
      } finally {
        isFirstLoad.current = false;
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return state;
}
