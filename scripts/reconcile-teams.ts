/**
 * Reconcile teams: delete any Team row in the database that is NOT present in
 * prisma/seed-data/teams.json. Refuses to delete teams that still have match,
 * player, or favorite references.
 *
 * Usage:  pnpm tsx scripts/reconcile-teams.ts
 *         pnpm tsx scripts/reconcile-teams.ts --dry-run
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnv({ path: ".env.local", override: true });

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const seedPath = join(process.cwd(), "prisma", "seed-data", "teams.json");
    const seedTeams = JSON.parse(readFileSync(seedPath, "utf-8")) as Array<{ id: string }>;
    const wantedIds = new Set(seedTeams.map((t) => t.id));

    const dbTeams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            squad: true,
            homeMatches: true,
            awayMatches: true,
            favoritedBy: true,
          },
        },
      },
    });

    const obsolete = dbTeams.filter((t) => !wantedIds.has(t.id));
    if (obsolete.length === 0) {
      console.log("Nothing to reconcile. DB matches seed.");
      return;
    }

    console.log(`Found ${obsolete.length} obsolete team(s):`);
    let deletable = 0;
    for (const t of obsolete) {
      const refs =
        t._count.squad +
        t._count.homeMatches +
        t._count.awayMatches +
        t._count.favoritedBy;
      const status = refs === 0 ? "DELETE" : "SKIP (refs)";
      console.log(
        `  ${t.id.padEnd(4)} ${t.name.padEnd(28)} squad=${t._count.squad} home=${t._count.homeMatches} away=${t._count.awayMatches} fav=${t._count.favoritedBy}  → ${status}`
      );
      if (refs === 0) deletable += 1;
    }

    if (dryRun) {
      console.log(`\n[dry-run] would delete ${deletable} team(s).`);
      return;
    }

    if (deletable === 0) {
      console.log("\nNothing safe to delete. Reassign/delete references first.");
      return;
    }

    let deleted = 0;
    for (const t of obsolete) {
      const refs =
        t._count.squad +
        t._count.homeMatches +
        t._count.awayMatches +
        t._count.favoritedBy;
      if (refs > 0) continue;
      await prisma.team.delete({ where: { id: t.id } });
      deleted += 1;
    }
    console.log(`\nDeleted ${deleted} team(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
