import { prisma } from "@/server/db";

export type StandingRow = {
  teamId: string;
  teamName: string;
  flagEmoji: string;
  groupCode: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type Group = {
  code: string;
  rows: StandingRow[];
};

/**
 * Computes group-stage standings from FINISHED matches. Teams with no group
 * stage matches yet appear with zeros so the table is always shaped 4×N.
 */
export async function computeStandings(): Promise<Group[]> {
  const teams = await prisma.team.findMany({
    where: { groupCode: { not: null } },
    orderBy: [{ groupCode: "asc" }, { name: "asc" }],
  });

  const matches = await prisma.match.findMany({
    where: { stage: "GROUP", status: "FINISHED" },
  });

  const byId = new Map<string, StandingRow>();
  for (const t of teams) {
    byId.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      flagEmoji: t.flagEmoji,
      groupCode: t.groupCode ?? "?",
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const m of matches) {
    const h = byId.get(m.homeTeamId);
    const a = byId.get(m.awayTeamId);
    if (!h || !a) continue;
    const hs = m.homeScore ?? 0;
    const as = m.awayScore ?? 0;

    h.played += 1;
    a.played += 1;
    h.goalsFor += hs;
    h.goalsAgainst += as;
    a.goalsFor += as;
    a.goalsAgainst += hs;

    if (hs > as) {
      h.won += 1; h.points += 3;
      a.lost += 1;
    } else if (hs < as) {
      a.won += 1; a.points += 3;
      h.lost += 1;
    } else {
      h.drawn += 1; h.points += 1;
      a.drawn += 1; a.points += 1;
    }
  }

  for (const row of byId.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  const groups = new Map<string, StandingRow[]>();
  for (const row of byId.values()) {
    const list = groups.get(row.groupCode) ?? [];
    list.push(row);
    groups.set(row.groupCode, list);
  }

  const sorted: Group[] = [];
  for (const [code, rows] of [...groups.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.teamName.localeCompare(b.teamName)
    );
    sorted.push({ code, rows });
  }
  return sorted;
}
