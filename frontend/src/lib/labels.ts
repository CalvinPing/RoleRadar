import type { CompanySize, EmploymentType, JobCategory, SeniorityLevel } from "../types";

export const CATEGORY_LABELS: Record<JobCategory, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Full Stack",
  mobile: "Mobile",
  ml_ai: "ML / AI",
  data: "Data",
  devops_infra: "DevOps / Infra",
  security: "Security",
  other_engineering: "Other Engineering",
};

export const LEVEL_LABELS: Record<SeniorityLevel, string> = {
  intern: "Intern",
  new_grad: "New Grad",
  entry: "Entry",
  mid: "Mid",
  senior: "Senior",
  staff_plus: "Staff+",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  internship: "Internship",
  contract: "Contract",
};

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  startup: "Startup",
  midsize: "Mid-size",
  enterprise: "Enterprise",
};

export const TIME_WINDOW_LABELS: Record<string, string> = {
  "24h": "Last 24 hours",
  "3d": "Last 3 days",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};
