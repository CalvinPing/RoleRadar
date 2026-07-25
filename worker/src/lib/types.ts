import type { AtsType, CompanySize } from "../config/companies";
import type { SalaryRange } from "./extract/salary";
import type { EmploymentType } from "./extract/employmentType";
import type { Qualifications } from "./extract/qualifications";

export type JobSource = AtsType | "themuse" | "remoteok";
export type { SalaryRange, EmploymentType, Qualifications, CompanySize };

export type JobCategory =
  | "frontend"
  | "backend"
  | "fullstack"
  | "mobile"
  | "ml_ai"
  | "data"
  | "devops_infra"
  | "security"
  | "other_engineering";

export type SeniorityLevel =
  | "intern"
  | "new_grad"
  | "entry"
  | "mid"
  | "senior"
  | "staff_plus";

export interface Job {
  id: string;
  company: string;
  companySlug: string;
  companyTicker: string;
  ats: JobSource;
  title: string;
  location: string;
  postedAt: string; // ISO 8601
  applyUrl: string;
  category: JobCategory;
  level: SeniorityLevel;
  searchText: string; // lowercased title + description excerpt, for keyword search only
  dedupeKey: string;

  // Optional - only present when the source data actually supports it. Never fabricated/estimated.
  salary?: SalaryRange;
  employmentType?: EmploymentType;
  hiringCohort?: string; // e.g. "Fall 2026" - only when explicitly stated in the posting
  qualifications?: Qualifications;
  companySize?: CompanySize; // hand-curated in config/companies.ts, only for companies in our seed list
}

export interface CompanyFetchResult {
  company: string;
  slug: string;
  ats: JobSource;
  ok: boolean;
  jobCount: number;
  error?: string;
}

export interface JobsCache {
  jobs: Job[];
  lastRefreshedAt: string; // ISO 8601
  refreshIntervalMinutes: number;
  companyResults: CompanyFetchResult[];
}
