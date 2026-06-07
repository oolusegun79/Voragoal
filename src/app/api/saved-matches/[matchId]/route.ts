import { NextResponse } from "next/server";
import { auth } from "@/server/auth/config";
import { prisma } from "@/server/db";

function unauthorized() {
  return NextResponse.json(
    { error: { code: "unauthorized", message: "Sign in required" } },
    { status: 401 }
  );
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const { matchId } = await ctx.params;

  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { id: true } });
  if (!match) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Match not found" } },
      { status: 404 }
    );
  }

  await prisma.savedMatch.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    create: { userId: session.user.id, matchId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const { matchId } = await ctx.params;
  await prisma.savedMatch.deleteMany({
    where: { userId: session.user.id, matchId },
  });
  return NextResponse.json({ ok: true });
}
