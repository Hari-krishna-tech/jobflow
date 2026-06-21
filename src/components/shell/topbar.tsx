"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { pageTitle } from "./nav";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";

/*
 * Topbar — app-shell header (CONTEXT/02 §8, CONTEXT/03 §1).
 *
 *   56px · --bg (translucent + backdrop-blur optional) · bottom border
 *   Left: page title (text-h3) + mobile hamburger (<1024px)
 *   Right: Gmail sync indicator + user avatar menu
 *
 * The hamburger dispatches `onToggleSidebar`; the drawer open/close state lives
 * in AppShell so it can render the overlay + manage body scroll.
 */

export function Topbar({
  onToggleSidebar,
  user,
}: {
  onToggleSidebar: () => void;
  user?: { name?: string | null; email?: string | null };
}) {
  const pathname = usePathname();
  const title = pageTitle(pathname);

  return (
    <header
      className="sticky top-0 z-[10] flex h-14 items-center gap-3 border-b border-border bg-bg/90 px-4 backdrop-blur-sm md:px-6"
      role="banner"
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggleSidebar}
        aria-label="Open navigation"
      >
        <Menu className="size-[18px]" />
      </Button>

      <h1 className="truncate text-[17px] font-semibold tracking-tight text-text">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-3">
        {/* Gmail sync indicator — non-blocking placeholder until Phase 2.
            Off/disconnected renders faint; Phase 2 turns it green when synced. */}
        <span
          className="hidden items-center gap-1.5 text-xs text-text-faint sm:flex"
          title="Gmail not connected"
        >
          <span className="size-1.5 rounded-full bg-text-faint" aria-hidden />
          Not synced
        </span>
        <UserMenu name={user?.name} email={user?.email} />
      </div>
    </header>
  );
}
