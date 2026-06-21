"use client";

import { useTransition } from "react";
import { deleteJobAction } from "@/lib/actions/job";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface JobHeaderActionsProps {
  jobId: string;
}

export function JobHeaderActions({ jobId }: JobHeaderActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (confirm("Delete this application? This can't be undone.")) {
      startTransition(async () => {
        const res = await deleteJobAction(jobId);
        if (res.ok) {
          toast.success("Application deleted.");
          router.push("/jobs");
        } else {
          toast.error(res.message);
        }
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link href={`/jobs/${jobId}/edit`} className="inline-block">
        <Button variant="secondary" size="sm" className="gap-1.5 cursor-pointer">
          <Edit2 className="size-3.5" />
          Edit
        </Button>
      </Link>
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={handleDelete}
        className="gap-1.5 bg-red-950/20 text-red-400 border border-red-500/20 hover:bg-red-950/40 hover:text-red-300 cursor-pointer"
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
        Delete
      </Button>
    </div>
  );
}
