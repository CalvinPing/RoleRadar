import type { CompanyConfig } from "../../config/companies";
import { categorize, extractLevel, isSoftwareEngineeringRole } from "../classify";
import { makeDedupeKey } from "../dedupe";
import { extractHiringCohort } from "../extract/cohort";
import { inferEmploymentTypeFromTitle, normalizeEmploymentType } from "../extract/employmentType";
import { extractQualifications } from "../extract/qualifications";
import { salaryFromGreenhouseMetadata, salaryFromText } from "../extract/salary";
import type { Job } from "../types";
import { decodeHtml, fetchJson, stripHtml, stripTags } from "./common";

interface GreenhouseMetadataField {
  id: number;
  name: string;
  value: unknown;
  value_type: string;
}

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location: { name: string } | null;
  updated_at: string;
  first_published?: string;
  content?: string;
  departments?: { name: string }[];
  metadata?: GreenhouseMetadataField[] | null;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export async function fetchGreenhouseJobs(company: CompanyConfig): Promise<Job[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs?content=true`;
  const data = (await fetchJson(url)) as GreenhouseResponse;
  if (!Array.isArray(data.jobs)) {
    throw new Error("malformed response: missing jobs array");
  }

  const jobs: Job[] = [];
  for (const raw of data.jobs) {
    const departments = (raw.departments ?? []).map((d) => d.name);
    if (!isSoftwareEngineeringRole(raw.title, departments)) continue;

    const location = raw.location?.name?.trim() || "Unspecified";
    const postedAt = raw.first_published || raw.updated_at;
    const descriptionExcerpt = stripHtml(raw.content);
    const decodedContent = decodeHtml(raw.content);
    const plainDescription = stripTags(decodedContent);

    const employmentTypeField = raw.metadata?.find((m) => /employment type/i.test(m.name));
    const employmentType =
      normalizeEmploymentType(typeof employmentTypeField?.value === "string" ? employmentTypeField.value : null) ??
      inferEmploymentTypeFromTitle(raw.title);

    jobs.push({
      id: `greenhouse:${company.slug}:${raw.id}`,
      company: company.name,
      companySlug: company.slug,
      companyTicker: company.ticker,
      companySize: company.size,
      ats: "greenhouse",
      title: raw.title.trim(),
      location,
      postedAt: new Date(postedAt).toISOString(),
      applyUrl: raw.absolute_url,
      category: categorize(raw.title),
      level: extractLevel(raw.title),
      searchText: `${raw.title} ${descriptionExcerpt}`.toLowerCase(),
      dedupeKey: makeDedupeKey(company.slug, raw.title, location),
      salary: salaryFromGreenhouseMetadata(raw.metadata) ?? salaryFromText(plainDescription),
      employmentType,
      hiringCohort: extractHiringCohort(raw.title, plainDescription),
      qualifications: extractQualifications(decodedContent),
    });
  }
  return jobs;
}
