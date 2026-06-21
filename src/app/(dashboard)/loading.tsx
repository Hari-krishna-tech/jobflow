import { Skeleton } from "@/components/ui/skeleton";

/*
 * Dashboard loading skeleton — matches the dashboard layout shape (CONTEXT/02 §17).
 *
 * Card-shaped and row-shaped skeleton blocks, --bg-soft base. Respects
 * prefers-reduced-motion via the globals.css rule.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading dashboard">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stat cards row */}
      <div className="grid gap-[14px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex min-h-[110px] flex-col gap-3 rounded-xl border border-border bg-card p-[18px]">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-auto h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid gap-[14px] grid-cols-1 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-[18px]">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 py-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="ml-auto h-4 w-16" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
