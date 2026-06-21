import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * Prisma client singleton.
 *
 * Prisma 7 uses driver adapters at runtime; we use the Neon serverless adapter
 * (`@prisma/adapter-neon`) which works in both `next dev` and Vercel's
 * serverless functions. Migrations read DATABASE_URL via prisma.config.ts.
 *
 * In development, Next.js hot-reloads modules which would otherwise spawn a
 * new PrismaClient per reload and exhaust DB connections. We stash the client
 * on `globalThis` and reuse it.
 *
 * See: https://www.prisma.io/docs/guides/nextjs
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.example).",
    );
  }
  // PrismaNeon takes a PoolConfig and manages the connection Pool internally.
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
