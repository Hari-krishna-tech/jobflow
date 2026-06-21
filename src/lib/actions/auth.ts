"use server";

import { signOut } from "@/lib/auth";

/*
 * Sign-out Server Action.
 *
 * `signOut` from Auth.js v5 must be called server-side (it clears the JWT and
 * cookie). Wrapping it in an action lets the client avatar menu call it as a
 * form action without exposing the callback to the browser.
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/signin" });
}
