import type { CompanyConfig } from "../../config/companies";
import { categorize, extractLevel, isSoftwareEngineeringRole } from "../classify";
import { makeDedupeKey } from "../dedupe";
import { extractHiringCohort } from "../extract/cohort";
import { inferEmploymentTypeFromTitle, normalizeEmploymentType } from "../extract/employmentType";
import { extractQualifications } from "../extract/qualifications";
import { salaryFromAshby } from "../extract/salary";
import type { Job } from "../types";
import { decodeHtml, fetchJson, stripHtml, stripTags } from "./common";

interface AshbyCompensation {
  summaryComponents?: {
    compensationType?: string;
    minValue?: number | null;
    maxValue?: number | null;
    currencyCode?: string | null;
    interval?: string | null;
  }[];
}

interface AshbyJob {
  id: string;
  title: string;
  department?: string;
  team?: string;
  location?: string;
  publishedAt?: string;
  jobUrl: string;
  applyUrl?: string;
  descriptionHtml?: string;
  employmentType?: string;
  compensation?: AshbyCompensation;
}

interface AshbyResponse {
  jobs: AshbyJob[];
}

export async function fetchAshbyJobs(company: CompanyConfig): Promise<Job[]> {
  // includeCompensation=true is required to get salary data - without it
  // the `compensation` field is always empty even when the posting has it.
  const url = `https://api.ashbyhq.com/posting-api/job-board/${company.slug}?includeCompensation=true`;
  const data = (await fetchJson(url)) as AshbyResponse;
  if (!Array.isArray(data.jobs)) {
    throw new Error("malformed response: missing jobs array");
  }

  const jobs: Job[] = [];
  for (const raw of data.jobs) {
    const departments = [raw.department, raw.team].filter((d): d is string => !!d);
    if (!isSoftwareEngineeringRole(raw.title, departments)) continue;

    const location = raw.location?.trim() || "Unspecified";
    const postedAt = raw.publishedAt || new Date().toISOString();
    const descriptionExcerpt = stripHtml(raw.descriptionHtml);
    const decodedContent = decodeHtml(raw.descriptionHtml);
    const plainDescription = stripTags(decodedContent);

    jobs.push({
      id: `ashby:${company.slug}:${raw.id}`,
      company: company.name,
      companySlug: company.slug,
      companyTicker: company.ticker,
      companySize: company.size,
      ats: "ashby",
      title: raw.title.trim(),
      location,
      postedAt: new Date(postedAt).toISOString(),
      applyUrl: raw.jobUrl || raw.applyUrl || "",
      category: categorize(raw.title),
      level: extractLevel(raw.title),
      searchText: `${raw.title} ${descriptionExcerpt}`.toLowerCase(),
      dedupeKey: makeDedupeKey(company.slug, raw.title, location),
      salary: salaryFromAshby(raw.compensation),
      employmentType: normalizeEmploymentType(raw.employmentType) ?? inferEmploymentTypeFromTitle(raw.title),
      hiringCohort: extractHiringCohort(raw.title, plainDescription),
      qualifications: extractQualifications(decodedContent),
    });
  }
  return jobs;
}
