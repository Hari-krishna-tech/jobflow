"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";

/*
 * AppShell — the persistent frame around every authenticated page
 * (CONTEXT/03 §1).
 *
 *   ┌──────────┬──────────────────────────────┐
 *   │ SIDEBAR  │  TOPBAR (56px)               │
 *   │ (260px)  ├──────────────────────────────┤
 *   │          │  PAGE CONTENT (max 980px)    │
 *   └──────────┴──────────────────────────────┘
 *
 * Responsive:
 *   ≥1024px (lg): sidebar docked left, content beside it.
 *   <1024px:      sidebar becomes an off-canvas drawer (toggled from topbar).
 *
 * The content column is capped at 980px and padded per the spec. The drawer
 * overlay is rendered here so the sidebar component stays presentational.
 */

type AppShellProps = {
  children: React.ReactNode;
  /** Signed-in user, surfaced to the topbar avatar menu. */
  user?: { name?: string | null; email?: string | null };
};

export function AppShell({ children, user }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  // Close the drawer on Escape — keyboard parity with Radix overlays.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-bg">
      {/* Docked sidebar (desktop) */}
      <aside
        className="fixed inset-y-0 left-0 z-[20] hidden w-[260px] border-r border-border bg-bg-soft lg:block"
        aria-label="Sidebar"
      >
        <Sidebar />
      </aside>

      {/* Off-canvas drawer (mobile/tablet) */}
      <div
        className={cn(
          "fixed inset-0 z-[20] lg:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!drawerOpen}
      >
        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-[var(--ease-normal)]",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setDrawerOpen(false)}
        />
        {/* Panel */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[280px] max-w-[80vw] border-r border-border bg-bg-soft transition-transform duration-[var(--ease-normal)]",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar />
        </div>
      </div>

      {/* Main column */}
      <div className="lg:pl-[260px]">
        <Topbar
          onToggleSidebar={() => setDrawerOpen((v) => !v)}
          user={user}
        />
        <div className="mx-auto w-full max-w-[980px] px-5 pb-20 pt-12 md:px-14 md:pb-[120px]">
          {children}
        </div>
      </div>
    </div>
  );
}
