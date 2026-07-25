import type { CompanyConfig } from "../../config/companies";
import { categorize, extractLevel, isSoftwareEngineeringRole } from "../classify";
import { makeDedupeKey } from "../dedupe";
import { extractHiringCohort } from "../extract/cohort";
import { inferEmploymentTypeFromTitle, normalizeEmploymentType } from "../extract/employmentType";
import { extractQualifications, extractQualificationsFromLeverLists } from "../extract/qualifications";
import { salaryFromLever, salaryFromText } from "../extract/salary";
import type { Job } from "../types";
import { decodeHtml, fetchJson, stripHtml } from "./common";

interface LeverJob {
  id: string;
  text: string;
  hostedUrl: string;
  createdAt: number;
  categories?: { team?: string; location?: string; commitment?: string };
  descriptionBodyPlain?: string;
  descriptionPlain?: string;
  descriptionBody?: string;
  description?: string;
  lists?: { text: string; content: string }[];
  salaryRange?: { min?: number; max?: number; currency?: string; interval?: string };
}

export async function fetchLeverJobs(company: CompanyConfig): Promise<Job[]> {
  const url = `https://api.lever.co/v0/postings/${company.slug}?mode=json`;
  const data = (await fetchJson(url)) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("malformed response: expected array");
  }

  const jobs: Job[] = [];
  for (const raw of data as LeverJob[]) {
    const department = raw.categories?.team ? [raw.categories.team] : [];
    if (!isSoftwareEngineeringRole(raw.text, department)) continue;

    const location = raw.categories?.location?.trim() || "Unspecified";
    const plainDescription = raw.descriptionBodyPlain || raw.descriptionPlain || "";
    const descriptionExcerpt = stripHtml(plainDescription);

    const employmentType =
      normalizeEmploymentType(raw.categories?.commitment) ?? inferEmploymentTypeFromTitle(raw.text);

    jobs.push({
      id: `lever:${company.slug}:${raw.id}`,
      company: company.name,
      companySlug: company.slug,
      companyTicker: company.ticker,
      companySize: company.size,
      ats: "lever",
      title: raw.text.trim(),
      location,
      postedAt: new Date(raw.createdAt).toISOString(),
      applyUrl: raw.hostedUrl,
      category: categorize(raw.text),
      level: extractLevel(raw.text),
      searchText: `${raw.text} ${descriptionExcerpt}`.toLowerCase(),
      dedupeKey: makeDedupeKey(company.slug, raw.text, location),
      salary: salaryFromLever(raw.salaryRange) ?? salaryFromText(plainDescription),
      employmentType,
      hiringCohort: extractHiringCohort(raw.text, plainDescription),
      qualifications:
        extractQualificationsFromLeverLists(raw.lists) ??
        extractQualifications(decodeHtml(raw.descriptionBody || raw.description)),
    });
  }
  return jobs;
}
