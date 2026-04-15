import { getMainLineIndices } from './buildScrambleRows';
import type { EventContext } from './types';
import { makeSlotKey } from './types';

export function getMainIndicesForRound(ctx: EventContext, scheduleIdx: number): number[] {
  const sr = ctx.scheduleRounds.find((r) => r.scheduleIdx === scheduleIdx);
  if (!sr || sr.skipped || sr.rows.length === 0) {
    return [];
  }
  return getMainLineIndices(sr.rows, ctx.event);
}

/** 全部主赛程 slot 顺序（跨轮） */
export function getAllMainSlots(ctx: EventContext): { scheduleIdx: number; lineIndex: number }[] {
  const slots: { scheduleIdx: number; lineIndex: number }[] = [];
  for (const sr of ctx.scheduleRounds) {
    if (sr.skipped) {
      continue;
    }
    const mains = getMainIndicesForRound(ctx, sr.scheduleIdx);
    for (const li of mains) {
      slots.push({ scheduleIdx: sr.scheduleIdx, lineIndex: li });
    }
  }
  return slots;
}

export function getAttemptInRound(ctx: EventContext, scheduleIdx: number, lineIndex: number): number {
  const mains = getMainIndicesForRound(ctx, scheduleIdx);
  const pos = mains.indexOf(lineIndex);
  return pos >= 0 ? pos + 1 : 0;
}

/** 当前项目中，主赛程顺序下第一个尚未录入的格；全部已有则返回 null */
export function getFirstUnfilledMainSlot(
  ctx: EventContext,
  solves: Record<string, unknown>,
  eventId: string,
): { scheduleIdx: number; lineIndex: number } | null {
  const slots = getAllMainSlots(ctx);
  for (const s of slots) {
    const k = makeSlotKey(eventId, s.scheduleIdx, s.lineIndex);
    if (!solves[k]) {
      return s;
    }
  }
  return null;
}

export function getNextMainSlot(
  ctx: EventContext,
  cur: { scheduleIdx: number; lineIndex: number },
): { scheduleIdx: number; lineIndex: number } | 'done' {
  const slots = getAllMainSlots(ctx);
  const key = (s: { scheduleIdx: number; lineIndex: number }) =>
    `${s.scheduleIdx}|${s.lineIndex}`;
  const i = slots.findIndex((s) => key(s) === key(cur));
  if (slots.length === 0) {
    return 'done';
  }
  if (i === -1) {
    return slots[0];
  }
  if (i >= slots.length - 1) {
    return 'done';
  }
  return slots[i + 1];
}

export function getPrevMainSlot(
  ctx: EventContext,
  cur: { scheduleIdx: number; lineIndex: number },
): { scheduleIdx: number; lineIndex: number } | null {
  const slots = getAllMainSlots(ctx);
  const key = (s: { scheduleIdx: number; lineIndex: number }) =>
    `${s.scheduleIdx}|${s.lineIndex}`;
  const i = slots.findIndex((s) => key(s) === key(cur));
  if (i <= 0) {
    return null;
  }
  return slots[i - 1];
}

/** 该轮主赛程每一格是否均已录入 */
export function isRoundFullyRecorded(
  ctx: EventContext,
  solves: Record<string, unknown>,
  eventId: string,
  scheduleIdx: number,
): boolean {
  const mains = getMainIndicesForRound(ctx, scheduleIdx);
  if (mains.length === 0) {
    return false;
  }
  for (const li of mains) {
    const k = makeSlotKey(eventId, scheduleIdx, li);
    if (!solves[k]) {
      return false;
    }
  }
  return true;
}

/** 该轮主赛程中是否仍有未录入的把（导出时将以 DNS 补齐） */
export function roundHasMissingSlots(
  ctx: EventContext,
  solves: Record<string, unknown>,
  eventId: string,
  scheduleIdx: number,
): boolean {
  const mains = getMainIndicesForRound(ctx, scheduleIdx);
  for (const li of mains) {
    const k = makeSlotKey(eventId, scheduleIdx, li);
    if (!solves[k]) {
      return true;
    }
  }
  return false;
}

/** 该轮是否至少有一把已有成绩记录（含 DNF、DNS、多盲等任意一条） */
export function roundHasAnyRecorded(
  ctx: EventContext,
  solves: Record<string, unknown>,
  eventId: string,
  scheduleIdx: number,
): boolean {
  const mains = getMainIndicesForRound(ctx, scheduleIdx);
  for (const li of mains) {
    const k = makeSlotKey(eventId, scheduleIdx, li);
    if (solves[k]) {
      return true;
    }
  }
  return false;
}

export function isEventFullyRecorded(
  ctx: EventContext,
  solves: Record<string, unknown>,
  eventId: string,
): boolean {
  const slots = getAllMainSlots(ctx);
  for (const s of slots) {
    const k = makeSlotKey(eventId, s.scheduleIdx, s.lineIndex);
    if (!solves[k]) {
      return false;
    }
  }
  return slots.length > 0;
}

export function hasStartedEvent(
  ctx: EventContext,
  solves: Record<string, unknown>,
  eventId: string,
): boolean {
  const slots = getAllMainSlots(ctx);
  for (const s of slots) {
    const k = makeSlotKey(eventId, s.scheduleIdx, s.lineIndex);
    if (solves[k]) {
      return true;
    }
  }
  return false;
}

export function findIncompleteOtherEvents(
  contexts: EventContext[],
  solves: Record<string, unknown>,
  exceptEventId: string,
): string[] {
  const ids: string[] = [];
  for (const ctx of contexts) {
    if (ctx.event.EventID === exceptEventId) {
      continue;
    }
    if (!hasStartedEvent(ctx, solves, ctx.event.EventID)) {
      continue;
    }
    if (!isEventFullyRecorded(ctx, solves, ctx.event.EventID)) {
      ids.push(ctx.event.EventID);
    }
  }
  return ids;
}

export function getRoundExportNumber(scheduleIdx: number): number {
  return scheduleIdx + 1;
}

export function findContextByEventId(
  contexts: EventContext[],
  eventId: string,
): EventContext | undefined {
  return contexts.find((c) => c.event.EventID === eventId);
}

export function defaultCursor(contexts: EventContext[]): {
  eventId: string;
  scheduleIdx: number;
  lineIndex: number;
} {
  if (contexts.length === 0) {
    return { eventId: '', scheduleIdx: 0, lineIndex: 0 };
  }
  const ctx = contexts[0];
  const first = getAllMainSlots(ctx)[0];
  if (!first) {
    return { eventId: ctx.event.EventID, scheduleIdx: 0, lineIndex: 0 };
  }
  return { eventId: ctx.event.EventID, ...first };
}

export function lastRecordedCursor(
  contexts: EventContext[],
  solves: Record<string, { updatedAt: string }>,
): { eventId: string; scheduleIdx: number; lineIndex: number } | null {
  let best: { t: number; eventId: string; scheduleIdx: number; lineIndex: number } | null = null;
  for (const ctx of contexts) {
    const evId = ctx.event.EventID;
    for (const s of getAllMainSlots(ctx)) {
      const k = makeSlotKey(evId, s.scheduleIdx, s.lineIndex);
      const rec = solves[k];
      if (rec) {
        const t = new Date(rec.updatedAt).getTime();
        if (!best || t > best.t) {
          best = { t, eventId: evId, scheduleIdx: s.scheduleIdx, lineIndex: s.lineIndex };
        }
      }
    }
  }
  return best
    ? { eventId: best.eventId, scheduleIdx: best.scheduleIdx, lineIndex: best.lineIndex }
    : null;
}

/** 重新打开：定位到「下一待赛格」；若项目已结束则停在最后一格 */
export function reopenCursor(
  contexts: EventContext[],
  solves: Record<string, { updatedAt: string }>,
): { eventId: string; scheduleIdx: number; lineIndex: number } {
  const def = defaultCursor(contexts);
  const last = lastRecordedCursor(contexts, solves);
  if (!last) {
    return def;
  }
  const ctx = findContextByEventId(contexts, last.eventId);
  if (!ctx) {
    return def;
  }
  const n = getNextMainSlot(ctx, last);
  if (n === 'done') {
    return last;
  }
  return { eventId: last.eventId, scheduleIdx: n.scheduleIdx, lineIndex: n.lineIndex };
}

/** 将游标落在合法主赛程上；若当前为非法则修正 */
export function normalizeCursor(
  contexts: EventContext[],
  cursor: { eventId: string; scheduleIdx: number; lineIndex: number },
): { eventId: string; scheduleIdx: number; lineIndex: number } {
  const ctx = findContextByEventId(contexts, cursor.eventId);
  if (!ctx) {
    return defaultCursor(contexts);
  }
  const mains = getMainIndicesForRound(ctx, cursor.scheduleIdx);
  if (mains.includes(cursor.lineIndex)) {
    return cursor;
  }
  const slots = getAllMainSlots(ctx);
  const hit = slots.find(
    (s) => s.scheduleIdx === cursor.scheduleIdx && s.lineIndex === cursor.lineIndex,
  );
  if (hit) {
    return { ...cursor, eventId: ctx.event.EventID };
  }
  return slots[0]
    ? { eventId: ctx.event.EventID, scheduleIdx: slots[0].scheduleIdx, lineIndex: slots[0].lineIndex }
    : defaultCursor(contexts);
}
