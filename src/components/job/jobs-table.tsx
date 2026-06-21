"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, Search, Briefcase, Eye } from "lucide-react";
import { toast } from "sonner";
import type { Job, JobStatus } from "@prisma/client";
import { JOB_STATUS_LABELS, JOB_STATUSES } from "@/lib/schemas/job";
import { deleteJobAction } from "@/lib/actions/job";
import { formatRelative } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/*
 * JobsTable — the /jobs page interactive content (CONTEXT/03 §4 "Jobs (`/jobs)`").
 *
 *   Action row: search (left) + status filter + "Add Job" primary (right)
 *   Table: Company · Role · Location · Status · Last Update · ⋯
 *   ⋯ row menu: Edit → /jobs/[id]/edit, Delete → confirm dialog
 *
 * Reads `jobs` from the server page (passed as props). Search + filter navigate
 * via URL search params so the server can pre-filter on load.
 */

type JobsTableProps = {
  jobs: Job[];
  defaultQ?: string;
  defaultStatus?: JobStatus | "";
};

export function JobsTable({ jobs, defaultQ = "", defaultStatus = "" }: JobsTableProps) {
  const router = useRouter();

  // URL-driven search/filter — push search params so the server pre-filters.
  const [q, setQ] = useState(defaultQ);
  const [status, setStatus] = useState<JobStatus | "">(defaultStatus);

  function applyFilters() {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : "/jobs");
  }

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

  const [, deleteActionDispatch] = useActionState(async (_prev: unknown, formData: FormData) => {
    const id = formData.get("id") as string;
    const result = await deleteJobAction(id);
    if (result.ok) {
      toast.success("Job deleted.");
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast.error(result.message ?? "Couldn't delete.");
    }
    return result;
  }, null);

  return (
    <div className="flex flex-col gap-6">
      {/* Action row */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
          className="relative flex-1 min-w-[200px] max-w-sm"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-faint" aria-hidden />
          <Input
            placeholder="Search by company or role…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </form>

        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v === "" ? "" : (v as JobStatus));
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {JOB_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {JOB_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="secondary"
          size="sm"
          onClick={applyFilters}
          className="ml-1"
        >
          Filter
        </Button>

        <div className="ml-auto">
          <Button asChild size="sm">
            <Link href="/jobs/new">
              <Briefcase className="size-4" />
              Add Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Table or empty state */}
      {jobs.length === 0 ? (
        q || status ? (
          /* No results (filtering) */
          <EmptyState
            icon={Search}
            title="No results"
            description="Try a different company or role."
          />
        ) : (
          /* No jobs at all */
          <EmptyState
            icon={Briefcase}
            title="No applications yet"
            description="Add the first role you've applied to and JobFlow starts tracking it."
            action={
              <Button asChild size="sm">
                <Link href="/jobs/new">
                  <Briefcase className="size-4" />
                  Add Job
                </Link>
              </Button>
            }
          />
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border-soft hover:bg-transparent">
                <TableHead className="bg-bg-soft text-[11px] font-semibold uppercase tracking-[0.05em] text-text-faint px-4 py-[11px]">
                  Company
                </TableHead>
                <TableHead className="bg-bg-soft text-[11px] font-semibold uppercase tracking-[0.05em] text-text-faint px-4 py-[11px]">
                  Role
                </TableHead>
                <TableHead className="bg-bg-soft text-[11px] font-semibold uppercase tracking-[0.05em] text-text-faint px-4 py-[11px] hidden md:table-cell">
                  Location
                </TableHead>
                <TableHead className="bg-bg-soft text-[11px] font-semibold uppercase tracking-[0.05em] text-text-faint px-4 py-[11px]">
                  Status
                </TableHead>
                <TableHead className="bg-bg-soft text-[11px] font-semibold uppercase tracking-[0.05em] text-text-faint px-4 py-[11px] text-right">
                  Last Update
                </TableHead>
                <TableHead className="bg-bg-soft w-10 px-3 py-[11px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id} className="border-border-soft">
                  <TableCell className="px-4 py-[11px] font-medium text-text">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="hover:text-accent-soft transition-colors font-semibold"
                    >
                      {job.company}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-[11px] text-text-dim">
                    {job.position}
                  </TableCell>
                  <TableCell className="px-4 py-[11px] text-text-dim hidden md:table-cell">
                    {job.location ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-[11px]">
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="px-4 py-[11px] text-right">
                    <span className="font-mono text-[12px] text-text-faint">
                      {formatRelative(job.updatedAt)}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-[11px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs" aria-label="Row actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/jobs/${job.id}`}>
                            <Eye className="size-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/jobs/${job.id}/edit`}>
                            <Pencil className="size-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(job)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete this application?</DialogTitle>
            <DialogDescription>
              This can&apos;t be undone. The job and all associated emails and tasks will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <form action={deleteActionDispatch}>
              <input type="hidden" name="id" value={deleteTarget?.id ?? ""} />
              <Button type="submit" variant="destructive">
                Delete
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
