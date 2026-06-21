import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JobStatus } from "@prisma/client";
import * as jobRepo from "@/lib/repositories/jobRepo";
import { JobsTable } from "@/components/job/jobs-table";

/*
 * Jobs page (CONTEXT/03 §4 "Jobs (`/jobs)`").
 *
 * Server component — reads searchParams (q, status) and pre-filters via the
 * repository. The interactive table, search, filter, and row actions are handled
 * by the client <JobsTable /> component.
 */
export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const params = await searchParams;
  const q = params.q;
  const status = params.status && Object.values(JobStatus).includes(params.status as JobStatus)
    ? (params.status as JobStatus)
    : undefined;

  const jobs = await jobRepo.listByUser(session.user.id, { q, status });

  return (
    <div className="flex flex-col gap-6">
      {/* Page header (CONTEXT/03 §2) */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-text">
          Jobs
        </h2>
        <p className="max-w-[640px] text-sm text-text-dim">
          All your job applications in one place.
        </p>
      </div>

      <JobsTable jobs={jobs} defaultQ={q} defaultStatus={status ?? ""} />
    </div>
  );
}
