import type { SalaryRange } from "../types";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  const days = Math.floor(diff / DAY);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function relativeTimeShort(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  return `${Math.floor(diff / HOUR)}h ago`;
}

function compactNumber(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${Math.round(n)}`;
}

export function formatSalary(salary: SalaryRange): string {
  const currency = salary.currency === "USD" ? "$" : `${salary.currency} `;
  const suffix = salary.interval === "hour" ? "/hr" : salary.interval === "year" ? "/yr" : "";
  if (salary.min === salary.max) {
    return `${currency}${compactNumber(salary.min)}${suffix}`;
  }
  return `${currency}${compactNumber(salary.min)}–${currency}${compactNumber(salary.max)}${suffix}`;
}
