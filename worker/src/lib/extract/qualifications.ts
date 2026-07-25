import { stripTags } from "../ats/common";

export interface Qualifications {
  bullets?: string[];
  fallbackText?: string;
}

const HEADING_RE = /<(h[1-6]|strong|b)>\s*([^<]{2,80}?)\s*<\/\1>/gi;
const QUAL_HEADING_RE =
  /requirements?|qualifications?|what you'?ll need|what we'?re looking for|what we are looking for|who you are|skills?\s*(&|and)\s*qualifications/i;

const MAX_BULLETS = 12;
const MAX_FALLBACK_CHARS = 1500;
const MAX_FULL_DESCRIPTION_CHARS = 2000;

/**
 * Looks for a requirements/qualifications-style heading in the (already
 * HTML-decoded) description and returns the bullet list under it. If no
 * such heading exists, falls back to the full description text rather than
 * forcing a bad split - per spec, never a partial/misleading extraction.
 */
export function extractQualifications(decodedHtml: string): Qualifications | undefined {
  if (!decodedHtml) return undefined;

  const headings = [...decodedHtml.matchAll(HEADING_RE)];
  const matchIndex = headings.findIndex((h) => QUAL_HEADING_RE.test(h[2]));

  if (matchIndex === -1) {
    const fullText = stripTags(decodedHtml);
    if (!fullText) return undefined;
    return { fallbackText: fullText.slice(0, MAX_FULL_DESCRIPTION_CHARS) };
  }

  const match = headings[matchIndex];
  const sectionStart = (match.index ?? 0) + match[0].length;
  const sectionEnd = matchIndex + 1 < headings.length ? (headings[matchIndex + 1].index ?? decodedHtml.length) : decodedHtml.length;
  const sectionHtml = decodedHtml.slice(sectionStart, sectionEnd);

  const bullets = [...sectionHtml.matchAll(/<li>([\s\S]*?)<\/li>/gi)]
    .map((m) => stripTags(m[1]).trim())
    .filter(Boolean)
    .slice(0, MAX_BULLETS);

  if (bullets.length >= 2) {
    return { bullets };
  }

  const sectionText = stripTags(sectionHtml).trim();
  return sectionText ? { fallbackText: sectionText.slice(0, MAX_FALLBACK_CHARS) } : undefined;
}

interface LeverList {
  text: string;
  content: string;
}

/**
 * Lever structures postings as named sections up front (job.lists =
 * [{text: heading, content: html}]) - more reliable than heading-scanning
 * free text, so this is tried before extractQualifications() as a fallback.
 */
export function extractQualificationsFromLeverLists(lists: LeverList[] | undefined | null): Qualifications | undefined {
  const match = lists?.find((l) => QUAL_HEADING_RE.test(l.text));
  if (!match) return undefined;

  const bullets = [...match.content.matchAll(/<li>([\s\S]*?)<\/li>/gi)]
    .map((m) => stripTags(m[1]).trim())
    .filter(Boolean)
    .slice(0, MAX_BULLETS);

  if (bullets.length >= 1) return { bullets };

  const text = stripTags(match.content).trim();
  return text ? { fallbackText: text.slice(0, MAX_FALLBACK_CHARS) } : undefined;
}
