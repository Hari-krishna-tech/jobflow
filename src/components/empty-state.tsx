import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * EmptyState — canonical empty/zero state (CONTEXT/02 §16, CONTEXT/04 §3).
 *
 *   icon (40px, --text-faint) → title (text-h3) → description (text-sm --text-dim)
 *   → optional primary action
 *
 * Centered in its container, max-width 360px. Always offer a next step when
 * possible. Copy comes from the page (see CONTEXT/04 §3 table).
 */

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-[360px] flex-col items-center gap-3 px-4 py-12 text-center",
        className,
      )}
    >
      <Icon className="size-10 text-text-faint" aria-hidden />
      <h3 className="text-[17px] font-semibold tracking-tight text-text">{title}</h3>
      {description ? (
        <p className="text-sm text-text-dim">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
