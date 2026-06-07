"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CornerDownLeft, Trash2, Undo2 } from "lucide-react";
import type { EventType, Player, Team, Match } from "@prisma/client";
import { LiveMatchClock, getAddedMinute, getCurrentMinute } from "@/components/admin/live/LiveMatchClock";
import { cn } from "@/lib/utils";

type EventRow = {
  id: string;
  minute: number;
  addedMinute: number | null;
  type: EventType;
  teamId: string;
  team: { flagEmoji: string; shortName: string };
  player: { knownAs: string | null; fullName: string } | null;
  relatedPlayer: { knownAs: string | null; fullName: string } | null;
  detail: string | null;
};

type Squad = { team: Team; players: Player[] };

type QuickKind = "GOAL" | "YELLOW_CARD" | "RED_CARD" | "SUB";

type Side = "home" | "away";

const QUICK: Array<{ kind: QuickKind; label: string; icon: string; tone: "primary" | "warning" | "error" | "muted" }> = [
  { kind: "GOAL", label: "Goal", icon: "⚽", tone: "primary" },
  { kind: "YELLOW_CARD", label: "Yellow", icon: "🟨", tone: "warning" },
  { kind: "RED_CARD", label: "Red", icon: "🟥", tone: "error" },
  { kind: "SUB", label: "Sub", icon: "🔁", tone: "muted" },
];

const EVENT_LABEL: Record<EventType, string> = {
  GOAL: "Goal",
  OWN_GOAL: "Own goal",
  PENALTY_GOAL: "Goal (pen)",
  PENALTY_MISS: "Penalty missed",
  ASSIST: "Assist",
  YELLOW_CARD: "Yellow",
  RED_CARD: "Red",
  SUB_IN: "Sub on",
  SUB_OUT: "Sub off",
  VAR: "VAR",
  INJURY: "Injury",
};

export function LiveEntryPanel({
  match,
  home,
  away,
  initialEvents,
}: {
  match: Match;
  home: Squad;
  away: Squad;
  initialEvents: EventRow[];
}) {
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<
    | { kind: QuickKind; side: Side }
    | null
  >(null);

  // Keep server-rendered events in sync if the page refreshes.
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const clockState = {
    status: match.status,
    kickoffStartedAt: match.kickoffStartedAt?.toISOString() ?? null,
    secondHalfStartedAt: match.secondHalfStartedAt?.toISOString() ?? null,
    addedMinutes1H: match.addedMinutes1H,
  };
  const minute = getCurrentMinute(clockState);
  const addedMinute = getAddedMinute(clockState);

  const homeScore = events.filter((e) => isHomeGoal(e, match)).length;
  const awayScore = events.filter((e) => isAwayGoal(e, match)).length;

  function pickerOpenFor(kind: QuickKind, side: Side) {
    if (match.status !== "LIVE") {
      setError("Tap Start match first.");
      return;
    }
    setError(null);
    setDialog({ kind, side });
  }

  async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
    }
    return res.json();
  }

  async function submitEvent(input: {
    type: EventType;
    teamId: string;
    playerId?: string | null;
    relatedPlayerId?: string | null;
    detail?: string | null;
  }) {
    setError(null);
    // Optimistic add
    const tempId = `temp_${Date.now()}`;
    const team = input.teamId === home.team.id ? home.team : away.team;
    const playerLookup = (id: string | null | undefined) =>
      !id ? null : (input.teamId === home.team.id ? home.players : away.players).find((p) => p.id === id) ?? null;
    const optimistic: EventRow = {
      id: tempId,
      minute,
      addedMinute,
      type: input.type,
      teamId: input.teamId,
      team: { flagEmoji: team.flagEmoji, shortName: team.shortName },
      player: playerLookup(input.playerId)
        ? { knownAs: playerLookup(input.playerId)!.knownAs, fullName: playerLookup(input.playerId)!.fullName }
        : null,
      relatedPlayer: playerLookup(input.relatedPlayerId)
        ? { knownAs: playerLookup(input.relatedPlayerId)!.knownAs, fullName: playerLookup(input.relatedPlayerId)!.fullName }
        : null,
      detail: input.detail ?? null,
    };
    setEvents((cur) => [...cur, optimistic]);

    try {
      const { event } = await api<{ event: EventRow }>(`/api/admin/matches/${match.id}/events`, {
        method: "POST",
        body: JSON.stringify({
          minute,
          addedMinute,
          type: input.type,
          teamId: input.teamId,
          playerId: input.playerId ?? null,
          relatedPlayerId: input.relatedPlayerId ?? null,
          detail: input.detail ?? null,
        }),
      });
      setEvents((cur) =>
        cur.map((e) => (e.id === tempId ? { ...optimistic, id: event.id } : e))
      );
      startTransition(() => router.refresh());
    } catch (err) {
      setEvents((cur) => cur.filter((e) => e.id !== tempId));
      setError(err instanceof Error ? err.message : "Failed to save event");
    }
  }

  async function deleteEvent(id: string) {
    if (id.startsWith("temp_")) return;
    const previous = events;
    setEvents((cur) => cur.filter((e) => e.id !== id));
    try {
      await api(`/api/admin/matches/${match.id}/events/${id}`, { method: "DELETE" });
      startTransition(() => router.refresh());
    } catch (err) {
      setEvents(previous);
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  }

  async function transition(path: string) {
    setError(null);
    try {
      await api(`/api/admin/matches/${match.id}/${path}`, { method: "POST" });
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  const sortedEvents = [...events].sort(
    (a, b) => b.minute - a.minute || (b.addedMinute ?? 0) - (a.addedMinute ?? 0)
  );
  const lastEvent = sortedEvents[0];

  return (
    <div className="space-y-4">
      {/* Score + clock + status transitions */}
      <section className="rounded-xl border border-border/60 bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-2xl">{home.team.flagEmoji}</span>
            <p className="font-mono text-4xl font-bold tabular-nums">
              {homeScore} <span className="text-muted-foreground">–</span> {awayScore}
            </p>
            <span className="text-2xl">{away.team.flagEmoji}</span>
          </div>
          <LiveMatchClock state={clockState} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {match.status === "SCHEDULED" ? (
            <BigBtn onClick={() => transition("start")} tone="primary" disabled={pending}>
              ▶ Start match
            </BigBtn>
          ) : null}
          {match.status === "LIVE" && match.addedMinutes1H == null && !match.secondHalfStartedAt ? (
            <BigBtn onClick={() => transition("half-time")} tone="warning" disabled={pending}>
              ⏸ Half time
            </BigBtn>
          ) : null}
          {match.status === "LIVE" && match.addedMinutes1H != null && !match.secondHalfStartedAt ? (
            <BigBtn onClick={() => transition("resume-2h")} tone="primary" disabled={pending}>
              ▶ Resume 2H
            </BigBtn>
          ) : null}
          {match.status === "LIVE" && match.secondHalfStartedAt ? (
            <BigBtn onClick={() => transition("full-time")} tone="success" disabled={pending}>
              ⏹ Full time
            </BigBtn>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="mt-3 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </p>
        ) : null}
      </section>

      {/* Quick action grid */}
      <section className="grid grid-cols-2 gap-3">
        <SideColumn label={home.team.name} flag={home.team.flagEmoji} side="home" onPick={pickerOpenFor} disabled={match.status !== "LIVE"} />
        <SideColumn label={away.team.name} flag={away.team.flagEmoji} side="away" onPick={pickerOpenFor} disabled={match.status !== "LIVE"} />
      </section>

      {/* Timeline */}
      <section className="rounded-xl border border-border/60 bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium tracking-tight">Live timeline ({events.length})</h2>
          {lastEvent && !lastEvent.id.startsWith("temp_") ? (
            <button
              type="button"
              onClick={() => deleteEvent(lastEvent.id)}
              className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-card/40 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Undo2 className="size-3.5" /> Undo last
            </button>
          ) : null}
        </div>
        {sortedEvents.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
            No events yet. Tap a button above to add one.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {sortedEvents.map((e) => (
              <li
                key={e.id}
                className="grid grid-cols-[60px_1fr_auto] items-center gap-3 rounded-md border border-border/40 bg-card-muted/40 px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {e.minute}{e.addedMinute ? `+${e.addedMinute}` : ""}'
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span aria-hidden>{e.team.flagEmoji}</span>
                  <span className="text-muted-foreground">{EVENT_LABEL[e.type]}</span>
                  {e.player ? (
                    <span className="font-medium">{e.player.knownAs ?? e.player.fullName}</span>
                  ) : null}
                  {e.relatedPlayer ? (
                    <span className="text-muted-foreground">
                      ({e.relatedPlayer.knownAs ?? e.relatedPlayer.fullName})
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => deleteEvent(e.id)}
                  aria-label="Delete event"
                  className="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-error/10 hover:text-error"
                  disabled={e.id.startsWith("temp_")}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dialog ? (
        <PickerDialog
          home={home}
          away={away}
          dialog={dialog}
          onClose={() => setDialog(null)}
          onSubmit={async (payload) => {
            setDialog(null);
            await submitEvent(payload);
          }}
        />
      ) : null}
    </div>
  );
}

// ---- helpers ----

function isHomeGoal(e: EventRow, match: Match): boolean {
  if (e.type === "GOAL" || e.type === "PENALTY_GOAL") return e.teamId === match.homeTeamId;
  if (e.type === "OWN_GOAL") return e.teamId === match.awayTeamId; // own goal credited to opposing side
  return false;
}

function isAwayGoal(e: EventRow, match: Match): boolean {
  if (e.type === "GOAL" || e.type === "PENALTY_GOAL") return e.teamId === match.awayTeamId;
  if (e.type === "OWN_GOAL") return e.teamId === match.homeTeamId;
  return false;
}

// ---- subcomponents ----

function SideColumn({
  label,
  flag,
  side,
  onPick,
  disabled,
}: {
  label: string;
  flag: string;
  side: Side;
  onPick: (kind: QuickKind, side: Side) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <div className="mb-2 flex items-center gap-2 px-1 text-sm font-medium">
        <span className="text-xl">{flag}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {QUICK.map((q) => (
          <BigBtn
            key={q.kind}
            onClick={() => onPick(q.kind, side)}
            disabled={disabled}
            tone={q.tone}
          >
            <span className="text-base">{q.icon}</span>
            <span>{q.label}</span>
          </BigBtn>
        ))}
      </div>
    </div>
  );
}

function BigBtn({
  onClick,
  children,
  disabled,
  tone = "primary",
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  tone?: "primary" | "warning" | "error" | "muted" | "success";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/15 text-primary border-primary/30 hover:bg-primary/25",
    accent: "bg-accent/15 text-accent border-accent/30 hover:bg-accent/25",
    warning: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25",
    error: "bg-error/15 text-error border-error/30 hover:bg-error/25",
    success: "bg-success/15 text-success border-success/30 hover:bg-success/25",
    muted: "bg-card-muted text-foreground border-border/60 hover:bg-card-muted/80",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-14 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition active:scale-[0.98]",
        tones[tone],
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
      )}
    >
      {children}
    </button>
  );
}

function PickerDialog({
  home,
  away,
  dialog,
  onClose,
  onSubmit,
}: {
  home: Squad;
  away: Squad;
  dialog: { kind: QuickKind; side: Side };
  onClose: () => void;
  onSubmit: (payload: {
    type: EventType;
    teamId: string;
    playerId?: string | null;
    relatedPlayerId?: string | null;
  }) => Promise<void>;
}) {
  const squad = dialog.side === "home" ? home : away;
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [primary, setPrimary] = useState<string>("");
  const [related, setRelated] = useState<string>("");

  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);

  const isGoal = dialog.kind === "GOAL";
  const isSub = dialog.kind === "SUB";
  const isCard = dialog.kind === "YELLOW_CARD" || dialog.kind === "RED_CARD";
  const title = isGoal ? "Goal" : isSub ? "Substitution" : isCard ? (dialog.kind === "YELLOW_CARD" ? "Yellow card" : "Red card") : "Event";

  const filtered = squad.players.filter((p) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    const name = (p.knownAs ?? p.fullName).toLowerCase();
    return name.includes(needle) || String(p.shirtNumber ?? "").includes(needle);
  });

  function PlayerSelect({
    label,
    value,
    onChange,
    placeholder = "Select…",
    optional = false,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    optional?: boolean;
  }) {
    return (
      <label className="block">
        <span className="text-xs text-muted-foreground">{label}{optional ? " (optional)" : ""}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block h-10 w-full rounded-md border border-border/80 bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{placeholder}</option>
          {filtered.map((p) => (
            <option key={p.id} value={p.id}>
              {p.shirtNumber != null ? `#${p.shirtNumber} ` : ""}{p.knownAs ?? p.fullName} · {p.position}
            </option>
          ))}
        </select>
      </label>
    );
  }

  async function handleSave() {
    let type: EventType;
    let playerId: string | null = primary || null;
    let relatedPlayerId: string | null = related || null;
    if (isGoal) type = "GOAL";
    else if (dialog.kind === "YELLOW_CARD") { type = "YELLOW_CARD"; relatedPlayerId = null; }
    else if (dialog.kind === "RED_CARD") { type = "RED_CARD"; relatedPlayerId = null; }
    else if (isSub) {
      type = "SUB_IN";
    } else return;
    await onSubmit({ type, teamId: squad.team.id, playerId, relatedPlayerId });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[92vw] max-w-md rounded-xl border border-border/60 bg-card p-0 text-foreground backdrop:bg-black/60"
    >
      <div className="border-b border-border/60 p-4">
        <h3 className="font-semibold tracking-tight">
          {title} · {squad.team.flagEmoji} {squad.team.shortName}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Minute auto-fills from the clock.</p>
      </div>
      <div className="space-y-3 p-4">
        <label className="block">
          <span className="text-xs text-muted-foreground">Search by name or jersey #</span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pulisic, 10, Rey…"
            className="mt-1 block h-10 w-full rounded-md border border-border/80 bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
        </label>
        <PlayerSelect
          label={isSub ? "Coming on" : "Player"}
          value={primary}
          onChange={setPrimary}
          placeholder={isSub ? "Sub in" : "Pick player"}
        />
        {isGoal ? (
          <PlayerSelect
            label="Assist"
            value={related}
            onChange={setRelated}
            placeholder="No assist"
            optional
          />
        ) : null}
        {isSub ? (
          <PlayerSelect
            label="Going off"
            value={related}
            onChange={setRelated}
            placeholder="Sub out"
            optional
          />
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border/60 p-4">
        <button
          type="button"
          onClick={() => { ref.current?.close(); onClose(); }}
          className="inline-flex h-9 items-center rounded-md border border-border/80 bg-card/40 px-3 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!primary}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          Save <CornerDownLeft className="size-3.5" />
        </button>
      </div>
    </dialog>
  );
}
