/**
 * Promote a user to ADMIN by email.
 * Usage:  pnpm tsx scripts/make-admin.ts you@example.com
 *
 * No-op if the user is already ADMIN.
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnv({ path: ".env.local", override: true });

async function main() {
  const email = process.argv[2]?.toLowerCase();
  if (!email) {
    console.error("Usage: pnpm tsx scripts/make-admin.ts <email>");
    process.exit(1);
  }

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DIRECT_URL or DATABASE_URL must be set");
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (!user) {
      console.error(`No user with email ${email}. Sign up at /signup first.`);
      process.exit(1);
    }
    if (user.role === "ADMIN") {
      console.log(`${email} is already ADMIN.`);
    } else {
      await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
      console.log(`Promoted ${email} from ${user.role} to ADMIN.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
