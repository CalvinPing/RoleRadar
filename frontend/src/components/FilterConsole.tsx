import type { ChangeEvent } from "react";
import {
  CATEGORY_LABELS,
  COMPANY_SIZE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  LEVEL_LABELS,
  TIME_WINDOW_LABELS,
} from "../lib/labels";
import type { CompanySize, EmploymentType, Filters, JobCategory, SeniorityLevel, TimeWindow } from "../types";

interface FilterConsoleProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
  locations: string[];
  companies: { slug: string; name: string }[];
  hiringCohorts: string[];
  isDefault: boolean;
}

const TIME_WINDOWS: TimeWindow[] = ["24h", "3d", "7d", "30d", "all"];
const CATEGORIES: JobCategory[] = [
  "frontend",
  "backend",
  "fullstack",
  "mobile",
  "ml_ai",
  "data",
  "devops_infra",
  "security",
  "other_engineering",
];
const LEVELS: SeniorityLevel[] = ["intern", "new_grad", "entry", "mid", "senior", "staff_plus"];
const EMPLOYMENT_TYPES: EmploymentType[] = ["full_time", "part_time", "internship", "contract"];
const COMPANY_SIZES: CompanySize[] = ["startup", "midsize", "enterprise"];

export function FilterConsole({
  filters,
  onChange,
  onReset,
  locations,
  companies,
  hiringCohorts,
  isDefault,
}: FilterConsoleProps) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="border-b border-line bg-void">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-4 sm:px-6 md:grid-cols-6">
        <Field label="Keyword" className="col-span-2 md:col-span-2">
          <input
            type="text"
            value={filters.keyword}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set("keyword", e.target.value)}
            placeholder="title or description…"
            className="w-full rounded border border-line bg-panel px-2.5 py-1.5 font-mono text-sm text-ink placeholder:text-ink-faint focus:border-amber"
          />
        </Field>

        <Field label="Window">
          <Select
            value={filters.timeWindow}
            onChange={(v) => set("timeWindow", v as TimeWindow)}
            options={TIME_WINDOWS.map((w) => ({ value: w, label: TIME_WINDOW_LABELS[w] }))}
          />
        </Field>

        <Field label="Role">
          <Select
            value={filters.category}
            onChange={(v) => set("category", v as Filters["category"])}
            options={[
              { value: "all", label: "All" },
              ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
            ]}
          />
        </Field>

        <Field label="Level">
          <Select
            value={filters.level}
            onChange={(v) => set("level", v as Filters["level"])}
            options={[
              { value: "all", label: "All" },
              ...LEVELS.map((l) => ({ value: l, label: LEVEL_LABELS[l] })),
            ]}
          />
        </Field>

        <Field label="Location">
          <Select
            value={filters.location}
            onChange={(v) => set("location", v)}
            options={[
              { value: "all", label: "All" },
              ...locations.map((l) => ({ value: l, label: l })),
            ]}
          />
        </Field>

        <Field label="Company">
          <Select
            value={filters.company}
            onChange={(v) => set("company", v)}
            options={[
              { value: "all", label: "All" },
              ...companies.map((c) => ({ value: c.slug, label: c.name })),
            ]}
          />
        </Field>

        <Field label="Employment">
          <Select
            value={filters.employmentType}
            onChange={(v) => set("employmentType", v as Filters["employmentType"])}
            options={[
              { value: "all", label: "All" },
              ...EMPLOYMENT_TYPES.map((t) => ({ value: t, label: EMPLOYMENT_TYPE_LABELS[t] })),
            ]}
          />
        </Field>

        <Field label="Company size">
          <Select
            value={filters.companySize}
            onChange={(v) => set("companySize", v as Filters["companySize"])}
            options={[
              { value: "all", label: "All" },
              ...COMPANY_SIZES.map((s) => ({ value: s, label: COMPANY_SIZE_LABELS[s] })),
            ]}
          />
        </Field>

        {hiringCohorts.length > 0 && (
          <Field label="Hiring cohort">
            <Select
              value={filters.hiringCohort}
              onChange={(v) => set("hiringCohort", v)}
              options={[
                { value: "all", label: "All" },
                ...hiringCohorts.map((c) => ({ value: c, label: c })),
              ]}
            />
          </Field>
        )}

        <div className="col-span-2 flex items-end md:col-span-6 md:justify-end">
          <button
            type="button"
            onClick={onReset}
            disabled={isDefault}
            className="rounded border border-line px-3 py-1.5 font-mono text-xs text-ink-dim transition-colors hover:border-amber hover:text-amber disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-dim"
          >
            Reset filters
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-line bg-panel px-2.5 py-1.5 font-mono text-sm text-ink focus:border-amber"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
