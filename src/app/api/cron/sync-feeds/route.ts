import { NextResponse } from "next/server";
import { syncAllLiveMatches } from "@/server/services/feedImportService";
import { autoStartScheduledMatches } from "@/server/services/eventsService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // Flip recently-due matches to LIVE first, so the immediate feed sync
    // below picks up the same matches we just promoted.
    const autoStart = await autoStartScheduledMatches();
    const feeds = await syncAllLiveMatches();
    return NextResponse.json({ autoStart, feeds });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "sync failed" },
      { status: 500 },
    );
  }
}
