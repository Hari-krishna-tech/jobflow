import { Skeleton } from "@/components/ui/skeleton";

/*
 * Jobs page loading skeleton — matches the page layout shape (CONTEXT/02 §17).
 */
export default function JobsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading jobs">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 flex-1 max-w-sm" />
        <Skeleton className="h-9 w-[160px]" />
        <Skeleton className="ml-auto h-9 w-24" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="bg-bg-soft border-b border-border-soft">
          <div className="flex items-center gap-4 px-4 py-[11px]">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="hidden md:block h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="ml-auto h-3 w-20" />
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-[14px] border-b border-border-soft last:border-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="hidden md:block h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="ml-auto h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}
