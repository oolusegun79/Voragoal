import { NextResponse } from "next/server";
import { requireApiRole, isAuthError } from "@/server/auth/api-guards";
import { getSummary } from "@/server/ai/aiSummaryService";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ playerId: string }> }
) {
  const auth = await requireApiRole("EDITOR");
  if (isAuthError(auth)) return auth;
  const { playerId } = await ctx.params;
  const result = await getSummary("PLAYER", playerId, { force: true });
  return NextResponse.json(result);
}
