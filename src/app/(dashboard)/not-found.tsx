import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

/*
 * Not-found boundary for the (dashboard) route group.
 *
 * Catches `notFound()` calls (e.g. /jobs/[id]/edit with a missing id) and
 * shows a friendly message instead of Next's default 404 page.
 */
export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg bg-accent-bg text-accent-soft">
        <Briefcase className="size-6" />
      </div>
      <h2 className="text-[20px] font-bold text-text">Page not found</h2>
      <p className="max-w-sm text-sm text-text-dim">
        The page you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Button asChild size="sm">
        <Link href="/">Go to dashboard</Link>
      </Button>
    </div>
  );
}
