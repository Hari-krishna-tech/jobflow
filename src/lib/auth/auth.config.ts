import type { NextAuthConfig } from "next-auth";

/*
 * Edge-compatible Auth.js config.
 *
 * This file MUST stay edge-safe (no Prisma / DB calls) because it's imported
 * by `src/middleware.ts`, which runs in the Edge runtime. DB-touching logic
 * (user upsert, token enrichment) lives in `src/lib/auth/index.ts` instead.
 *
 * See: https://authjs.dev/getting-started/migrating-to-v5
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/signin",
  },
  providers: [], // Populated in src/lib/auth/index.ts (Google provider).
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnSignin = request.nextUrl.pathname.startsWith("/signin");

      if (isOnSignin) {
        // Send logged-in users away from the sign-in page.
        if (isLoggedIn) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      // Every other route requires a session; middleware redirects to /signin.
      return isLoggedIn;
    },
  },
};
