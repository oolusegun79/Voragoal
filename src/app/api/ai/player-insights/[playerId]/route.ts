import { NextResponse } from "next/server";
import { auth } from "@/server/auth/config";
import { getSummary } from "@/server/ai/aiSummaryService";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Sign in required" } },
      { status: 401 }
    );
  }
  const result = await getSummary("PLAYER", playerId);
  return NextResponse.json(result);
}
