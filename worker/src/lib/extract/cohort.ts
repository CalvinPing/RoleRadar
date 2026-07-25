const COHORT_RE = /\b(spring|summer|fall|autumn|winter)\s+(20\d{2})\b/i;

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Only matches an explicit "Season YYYY" mention (e.g. "(Fall 2026)") -
 * never inferred from the posting date. Checks the title first since that's
 * where it almost always appears; falls back to the description only if
 * the title has nothing.
 */
export function extractHiringCohort(title: string, description?: string): string | undefined {
  const fromTitle = title.match(COHORT_RE);
  if (fromTitle) return `${capitalize(fromTitle[1])} ${fromTitle[2]}`;

  if (description) {
    const fromDescription = description.match(COHORT_RE);
    if (fromDescription) return `${capitalize(fromDescription[1])} ${fromDescription[2]}`;
  }

  return undefined;
}
