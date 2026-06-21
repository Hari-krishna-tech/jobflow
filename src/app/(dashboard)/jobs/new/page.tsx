import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JobForm } from "@/components/job/job-form";

/*
 * New Job page (CONTEXT/03 §4 "New Job (`/jobs/new)`").
 *
 * Server component — auth guard + renders the shared JobForm in create mode.
 */
export default async function NewJobPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-text">
          Add Job
        </h2>
        <p className="max-w-[640px] text-sm text-text-dim">
          Add a new application to your tracker.
        </p>
      </div>
      <JobForm />
    </div>
  );
}
