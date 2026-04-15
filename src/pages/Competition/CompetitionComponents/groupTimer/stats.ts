import { eventRouteM } from '@/components/Data/cube_result/event_route';
import { secondTimeFormat } from '@/pages/WCA/utils/wca_results';
import type { SolveRecord } from './types';

/** 应用 +2 后的毫秒（DNF 返回 null） */
export function effectiveTimeMs(rec: SolveRecord): number | null {
  if (rec.dns || rec.dnf || rec.timeMs === null) {
    return null;
  }
  return rec.plus2 ? rec.timeMs + 2000 : rec.timeMs;
}

export function formatMsForDisplay(ms: number, eventId: string): string {
  const sec = ms / 1000;
  if (eventId === '333mbf') {
    return secondTimeFormat(sec, true);
  }
  return secondTimeFormat(sec, false);
}

/** 短格式 x.xx 与 冒号格式 */
export function formatDualTimes(ms: number, eventId: string): { short: string; colon: string } {
  const sec = ms / 1000;
  const colon = secondTimeFormat(sec, eventId === '333mbf');
  let short: string;
  if (sec < 60) {
    short = sec.toFixed(2);
  } else {
    short = colon;
  }
  return { short, colon };
}

/**
 * 本轮（同一 scheduleIdx）内最佳
 */
export function roundBestMs(
  records: { lineIndex: number; rec: SolveRecord }[],
  eventId: string,
): number | null {
  let best: number | null = null;
  for (const { rec } of records) {
    if (eventId === '333mbf' && rec.mbf) {
      const t = rec.timeMs;
      if (t === null || rec.dnf || rec.dns) {
        continue;
      }
      if (best === null || t < best) {
        best = t;
      }
      continue;
    }
    const t = effectiveTimeMs(rec);
    if (t === null) {
      continue;
    }
    if (best === null || t < best) {
      best = t;
    }
  }
  return best;
}

/**
 * 全场比赛该项目：所有主赛程成绩聚合成一个平均（按 base_route_typ 去头尾等）
 */
export function eventCompetitionAverage(
  timesMs: number[],
  route: ReturnType<typeof eventRouteM>,
  integer?: boolean,
): string | null {
  const valid = timesMs.filter((t) => t > 0);
  if (valid.length === 0) {
    return null;
  }

  const h = route.headToTailNum ?? 0;
  let work = [...valid].sort((a, b) => a - b);

  if (h > 0 && work.length >= 2 * h + 1) {
    work = work.slice(h, work.length - h);
  }

  if (work.length === 0) {
    return null;
  }

  const sum = work.reduce((a, b) => a + b, 0);
  const avg = sum / work.length;
  if (integer) {
    return (Math.round((avg / 1000) * 100) / 100).toFixed(2);
  }
  return secondTimeFormat(avg / 1000, false);
}
