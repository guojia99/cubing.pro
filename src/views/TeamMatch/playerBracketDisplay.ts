import type { Player, School, SeedingEntry } from '@/views/TeamMatch/types';
import { tm, type TeamMatchLocale } from './i18n';

export function fmtSeedingVal(v: number | 'DNF' | null | undefined): string {
  if (v === 'DNF') return 'DNF';
  if (v === null || v === undefined) return '—';
  return String(v);
}

export function seedingEntryForPlayer(
  seeding: SeedingEntry[],
  playerId: string,
  eventId: string,
): SeedingEntry | undefined {
  return seeding.find((e) => e.playerId === playerId && e.eventId === eventId);
}

/** 当前项目下正式录入的「最佳」单次 / 平均（与成绩录入表一致） */
export function formatPlayerSingleAverageLine(entry: SeedingEntry | undefined, locale: TeamMatchLocale = 'zh-CN'): string {
  return tm(locale, 'teamMatch.scoreLine', { single: fmtSeedingVal(entry?.single), average: fmtSeedingVal(entry?.average) });
}

export function schoolNameForPlayer(player: Player | undefined, schools: School[]): string {
  if (!player) return '—';
  return schools.find((s) => s.id === player.schoolId)?.name ?? '—';
}
