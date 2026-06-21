import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load env files in the same precedence Next.js uses, so the Prisma CLI picks
// up `.env.local` (which `dotenv/config` does NOT load by default).
//   .env.local > .env
// Next.js itself loads these at runtime; this only affects prisma CLI commands.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
