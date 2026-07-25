const FETCH_TIMEOUT_MS = 12_000;
const DESCRIPTION_EXCERPT_LENGTH = 1500;

export async function fetchJson(
  url: string,
  extraHeaders: Record<string, string> = {},
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", ...extraHeaders },
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// One combined-alternation pass instead of 12 sequential full-string
// .replace() scans - same result, much less CPU time per job. This matters:
// every matched job's description gets decoded (twice, for double-encoded
// Greenhouse content), and Workers Free's 10ms CPU budget per invocation is
// tight enough that this showed up as a real cost in production.
const ENTITY_MAP: Record<string, string> = {
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
  "&amp;": "&",
  "&#39;": "'",
  "&apos;": "'",
  "&#x27;": "'",
  "&quot;": '"',
  "&rsquo;": "'",
  "&#8217;": "'",
  "&lsquo;": "'",
  "&#8216;": "'",
  "&rdquo;": '"',
  "&#8221;": '"',
  "&ldquo;": '"',
  "&#8220;": '"',
  "&ndash;": "-",
  "&#8211;": "-",
  "&mdash;": "-",
  "&#8212;": "-",
};
const ENTITY_RE = new RegExp(
  Object.keys(ENTITY_MAP)
    .map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g",
);

function decodeEntitiesOnce(html: string): string {
  return html.replace(ENTITY_RE, (match) => ENTITY_MAP[match] ?? match);
}

/**
 * Some ATS platforms (Greenhouse in particular) return description HTML that
 * is itself HTML-entity-encoded (e.g. "&lt;strong&gt;" instead of
 * "<strong>"), so a single decode pass leaves markup visible as text.
 * Decoding twice fixes that and is a harmless no-op on content that wasn't
 * double-encoded to begin with.
 */
export function decodeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return decodeEntitiesOnce(decodeEntitiesOnce(html));
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return stripTags(decodeHtml(html)).slice(0, DESCRIPTION_EXCERPT_LENGTH);
}
