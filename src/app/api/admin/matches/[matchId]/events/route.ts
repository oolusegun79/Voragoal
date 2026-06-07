import { NextResponse } from "next/server";
import { requireApiRole, isAuthError } from "@/server/auth/api-guards";
import { createEvent, eventInputSchema } from "@/server/services/eventsService";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  const auth = await requireApiRole("EDITOR");
  if (isAuthError(auth)) return auth;

  const { matchId } = await ctx.params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const parsed = eventInputSchema.safeParse({ ...(body as object), matchId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "validation_error", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 }
    );
  }

  const event = await createEvent(parsed.data);
  return NextResponse.json({ event }, { status: 201 });
}
