import { fetchOneUserGrades, pickBestOneGradeForEvent } from '@/pages/Tools/TeamMatch/oneGradeApi';
import { resolveOfficialScores } from '@/pages/Tools/TeamMatch/seedingScorePick';
import type { SeedingAdoptStrategy, SeedingEntry, TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { throttleBeforeWcaResultsRequest } from '@/pages/Tools/TeamMatch/wcaRequestThrottle';
import { pickBestForEvent } from '@/pages/Tools/TeamMatch/wcaSeeding';
import { getWCAPersonResults } from '@/services/cubing-pro/wca/player';

function defaultEntry(playerId: string, eventId: string): SeedingEntry {
  return {
    playerId,
    eventId,
    single: null,
    average: null,
    wcaBest: null,
    oneBest: null,
    preliminary: null,
    adoptStrategy: undefined,
  };
}

export function canBulkFillSeeding(session: TeamMatchSession): boolean {
  return session.players.some(
    (p) =>
      (p.wcaId?.length === 10) || !!(p.oneId?.trim() && /^\d+$/.test(p.oneId.trim())),
  );
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    const e = new Error('Aborted');
    e.name = 'AbortError';
    throw e;
  }
}

/** 线性拉取 WCA / One，合并为一条 seeding；`onProgress` 传入 0–100；`signal` 中止时抛出 `AbortError` */
export async function bulkFillSeedingScores(
  session: TeamMatchSession,
  eventIds: string[],
  onProgress: (percent: number) => void,
  options?: { signal?: AbortSignal },
): Promise<SeedingEntry[]> {
  const signal = options?.signal;
  const players = session.players;
  const map = new Map<string, SeedingEntry>(
    session.seeding.map((e) => [`${e.playerId}:${e.eventId}`, e] as [string, SeedingEntry]),
  );

  let totalOps = 0;
  for (const ev of eventIds) {
    for (const p of players) {
      if (p.wcaId?.length === 10) totalOps += 1;
      if (p.oneId?.trim() && /^\d+$/.test(p.oneId.trim())) totalOps += 1;
    }
  }

  if (totalOps === 0) {
    onProgress(0);
    throwIfAborted(signal);
    return [...map.values()];
  }

  let done = 0;
  const bump = () => {
    done += 1;
    onProgress(Math.min(100, Math.round((done / totalOps) * 100)));
  };

  for (const ev of eventIds) {
    for (const p of players) {
      throwIfAborted(signal);
      const k = `${p.id}:${ev}`;
      const base = map.get(k) ?? defaultEntry(p.id, ev);

      let wcaBest = base.wcaBest ?? null;
      let oneBest = base.oneBest ?? null;
      const preliminary =
        base.preliminary ?? { single: base.single, average: base.average };

      if (p.wcaId?.length === 10) {
        try {
          await throttleBeforeWcaResultsRequest();
          throwIfAborted(signal);
          const res = await getWCAPersonResults(p.wcaId);
          throwIfAborted(signal);
          const b = pickBestForEvent(res, ev);
          wcaBest = { single: b.single, average: b.average };
        } catch (e) {
          if ((e as Error).name === 'AbortError') throw e;
          /* 网络或 API 失败时跳过本条拉取 */
        }
        bump();
      }

      if (p.oneId?.trim() && /^\d+$/.test(p.oneId.trim())) {
        try {
          const rows = await fetchOneUserGrades(p.oneId.trim());
          throwIfAborted(signal);
          const b = pickBestOneGradeForEvent(rows, ev);
          oneBest = { single: b.single, average: b.average };
        } catch (e) {
          if ((e as Error).name === 'AbortError') throw e;
          /* CORS / 网络 */
        }
        bump();
      }

      const strategy: SeedingAdoptStrategy = base.adoptStrategy ?? 'best_average';
      const next: SeedingEntry = {
        ...base,
        playerId: p.id,
        eventId: ev,
        wcaBest,
        oneBest,
        preliminary,
        adoptStrategy: strategy,
      };
      if (strategy === 'manual') {
        /* 仅更新快照，不覆盖手填正式成绩 */
      } else {
        const resolved = resolveOfficialScores(strategy, wcaBest, oneBest, preliminary);
        if (resolved) {
          next.single = resolved.single;
          next.average = resolved.average;
          next.activeSource = resolved.activeSource;
        }
      }
      map.set(k, next);
    }
  }

  onProgress(100);
  return [...map.values()].filter(
    (e) => players.some((pl) => pl.id === e.playerId) && eventIds.includes(e.eventId),
  );
}
