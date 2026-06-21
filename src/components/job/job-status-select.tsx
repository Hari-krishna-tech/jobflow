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
    <div className="flex items-center gap-2">
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[160px] bg-bg-soft border-border text-sm font-semibold h-9">
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin text-text-dim" />
              <span>Updating...</span>
            </div>
          ) : (
            <SelectValue placeholder="Change status..." />
          )}
        </SelectTrigger>
        <SelectContent>
          {Object.values(JobStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {JOB_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
