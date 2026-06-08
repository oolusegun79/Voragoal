import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Match prisma.config.ts: prefer .env.local, fall back to .env.
loadEnv({ path: ".env.local", override: true });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SEED_DIR = join(process.cwd(), "prisma", "seed-data");

function load<T>(file: string): T {
  return JSON.parse(readFileSync(join(SEED_DIR, file), "utf-8")) as T;
}

type VenueSeed = {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number | null;
};

type TeamSeed = {
  id: string;
  name: string;
  shortName: string;
  flagEmoji: string;
  accentColor: string;
  groupCode: string | null;
  fifaRanking: number | null;
  manager?: string | null;
};

type PlayerSeed = {
  id: string;
  fullName: string;
  knownAs?: string | null;
  teamId: string;
  position: "GK" | "DF" | "MF" | "FW";
  shirtNumber?: number | null;
  club?: string | null;
  birthDate?: string | null;
  heightCm?: number | null;
};

type MatchSeed = {
  matchNumber: number;
  stage:
    | "GROUP"
    | "R32"
    | "R16"
    | "QF"
    | "SF"
    | "THIRD_PLACE"
    | "FINAL";
  groupCode: string | null;
  kickoffAt: string;
  homeTeamId: string;
  awayTeamId: string;
  venueId?: string | null;
  status:
    | "SCHEDULED"
    | "LIVE"
    | "FINISHED"
    | "POSTPONED"
    | "CANCELLED";
};

async function seedVenues() {
  const venues = load<VenueSeed[]>("venues.json");
  for (const v of venues) {
    await prisma.venue.upsert({
      where: { id: v.id },
      create: v,
      update: v,
    });
  }
  console.log(`  ✓ ${venues.length} venues`);
}

async function seedTeams() {
  const teams = load<TeamSeed[]>("teams.json");
  for (const t of teams) {
    await prisma.team.upsert({
      where: { id: t.id },
      create: t,
      update: t,
    });
  }
  console.log(`  ✓ ${teams.length} teams`);
}

async function seedPlayers() {
  const players = load<PlayerSeed[]>("players.json");
  for (const p of players) {
    const data = {
      ...p,
      birthDate: p.birthDate ? new Date(p.birthDate) : null,
    };
    await prisma.player.upsert({
      where: { id: p.id },
      create: data,
      update: data,
    });
  }
  console.log(`  ✓ ${players.length} players`);
}

async function seedMatches() {
  const matches = load<MatchSeed[]>("matches.json");
  for (const m of matches) {
    const data = {
      ...m,
      kickoffAt: new Date(m.kickoffAt),
    };
    await prisma.match.upsert({
      where: { matchNumber: m.matchNumber },
      create: data,
      update: data,
    });
  }
  console.log(`  ✓ ${matches.length} matches`);
}

async function main() {
  console.log("Seeding Voragoal database…");
  await seedVenues();
  await seedTeams();
  await seedPlayers();
  await seedMatches();
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
