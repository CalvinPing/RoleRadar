import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export function FeedbackWidget() {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(chosenRating: number) {
    setRating(chosenRating);
    setStatus("sending");
    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: chosenRating, comment: comment || undefined }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="rounded border border-line bg-panel px-4 py-3 text-center font-mono text-xs text-cyan">
          Thanks for the feedback.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
      <div className="flex flex-col items-center gap-2 rounded border border-line bg-panel px-4 py-4 text-center">
        <p className="font-mono text-xs text-ink-dim">How's RoleRadar working for you?</p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => submit(n)}
              disabled={status === "sending"}
              aria-label={`Rate ${n} out of 5`}
              className={`h-8 w-8 rounded border font-mono text-xs transition-colors disabled:opacity-40 ${
                rating === n
                  ? "border-amber text-amber"
                  : "border-line text-ink-dim hover:border-amber hover:text-amber"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What could be better? (optional)"
          rows={2}
          maxLength={1000}
          className="mt-1 w-full max-w-sm resize-none rounded border border-line bg-void px-2.5 py-1.5 font-mono text-xs text-ink placeholder:text-ink-faint focus:border-amber"
        />
        {status === "error" && (
          <p className="font-mono text-[11px] text-danger">Couldn't send that - try again?</p>
        )}
      </div>
    </div>
  );
}
