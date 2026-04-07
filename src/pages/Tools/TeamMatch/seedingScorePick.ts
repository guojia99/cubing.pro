import type {
  SeedingAdoptStrategy,
  SeedingEntryPreliminary,
  SeedingEntrySnapshot,
  SeedingScoreSource,
} from '@/pages/Tools/TeamMatch/types';

function rankAvg(v: number | 'DNF' | null | undefined): number {
  if (v === null || v === undefined) return Infinity;
  if (v === 'DNF') return Infinity;
  return v;
}

function rankSingle(v: number | 'DNF' | null | undefined): number {
  if (v === null || v === undefined) return Infinity;
  if (v === 'DNF') return Infinity;
  return v;
}

type Cand = {
  source: SeedingScoreSource;
  single: number | 'DNF' | null;
  average: number | 'DNF' | null;
};

/** 以最佳平均为准；若均无数值平均则退化为比较单次 */
export function pickBestByAverage(
  wca: SeedingEntrySnapshot | null | undefined,
  one: SeedingEntrySnapshot | null | undefined,
  pre: SeedingEntryPreliminary | null | undefined,
): { source: SeedingScoreSource; single: number | 'DNF' | null; average: number | 'DNF' | null } | null {
  const cands: Cand[] = [];
  if (wca && (wca.single !== null || wca.average !== null)) {
    cands.push({
      source: 'wca',
      single: wca.single,
      average: wca.average === null ? null : wca.average,
    });
  }
  if (one && (one.single !== null || one.average !== null)) {
    cands.push({
      source: 'one',
      single: one.single,
      average: one.average === null ? null : one.average,
    });
  }
  if (pre && (pre.single !== null || pre.average !== null)) {
    cands.push({
      source: 'preliminary',
      single: pre.single,
      average: pre.average,
    });
  }
  if (cands.length === 0) return null;

  const hasNumericAvg = cands.some((c) => typeof c.average === 'number');
  const pool = hasNumericAvg ? cands.filter((c) => typeof c.average === 'number') : cands;

  pool.sort((a, b) => {
    const ca = hasNumericAvg ? rankAvg(a.average) : rankSingle(a.single);
    const cb = hasNumericAvg ? rankAvg(b.average) : rankSingle(b.single);
    if (ca !== cb) return ca - cb;
    return rankSingle(a.single) - rankSingle(b.single);
  });

  return pool[0];
}

/** 按策略从初赛 / WCA / One 快照得到正式单次与平均；`manual` 返回 null（保留现有手填） */
export function resolveOfficialScores(
  strategy: SeedingAdoptStrategy,
  wca: SeedingEntrySnapshot | null | undefined,
  one: SeedingEntrySnapshot | null | undefined,
  pre: SeedingEntryPreliminary | null | undefined,
): { single: number | 'DNF' | null; average: number | 'DNF' | null; activeSource: SeedingScoreSource } | null {
  if (strategy === 'manual') return null;
  if (strategy === 'best_average') {
    const p = pickBestByAverage(wca, one, pre);
    return p ? { single: p.single, average: p.average, activeSource: p.source } : null;
  }
  if (strategy === 'preliminary') {
    if (!pre) return null;
    return { single: pre.single, average: pre.average, activeSource: 'preliminary' };
  }
  if (strategy === 'wca') {
    if (!wca || (wca.single === null && wca.average === null)) return null;
    return { single: wca.single, average: wca.average, activeSource: 'wca' };
  }
  if (strategy === 'one') {
    if (!one || (one.single === null && one.average === null)) return null;
    return { single: one.single, average: one.average, activeSource: 'one' };
  }
  return null;
}

export const SEEDING_SOURCE_LABEL: Record<SeedingScoreSource, string> = {
  wca: 'WCA',
  one: 'One',
  preliminary: '初赛',
  manual: '手填',
};

/** 表格行内跟在成绩后的「」短标签（手动 / wca / one / 初赛） */
export const SEEDING_SOURCE_INLINE: Record<SeedingScoreSource, string> = {
  manual: '手动',
  wca: 'wca',
  one: 'one',
  preliminary: '初赛',
};
