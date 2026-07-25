// Fallbacks for jobs sourced from aggregators (The Muse, RemoteOK) whose
// companies aren't in our curated config/companies.ts list.

import { COMPANIES, type CompanySize } from "../config/companies";

let curatedBySlug: Map<string, { ticker: string; size: CompanySize }> | null = null;

/** If an aggregator-sourced job happens to be from a company we already curate, reuse its real ticker/size instead of a generated fallback. */
export function lookupCuratedCompany(slug: string): { ticker: string; size: CompanySize } | undefined {
  if (!curatedBySlug) {
    curatedBySlug = new Map(COMPANIES.map((c) => [c.slug, { ticker: c.ticker, size: c.size }]));
  }
  return curatedBySlug.get(slug);
}

export function slugifyCompanyName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "unknown"
  );
}

export function fallbackTicker(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9 ]/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean);
  let t: string;
  if (words.length > 1) {
    t = words.map((w) => w[0]).join("").toUpperCase();
    if (t.length < 3) t += (words[words.length - 1]?.slice(1) || "").toUpperCase();
  } else {
    const w = words[0] || name;
    const first = w[0] ?? "?";
    const rest = w.slice(1).replace(/[aeiouAEIOU]/g, "");
    t = (first + rest).toUpperCase();
  }
  return t.slice(0, 5) || "???";
}
