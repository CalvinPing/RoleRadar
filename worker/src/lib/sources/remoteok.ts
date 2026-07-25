import { categorize, extractLevel, isSoftwareEngineeringRole } from "../classify";
import { fallbackTicker, lookupCuratedCompany, slugifyCompanyName } from "../companyMeta";
import { makeDedupeKey } from "../dedupe";
import { extractHiringCohort } from "../extract/cohort";
import { inferEmploymentTypeFromTitle, normalizeEmploymentType } from "../extract/employmentType";
import { extractQualifications } from "../extract/qualifications";
import { salaryFromRemoteOk } from "../extract/salary";
import type { Job } from "../types";
import { decodeHtml, fetchJson, stripHtml, stripTags } from "../ats/common";

// RemoteOK's terms (embedded in the API response itself) ask for a followed
// backlink + "RemoteOK" credit - see the footer attribution in the frontend.
// No API key. ?tag=dev pre-filters to reduce noise before our own classifier
// runs (the unfiltered feed is ~2% SWE titles; dev-tagged is closer to ~10%).
const REMOTEOK_URL = "https://remoteok.com/api?tag=dev";
const USER_AGENT = "RoleRadarBot/1.0 (+https://github.com/roleradar; job board aggregator)";

interface RemoteOkJob {
  id?: string;
  slug?: string;
  date?: string;
  epoch?: number;
  company?: string;
  position?: string;
  location?: string;
  description?: string;
  url?: string;
  apply_url?: string;
  tags?: string[];
  salary_min?: number;
  salary_max?: number;
}

export async function fetchRemoteOkJobs(): Promise<Job[]> {
  const data = (await fetchJson(REMOTEOK_URL, { "User-Agent": USER_AGENT })) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("malformed response: expected array");
  }

  const jobs: Job[] = [];
  // First element is a legal/metadata blob, not a job posting.
  for (const raw of data.slice(1) as RemoteOkJob[]) {
    const title = raw.position?.replace(/\s+/g, " ").trim();
    if (!title || !raw.company || !raw.id) continue;
    if (!isSoftwareEngineeringRole(title)) continue;

    const companyName = raw.company.trim();
    const companySlug = slugifyCompanyName(companyName);
    const curated = lookupCuratedCompany(companySlug);
    const location = raw.location?.replace(/,\s*$/, "").trim() || "Remote";
    const postedAt = raw.date || (raw.epoch ? new Date(raw.epoch * 1000).toISOString() : null);
    if (!postedAt) continue;
    const descriptionExcerpt = stripHtml(raw.description);
    const decodedContent = decodeHtml(raw.description);
    const plainDescription = stripTags(decodedContent);

    const employmentType =
      raw.tags?.map(normalizeEmploymentType).find((t): t is NonNullable<typeof t> => !!t) ??
      inferEmploymentTypeFromTitle(title);

    jobs.push({
      id: `remoteok:${raw.id}`,
      company: companyName,
      companySlug,
      companyTicker: curated?.ticker ?? fallbackTicker(companyName),
      companySize: curated?.size,
      ats: "remoteok",
      title,
      location,
      postedAt: new Date(postedAt).toISOString(),
      applyUrl: raw.url || raw.apply_url || "",
      category: categorize(title),
      level: extractLevel(title),
      searchText: `${title} ${descriptionExcerpt}`.toLowerCase(),
      dedupeKey: makeDedupeKey(companySlug, title, location),
      salary: salaryFromRemoteOk(raw.salary_min, raw.salary_max),
      employmentType,
      hiringCohort: extractHiringCohort(title, plainDescription),
      qualifications: extractQualifications(decodedContent),
    });
  }
  return jobs;
}
