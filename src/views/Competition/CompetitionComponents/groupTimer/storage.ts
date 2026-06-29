import type { GroupTimerPersisted, SolveSlotKey } from './types';

const PREFIX = 'cubingPro.groupTimer.v1:';

export function loadGroupTimer(compId: number): GroupTimerPersisted {
  const key = PREFIX + compId;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return emptyState(compId);
    }
    const data = JSON.parse(raw) as GroupTimerPersisted;
    if (data.version !== 1 || !data.solves) {
      return emptyState(compId);
    }
    if (!data.exportByEvent) {
      data.exportByEvent = {};
    }
    for (const k of Object.keys(data.exportByEvent)) {
      const m = data.exportByEvent[k];
      if (m && !m.exportedKeys) {
        m.exportedKeys = [];
      }
      if (m && !m.exportedRounds) {
        m.exportedRounds = [];
      }
    }
    data.solves = data.solves || {};
    return data;
  } catch {
    return emptyState(compId);
  }
}

export function saveGroupTimer(state: GroupTimerPersisted): void {
  const key = PREFIX + state.compId;
  localStorage.setItem(key, JSON.stringify(state));
}

function emptyState(compId: number): GroupTimerPersisted {
  return {
    version: 1,
    compId,
    cursor: { eventId: '', scheduleIdx: 0, lineIndex: 0 },
    solves: {},
    exportByEvent: {},
  };
}

export function isSlotExported(exportKeys: string[] | undefined, slotKey: SolveSlotKey): boolean {
  return !!(exportKeys && exportKeys.includes(slotKey));
}
