"use client";

import { useTransition } from "react";
import { JobStatus } from "@prisma/client";
import { updateJobAction } from "@/lib/actions/job";
import { JOB_STATUS_LABELS } from "@/lib/schemas/job";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

interface JobStatusSelectProps {
  jobId: string;
  currentStatus: JobStatus;
}

export function JobStatusSelect({ jobId, currentStatus }: JobStatusSelectProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const res = await updateJobAction(jobId, { status: newStatus });
      if (res.ok) {
        toast.success("Job status updated.");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="flex items-center w-full">
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-full bg-bg-soft border-border text-sm font-semibold h-10 px-3 cursor-pointer">
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin text-text-dim" />
              <span className="text-text-dim text-xs font-medium">Updating...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-faint">Status:</span>
              <StatusBadge status={currentStatus} />
            </div>
          )}
        </SelectTrigger>
        <SelectContent>
          {Object.values(JobStatus).map((status) => (
            <SelectItem key={status} value={status} className="cursor-pointer">
              <div className="py-0.5">
                <StatusBadge status={status} />
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
