export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  interval: "year" | "hour" | "unknown";
}

function normalizeInterval(raw: string | null | undefined): "year" | "hour" | "unknown" {
  if (!raw) return "unknown";
  if (/year|annual/i.test(raw)) return "year";
  if (/hour/i.test(raw)) return "hour";
  return "unknown";
}

function isPlausible(min: number, max: number): boolean {
  return Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min;
}

/** Lever: job.salaryRange = {currency, interval, min, max} - opt-in per posting. */
export function salaryFromLever(raw: unknown): SalaryRange | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as { min?: number; max?: number; currency?: string; interval?: string };
  if (typeof r.min !== "number" || typeof r.max !== "number" || !isPlausible(r.min, r.max)) {
    return undefined;
  }
  return { min: r.min, max: r.max, currency: r.currency || "USD", interval: normalizeInterval(r.interval) };
}

interface AshbyCompensation {
  summaryComponents?: {
    compensationType?: string;
    minValue?: number | null;
    maxValue?: number | null;
    currencyCode?: string | null;
    interval?: string | null;
  }[];
}

/** Ashby: requires ?includeCompensation=true on the request. Null/empty when the company hasn't disclosed. */
export function salaryFromAshby(compensation: AshbyCompensation | null | undefined): SalaryRange | undefined {
  const comp = compensation?.summaryComponents?.find(
    (c) => c.compensationType === "Salary" && typeof c.minValue === "number",
  );
  if (!comp || typeof comp.minValue !== "number") return undefined;
  const max = typeof comp.maxValue === "number" ? comp.maxValue : comp.minValue;
  if (!isPlausible(comp.minValue, max)) return undefined;
  return {
    min: comp.minValue,
    max,
    currency: comp.currencyCode || "USD",
    interval: normalizeInterval(comp.interval),
  };
}

interface GreenhouseMetadataField {
  name: string;
  value: unknown;
  value_type: string;
}

/** Greenhouse: a per-company custom field, name varies, only present when configured. */
export function salaryFromGreenhouseMetadata(
  metadata: GreenhouseMetadataField[] | null | undefined,
): SalaryRange | undefined {
  const field = metadata?.find(
    (m) =>
      m.value_type === "currency_range" &&
      m.value &&
      /salary|pay range|compensation/i.test(m.name),
  );
  if (!field) return undefined;
  const v = field.value as { unit?: string; min_value?: string; max_value?: string };
  const min = parseFloat(v.min_value ?? "");
  const max = parseFloat(v.max_value ?? "");
  if (!isPlausible(min, max)) return undefined;
  return { min, max, currency: v.unit || "USD", interval: "year" };
}

const SALARY_CONTEXT_RE = /salary|compensation|pay range|on target earnings|base pay/i;
const DOLLAR_RANGE_RE = /\$([\d,]+(?:\.\d+)?)\s*(?:-|to|–)\s*\$?([\d,]+(?:\.\d+)?)/i;
const WINDOW_RE = /.{0,60}\$[\d,]+(?:\.\d+)?\s*(?:-|to|–)\s*\$?[\d,]+(?:\.\d+)?.{0,60}/gi;

/**
 * Greenhouse (and any other platform without a structured field) fallback:
 * scan the plain-text description for a dollar range that appears near
 * salary-related wording. Requires both the range AND the context keyword
 * so we don't misread an unrelated pair of dollar figures as a salary.
 */
export function salaryFromText(plainText: string): SalaryRange | undefined {
  const windows = plainText.match(WINDOW_RE) ?? [];
  for (const window of windows) {
    if (!SALARY_CONTEXT_RE.test(window)) continue;
    const m = window.match(DOLLAR_RANGE_RE);
    if (!m) continue;
    const min = parseFloat(m[1].replace(/,/g, ""));
    const max = parseFloat(m[2].replace(/,/g, ""));
    if (!isPlausible(min, max) || max < 1000) continue; // filters out stray small-dollar mentions
    return { min, max, currency: "USD", interval: /hour|\/\s*hr\b/i.test(window) ? "hour" : "year" };
  }
  return undefined;
}

/** RemoteOK: salary_min/salary_max fields, 0 when not disclosed. */
export function salaryFromRemoteOk(min: unknown, max: unknown): SalaryRange | undefined {
  if (typeof min !== "number" || typeof max !== "number" || min <= 0 || max <= 0) return undefined;
  if (!isPlausible(min, max)) return undefined;
  return { min, max, currency: "USD", interval: "year" };
}
