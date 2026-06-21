import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Card — the universal container (CONTEXT/02 §2).
 *
 *   background: --card · border: 1px --border · radius: 12px
 *   padding: 18px (default) / 24px (large)
 *
 * Static cards carry no shadow — borders do the work (CONTEXT/01 §7).
 * The `interactive` variant lifts via --card-hover bg on hover (clickable rows).
 */

type CardProps = React.ComponentProps<"div"> & {
  variant?: "default" | "large" | "interactive";
  as?: React.ElementType;
};

export function Card({
  className,
  variant = "default",
  as: Comp = "div",
  ...props
}: CardProps) {
  return (
    <Comp
      data-slot="card"
      data-variant={variant}
      className={cn(
        "rounded-xl border border-border bg-card",
        variant === "large" ? "p-6" : "p-[18px]",
        variant === "interactive" &&
          "cursor-pointer transition-colors duration-[var(--ease-fast)] hover:bg-card-hover",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-[17px] font-semibold leading-tight tracking-tight text-text", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("ml-auto flex items-center gap-2", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("mt-4", className)} {...props} />
  );
}
