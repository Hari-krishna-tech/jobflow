import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import * as jobRepo from "@/lib/repositories/jobRepo";
import { JobForm } from "@/components/job/job-form";

/*
 * Edit Job page.
 *
 * Server component — auth guard + fetches the job by id (scoped to user).
 * Renders the shared JobForm in edit mode with the existing data pre-filled.
 * Falls through to the nearest not-found boundary if the job doesn't exist
 * or belongs to another user.
 */
export const dynamic = "force-dynamic";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { id } = await params;
  const job = await jobRepo.getById(session.user.id, id);
  if (!job) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-text">
          Edit Job
        </h2>
        <p className="max-w-[640px] text-sm text-text-dim">
          Update the details for this application.
        </p>
      </div>
      <JobForm job={job} />
    </div>
  );
}
