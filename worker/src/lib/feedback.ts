import type { Env } from "../env";

const KV_KEY = "feedback";
const MAX_STORED = 500;
const MAX_COMMENT_LENGTH = 1000;

export interface FeedbackEntry {
  rating: number; // 1-5
  comment?: string;
  submittedAt: string; // ISO 8601
}

export function validateFeedback(body: unknown): { rating: number; comment?: string } | null {
  if (!body || typeof body !== "object") return null;
  const { rating, comment } = body as { rating?: unknown; comment?: unknown };

  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }
  if (comment !== undefined && typeof comment !== "string") return null;

  const trimmedComment = typeof comment === "string" ? comment.trim().slice(0, MAX_COMMENT_LENGTH) : undefined;
  return { rating, comment: trimmedComment || undefined };
}

/** Simple v1 storage: an append-only (capped) list in KV. No dashboard yet - this is just so ratings aren't lost. */
export async function recordFeedback(env: Env, entry: { rating: number; comment?: string }): Promise<void> {
  const raw = await env.JOBS_KV.get(KV_KEY);
  const existing: FeedbackEntry[] = raw ? JSON.parse(raw) : [];

  existing.push({ ...entry, submittedAt: new Date().toISOString() });
  const trimmed = existing.slice(-MAX_STORED);

  await env.JOBS_KV.put(KV_KEY, JSON.stringify(trimmed));
}
