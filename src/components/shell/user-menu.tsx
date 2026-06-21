"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import { signOutAction } from "@/lib/actions/auth";

/*
 * UserMenu — avatar + dropdown (CONTEXT/02 §8 Avatar, §10 Dropdown).
 *
 * Avatar: 32px, radius-full, --accent-bg bg + --accent-soft initials.
 * The dropdown surfaces the signed-in email + Sign out (destructive-ish ghost).
 */

type UserMenuProps = {
  name?: string | null;
  email?: string | null;
};

export function UserMenu({ name, email }: UserMenuProps) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Account menu"
        >
          {/* Avatar: accent-bg tile + initials (CONTEXT/02 §9) */}
          <span className="flex size-8 items-center justify-center rounded-full bg-accent-bg text-[13px] font-semibold text-accent-soft">
            {initials(name, email)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {email ? (
          <>
            <DropdownMenuLabel className="truncate font-normal text-text-dim">
              {email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem
          variant="default"
          disabled={pending}
          onClick={() => startTransition(() => signOutAction())}
        >
          <LogOut className="size-4" />
          <span>{pending ? "Signing out…" : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
