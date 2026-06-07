import "dotenv/config";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js convention is to put secrets in `.env.local` (which we gitignore).
// The Prisma CLI only auto-reads `.env`, so we load `.env.local` here with
// override priority so it wins.
loadEnv({ path: ".env.local", override: true });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  // CLI ops (migrate, studio) use the *direct* Supabase connection because
  // PgBouncer's transaction-mode pooler doesn't support DDL or prepared
  // statements. Runtime (PrismaClient) uses DATABASE_URL via the adapter in
  // src/server/db.ts.
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
// Seed runner: `pnpm db:seed` (see package.json).
