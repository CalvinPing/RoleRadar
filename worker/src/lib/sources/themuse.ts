import { categorize, extractLevel, isSoftwareEngineeringRole } from "../classify";
import { fallbackTicker, lookupCuratedCompany, slugifyCompanyName } from "../companyMeta";
import { makeDedupeKey } from "../dedupe";
import { extractHiringCohort } from "../extract/cohort";
import { inferEmploymentTypeFromTitle } from "../extract/employmentType";
import { extractQualifications } from "../extract/qualifications";
import { salaryFromText } from "../extract/salary";
import type { Job } from "../types";
import { decodeHtml, fetchJson, stripHtml, stripTags } from "../ats/common";

// The Muse's public jobs API needs no auth (themuse.com/developers/api/v2).
// "Software Engineering" is one of their own categories but it's broad/noisy
// (mixes in non-eng roles) - we still run every result through the same
// title classifier as everything else rather than trusting their tagging.
const PAGES_PER_REFRESH = 4; // keep subrequest count small - see cache.ts sharding
const CATEGORY = "Software Engineering";

interface MuseJob {
  id: number;
  name: string;
  contents?: string;
  publication_date: string;
  locations?: { name: string }[];
  refs?: { landing_page?: string };
  company?: { name: string };
}

interface MuseResponse {
  results: MuseJob[];
}

export async function fetchTheMuseJobs(): Promise<Job[]> {
  const pages = await Promise.all(
    Array.from({ length: PAGES_PER_REFRESH }, (_, page) =>
      fetchJson(
        `https://www.themuse.com/api/public/jobs?category=${encodeURIComponent(CATEGORY)}&page=${page}`,
      ) as Promise<MuseResponse>,
    ),
  );

  const jobs: Job[] = [];
  for (const data of pages) {
    if (!Array.isArray(data.results)) continue;
    for (const raw of data.results) {
      if (!raw.company?.name || !raw.name) continue;
      if (!isSoftwareEngineeringRole(raw.name)) continue;

      const companyName = raw.company.name;
      const companySlug = slugifyCompanyName(companyName);
      const curated = lookupCuratedCompany(companySlug);
      const location = raw.locations?.map((l) => l.name).filter(Boolean).join("; ") || "Unspecified";
      const descriptionExcerpt = stripHtml(raw.contents);
      const decodedContent = decodeHtml(raw.contents);
      const plainDescription = stripTags(decodedContent);

      jobs.push({
        id: `themuse:${raw.id}`,
        company: companyName,
        companySlug,
        companyTicker: curated?.ticker ?? fallbackTicker(companyName),
        companySize: curated?.size,
        ats: "themuse",
        title: raw.name.trim(),
        location,
        postedAt: new Date(raw.publication_date).toISOString(),
        applyUrl: raw.refs?.landing_page || "",
        category: categorize(raw.name),
        level: extractLevel(raw.name),
        searchText: `${raw.name} ${descriptionExcerpt}`.toLowerCase(),
        dedupeKey: makeDedupeKey(companySlug, raw.name, location),
        salary: salaryFromText(plainDescription),
        employmentType: inferEmploymentTypeFromTitle(raw.name),
        hiringCohort: extractHiringCohort(raw.name, plainDescription),
        qualifications: extractQualifications(decodedContent),
      });
    }
  }
  return jobs;
}
