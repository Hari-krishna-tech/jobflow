import { JobStatus } from "@prisma/client";
import { JOB_STATUS_LABELS } from "@/lib/schemas/job";
import { cn } from "@/lib/utils";

/*
 * <StatusBadge /> — the single owner of the status→color map (CONTEXT/02 §4).
 *
 * Canonical mapping (CONTEXT/01 §3):
 *   Applied → accent · Assessment → cyan · Interview → amber · HR Round → amber
 *   Offer → green · Rejected → red · Ghosted → red
 *
 * Never hand-color status text anywhere else — use this component.
 * The mapping is exported as STATUS_STYLES so non-JobStatus callers (e.g. the
 * AI `detectedStatus` on emails) reuse the exact same colors.
 */

export type StatusTone =
  | "accent"
  | "cyan"
  | "amber"
  | "green"
  | "red";

export const STATUS_TONES: Record<JobStatus, StatusTone> = {
  APPLIED: "accent",
  ASSESSMENT: "cyan",
  INTERVIEW: "amber",
  HR_ROUND: "amber",
  OFFER: "green",
  REJECTED: "red",
  GHOSTED: "red",
};

const TONE_CLASS: Record<StatusTone, string> = {
  accent: "border-accent/30 bg-accent-bg text-accent-soft",
  cyan: "border-cyan/30 bg-cyan/[0.12] text-cyan",
  amber: "border-amber/30 bg-amber-bg text-amber",
  green: "border-green/30 bg-green-bg text-green",
  red: "border-red/30 bg-red-bg text-red",
};

export function StatusBadge({
  status,
  className,
}: {
  status: JobStatus;
  className?: string;
}) {
  const tone = STATUS_TONES[status];
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em]",
        TONE_CLASS[tone],
        className,
      )}
    >
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}

export function statusTone(status: JobStatus): StatusTone {
  return STATUS_TONES[status];
}
