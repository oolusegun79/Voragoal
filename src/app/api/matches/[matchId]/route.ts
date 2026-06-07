import { NextResponse } from "next/server";
import { getMatchById } from "@/server/services/matchService";
import { computeClock } from "@/server/services/eventsService";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await ctx.params;
  const match = await getMatchById(matchId);
  if (!match) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Match not found" } },
      { status: 404 }
    );
  }
  const clock = computeClock(match);
  return NextResponse.json({ match, clock });
}
