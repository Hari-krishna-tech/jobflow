import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import * as taskRepo from "@/lib/repositories/taskRepo";
import { TaskItem } from "@/components/task/task-item";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const userId = session.user.id;

  // 1. Fetch all tasks for the user (includes job info)
  const allTasks = await taskRepo.listAll(userId);

  // 2. Separate active and completed tasks
  const activeTasks = allTasks.filter((t) => !t.completed);
  const completedTasks = allTasks.filter((t) => t.completed);

  // 3. Group active tasks by calendar relativity (Overdue, Today, Upcoming, No Date)
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const overdue: typeof allTasks = [];
  const dueToday: typeof allTasks = [];
  const upcoming: typeof allTasks = [];
  const noDate: typeof allTasks = [];

  for (const task of activeTasks) {
    if (!task.dueDate) {
      noDate.push(task);
      continue;
    }

    const taskDate = new Date(task.dueDate);
    const taskMidnight = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()).getTime();

    if (taskMidnight < todayMidnight) {
      overdue.push(task);
    } else if (taskMidnight === todayMidnight) {
      dueToday.push(task);
    } else {
      upcoming.push(task);
    }
  }

  const hasAnyTasks = allTasks.length > 0;
  const hasActiveTasks = activeTasks.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header (CONTEXT/03 §2) */}
      <div className="flex flex-col gap-1.5 pb-2">
        <h2 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-text">
          Action Items
        </h2>
        <p className="max-w-[640px] text-sm text-text-dim">
          Follow-ups and task checklists generated from your synced emails or created by you.
        </p>
      </div>

      {!hasAnyTasks ? (
        <EmptyState
          icon={CheckCircle2}
          title="You're all caught up"
          description="No open action items. Connect Gmail or add tasks in your job trackers and we'll surface follow-ups here."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {/* Active Tasks Grouped Sections */}
          {hasActiveTasks ? (
            <div className="flex flex-col gap-6">
              {/* Overdue Section */}
              {overdue.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                    Overdue
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 text-[10px] font-bold text-red-400 border border-red-500/20">
                      {overdue.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
                    {overdue.map((task) => (
                      <TaskItem
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        dueDate={task.dueDate}
                        completed={task.completed}
                        source={task.source}
                        jobCompany={task.job?.company}
                        jobPosition={task.job?.position}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Today Section */}
              {dueToday.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    Due Today
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                      {dueToday.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
                    {dueToday.map((task) => (
                      <TaskItem
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        dueDate={task.dueDate}
                        completed={task.completed}
                        source={task.source}
                        jobCompany={task.job?.company}
                        jobPosition={task.job?.position}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Section */}
              {upcoming.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-soft flex items-center gap-2">
                    Upcoming
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft/10 text-[10px] font-bold text-accent-soft border border-accent-soft/20">
                      {upcoming.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
                    {upcoming.map((task) => (
                      <TaskItem
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        dueDate={task.dueDate}
                        completed={task.completed}
                        source={task.source}
                        jobCompany={task.job?.company}
                        jobPosition={task.job?.position}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No Due Date Section */}
              {noDate.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-faint flex items-center gap-2">
                    No Due Date
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-bg-soft text-[10px] font-bold text-text-dim border border-border/40">
                      {noDate.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
                    {noDate.map((task) => (
                      <TaskItem
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        dueDate={task.dueDate}
                        completed={task.completed}
                        source={task.source}
                        jobCompany={task.job?.company}
                        jobPosition={task.job?.position}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="All caught up"
              description="No open action items. You've cleared your checklist."
            />
          )}

          {/* Completed Tasks Section */}
          {completedTasks.length > 0 && (
            <div className="flex flex-col gap-3 pt-6 border-t border-border/30">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-faint flex items-center gap-2">
                Completed
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-bg-soft text-[10px] font-bold text-text-faint border border-border/30">
                  {completedTasks.length}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] opacity-75">
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    dueDate={task.dueDate}
                    completed={task.completed}
                    source={task.source}
                    jobCompany={task.job?.company}
                    jobPosition={task.job?.position}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
