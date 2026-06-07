import { NextResponse } from "next/server";
import { auth } from "@/server/auth/config";
import { userHasPass } from "@/server/auth/access";
import { prisma } from "@/server/db";

function unauthorized() {
  return NextResponse.json(
    { error: { code: "unauthorized", message: "Sign in required" } },
    { status: 401 }
  );
}

function paymentRequired() {
  return NextResponse.json(
    { error: { code: "payment_required", message: "Tournament Pass required to favourite teams." } },
    { status: 402 }
  );
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  if (!(await userHasPass(session.user.id))) return paymentRequired();
  const { teamId } = await ctx.params;

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } });
  if (!team) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Team not found" } },
      { status: 404 }
    );
  }

  await prisma.favoriteTeam.upsert({
    where: { userId_teamId: { userId: session.user.id, teamId } },
    create: { userId: session.user.id, teamId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const { teamId } = await ctx.params;
  await prisma.favoriteTeam.deleteMany({
    where: { userId: session.user.id, teamId },
  });
  return NextResponse.json({ ok: true });
}
