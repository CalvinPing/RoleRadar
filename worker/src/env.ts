export interface Env {
  JOBS_KV: KVNamespace;
  /** Minutes between scheduled refreshes. Also drives the cron expression in wrangler.toml - keep them in sync. */
  REFRESH_INTERVAL_MINUTES?: string;
  /** If set, POST /api/refresh requires `Authorization: Bearer <secret>`. Unset in local dev. */
  CRON_SECRET?: string;
}
