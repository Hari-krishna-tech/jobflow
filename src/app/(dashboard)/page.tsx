import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JobStatus } from "@prisma/client";
import {
  Briefcase,
  MessageSquare,
  Trophy,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import * as jobRepo from "@/lib/repositories/jobRepo";
import * as taskRepo from "@/lib/repositories/taskRepo";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { formatRelative } from "@/lib/format";


/*
 * Dashboard home (CONTEXT/03 §4 "Dashboard Home (`/)`").
 *
 * Server component — reads job counts, recent activity, open tasks, and stale
 * jobs in one pass. The layout follows the page anatomy: title → subtitle →
 * stat cards grid → recent activity + action items → needs attention.
 *
 * Row 1: grid-3 (→ grid-4 on XL) stat cards.
 * Row 2: two-column split — Recent Activity | Open Action Items.
 * Row 3 (conditional): Needs Attention — jobs not updated in 7+ days.
 */

type DashboardData = {
  counts: Record<JobStatus, number>;
  totalJobs: number;
  recent: Awaited<ReturnType<typeof jobRepo.recentActivity>>;
  openTaskCount: number;
  openTasks: Awaited<ReturnType<typeof taskRepo.listOpen>>;
  stale: Awaited<ReturnType<typeof jobRepo.staleJobs>>;
};

async function getData(userId: string): Promise<DashboardData> {
  const [counts, totalJobs, recent, openTaskCount, openTasks, stale] =
    await Promise.all([
      jobRepo.countsByStatus(userId),
      jobRepo.totalCount(userId),
      jobRepo.recentActivity(userId, 6),
      taskRepo.openCount(userId),
      taskRepo.listOpen(userId, 5),
      jobRepo.staleJobs(userId, 7, 5),
    ]);

  return { counts, totalJobs, recent, openTaskCount, openTasks, stale };
}

export default async function DashboardHome() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const data = await getData(session.user.id);

  // Derive stat card values from the grouped counts.
  const applications = data.totalJobs;
  const interviews =
    (data.counts.INTERVIEW ?? 0) + (data.counts.HR_ROUND ?? 0);
  const offers = data.counts.OFFER ?? 0;
  const rejections =
    (data.counts.REJECTED ?? 0) + (data.counts.GHOSTED ?? 0);
  const actionItems = data.openTaskCount;

  return (
    <div className="flex flex-col gap-8">
      {/* Page header (CONTEXT/03 §2) */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-text">
          Dashboard
        </h2>
        <p className="max-w-[640px] text-sm text-text-dim">
          Overview of your job applications, upcoming interviews, and action items.
        </p>
      </div>

      {/* Row 1 — Stat Cards (grid-3 → grid-4 on XL) */}
      <div className="grid gap-[14px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={Briefcase}
          label="Applications"
          value={applications}
          tone="accent"
        />
        <StatCard
          icon={MessageSquare}
          label="Interviews"
          value={interviews}
          tone="amber"
        />
        <StatCard
          icon={Trophy}
          label="Offers"
          value={offers}
          tone="green"
        />
        <StatCard
          icon={XCircle}
          label="Rejections"
          value={rejections}
          tone="red"
        />
        <StatCard
          icon={AlertTriangle}
          label="Action Items"
          value={actionItems}
          tone="cyan"
        />
      </div>

      {/* Row 2 — two-column split */}
      <div className="grid gap-[14px] grid-cols-1 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="size-[18px] text-accent-soft" aria-hidden />
            <h3 className="text-[17px] font-semibold tracking-tight text-text">
              Recent Activity
            </h3>
          </div>
          {data.recent.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No applications yet"
              description="Add the first role you've applied to and JobFlow starts tracking it."
              action={
                <Link
                  href="/jobs/new"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-soft"
                >
                  <Briefcase className="size-4" />
                  Add Job
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border-soft">
              {data.recent.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${job.id}/edit`}
                      className="truncate text-sm font-medium text-text transition-colors hover:text-accent-soft"
                    >
                      {job.company}
                    </Link>
                    <p className="truncate text-xs text-text-dim">
                      {job.position}{job.location ? ` · ${job.location}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={job.status} />
                    <span className="font-mono text-[12px] text-text-faint">
                      {formatRelative(job.updatedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Open Action Items */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="size-[18px] text-cyan" aria-hidden />
            <h3 className="text-[17px] font-semibold tracking-tight text-text">
              Open Action Items
            </h3>
          </div>
          {data.openTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="You're all caught up"
              description="Tasks created from emails or by you will show up here."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border-soft">
              {data.openTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded border border-border-soft" aria-hidden />
                  <span className="truncate text-sm text-text">{task.title}</span>
                  {task.dueDate ? (
                    <span className="ml-auto shrink-0 font-mono text-[12px] text-text-faint">
                      {formatRelative(task.dueDate)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Row 3 — Needs Attention (conditional) */}
      {data.stale.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-[17px] font-semibold tracking-tight text-text">
            Needs Attention
          </h3>
          <Card>
            <ul className="flex flex-col divide-y divide-border-soft">
              {data.stale.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${job.id}/edit`}
                      className="truncate text-sm font-medium text-text transition-colors hover:text-accent-soft"
                    >
                      {job.company}
                    </Link>
                    <p className="truncate text-xs text-text-dim">
                      {job.position}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={job.status} />
                    <span className="font-mono text-[12px] text-text-faint">
                      {formatRelative(job.updatedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
