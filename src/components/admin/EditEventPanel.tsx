"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { EventType, Player, Team } from "@prisma/client";
import { EventForm } from "@/components/admin/EventForm";

type Squad = { team: Team; players: Player[] };

type EditingEvent = {
  id: string;
  matchId: string;
  minute: number;
  addedMinute: number | null;
  type: EventType;
  teamId: string;
  playerId: string | null;
  relatedPlayerId: string | null;
  detail: string | null;
};

/**
 * Wraps EventForm in "edit" mode. After the server action succeeds (state.ok
 * fires via onDone), this component clears the ?edit= query param so the
 * sidebar returns to its "Add event" state without a manual cancel.
 */
export function EditEventPanel({
  matchId,
  home,
  away,
  editing,
}: {
  matchId: string;
  home: Squad;
  away: Squad;
  editing: EditingEvent;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium tracking-tight">Edit event</h2>
        <Link
          href={pathname}
          aria-label="Cancel editing"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-card-muted hover:text-foreground"
        >
          <X className="size-3" /> Cancel
        </Link>
      </div>
      <EventForm
        matchId={matchId}
        home={home}
        away={away}
        editing={editing}
        onDone={() => router.replace(pathname)}
      />
    </>
  );
}
