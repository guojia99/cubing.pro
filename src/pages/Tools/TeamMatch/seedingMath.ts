import type { Player, SeedingEntry, SeedingPrimary, Team } from '@/pages/Tools/TeamMatch/types';
import { BRACKET_TEAM_COUNT, TEAM_PLAYERS } from '@/pages/Tools/TeamMatch/types';

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
  /** 若提供，仅在该名单内（仍按成绩顺序）取种子；用于正赛 16 强已确定时 */
  bracketPoolIds?: string[] | null,
): string[] {
  const active = teams.filter((t) => !t.disabled && t.playerIds.length === 3);
  const scored = active.map((t) => ({
    id: t.id,
    ...teamSeedingSum(t, players, seeding, eventId, primary),
  }));
  const valid = scored.filter((s) => s.valid).sort((a, b) => a.sum - b.sum);
  const invalid = scored.filter((s) => !s.valid);
  const ordered = [...valid, ...invalid];
  const poolSet = bracketPoolIds?.length ? new Set(bracketPoolIds) : null;
  const narrowed = poolSet ? ordered.filter((s) => poolSet.has(s.id)) : ordered;
  const pool = narrowed.slice(0, BRACKET_TEAM_COUNT);
  return pool.slice(0, 4).map((s) => s.id);
}

/**
 * 队伍列表排序用：满编队优先；满编队内「主排序」非数字（缺成绩或 DNF）人数多的排后；
 * 其余按有效数字成绩之和升序（越小越好）。
 */
export function teamSeedingSortMeta(
  team: Team,
  _players: Player[],
  seeding: SeedingEntry[],
  eventId: string,
  primary: SeedingPrimary,
): { badSlotCount: number; sumNumeric: number; rosterOk: boolean } {
  const rosterOk = team.playerIds.length === TEAM_PLAYERS;
  let badSlotCount = 0;
  let sumNumeric = 0;
  for (const pid of team.playerIds) {
    const e = entryFor(seeding, pid, eventId);
    const v = valuePrimary(e, primary);
    if (typeof v === 'number') {
      sumNumeric += v;
    } else {
      badSlotCount += 1;
    }
  }
  return { badSlotCount, sumNumeric, rosterOk };
}

/** 与种子计算同一套规则：满编队按「缺有效成绩人数 → 成绩和」排序；未满编在中间段之后；已禁用最后 */
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
    ...teamSeedingSortMeta(t, players, seeding, eventId, primary),
  }));
  const fullRoster = withMeta.filter((x) => x.rosterOk);
  const incomplete = withMeta.filter((x) => !x.rosterOk);

  const cmpFull = (
    a: (typeof withMeta)[number],
    b: (typeof withMeta)[number],
  ): number => {
    if (a.badSlotCount !== b.badSlotCount) return a.badSlotCount - b.badSlotCount;
    if (a.sumNumeric !== b.sumNumeric) return a.sumNumeric - b.sumNumeric;
    return a.team.name.localeCompare(b.team.name, 'zh');
  };

  fullRoster.sort(cmpFull);
  incomplete.sort((a, b) => a.team.name.localeCompare(b.team.name, 'zh'));

  return [...fullRoster.map((x) => x.team), ...incomplete.map((x) => x.team), ...disabled];
}

/**
 * 正赛资格队 id（至多 {@link BRACKET_TEAM_COUNT} 支）：满编、未缺席，顺序与 {@link sortTeamsBySeedingRank} 一致。
 * 成绩更齐、合计更好的队在前；不足 16 支「三人皆有有效主排序成绩」时，按该顺序用缺成绩的满编队补足名额。
 */
export function rankedBracketTeamIds(
  teams: Team[],
  players: Player[],
  seeding: SeedingEntry[],
  eventId: string,
  primary: SeedingPrimary,
): string[] {
  const ordered = sortTeamsBySeedingRank(teams, players, seeding, eventId, primary);
  return ordered
    .filter((t) => !t.disabled && t.playerIds.length === TEAM_PLAYERS)
    .slice(0, BRACKET_TEAM_COUNT)
    .map((t) => t.id);
}

/** 满编、未禁用的全部队伍 id，顺序与 {@link sortTeamsBySeedingRank} 一致（不限 16） */
export function allRankedActiveTeamIds(
  teams: Team[],
  players: Player[],
  seeding: SeedingEntry[],
  eventId: string,
  primary: SeedingPrimary,
): string[] {
  return sortTeamsBySeedingRank(teams, players, seeding, eventId, primary)
    .filter((t) => !t.disabled && t.playerIds.length === TEAM_PLAYERS)
    .map((t) => t.id);
}
