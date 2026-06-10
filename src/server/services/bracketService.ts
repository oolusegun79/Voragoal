import { prisma } from "@/server/db";
import { computeStandings } from "./standingsService";

export type BracketRound = "R32" | "R16" | "QF" | "SF" | "THIRD_PLACE" | "FINAL";

type Slot =
  | { kind: "group-position"; pos: 1 | 2 | 3; groupCode: string }
  | { kind: "third-place-pool"; candidates: string[] }
  | { kind: "match-winner"; matchNumber: number }
  | { kind: "match-runner-up"; matchNumber: number };

type LayoutNode = {
  matchNumber: number;
  round: BracketRound;
  kickoffAt: string;
  venueId: string;
  col: number;
  rowStart: number;
  rowEnd: number;
  home: Slot;
  away: Slot;
};

function slot(label: string): Slot {
  if (label.startsWith("RU")) {
    return { kind: "match-runner-up", matchNumber: Number(label.slice(2)) };
  }
  if (label.startsWith("W")) {
    return { kind: "match-winner", matchNumber: Number(label.slice(1)) };
  }
  const head = label[0];
  if (head !== "1" && head !== "2" && head !== "3") {
    throw new Error(`Unknown bracket slot label: ${label}`);
  }
  if (label.length === 2) {
    return { kind: "group-position", pos: Number(head) as 1 | 2 | 3, groupCode: label[1] };
  }
  if (head === "3") {
    return { kind: "third-place-pool", candidates: label.slice(1).split("") };
  }
  throw new Error(`Unknown bracket slot label: ${label}`);
}

// FIFA-published bracket: 9-column horizontal layout (R32 → Final + 3rd place).
// Kickoff times stored in UTC; FIFA Central Time (CDT, UTC-5) + 5h.
const LAYOUT: LayoutNode[] = [
  // ─── Left R32 (col 1) ───
  { matchNumber: 74, round: "R32", kickoffAt: "2026-06-29T20:30:00Z", venueId: "v_gillette", col: 1, rowStart: 1,  rowEnd: 3,  home: slot("1E"), away: slot("3ABCDF") },
  { matchNumber: 77, round: "R32", kickoffAt: "2026-06-30T21:00:00Z", venueId: "v_metlife",  col: 1, rowStart: 3,  rowEnd: 5,  home: slot("1I"), away: slot("3CDFGH") },
  { matchNumber: 73, round: "R32", kickoffAt: "2026-06-28T19:00:00Z", venueId: "v_sofi",     col: 1, rowStart: 5,  rowEnd: 7,  home: slot("2A"), away: slot("2B") },
  { matchNumber: 75, round: "R32", kickoffAt: "2026-06-30T01:00:00Z", venueId: "v_bbva",     col: 1, rowStart: 7,  rowEnd: 9,  home: slot("1F"), away: slot("2C") },
  { matchNumber: 83, round: "R32", kickoffAt: "2026-07-02T23:00:00Z", venueId: "v_bmo",      col: 1, rowStart: 9,  rowEnd: 11, home: slot("2K"), away: slot("2L") },
  { matchNumber: 84, round: "R32", kickoffAt: "2026-07-02T19:00:00Z", venueId: "v_sofi",     col: 1, rowStart: 11, rowEnd: 13, home: slot("1H"), away: slot("2J") },
  { matchNumber: 81, round: "R32", kickoffAt: "2026-07-02T00:00:00Z", venueId: "v_levis",    col: 1, rowStart: 13, rowEnd: 15, home: slot("1D"), away: slot("3BEFIJ") },
  { matchNumber: 82, round: "R32", kickoffAt: "2026-07-01T20:00:00Z", venueId: "v_lumen",    col: 1, rowStart: 15, rowEnd: 17, home: slot("1G"), away: slot("3AEHIJ") },

  // ─── Left R16 (col 2) ───
  { matchNumber: 89, round: "R16", kickoffAt: "2026-07-04T21:00:00Z", venueId: "v_lincoln",  col: 2, rowStart: 2,  rowEnd: 4,  home: slot("W74"), away: slot("W77") },
  { matchNumber: 90, round: "R16", kickoffAt: "2026-07-04T17:00:00Z", venueId: "v_nrg",      col: 2, rowStart: 6,  rowEnd: 8,  home: slot("W73"), away: slot("W75") },
  { matchNumber: 93, round: "R16", kickoffAt: "2026-07-06T19:00:00Z", venueId: "v_att",      col: 2, rowStart: 10, rowEnd: 12, home: slot("W83"), away: slot("W84") },
  { matchNumber: 94, round: "R16", kickoffAt: "2026-07-07T00:00:00Z", venueId: "v_lumen",    col: 2, rowStart: 14, rowEnd: 16, home: slot("W81"), away: slot("W82") },

  // ─── Left QF (col 3) ───
  { matchNumber: 97, round: "QF",  kickoffAt: "2026-07-09T20:00:00Z", venueId: "v_gillette", col: 3, rowStart: 3,  rowEnd: 7,  home: slot("W89"), away: slot("W90") },
  { matchNumber: 98, round: "QF",  kickoffAt: "2026-07-10T19:00:00Z", venueId: "v_sofi",     col: 3, rowStart: 11, rowEnd: 15, home: slot("W93"), away: slot("W94") },

  // ─── Left SF (col 4) ───
  { matchNumber: 101, round: "SF", kickoffAt: "2026-07-14T19:00:00Z", venueId: "v_att",      col: 4, rowStart: 7,  rowEnd: 11, home: slot("W97"), away: slot("W98") },

  // ─── Center column (col 5) — Final + 3rd place ───
  { matchNumber: 104, round: "FINAL",       kickoffAt: "2026-07-19T19:00:00Z", venueId: "v_metlife",  col: 5, rowStart: 5,  rowEnd: 8,  home: slot("W101"),  away: slot("W102") },
  { matchNumber: 103, round: "THIRD_PLACE", kickoffAt: "2026-07-18T21:00:00Z", venueId: "v_hardrock", col: 5, rowStart: 10, rowEnd: 13, home: slot("RU101"), away: slot("RU102") },

  // ─── Right SF (col 6) ───
  { matchNumber: 102, round: "SF", kickoffAt: "2026-07-15T19:00:00Z", venueId: "v_mercedes", col: 6, rowStart: 7,  rowEnd: 11, home: slot("W99"), away: slot("W100") },

  // ─── Right QF (col 7) ───
  { matchNumber: 99,  round: "QF",  kickoffAt: "2026-07-11T21:00:00Z", venueId: "v_hardrock", col: 7, rowStart: 3,  rowEnd: 7,  home: slot("W91"), away: slot("W92") },
  { matchNumber: 100, round: "QF",  kickoffAt: "2026-07-12T01:00:00Z", venueId: "v_arrowhead", col: 7, rowStart: 11, rowEnd: 15, home: slot("W95"), away: slot("W96") },

  // ─── Right R16 (col 8) ───
  { matchNumber: 91, round: "R16", kickoffAt: "2026-07-05T20:00:00Z", venueId: "v_metlife",  col: 8, rowStart: 2,  rowEnd: 4,  home: slot("W76"), away: slot("W78") },
  { matchNumber: 92, round: "R16", kickoffAt: "2026-07-06T00:00:00Z", venueId: "v_azteca",   col: 8, rowStart: 6,  rowEnd: 8,  home: slot("W79"), away: slot("W80") },
  { matchNumber: 95, round: "R16", kickoffAt: "2026-07-07T16:00:00Z", venueId: "v_mercedes", col: 8, rowStart: 10, rowEnd: 12, home: slot("W86"), away: slot("W88") },
  { matchNumber: 96, round: "R16", kickoffAt: "2026-07-07T20:00:00Z", venueId: "v_bcplace",  col: 8, rowStart: 14, rowEnd: 16, home: slot("W85"), away: slot("W87") },

  // ─── Right R32 (col 9) ───
  { matchNumber: 76, round: "R32", kickoffAt: "2026-06-29T17:00:00Z", venueId: "v_nrg",      col: 9, rowStart: 1,  rowEnd: 3,  home: slot("1C"), away: slot("2F") },
  { matchNumber: 78, round: "R32", kickoffAt: "2026-06-30T17:00:00Z", venueId: "v_att",      col: 9, rowStart: 3,  rowEnd: 5,  home: slot("2E"), away: slot("2I") },
  { matchNumber: 79, round: "R32", kickoffAt: "2026-07-01T01:00:00Z", venueId: "v_azteca",   col: 9, rowStart: 5,  rowEnd: 7,  home: slot("1A"), away: slot("3CEFHI") },
  { matchNumber: 80, round: "R32", kickoffAt: "2026-07-01T16:00:00Z", venueId: "v_mercedes", col: 9, rowStart: 7,  rowEnd: 9,  home: slot("1L"), away: slot("3EHIJK") },
  { matchNumber: 86, round: "R32", kickoffAt: "2026-07-03T22:00:00Z", venueId: "v_hardrock", col: 9, rowStart: 9,  rowEnd: 11, home: slot("1J"), away: slot("2H") },
  { matchNumber: 88, round: "R32", kickoffAt: "2026-07-03T18:00:00Z", venueId: "v_att",      col: 9, rowStart: 11, rowEnd: 13, home: slot("2D"), away: slot("2G") },
  { matchNumber: 85, round: "R32", kickoffAt: "2026-07-03T03:00:00Z", venueId: "v_bcplace",  col: 9, rowStart: 13, rowEnd: 15, home: slot("1B"), away: slot("3EFGIJ") },
  { matchNumber: 87, round: "R32", kickoffAt: "2026-07-04T01:30:00Z", venueId: "v_arrowhead", col: 9, rowStart: 15, rowEnd: 17, home: slot("1K"), away: slot("3DEIJL") },
];

export type ResolvedTeam = {
  teamId: string;
  name: string;
  shortName: string;
  flagEmoji: string;
  accentColor: string;
};

export type ResolvedSlot =
  | { resolved: true; team: ResolvedTeam }
  | { resolved: false; label: string };

export type BracketVenue = {
  name: string;
  city: string;
};

export type BracketCell = {
  matchNumber: number;
  round: BracketRound;
  kickoffAt: Date;
  venue: BracketVenue | null;
  col: number;
  rowStart: number;
  rowEnd: number;
  matchId: string | null;
  status: "TBD" | "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";
  home: ResolvedSlot;
  away: ResolvedSlot;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
};

function slotToLabel(s: Slot): string {
  switch (s.kind) {
    case "group-position":
      return `${s.pos}${s.groupCode}`;
    case "third-place-pool":
      return `3${s.candidates.join("")}`;
    case "match-winner":
      return `W${s.matchNumber}`;
    case "match-runner-up":
      return `RU${s.matchNumber}`;
  }
}

function winnerOf(m: { homeTeamId: string; awayTeamId: string; homeScore: number | null; awayScore: number | null; homePenalties: number | null; awayPenalties: number | null }): string | null {
  const hs = m.homeScore ?? 0;
  const as = m.awayScore ?? 0;
  if (hs > as) return m.homeTeamId;
  if (as > hs) return m.awayTeamId;
  const hp = m.homePenalties ?? 0;
  const ap = m.awayPenalties ?? 0;
  if (hp > ap) return m.homeTeamId;
  if (ap > hp) return m.awayTeamId;
  return null;
}

function loserOf(m: { homeTeamId: string; awayTeamId: string; homeScore: number | null; awayScore: number | null; homePenalties: number | null; awayPenalties: number | null }): string | null {
  const w = winnerOf(m);
  if (!w) return null;
  return w === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
}

type RealMatch = {
  id: string;
  status: BracketCell["status"];
  kickoffAt: Date;
  venueId: string | null;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
};

type Ctx = {
  teamById: Map<string, ResolvedTeam>;
  venueById: Map<string, BracketVenue>;
  matchByNumber: Map<number, RealMatch>;
  standings: Awaited<ReturnType<typeof computeStandings>>;
  groupFinished: Map<string, number>;
};

function resolveSlot(s: Slot, ctx: Ctx): ResolvedSlot {
  switch (s.kind) {
    case "group-position": {
      const group = ctx.standings.find((g) => g.code === s.groupCode);
      if (!group) return { resolved: false, label: slotToLabel(s) };
      const finished = ctx.groupFinished.get(s.groupCode) ?? 0;
      if (finished < 6) return { resolved: false, label: slotToLabel(s) };
      const row = group.rows[s.pos - 1];
      if (!row) return { resolved: false, label: slotToLabel(s) };
      const team = ctx.teamById.get(row.teamId);
      if (!team) return { resolved: false, label: slotToLabel(s) };
      return { resolved: true, team };
    }
    case "third-place-pool":
      return { resolved: false, label: slotToLabel(s) };
    case "match-winner": {
      const m = ctx.matchByNumber.get(s.matchNumber);
      if (!m || m.status !== "FINISHED") return { resolved: false, label: slotToLabel(s) };
      const wid = winnerOf(m);
      if (!wid) return { resolved: false, label: slotToLabel(s) };
      const team = ctx.teamById.get(wid);
      return team ? { resolved: true, team } : { resolved: false, label: slotToLabel(s) };
    }
    case "match-runner-up": {
      const m = ctx.matchByNumber.get(s.matchNumber);
      if (!m || m.status !== "FINISHED") return { resolved: false, label: slotToLabel(s) };
      const lid = loserOf(m);
      if (!lid) return { resolved: false, label: slotToLabel(s) };
      const team = ctx.teamById.get(lid);
      return team ? { resolved: true, team } : { resolved: false, label: slotToLabel(s) };
    }
  }
}

/**
 * How many distinct teams currently have a slot in the bracket. Used to gate
 * the public /bracket page: free users see it unblurred while populated <= 4,
 * then see a paywall once it crosses to 5+.
 */
export function countPopulatedTeams(cells: BracketCell[]): number {
  const ids = new Set<string>();
  for (const cell of cells) {
    if (cell.home.resolved) ids.add(cell.home.team.teamId);
    if (cell.away.resolved) ids.add(cell.away.team.teamId);
  }
  return ids.size;
}

export async function computeBracket(): Promise<BracketCell[]> {
  const [teams, venues, groupMatches, knockoutMatches, standings] = await Promise.all([
    prisma.team.findMany(),
    prisma.venue.findMany(),
    prisma.match.findMany({
      where: { stage: "GROUP" },
      select: { groupCode: true, status: true },
    }),
    prisma.match.findMany({
      where: { matchNumber: { gte: 73 } },
      select: {
        id: true,
        matchNumber: true,
        status: true,
        kickoffAt: true,
        venueId: true,
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        homePenalties: true,
        awayPenalties: true,
      },
    }),
    computeStandings(),
  ]);

  const teamById = new Map<string, ResolvedTeam>();
  for (const t of teams) {
    teamById.set(t.id, {
      teamId: t.id,
      name: t.name,
      shortName: t.shortName,
      flagEmoji: t.flagEmoji,
      accentColor: t.accentColor,
    });
  }

  const venueById = new Map<string, BracketVenue>();
  for (const v of venues) {
    venueById.set(v.id, { name: v.name, city: v.city });
  }

  const matchByNumber = new Map<number, RealMatch>();
  for (const m of knockoutMatches) {
    matchByNumber.set(m.matchNumber, m);
  }

  const groupFinished = new Map<string, number>();
  for (const m of groupMatches) {
    if (m.status === "FINISHED" && m.groupCode) {
      groupFinished.set(m.groupCode, (groupFinished.get(m.groupCode) ?? 0) + 1);
    }
  }

  const ctx: Ctx = { teamById, venueById, matchByNumber, standings, groupFinished };

  return LAYOUT.map<BracketCell>((node) => {
    const real = matchByNumber.get(node.matchNumber);
    const venueId = real?.venueId ?? node.venueId;
    const venue = venueById.get(venueId) ?? null;

    if (real) {
      const homeTeam = teamById.get(real.homeTeamId);
      const awayTeam = teamById.get(real.awayTeamId);
      return {
        matchNumber: node.matchNumber,
        round: node.round,
        kickoffAt: real.kickoffAt,
        venue,
        col: node.col,
        rowStart: node.rowStart,
        rowEnd: node.rowEnd,
        matchId: real.id,
        status: real.status,
        home: homeTeam
          ? { resolved: true, team: homeTeam }
          : { resolved: false, label: slotToLabel(node.home) },
        away: awayTeam
          ? { resolved: true, team: awayTeam }
          : { resolved: false, label: slotToLabel(node.away) },
        homeScore: real.homeScore,
        awayScore: real.awayScore,
        homePenalties: real.homePenalties,
        awayPenalties: real.awayPenalties,
      };
    }
    return {
      matchNumber: node.matchNumber,
      round: node.round,
      kickoffAt: new Date(node.kickoffAt),
      venue,
      col: node.col,
      rowStart: node.rowStart,
      rowEnd: node.rowEnd,
      matchId: null,
      status: "TBD",
      home: resolveSlot(node.home, ctx),
      away: resolveSlot(node.away, ctx),
      homeScore: null,
      awayScore: null,
      homePenalties: null,
      awayPenalties: null,
    };
  });
}
