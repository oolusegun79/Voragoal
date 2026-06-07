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
  ctx: { params: Promise<{ playerId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const { playerId } = await ctx.params;

  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { id: true } });
  if (!player) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Player not found" } },
      { status: 404 }
    );
  }

  await prisma.favoritePlayer.upsert({
    where: { userId_playerId: { userId: session.user.id, playerId } },
    create: { userId: session.user.id, playerId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ playerId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const { playerId } = await ctx.params;
  await prisma.favoritePlayer.deleteMany({
    where: { userId: session.user.id, playerId },
  });
  return NextResponse.json({ ok: true });
}
