import { DefaultSession } from "next-auth";

/*
 * Augment Auth.js types so `session.user.id` (our DB user id) is visible to
 * server components and actions. The id is attached in the `jwt`/`session`
 * callbacks in src/lib/auth/index.ts.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
