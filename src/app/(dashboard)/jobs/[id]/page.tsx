import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDateTime, formatDate, formatRelative } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { JobHeaderActions } from "@/components/job/job-header-actions";
import { JobStatusSelect } from "@/components/job/job-status-select";
import { TaskItem } from "@/components/task/task-item";
import { AddTaskForm } from "@/components/job/add-task-form";
import { JobStatus } from "@prisma/client";
import {
  MapPin,
  DollarSign,
  ChevronLeft,
  Calendar,
  Mail,
  User,
  ExternalLink,
  MessageSquare,
  ClipboardList,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface TimelineEvent {
  id: string;
  date: Date;
  type: "applied" | "email" | "task_created" | "task_completed";
  title: string;
  description?: string | null;
  status?: JobStatus | null;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;
  const resolvedParams = await params;
  const jobId = resolvedParams.id;

  // 1. Fetch Job details
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId },
  });

  if (!job) {
    notFound();
  }

  // 2. Fetch linked Emails
  const emails = await prisma.email.findMany({
    where: { jobId, userId },
    orderBy: { receivedAt: "desc" },
  });

  // 3. Fetch linked Tasks
  const tasks = await prisma.task.findMany({
    where: { jobId, userId },
    orderBy: [{ completed: "asc" }, { dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
  });

  // 4. Interleave Timeline Events
  const events: TimelineEvent[] = [];

  // Seed with creation/application date
  if (job.appliedDate) {
    events.push({
      id: "applied",
      date: new Date(job.appliedDate),
      type: "applied",
      title: "Application Submitted",
      description: `Submitted application to ${job.company} for the ${job.position} position.`,
    });
  } else {
    events.push({
      id: "applied",
      date: new Date(job.createdAt),
      type: "applied",
      title: "Application Added",
      description: `Tracked ${job.company} (${job.position}) in JobFlow.`,
    });
  }

  // Add Emails
  for (const email of emails) {
    events.push({
      id: email.id,
      date: new Date(email.receivedAt),
      type: "email",
      title: `Email Received: ${email.subject}`,
      description: email.summary || `Correspondence from ${email.fromEmail}`,
      status: email.detectedStatus,
    });
  }

  // Add Tasks
  for (const task of tasks) {
    events.push({
      id: `task-created-${task.id}`,
      date: new Date(task.createdAt),
      type: "task_created",
      title: `Action Item Added: ${task.title}`,
      description: task.description,
    });
    if (task.completed && task.updatedAt) {
      events.push({
        id: `task-completed-${task.id}`,
        date: new Date(task.updatedAt),
        type: "task_completed",
        title: `Action Item Completed: ${task.title}`,
      });
    }
  }

  // Sort events chronologically (newest first)
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-text-faint hover:text-text transition-colors"
        >
          <ChevronLeft className="size-3.5" />
          Back to Jobs
        </Link>
      </div>

      {/* Header Area */}
      <div className="flex flex-col gap-3 pb-6 border-b border-border/40">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-text">
              {job.company}
            </h2>
            <span className="text-[22px] font-light text-text-faint">/</span>
            <span className="text-xl font-medium text-text-dim">{job.position}</span>
          </div>
          <JobHeaderActions jobId={job.id} />
        </div>

        {/* Sub-header details */}
        <div className="flex items-center gap-4 flex-wrap text-sm text-text-dim mt-0.5">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-4 text-text-faint" />
              {job.location}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1 font-mono">
              <DollarSign className="size-4 text-text-faint" />
              {job.salary}
            </span>
          )}
          <span className="flex items-center gap-1 font-mono text-xs text-text-faint">
            <Calendar className="size-3.5" />
            Added: {formatDate(job.createdAt)}
          </span>
        </div>
      </div>

      {/* Main Grid: 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline & Emails (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Timeline Card */}
          <Card>
            <CardHeader className="border-b border-border/30 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="size-4.5 text-accent-soft" />
                <CardTitle className="text-base font-bold">Activity Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative border-l-2 border-border/40 pl-6 ml-3 space-y-8 py-2">
                {events.map((event) => {
                  let dotColor = "ring-accent bg-accent/30";
                  if (event.type === "applied") dotColor = "ring-indigo-400 bg-indigo-950 text-indigo-400";
                  if (event.type === "email") dotColor = "ring-cyan/70 bg-cyan-950/40 text-cyan-400";
                  if (event.type === "task_created") dotColor = "ring-amber/70 bg-amber-950/40 text-amber-400";
                  if (event.type === "task_completed") dotColor = "ring-green/70 bg-green-950/40 text-green-400";

                  return (
                    <div key={event.id} className="relative">
                      <span
                        className={`absolute -left-[32px] top-1.5 size-3.5 rounded-full ring-4 ring-bg ${dotColor}`}
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[10px] text-text-faint">
                          {formatDateTime(event.date)}
                        </span>
                        <h4 className="text-sm font-semibold text-text mt-0.5 leading-snug">
                          {event.title}
                        </h4>
                        {event.description && (
                          <p className="text-xs text-text-dim mt-1 max-w-[90%] leading-relaxed break-words whitespace-pre-wrap">
                            {event.description}
                          </p>
                        )}
                        {event.type === "email" && event.status && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-[10px] text-text-faint font-mono font-medium uppercase tracking-wider">
                              Detected Status:
                            </span>
                            <StatusBadge status={event.status} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sync Emails Card */}
          <Card>
            <CardHeader className="border-b border-border/30 pb-4">
              <div className="flex items-center gap-2">
                <Mail className="size-4.5 text-cyan-400" />
                <CardTitle className="text-base font-bold">Email Correspondence</CardTitle>
                <span className="inline-flex h-5 items-center rounded-full bg-cyan-500/10 px-2 text-[10px] font-mono font-semibold text-cyan-400 border border-cyan-500/20">
                  {emails.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {emails.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-dim">
                  No emails linked to this application. Connect Gmail or link emails manually.
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {emails.map((email) => (
                    <div key={email.id} className="p-4 flex flex-col gap-1.5 hover:bg-card-hover/10 transition-colors">
                      <div className="flex justify-between items-center gap-4 flex-wrap">
                        <span className="text-xs font-semibold text-text">{email.fromEmail}</span>
                        <span className="font-mono text-[10px] text-text-faint">
                          {formatRelative(email.receivedAt)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-text-dim">{email.subject}</span>
                      {email.summary && (
                        <p className="text-xs text-text-faint mt-1 bg-bg-soft/40 p-2.5 rounded-lg border border-border/20">
                          <span className="font-semibold text-text-dim block mb-0.5 text-[10px] font-mono uppercase tracking-wider">AI Summary</span>
                          {email.summary}
                        </p>
                      )}
                      {email.actionRequired && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono text-text-faint font-semibold uppercase tracking-wider">Action Needed:</span>
                          <span className="inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-amber-400 border border-amber-500/20">
                            {email.actionRequired}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions, CRM/Details, Notes (1/3 width) */}
        <div className="flex flex-col gap-6">
          {/* Status Settings Card */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-faint">
                Application Status
              </span>
              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={job.status} />
                <JobStatusSelect jobId={job.id} currentStatus={job.status} />
              </div>
            </CardContent>
          </Card>

          {/* Action Items/Tasks Card */}
          <Card className="flex flex-col gap-4">
            <CardHeader className="border-b border-border/30 pb-3 flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4.5 text-amber-400" />
                <CardTitle className="text-base font-bold">Action Items</CardTitle>
              </div>
              <span className="inline-flex h-5 items-center rounded-full bg-amber-500/10 px-2 text-[10px] font-mono font-semibold text-amber-400 border border-amber-500/20">
                {tasks.filter((t) => !t.completed).length} open
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-1">
              {tasks.length === 0 ? (
                <p className="text-xs text-text-dim text-center py-4">
                  No action items tracked. Create one below.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      id={task.id}
                      title={task.title}
                      dueDate={task.dueDate}
                      completed={task.completed}
                      source={task.source}
                    />
                  ))}
                </div>
              )}
              <AddTaskForm jobId={job.id} />
            </CardContent>
          </Card>

          {/* Recruiter / CRM Card */}
          <Card>
            <CardContent className="flex flex-col gap-3.5 p-4 text-sm">
              <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-text-faint flex items-center gap-1.5 pb-2 border-b border-border/20">
                <User className="size-3.5 text-text-faint" />
                CRM & Details
              </h4>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-text-dim">Recruiter</span>
                  <span className="font-semibold text-text truncate max-w-[150px]">
                    {job.recruiter || "None listed"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-text-dim">Location</span>
                  <span className="text-text truncate max-w-[150px]">{job.location || "Not specified"}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-text-dim">Salary</span>
                  <span className="font-mono text-text truncate max-w-[150px]">{job.salary || "Not specified"}</span>
                </div>
                {job.jobUrl && (
                  <div className="flex justify-between items-center gap-4 pt-2 border-t border-border/20 mt-1">
                    <span className="text-xs text-text-dim">Job Posting</span>
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent hover:underline font-mono truncate max-w-[150px] inline-flex items-center gap-1"
                    >
                      View Link
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardContent className="flex flex-col gap-2 p-4 text-sm">
              <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-text-faint flex items-center gap-1.5 pb-2 border-b border-border/20">
                <MessageSquare className="size-3.5 text-text-faint" />
                Notes
              </h4>
              <p className="text-xs text-text-dim break-words whitespace-pre-wrap leading-relaxed pt-1">
                {job.notes || "No notes saved. Click Edit above to add references, contact details, or job details."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
