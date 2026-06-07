"use client";

import { useActionState, useState } from "react";
import type { EventType, Player, Team } from "@prisma/client";
import { createEventAction, updateEventAction } from "@/app/(admin)/admin/matches/[matchId]/events/actions";

type Squad = { team: Team; players: Player[] };

const EVENT_TYPES: EventType[] = [
  "GOAL", "PENALTY_GOAL", "OWN_GOAL", "PENALTY_MISS",
  "YELLOW_CARD", "RED_CARD",
  "SUB_IN", "SUB_OUT",
  "VAR", "INJURY",
];

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

export function EventForm({
  matchId,
  home,
  away,
  editing,
  onDone,
}: {
  matchId: string;
  home: Squad;
  away: Squad;
  editing?: EditingEvent;
  onDone?: () => void;
}) {
  const action = editing ? updateEventAction : createEventAction;
  const [state, formAction, pending] = useActionState(action, { });
  const [teamId, setTeamId] = useState<string>(editing?.teamId ?? home.team.id);
  const squad = teamId === home.team.id ? home.players : away.players;

  // Reset and call onDone after successful save.
  if (state.ok && onDone) {
    onDone();
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="matchId" value={matchId} />
      {editing ? <input type="hidden" name="eventId" value={editing.id} /> : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Minute">
          <input
            name="minute"
            type="number"
            min={0}
            max={150}
            required
            defaultValue={editing?.minute ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Added (+)">
          <input
            name="addedMinute"
            type="number"
            min={0}
            max={30}
            defaultValue={editing?.addedMinute ?? ""}
            placeholder="optional"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Team">
        <select
          name="teamId"
          required
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className={inputClass}
        >
          <option value={home.team.id}>{home.team.flagEmoji} {home.team.name} (home)</option>
          <option value={away.team.id}>{away.team.flagEmoji} {away.team.name} (away)</option>
        </select>
      </Field>

      <Field label="Event type">
        <select
          name="type"
          required
          defaultValue={editing?.type ?? "GOAL"}
          className={inputClass}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Player">
        <select name="playerId" defaultValue={editing?.playerId ?? ""} className={inputClass}>
          <option value="">(unattributed)</option>
          {squad.map((p) => (
            <option key={p.id} value={p.id}>
              {p.shirtNumber != null ? `#${p.shirtNumber} ` : ""}{p.knownAs ?? p.fullName}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Related player (assister, sub partner)">
        <select name="relatedPlayerId" defaultValue={editing?.relatedPlayerId ?? ""} className={inputClass}>
          <option value="">—</option>
          {squad.map((p) => (
            <option key={p.id} value={p.id}>
              {p.shirtNumber != null ? `#${p.shirtNumber} ` : ""}{p.knownAs ?? p.fullName}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Detail">
        <input
          name="detail"
          type="text"
          maxLength={200}
          defaultValue={editing?.detail ?? ""}
          placeholder="e.g. header from corner"
          className={inputClass}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : editing ? "Save changes" : "Add event"}
      </button>
    </form>
  );
}

const inputClass =
  "block h-9 w-full rounded-md border border-border/80 bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
