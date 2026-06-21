import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * StatCard — dashboard metric tile (CONTEXT/02 §3).
 *
 *   ┌─────────────────────────┐
 *   │ ICON   LABEL            │
 *   │ 42                      │  ← big mono number, 30px/700
 *   │ +3 this week            │  ← optional delta (semantic color)
 *   └─────────────────────────┘
 *
 * Icon top-left (18px), colored by metric semantics. Value is mono 30px/700.
 * Delta only when meaningful; tone controls color (green=up-good, red=up-bad).
 */

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: number | string;
  delta?: React.ReactNode;
  /** Semantic color for the icon. Defaults to accent. */
  tone?: "accent" | "amber" | "green" | "red" | "cyan";
  className?: string;
};

const TONE_ICON: Record<NonNullable<StatCardProps["tone"]>, string> = {
  accent: "text-accent-soft",
  amber: "text-amber",
  green: "text-green",
  red: "text-red",
  cyan: "text-cyan",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  tone = "accent",
  className,
}: StatCardProps) {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "flex min-h-[110px] flex-col gap-3 rounded-xl border border-border bg-card p-[18px]",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("size-[18px]", TONE_ICON[tone])} aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-faint">
          {label}
        </span>
      </div>
      <div className="mt-auto">
        <div className="font-mono text-[30px] font-bold leading-none text-text">
          {value}
        </div>
        {delta ? <div className="mt-2 text-xs">{delta}</div> : null}
      </div>
    </div>
  );
}
