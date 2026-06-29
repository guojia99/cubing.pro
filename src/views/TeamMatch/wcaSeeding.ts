import type { WCAResult } from '@/services/cubing-pro/wca/types';

/** WCA API 成绩为百分之一秒，转为秒 */
export function wcaCentisecondsToSeconds(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n / 100;
}

export function pickBestForEvent(
  results: WCAResult[],
  eventId: string,
): { single: number | null; average: number | null } {
  const rows = results.filter((r) => r.event_id === eventId);
  if (!rows.length) return { single: null, average: null };
  let bestS = Infinity;
  let bestA = Infinity;
  for (const row of rows) {
    if (row.best > 0 && row.best < bestS) bestS = row.best;
    if (row.average > 0 && row.average < bestA) bestA = row.average;
  }
  return {
    single: bestS === Infinity ? null : wcaCentisecondsToSeconds(bestS),
    average: bestA === Infinity ? null : wcaCentisecondsToSeconds(bestA),
  };
}
