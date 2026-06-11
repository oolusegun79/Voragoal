import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Radio } from "lucide-react";
import { prisma } from "@/server/db";
import { getMatchById } from "@/server/services/matchService";
import { TeamCrest } from "@/components/team/TeamCrest";
import { FlagIcon } from "@/components/team/FlagIcon";
import { EventForm } from "@/components/admin/EventForm";
import { EditEventPanel } from "@/components/admin/EditEventPanel";
import { formatKickoff } from "@/lib/formatters";
import {
  deleteEventAction,
  recomputeScoreAction,
  setStatusAction,
  setExternalApiIdAction,
  syncFeedNowAction,
} from "./actions";

const STATUSES = ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"] as const;

export default async function AdminMatchEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { matchId } = await params;
  const { edit: editId } = await searchParams;
  const match = await getMatchById(matchId);
  if (!match) notFound();

  const [homeSquad, awaySquad] = await Promise.all([
    prisma.player.findMany({
      where: { teamId: match.homeTeamId },
      orderBy: [{ position: "asc" }, { shirtNumber: "asc" }],
    }),
    prisma.player.findMany({
      where: { teamId: match.awayTeamId },
      orderBy: [{ position: "asc" }, { shirtNumber: "asc" }],
    }),
  ]);

  const editingEvent = editId ? match.events.find((e) => e.id === editId) : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/matches"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All matches
        </Link>
        <Link
          href={`/admin/matches/${matchId}/live`}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-error/40 bg-error/10 px-3 text-sm font-medium text-error transition hover:bg-error/15"
        >
          <Radio className="size-4" /> Live entry mode
        </Link>
      </div>

      {/* Match header */}
      <header className="mt-4 rounded-xl border border-border/60 bg-card p-6">
        <p className="text-xs text-muted-foreground">
          {match.stage === "GROUP" && match.groupCode ? `Group ${match.groupCode}` : match.stage} ·{" "}
          {formatKickoff(match.kickoffAt)}
          {match.venue ? ` · ${match.venue.name}` : ""}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden><FlagIcon emoji={match.homeTeam.flagEmoji} /></span>
              <span className="text-xl font-semibold">{match.homeTeam.shortName}</span>
            </div>
            <p className="font-mono text-3xl tabular-nums">
              {match.homeScore ?? 0} <span className="text-muted-foreground">–</span> {match.awayScore ?? 0}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold">{match.awayTeam.shortName}</span>
              <span className="text-3xl" aria-hidden><FlagIcon emoji={match.awayTeam.flagEmoji} /></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Status select form */}
            <form action={setStatusAction} className="inline-flex items-center gap-2">
              <input type="hidden" name="matchId" value={match.id} />
              <select
                name="status"
                defaultValue={match.status}
                className="h-9 rounded-md border border-border/80 bg-background px-3 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-md bg-card-muted px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                Save status
              </button>
            </form>
            {/* Recompute score */}
            <form action={recomputeScoreAction}>
              <input type="hidden" name="matchId" value={match.id} />
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-md border border-border/80 bg-card/40 px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                Recompute score
              </button>
            </form>
          </div>
        </div>

        {/* Feed import row */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <span className="font-medium tracking-wide uppercase">Feed</span>
          <form action={setExternalApiIdAction} className="inline-flex items-center gap-2">
            <input type="hidden" name="matchId" value={match.id} />
            <input
              type="text"
              name="externalApiId"
              defaultValue={match.externalApiId ?? ""}
              placeholder="API-Football fixture ID"
              className="h-8 w-52 rounded-md border border-border/80 bg-background px-2 text-xs"
            />
            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-md bg-card-muted px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Save ID
            </button>
          </form>
          <form action={syncFeedNowAction}>
            <input type="hidden" name="matchId" value={match.id} />
            <button
              type="submit"
              disabled={!match.externalApiId}
              className="inline-flex h-8 items-center rounded-md border border-primary/40 bg-primary/10 px-3 text-xs font-medium text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:border-border/40 disabled:bg-card-muted disabled:text-muted-foreground"
            >
              Sync now
            </button>
          </form>
          {match.externalApiId ? (
            <span className="text-[10px] text-muted-foreground">
              Auto-syncs every minute while LIVE.
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              Paste an API-Football fixture ID to enable auto-import.
            </span>
          )}
        </div>
      </header>

      {/* Events list + form */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="mb-3 text-sm font-medium tracking-tight">Events ({match.events.length})</h2>
          {match.events.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
              No events yet. Add one using the form on the right.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {match.events.map((e) => {
                const isEditing = editingEvent?.id === e.id;
                return (
                  <li
                    key={e.id}
                    className={`grid grid-cols-[60px_1fr_auto] items-center gap-3 rounded-md border px-3 py-2 text-sm transition ${
                      isEditing
                        ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/40 bg-card"
                    }`}
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {e.minute}{e.addedMinute ? `+${e.addedMinute}` : ""}'
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <TeamCrest flagEmoji={e.team.flagEmoji} shortName={e.team.shortName} size="sm" />
                      <span className="text-muted-foreground">{e.type.replaceAll("_", " ")}</span>
                      {e.player ? (
                        <span className="font-medium">{e.player.knownAs ?? e.player.fullName}</span>
                      ) : null}
                      {e.relatedPlayer ? (
                        <span className="text-muted-foreground">
                          ({e.relatedPlayer.knownAs ?? e.relatedPlayer.fullName})
                        </span>
                      ) : null}
                      {e.detail ? <span className="text-muted-foreground">— {e.detail}</span> : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        href={isEditing ? `/admin/matches/${match.id}/events` : `?edit=${e.id}`}
                        aria-label={isEditing ? "Stop editing" : "Edit event"}
                        className={`inline-flex size-7 items-center justify-center rounded transition ${
                          isEditing
                            ? "bg-primary/15 text-primary hover:bg-primary/25"
                            : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        <Pencil className="size-3.5" />
                      </Link>
                      <form action={deleteEventAction}>
                        <input type="hidden" name="eventId" value={e.id} />
                        <input type="hidden" name="matchId" value={match.id} />
                        <button
                          type="submit"
                          aria-label="Delete event"
                          className="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-error/10 hover:text-error"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="rounded-xl border border-border/60 bg-card p-5">
          {editingEvent ? (
            <EditEventPanel
              matchId={match.id}
              home={{ team: match.homeTeam, players: homeSquad }}
              away={{ team: match.awayTeam, players: awaySquad }}
              editing={{
                id: editingEvent.id,
                matchId: match.id,
                minute: editingEvent.minute,
                addedMinute: editingEvent.addedMinute,
                type: editingEvent.type,
                teamId: editingEvent.teamId,
                playerId: editingEvent.playerId,
                relatedPlayerId: editingEvent.relatedPlayerId,
                detail: editingEvent.detail,
              }}
            />
          ) : (
            <>
              <h2 className="mb-4 text-sm font-medium tracking-tight">Add event</h2>
              <EventForm
                matchId={match.id}
                home={{ team: match.homeTeam, players: homeSquad }}
                away={{ team: match.awayTeam, players: awaySquad }}
              />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
