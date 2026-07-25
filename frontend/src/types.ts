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

export type EmploymentType = "full_time" | "part_time" | "internship" | "contract";

export type CompanySize = "startup" | "midsize" | "enterprise";

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  interval: "year" | "hour" | "unknown";
}

export interface Qualifications {
  bullets?: string[];
  fallbackText?: string;
}

export interface Job {
  id: string;
  company: string;
  companySlug: string;
  companyTicker: string;
  companySize?: CompanySize;
  ats: "greenhouse" | "lever" | "ashby" | "themuse" | "remoteok";
  title: string;
  location: string;
  postedAt: string;
  applyUrl: string;
  category: JobCategory;
  level: SeniorityLevel;
  searchText: string;
  dedupeKey: string;
  salary?: SalaryRange;
  employmentType?: EmploymentType;
  hiringCohort?: string;
  qualifications?: Qualifications;
}

export interface CompanyFetchResult {
  company: string;
  slug: string;
  ats: string;
  ok: boolean;
  jobCount: number;
  error?: string;
}

export interface JobsResponse {
  jobs: Job[];
  lastRefreshedAt: string | null;
  refreshIntervalMinutes: number | null;
  companyResults: CompanyFetchResult[];
  status: "loading" | "ready";
}

export type TimeWindow = "24h" | "3d" | "7d" | "30d" | "all";

export interface Filters {
  keyword: string;
  timeWindow: TimeWindow;
  category: JobCategory | "all";
  level: SeniorityLevel | "all";
  location: string | "all";
  company: string | "all";
  employmentType: EmploymentType | "all";
  companySize: CompanySize | "all";
  hiringCohort: string | "all";
}

export const DEFAULT_FILTERS: Filters = {
  keyword: "",
  timeWindow: "30d",
  category: "all",
  level: "all",
  location: "all",
  company: "all",
  employmentType: "all",
  companySize: "all",
  hiringCohort: "all",
};
