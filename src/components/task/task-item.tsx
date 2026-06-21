"use client";

import { useTransition } from "react";
import { toggleTaskAction, deleteTaskAction } from "@/lib/actions/task";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { Trash2, Loader2, Calendar, Mail, FileText } from "lucide-react";

interface TaskItemProps {
  id: string;
  title: string;
  dueDate: string | Date | null;
  completed: boolean;
  source: "EMAIL" | "MANUAL" | string;
  jobCompany?: string;
  jobPosition?: string;
}

export function TaskItem({
  id,
  title,
  dueDate,
  completed,
  source,
  jobCompany,
  jobPosition,
}: TaskItemProps) {
  const [isPending, startToggleTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    startToggleTransition(async () => {
      const res = await toggleTaskAction(id, checked);
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      startDeleteTransition(async () => {
        const res = await deleteTaskAction(id);
        if (res.ok) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      });
    }
  };

  const isOverdue = dueDate && new Date(dueDate) < new Date() && !completed;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 p-3.5 border border-border/40 rounded-xl bg-card hover:bg-card-hover/20 transition-all duration-150",
        completed && "opacity-60 bg-bg-soft/20 border-border/20"
      )}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={completed}
          disabled={isPending || isDeleting}
          onChange={(e) => handleToggle(e.target.checked)}
          className="mt-0.5 size-4 rounded border-border bg-bg-soft text-accent accent-accent focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span
            className={cn(
              "text-sm font-medium text-text leading-tight break-words",
              completed && "line-through text-text-dim"
            )}
          >
            {title}
          </span>

          {/* Job details (if rendered on a general list like /tasks) */}
          {(jobCompany || jobPosition) && (
            <span className="text-xs text-text-faint font-medium">
              {jobCompany || "Unknown Company"} {jobPosition ? `— ${jobPosition}` : ""}
            </span>
          )}

          {/* Metadata Chips */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            {dueDate && (
              <span
                className={cn(
                  "font-mono text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 font-semibold",
                  isOverdue
                    ? "border-red-500/20 bg-red-950/20 text-red-400"
                    : "border-border/40 bg-bg-soft/40 text-text-dim"
                )}
              >
                <Calendar className="size-2.5" />
                {formatDate(dueDate)}
              </span>
            )}
            <span
              className={cn(
                "text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 font-semibold",
                source === "EMAIL"
                  ? "border-accent/20 bg-accent-bg/40 text-accent-soft"
                  : "border-border/40 bg-bg-soft/40 text-text-dim"
              )}
            >
              {source === "EMAIL" ? <Mail className="size-2.5" /> : <FileText className="size-2.5" />}
              {source}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleDelete}
        disabled={isPending || isDeleting}
        className="p-1 rounded-md text-text-faint hover:text-red-400 hover:bg-red-950/20 transition-colors disabled:opacity-50"
        title="Delete task"
      >
        {isDeleting ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
      </button>
    </div>
  );
}
