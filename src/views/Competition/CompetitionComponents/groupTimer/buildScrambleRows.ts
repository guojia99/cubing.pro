import { eventRouteM } from '@/components/Data/cube_result/event_route';
import type { CompAPI } from '@/services/cubing-pro/comps/typings';
import type { EventsAPI } from '@/services/cubing-pro/events/typings';
import {
  formatTimerSingleBlob,
  isMbfEventId,
  isRelayMetaEvent,
  parseScramblePuzzleIds,
  resolveStructuredSegments,
} from '../scrambleSegments';
import type { ScrambleRow } from './types';

/**
 * 与 CompetitionScrambles 展示规则一致；连拧/多盲在计时器内合并为「一把」一行（正文含多段）。
 */
export function buildScrambleRowsForGroup(
  ssc: string[],
  ev: CompAPI.Event,
  baseEvent: EventsAPI.Event,
): ScrambleRow[] | 'skip' {
  const m = eventRouteM(ev.EventRoute);
  const puzzleIds = parseScramblePuzzleIds(baseEvent.scrambleValue);
  const isMbf = isMbfEventId(ev.EventID);
  const isRelay = isRelayMetaEvent(baseEvent);

  if ((isRelay || isMbf) && puzzleIds.length >= 2) {
    const { segments, fallbackBlob } = resolveStructuredSegments(ssc, puzzleIds);
    if (segments && segments.length === puzzleIds.length) {
      const scramble = formatTimerSingleBlob(segments, puzzleIds, isMbf);
      return [
        {
          lineIndex: 0,
          indexLabel: isMbf ? '多盲' : '连拧',
          scramble,
          puzzleIdForImage: baseEvent.puzzleId,
          isExtra: false,
        },
      ];
    }
    if (fallbackBlob) {
      return [
        {
          lineIndex: 0,
          indexLabel: isMbf ? '多盲' : '连拧',
          scramble: fallbackBlob,
          puzzleIdForImage: baseEvent.puzzleId,
          isExtra: false,
        },
      ];
    }
  }

  if (isMbf && puzzleIds.length < 2 && ssc.length >= 2) {
    const scramble = ssc.map((s, i) => `#${i + 1}\n${s}`).join('\n\n');
    return [
      {
        lineIndex: 0,
        indexLabel: '多盲',
        scramble,
        puzzleIdForImage: baseEvent.puzzleId,
        isExtra: false,
      },
    ];
  }

  const tb: { indexLabel: string; scramble: string; puzzleIdForImage: string }[] = [];

  if (m.repeatedly) {
    for (let evIdx = 0; evIdx < ssc.length; evIdx++) {
      tb.push({
        indexLabel: '#' + (evIdx + 1),
        scramble: ssc[evIdx],
        puzzleIdForImage: baseEvent.puzzleId,
      });
    }
  } else if (puzzleIds.length >= 2) {
    if (puzzleIds.length !== ssc.length) {
      return 'skip';
    }
    for (let evIdx = 0; evIdx < puzzleIds.length; evIdx++) {
      tb.push({
        indexLabel: puzzleIds[evIdx],
        scramble: ssc[evIdx],
        puzzleIdForImage: puzzleIds[evIdx],
      });
    }
  }

  if (tb.length === 0) {
    let extNum = 1;
    for (let evIdx = 0; evIdx < ssc.length; evIdx++) {
      let indexStr = '#' + (evIdx + 1);
      if (evIdx + 1 > m.rounds) {
        indexStr = 'Ex#' + extNum;
        extNum += 1;
      }
      tb.push({
        indexLabel: indexStr,
        scramble: ssc[evIdx],
        puzzleIdForImage: baseEvent.puzzleId,
      });
    }
  }

  return tb.map((row, lineIndex) => ({
    lineIndex,
    indexLabel: row.indexLabel,
    scramble: row.scramble,
    puzzleIdForImage: row.puzzleIdForImage,
    isExtra: row.indexLabel.indexOf('Ex') !== -1,
  }));
}

/** 一轮内「主赛程」行下标（不含 Ex）；多轮多次等取 route.rounds 把 */
export function getMainLineIndices(rows: ScrambleRow[], ev: CompAPI.Event): number[] {
  const m = eventRouteM(ev.EventRoute);
  const nonEx = rows.map((r, i) => ({ r, i })).filter((x) => !x.r.isExtra);

  if (m.repeatedly) {
    const cap = Math.min(m.rounds, nonEx.length);
    return nonEx.slice(0, cap).map((x) => x.i);
  }

  return nonEx.map((x) => x.i);
}

/** 备打乱列表（Ex#） */
export function getExtraRows(rows: ScrambleRow[]): ScrambleRow[] {
  return rows.filter((r) => r.isExtra);
}
