import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

/*
 * Middleware auth guard.
 *
 * Runs in the Edge runtime, so it only imports the edge-safe `authConfig`
 * (no Prisma / DB). The `authorized` callback in authConfig handles the
 * redirect logic:
 *   - signed-in users hitting /signin  → redirected to /
 *   - signed-out users hitting any other route → redirected to /signin
 *
 * Everything except the Auth.js callback routes and static assets is matched,
 * so all app pages (including the (dashboard) group) are protected by default.
 *
 * Note: Next 16 requires an explicit `middleware` function export rather than
 * the `export const { auth: middleware }` shorthand used in older Auth.js
 * examples.
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Skip Next internals, the Auth.js handler, and static assets.
  // Auth callback routes (/api/auth/*) are handled by NextAuth itself.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|manifest\\.json|logo\\.svg).*)"],
};
