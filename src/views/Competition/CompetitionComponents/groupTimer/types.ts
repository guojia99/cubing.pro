/** 与 CompetitionScrambles 中单行打乱一致 */
export type ScrambleRow = {
  lineIndex: number;
  indexLabel: string;
  scramble: string;
  puzzleIdForImage: string;
  isExtra: boolean;
};

export type TimerMode = 'manual' | 'inspection' | 'running';

export type MbfPhase = 'time' | 'solved';

export type SolveRecord = {
  timeMs: number | null;
  /** 标记 DNF 前的时间，用于从 DNF 切回 */
  priorTimeMs?: number;
  dnf: boolean;
  /** 未开始（未观察未计时） */
  dns?: boolean;
  plus2: boolean;
  usedSpare: boolean;
  /** 使用备打时保留原打乱 */
  originalScramble?: string;
  /** 备打对应 Ex 行的 lineIndex */
  extraLineIndex?: number;
  scramble: string;
  mbf?: {
    attempted: number;
    solved: number;
  };
  updatedAt: string;
};

export type SolveSlotKey = string;

export function makeSlotKey(eventId: string, scheduleIdx: number, lineIndex: number): SolveSlotKey {
  return `${eventId}|${scheduleIdx}|${lineIndex}`;
}

export type ExportMeta = {
  lastExportedAt?: string;
  /** 已导出过的 slot key（兼容） */
  exportedKeys: string[];
  /** 按轮次导出：已导出的 scheduleIdx（字符串） */
  exportedRounds?: string[];
};

export type GroupTimerPersisted = {
  version: 1;
  compId: number;
  /** 当前游标 */
  cursor: {
    eventId: string;
    scheduleIdx: number;
    lineIndex: number;
  };
  /** slotKey -> 记录 */
  solves: Record<SolveSlotKey, SolveRecord>;
  /** 每项目导出元数据 */
  exportByEvent: Record<string, ExportMeta>;
};

export type EventContext = {
  event: import('@/services/cubing-pro/comps/typings').CompAPI.Event;
  baseEvent: import('@/services/cubing-pro/events/typings').EventsAPI.Event;
  route: ReturnType<typeof import('@/components/Data/cube_result/event_route').eventRouteM>;
  scheduleRounds: {
    scheduleIdx: number;
    roundTitle: string;
    rows: ScrambleRow[];
    skipped: boolean;
  }[];
};
