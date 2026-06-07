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

// The 9-column horizontal bracket. col 1 is leftmost R32, col 9 is rightmost R32.
// Rows are 1..16. R32 cells span 2 rows; R16 span 4; QF span 8; SF/Final/3rd span various.
const LAYOUT: LayoutNode[] = [
  // ─── Left R32 (col 1) ───
  { matchNumber: 74, round: "R32", kickoffAt: "2026-06-29T19:30:00Z", col: 1, rowStart: 1,  rowEnd: 3,  home: slot("1E"), away: slot("3ABCDF") },
  { matchNumber: 77, round: "R32", kickoffAt: "2026-06-30T20:00:00Z", col: 1, rowStart: 3,  rowEnd: 5,  home: slot("1I"), away: slot("3CDFGH") },
  { matchNumber: 73, round: "R32", kickoffAt: "2026-06-28T18:00:00Z", col: 1, rowStart: 5,  rowEnd: 7,  home: slot("2A"), away: slot("2B") },
  { matchNumber: 75, round: "R32", kickoffAt: "2026-06-30T00:00:00Z", col: 1, rowStart: 7,  rowEnd: 9,  home: slot("1F"), away: slot("2C") },
  { matchNumber: 83, round: "R32", kickoffAt: "2026-07-02T22:00:00Z", col: 1, rowStart: 9,  rowEnd: 11, home: slot("2K"), away: slot("2L") },
  { matchNumber: 84, round: "R32", kickoffAt: "2026-07-02T18:00:00Z", col: 1, rowStart: 11, rowEnd: 13, home: slot("1H"), away: slot("2J") },
  { matchNumber: 81, round: "R32", kickoffAt: "2026-07-01T23:00:00Z", col: 1, rowStart: 13, rowEnd: 15, home: slot("1D"), away: slot("3BEFIJ") },
  { matchNumber: 82, round: "R32", kickoffAt: "2026-07-01T19:00:00Z", col: 1, rowStart: 15, rowEnd: 17, home: slot("1G"), away: slot("3AEHIJ") },

  // ─── Left R16 (col 2) ───
  { matchNumber: 89, round: "R16", kickoffAt: "2026-07-04T20:00:00Z", col: 2, rowStart: 2,  rowEnd: 4,  home: slot("W74"), away: slot("W77") },
  { matchNumber: 90, round: "R16", kickoffAt: "2026-07-04T16:00:00Z", col: 2, rowStart: 6,  rowEnd: 8,  home: slot("W73"), away: slot("W75") },
  { matchNumber: 93, round: "R16", kickoffAt: "2026-07-06T18:00:00Z", col: 2, rowStart: 10, rowEnd: 12, home: slot("W83"), away: slot("W84") },
  { matchNumber: 94, round: "R16", kickoffAt: "2026-07-06T23:00:00Z", col: 2, rowStart: 14, rowEnd: 16, home: slot("W81"), away: slot("W82") },

  // ─── Left QF (col 3) ───
  { matchNumber: 97, round: "QF",  kickoffAt: "2026-07-09T19:00:00Z", col: 3, rowStart: 3,  rowEnd: 7,  home: slot("W89"), away: slot("W90") },
  { matchNumber: 98, round: "QF",  kickoffAt: "2026-07-10T18:00:00Z", col: 3, rowStart: 11, rowEnd: 15, home: slot("W93"), away: slot("W94") },

  // ─── Left SF (col 4) ───
  { matchNumber: 101, round: "SF", kickoffAt: "2026-07-14T18:00:00Z", col: 4, rowStart: 7,  rowEnd: 11, home: slot("W97"), away: slot("W98") },

  // ─── Center column (col 5) — Final + 3rd place ───
  { matchNumber: 104, round: "FINAL",       kickoffAt: "2026-07-19T18:00:00Z", col: 5, rowStart: 5,  rowEnd: 8,  home: slot("W101"),  away: slot("W102") },
  { matchNumber: 103, round: "THIRD_PLACE", kickoffAt: "2026-07-18T20:00:00Z", col: 5, rowStart: 10, rowEnd: 13, home: slot("RU101"), away: slot("RU102") },

  // ─── Right SF (col 6) ───
  { matchNumber: 102, round: "SF", kickoffAt: "2026-07-15T18:00:00Z", col: 6, rowStart: 7,  rowEnd: 11, home: slot("W99"), away: slot("W100") },

  // ─── Right QF (col 7) ───
  { matchNumber: 99,  round: "QF",  kickoffAt: "2026-07-11T20:00:00Z", col: 7, rowStart: 3,  rowEnd: 7,  home: slot("W91"), away: slot("W92") },
  { matchNumber: 100, round: "QF",  kickoffAt: "2026-07-12T00:00:00Z", col: 7, rowStart: 11, rowEnd: 15, home: slot("W95"), away: slot("W96") },

  // ─── Right R16 (col 8) ───
  { matchNumber: 91, round: "R16", kickoffAt: "2026-07-05T19:00:00Z", col: 8, rowStart: 2,  rowEnd: 4,  home: slot("W76"), away: slot("W78") },
  { matchNumber: 92, round: "R16", kickoffAt: "2026-07-05T23:00:00Z", col: 8, rowStart: 6,  rowEnd: 8,  home: slot("W79"), away: slot("W80") },
  { matchNumber: 95, round: "R16", kickoffAt: "2026-07-07T15:00:00Z", col: 8, rowStart: 10, rowEnd: 12, home: slot("W86"), away: slot("W88") },
  { matchNumber: 96, round: "R16", kickoffAt: "2026-07-07T19:00:00Z", col: 8, rowStart: 14, rowEnd: 16, home: slot("W85"), away: slot("W87") },

  // ─── Right R32 (col 9) ───
  { matchNumber: 76, round: "R32", kickoffAt: "2026-06-29T16:00:00Z", col: 9, rowStart: 1,  rowEnd: 3,  home: slot("1C"), away: slot("2F") },
  { matchNumber: 78, round: "R32", kickoffAt: "2026-06-30T16:00:00Z", col: 9, rowStart: 3,  rowEnd: 5,  home: slot("2E"), away: slot("2I") },
  { matchNumber: 79, round: "R32", kickoffAt: "2026-07-01T00:00:00Z", col: 9, rowStart: 5,  rowEnd: 7,  home: slot("1A"), away: slot("3CEFHI") },
  { matchNumber: 80, round: "R32", kickoffAt: "2026-07-01T15:00:00Z", col: 9, rowStart: 7,  rowEnd: 9,  home: slot("1L"), away: slot("3EHIJK") },
  { matchNumber: 86, round: "R32", kickoffAt: "2026-07-03T21:00:00Z", col: 9, rowStart: 9,  rowEnd: 11, home: slot("1J"), away: slot("2H") },
  { matchNumber: 88, round: "R32", kickoffAt: "2026-07-03T17:00:00Z", col: 9, rowStart: 11, rowEnd: 13, home: slot("2D"), away: slot("2G") },
  { matchNumber: 85, round: "R32", kickoffAt: "2026-07-03T02:00:00Z", col: 9, rowStart: 13, rowEnd: 15, home: slot("1B"), away: slot("3EFGIJ") },
  { matchNumber: 87, round: "R32", kickoffAt: "2026-07-04T00:30:00Z", col: 9, rowStart: 15, rowEnd: 17, home: slot("1K"), away: slot("3DEIJL") },
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

export type BracketCell = {
  matchNumber: number;
  round: BracketRound;
  kickoffAt: Date;
  col: number;
  rowStart: number;
  rowEnd: number;
  // null id means the Match row hasn't been created in /admin/matches yet.
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

type Ctx = {
  teamById: Map<string, ResolvedTeam>;
  matchByNumber: Map<number, {
    id: string;
    status: BracketCell["status"];
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
    homePenalties: number | null;
    awayPenalties: number | null;
  }>;
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

export async function computeBracket(): Promise<BracketCell[]> {
  const [teams, groupMatches, knockoutMatches, standings] = await Promise.all([
    prisma.team.findMany(),
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

  const matchByNumber = new Map<number, Ctx["matchByNumber"] extends Map<number, infer V> ? V : never>();
  for (const m of knockoutMatches) {
    matchByNumber.set(m.matchNumber, {
      id: m.id,
      status: m.status,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homePenalties: m.homePenalties,
      awayPenalties: m.awayPenalties,
    });
  }

  const groupFinished = new Map<string, number>();
  for (const m of groupMatches) {
    if (m.status === "FINISHED" && m.groupCode) {
      groupFinished.set(m.groupCode, (groupFinished.get(m.groupCode) ?? 0) + 1);
    }
  }

  const ctx: Ctx = { teamById, matchByNumber, standings, groupFinished };

  return LAYOUT.map<BracketCell>((node) => {
    const real = matchByNumber.get(node.matchNumber);
    if (real) {
      const homeTeam = teamById.get(real.homeTeamId);
      const awayTeam = teamById.get(real.awayTeamId);
      return {
        matchNumber: node.matchNumber,
        round: node.round,
        kickoffAt: new Date(node.kickoffAt),
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
