import { secondTimeFormat } from '@/pages/WCA/utils/wca_results';
import { getMainIndicesForRound, getRoundExportNumber } from './navigation';
import { effectiveTimeMs, formatDualTimes } from './stats';
import type { EventContext } from './types';
import { makeSlotKey } from './types';
import type { SolveRecord } from './types';

function parseExportRoundKey(k: string): { eid: string; scheduleIdx: number } | null {
  const i = k.indexOf('::');
  if (i === -1) {
    return null;
  }
  const eid = k.slice(0, i);
  const scheduleIdx = parseInt(k.slice(i + 2), 10);
  if (Number.isNaN(scheduleIdx)) {
    return null;
  }
  return { eid, scheduleIdx };
}

function recToCompactToken(rec: SolveRecord, eventId: string): string {
  if (rec.dns) {
    return 'DNS';
  }
  if (rec.dnf) {
    return 'DNF';
  }
  if (eventId === '333mbf' && rec.mbf && rec.timeMs !== null) {
    const t = secondTimeFormat(rec.timeMs / 1000, true);
    return `${rec.mbf.solved}/${rec.mbf.attempted} ${t}`;
  }
  const ms = effectiveTimeMs(rec);
  if (ms === null) {
    return '—';
  }
  return formatDualTimes(ms, eventId).short;
}

export function buildCompactExportLines(
  contexts: EventContext[],
  solves: Record<string, SolveRecord>,
  exportRoundKeys: string[],
): string {
  const lines: string[] = [];
  for (const raw of exportRoundKeys.slice().sort()) {
    const parsed = parseExportRoundKey(raw);
    if (!parsed) {
      continue;
    }
    const { eid, scheduleIdx } = parsed;
    const ctx = contexts.find((c) => c.event.EventID === eid);
    if (!ctx) {
      continue;
    }
    const mains = getMainIndicesForRound(ctx, scheduleIdx);
    if (mains.length === 0) {
      continue;
    }
    const roundExport = getRoundExportNumber(scheduleIdx);
    const exportId = eid === '333mbf' ? '333mbf' : eid;
    const tokens: string[] = [];
    for (const li of mains) {
      const slotKey = makeSlotKey(eid, scheduleIdx, li);
      const rec = solves[slotKey];
      if (!rec) {
        tokens.push('DNS');
      } else {
        tokens.push(recToCompactToken(rec, eid));
      }
    }
    lines.push(`${exportId}[${roundExport}] ${tokens.join(' ')}`);
  }
  return lines.join('\n');
}
