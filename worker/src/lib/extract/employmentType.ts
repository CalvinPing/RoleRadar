export type EmploymentType = "full_time" | "part_time" | "internship" | "contract";

// Real values observed across live postings - each platform/company uses its
// own vocabulary, so this is a lookup table, not a single enum mapping.
const KNOWN_VALUES: Record<string, EmploymentType> = {
  fulltime: "full_time",
  "full-time": "full_time",
  "full time": "full_time",
  regular: "full_time",
  permanent: "full_time",
  parttime: "part_time",
  "part-time": "part_time",
  "part time": "part_time",
  intern: "internship",
  internship: "internship",
  scholarship: "internship",
  contract: "contract",
  contractor: "contract",
  "full time contractor": "contract",
  "fixed-term": "contract",
  "fixed term": "contract",
  "temporary (fixed term)": "contract",
  "temp full-time": "contract",
  "short term": "contract",
  temporary: "contract",
};

/** Normalizes a platform-provided employment-type string. Returns undefined for anything we don't recognize rather than guessing. */
export function normalizeEmploymentType(raw: string | null | undefined): EmploymentType | undefined {
  if (!raw) return undefined;
  return KNOWN_VALUES[raw.trim().toLowerCase()];
}

/** Conservative title-only fallback for platforms with no employment-type field at all. Only ever infers Internship - there's no reliable title signal for the other types. */
export function inferEmploymentTypeFromTitle(title: string): EmploymentType | undefined {
  return /\bintern(ship)?\b/i.test(title) ? "internship" : undefined;
}
