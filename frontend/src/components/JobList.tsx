import type { Job } from "../types";
import { JobRow } from "./JobRow";

export function JobList({ jobs }: { jobs: Job[] }) {
  return (
    <div className="mx-auto max-w-6xl">
      {jobs.map((job) => (
        <JobRow key={job.id} job={job} />
      ))}
    </div>
  );
}
