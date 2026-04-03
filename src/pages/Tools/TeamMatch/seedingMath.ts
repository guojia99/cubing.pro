import type { Player, SeedingEntry, SeedingPrimary, Team } from '@/pages/Tools/TeamMatch/types';

function entryFor(
  seeding: SeedingEntry[],
  playerId: string,
  eventId: string,
): SeedingEntry | undefined {
  return seeding.find((e) => e.playerId === playerId && e.eventId === eventId);
}

function valuePrimary(
  e: SeedingEntry | undefined,
  primary: SeedingPrimary,
): number | 'DNF' | null {
  if (!e) return null;
  const v = primary === 'average' ? e.average : e.single;
  if (v === null || v === undefined) return null;
  return v;
}

/** 队伍种子排序用总分：三人 primary 之和；任一人 DNF 则整队视为无效（排后） */
export function teamSeedingSum(
  team: Team,
  players: Player[],
  seeding: SeedingEntry[],
  eventId: string,
  primary: SeedingPrimary,
): { sum: number; valid: boolean } {
  let sum = 0;
  for (const pid of team.playerIds) {
    const e = entryFor(seeding, pid, eventId);
    const v = valuePrimary(e, primary);
    if (v === null) return { sum: 0, valid: false };
    if (v === 'DNF') return { sum: 0, valid: false };
    sum += v;
  }
  if (team.playerIds.length !== 3) return { sum: 0, valid: false };
  return { sum, valid: true };
}

export function pickSeedTeamIds(
  teams: Team[],
  players: Player[],
  seeding: SeedingEntry[],
  eventId: string,
  primary: SeedingPrimary,
): string[] {
  const active = teams.filter((t) => !t.disabled && t.playerIds.length === 3);
  const scored = active.map((t) => ({
    id: t.id,
    ...teamSeedingSum(t, players, seeding, eventId, primary),
  }));
  const valid = scored.filter((s) => s.valid).sort((a, b) => a.sum - b.sum);
  const invalid = scored.filter((s) => !s.valid);
  const ordered = [...valid, ...invalid];
  return ordered.slice(0, 4).map((s) => s.id);
}

/** 与种子计算同一套规则：有效队按总分升序，无效在后；已禁用队伍排在最后 */
export function sortTeamsBySeedingRank(
  teams: Team[],
  players: Player[],
  seeding: SeedingEntry[],
  eventId: string,
  primary: SeedingPrimary,
): Team[] {
  const active = teams.filter((t) => !t.disabled);
  const disabled = teams.filter((t) => t.disabled);
  const withMeta = active.map((t) => ({
    team: t,
    ...teamSeedingSum(t, players, seeding, eventId, primary),
  }));
  const valid = withMeta.filter((x) => x.valid).sort((a, b) => a.sum - b.sum);
  const invalid = withMeta.filter((x) => !x.valid);
  return [...valid.map((x) => x.team), ...invalid.map((x) => x.team), ...disabled];
}
