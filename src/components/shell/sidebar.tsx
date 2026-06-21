"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { NAV_ITEMS } from "./nav";
import { cn } from "@/lib/utils";

/*
 * Sidebar — app-shell navigation (CONTEXT/02 §7, CONTEXT/03 §1).
 *
 *   260px fixed · --bg-soft · right border --border
 *   Brand block top: 32px gradient logo tile (accent→pink) + name
 *   Nav item: padding 7px 10px, radius 7px, --text-dim, text-sm
 *   Active: bg --accent-bg, text --accent-soft, font 600
 *
 * Responsive: on <1024px this renders as an off-canvas drawer toggled from the
 * topbar (controlled via the `open` / `onOpenChange` props). The drawer overlay
 * is rendered by the AppShell so focus stays outside this component.
 */

function isActive(pathname: string, item: (typeof NAV_ITEMS)[number]): boolean {
  if (item.matchPrefix === "/") return pathname === "/";
  return pathname.startsWith(item.matchPrefix);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex h-full flex-col gap-6 p-4" aria-label="Primary">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-md px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-soft"
      >
        <Image
          src="/logo.svg"
          alt="JobFlow Logo"
          width={32}
          height={32}
          className="size-8"
        />
        <span className="text-[15px] font-semibold tracking-tight text-text">
          JobFlow
        </span>
      </Link>

      {/* Nav */}
      <div className="flex flex-col gap-4">
        <span className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-faint">
          Workspace
        </span>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[7px] px-2.5 py-[7px] text-sm transition-colors duration-[var(--ease-fast)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-soft",
                    active
                      ? "bg-accent-bg font-semibold text-accent-soft"
                      : "text-text-dim hover:bg-card hover:text-text",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
