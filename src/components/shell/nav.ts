import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Mail,
  type LucideIcon,
} from "lucide-react";

/*
 * App-shell navigation — single source of truth for sidebar + topbar title.
 *
 * The topbar title is derived from the matched route prefix. Keep `segment`
 * aligned with the (dashboard) route folder names so `usePathname` matches work.
 */

export type NavItem = {
  label: string;
  /** Route path used for the link + active-state match. */
  href: string;
  icon: LucideIcon;
  /** Pathname prefix used to mark this item active (handles nested routes). */
  matchPrefix: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    matchPrefix: "/",
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: Briefcase,
    matchPrefix: "/jobs",
  },
  {
    label: "Action Items",
    href: "/tasks",
    icon: CheckSquare,
    matchPrefix: "/tasks",
  },
  {
    label: "Gmail Sync",
    href: "/gmail",
    icon: Mail,
    matchPrefix: "/gmail",
  },
];

/**
 * Resolve the topbar page title from a pathname. Falls back to "Dashboard".
 * Special-cases the exact "/" root so it isn't shadowed by the Jobs prefix.
 */
export function pageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  // Longest-prefix match wins (e.g. /jobs/new → "Jobs").
  const match = NAV_ITEMS.filter(
    (n) => n.matchPrefix !== "/" && pathname.startsWith(n.matchPrefix),
  ).sort((a, b) => b.matchPrefix.length - a.matchPrefix.length)[0];
  return match?.label ?? "Dashboard";
}
