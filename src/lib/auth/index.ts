import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

/*
 * Full Auth.js config — imports the edge-safe `authConfig` and layers on the
 * Google provider plus DB-touching callbacks. Used by route handlers and
 * server components (Node runtime), NOT by middleware.
 *
 * Design note: JobFlow uses a single `User` model with OAuth tokens embedded
 * (no separate Account/Session tables — see prisma/schema.prisma). So we use
 * the JWT session strategy and manually upsert the User row on sign-in rather
 * than `@auth/prisma-adapter` (which expects the full Account/Session schema).
 * This matches PLAN §09 ("persist tokens to the User record"). Phase 2 will
 * extend the `signIn`/`jwt` callbacks to store the Gmail refresh token.
 *
 * Phase 1 scopes: openid, email, profile. gmail.readonly + offline access is
 * added in Phase 2.2.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    // `authorized` is inherited from authConfig via the spread above; restate
    // it explicitly so the full callback set is visible in one place.
    ...(authConfig.callbacks ?? {}),

    // First point of contact after Google verifies the user — create/update the
    // User row by email. Runs once per sign-in.
    async signIn({ user, account }) {
      if (!user?.email) return false;

      const rawRefreshToken = account?.refresh_token;
      const rawAccessToken = account?.access_token;
      const encryptedRefreshToken = rawRefreshToken ? encrypt(rawRefreshToken) : undefined;

      await prisma.user.upsert({
        where: { email: user.email },
        create: {
          email: user.email,
          name: user.name,
          refresh_token: encryptedRefreshToken,
          access_token: rawAccessToken,
        },
        update: {
          name: user.name ?? undefined,
          ...(encryptedRefreshToken ? { refresh_token: encryptedRefreshToken } : {}),
          ...(rawAccessToken ? { access_token: rawAccessToken } : {}),
        },
      });
      return true;
    },

    // Attach the DB user id to the JWT so it's available to the session.
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true },
        });
        if (dbUser) token.id = dbUser.id;
      }
      return token;
    },

    // Expose the user id on the session object for server components/actions.
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
