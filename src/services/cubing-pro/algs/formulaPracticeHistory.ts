/**
 * 公式练习历史 - 存储格式与 API
 *
 * 存储 key: algs:formula_practice_history:{cube}-{classId}
 * 不同公式库(cube+classId)使用不同 key，互不干扰
 *
 * 存储结构 v2（按会话组织）：
 * {
 *   version: 2,
 *   sessions: PracticeSession[]
 * }
 *
 * 每次「开始练习」创建一个会话，该次练习中完成的每条公式作为一条记录追加到该会话。
 * 支持保存多条练习记录，按会话分组，便于按练习轮次查看。
 */

const LS_KEY_PREFIX = 'algs:formula_practice_history:';
const STORAGE_VERSION = 2;
/** 降低限制以适配 localStorage 约 5MB 配额，image(SVG) 单条约 2-5KB */
const MAX_SESSIONS = 50;
const MAX_RECORDS_PER_SESSION = 100;
const MAX_TOTAL_RECORDS = 500;
export const PAGE_SIZE = 20;

export interface FormulaPracticeRecord {
  /** 唯一标识，用于列表 key */
  id: string;
  /** 创建时间戳 */
  createdAt: number;
  /** 耗时(ms) */
  timeMs: number;
  /** 公式唯一键: setName:groupName:formulaName */
  formulaKey: string;
  formulaName: string;
  setName: string;
  groupName: string;
  scramble: string;
  scrambleIndex: number;
  image: string;
  algs: string[];
}

/** 练习会话：一次「开始练习」到「返回配置」之间的所有记录 */
export interface PracticeSession {
  /** 会话唯一标识 */
  id: string;
  /** 会话创建时间 */
  createdAt: number;
  /** 练习模式 */
  mode: 'sequential' | 'random' | 'nonRepeatRandom' | 'weightedRandom';
  /** 该次练习选中的公式 key 列表 */
  selectedFormulas: string[];
  /** 该会话内的练习记录（按完成顺序） */
  records: FormulaPracticeRecord[];
}

interface StorageDataV2 {
  version: 2;
  sessions: PracticeSession[];
}

/** 旧版 v1 存储结构（兼容迁移） */
interface StorageDataV1 {
  version: 1;
  records: FormulaPracticeRecord[];
}

/** 当前 key 格式: {cube}-{classId} */
function getStorageKey(cube: string, classId: string): string {
  return `${LS_KEY_PREFIX}${encodeURIComponent(cube)}-${encodeURIComponent(classId)}`;
}

/** 旧 key 格式(兼容迁移): {cube}:{classId} */
function getLegacyStorageKey(cube: string, classId: string): string {
  return `${LS_KEY_PREFIX}${encodeURIComponent(cube)}:${encodeURIComponent(classId)}`;
}

function generateRecordId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateSessionId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 将旧格式迁移为 v2 会话结构 */
function migrateToV2(raw: string): StorageDataV2 | null {
  try {
    const parsed = JSON.parse(raw);
    let records: FormulaPracticeRecord[] = [];

    if (Array.isArray(parsed)) {
      // 最旧格式：直接是 FormulaPracticeRecord[]
      records = parsed.map((r: Record<string, unknown>, i: number) => ({
        id: `${(r.createdAt as number) ?? Date.now()}-${i}`,
        createdAt: (r.createdAt as number) ?? Date.now(),
        timeMs: (r.time as number) ?? (r.timeMs as number) ?? 0,
        formulaKey: (r.formulaKey as string) ?? `${r.setName}:${r.groupName}:${r.formulaName}`,
        formulaName: (r.formulaName as string) ?? '',
        setName: (r.setName as string) ?? '',
        groupName: (r.groupName as string) ?? '',
        scramble: (r.scramble as string) ?? '',
        scrambleIndex: (r.scrambleIndex as number) ?? 0,
        image: (r.image as string) ?? '',
        algs: Array.isArray(r.algs) ? r.algs : [],
      }));
    } else if ((parsed?.version === 1 || parsed?.version === '1') && Array.isArray(parsed?.records)) {
      const v1 = parsed as StorageDataV1;
      records = v1.records.map((r, i) => {
        const raw = r as unknown as { time?: number };
        return {
          ...r,
          id: r.id || `${r.createdAt}-${i}`,
          timeMs: raw?.time != null ? raw.time : r.timeMs,
        };
      });
    } else if (parsed?.version === 2 || parsed?.version === '2') {
      // v2 格式：确保 sessions 存在且每个 session 的 records 存在
      const sessions = Array.isArray(parsed?.sessions)
        ? (parsed.sessions as PracticeSession[]).map((s) => ({
            ...s,
            records: Array.isArray(s?.records) ? s.records : [],
          }))
        : [];
      return { version: 2, sessions };
    }

    if (records.length > 0) {
      const legacySession: PracticeSession = {
        id: generateSessionId(),
        createdAt: records[records.length - 1]?.createdAt ?? Date.now(),
        mode: 'sequential',
        selectedFormulas: [],
        records: records.reverse(),
      };
      return { version: 2, sessions: [legacySession] };
    }
  } catch {
    // ignore
  }
  return null;
}

function loadStorageData(cube: string, classId: string): StorageDataV2 {
  try {
    const key = getStorageKey(cube, classId);
    let raw = localStorage.getItem(key);
    let fromLegacyKey = false;
    if (!raw) {
      const legacyKey = getLegacyStorageKey(cube, classId);
      raw = localStorage.getItem(legacyKey);
      fromLegacyKey = !!raw;
    }
    if (raw) {
      const migrated = migrateToV2(raw);
      if (migrated) {
        // 若从旧格式迁移而来，持久化 v2 并清理旧 key
        const isOldFormat =
          fromLegacyKey ||
          raw.startsWith('[') ||
          /"version"\s*:\s*1\b/.test(raw);
        if (isOldFormat) {
          saveStorageData(cube, classId, migrated);
          if (fromLegacyKey) {
            try {
              localStorage.removeItem(getLegacyStorageKey(cube, classId));
            } catch {
              // ignore
            }
          }
        }
        return migrated;
      }
    }
  } catch {
    // ignore
  }
  return { version: 2, sessions: [] };
}

/** 精简记录：移除 image 以减小体积（展示时可通过 formulaKey 查找） */
function slimRecord(r: FormulaPracticeRecord): FormulaPracticeRecord {
  return { ...r, image: '' };
}

/** 尝试保存，若配额超限则逐步删除最旧数据后重试 */
function saveStorageData(cube: string, classId: string, data: StorageDataV2): boolean {
  if (!cube || !classId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[formulaPractice] saveStorageData skipped: cube or classId empty', { cube, classId });
    }
    return false;
  }
  const key = getStorageKey(cube, classId);

  const trySave = (d: StorageDataV2): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(d));
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        return false;
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('[formulaPractice] saveStorageData failed:', e);
      }
      return false;
    }
  };

  if (trySave(data)) return true;

  // 配额超限：逐步删除最旧数据并精简 image 后重试
  let current: StorageDataV2 = { version: 2, sessions: data.sessions.map((s) => ({
    ...s,
    records: s.records.map(slimRecord),
  })) };
  if (trySave(current)) return true;

  while (current.sessions.length > 0) {
    const last = current.sessions[current.sessions.length - 1];
    if (last.records.length > 1) {
      last.records = last.records.slice(1);
      current.sessions[current.sessions.length - 1] = { ...last };
    } else {
      current.sessions = current.sessions.slice(0, -1);
    }
    if (current.sessions.length === 0) break;
    if (trySave(current)) return true;
  }

  // 最后尝试只保存最新一条记录
  if (data.sessions.length > 0 && data.sessions[0].records.length > 0) {
    const latest = data.sessions[0].records[data.sessions[0].records.length - 1];
    const minimal: StorageDataV2 = {
      version: 2,
      sessions: [{
        ...data.sessions[0],
        records: [slimRecord(latest)],
      }],
    };
    if (trySave(minimal)) return true;
  }
  return false;
}

/** 从所有会话中扁平化出所有记录（按 createdAt 倒序，最新在前） */
function flattenRecords(sessions: PracticeSession[]): FormulaPracticeRecord[] {
  const all: FormulaPracticeRecord[] = [];
  (sessions ?? []).forEach((s) => {
    const recs = Array.isArray(s?.records) ? s.records : [];
    recs.forEach((r) => all.push(r));
  });
  all.sort((a, b) => b.createdAt - a.createdAt);
  return all;
}

export function getFormulaPracticeHistory(
  cube: string,
  classId: string,
): FormulaPracticeRecord[] {
  const data = loadStorageData(cube, classId);
  return flattenRecords(data.sessions);
}

/**
 * 创建新的练习会话，在「开始练习」时调用
 */
export function createPracticeSession(
  cube: string,
  classId: string,
  params: { mode: PracticeSession['mode']; selectedFormulas: string[] },
): string {
  if (!cube || !classId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[formulaPractice] createPracticeSession skipped: cube or classId empty', {
        cube,
        classId,
        cubeType: typeof cube,
        classIdType: typeof classId,
      });
    }
    return '';
  }

  const data = loadStorageData(cube, classId);
  const session: PracticeSession = {
    id: generateSessionId(),
    createdAt: Date.now(),
    mode: params.mode,
    selectedFormulas: params.selectedFormulas,
    records: [],
  };

  const nextSessions = [session, ...data.sessions].slice(0, MAX_SESSIONS);
  saveStorageData(cube, classId, { version: 2, sessions: nextSessions });
  return session.id;
}

export interface HistoryPageResult {
  records: FormulaPracticeRecord[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 分页获取练习历史
 */
export function getFormulaPracticeHistoryPage(
  cube: string,
  classId: string,
  page: number,
  pageSize: number = PAGE_SIZE,
): HistoryPageResult {
  const records = getFormulaPracticeHistory(cube, classId);
  const total = records.length;
  const start = (page - 1) * pageSize;
  const pageRecords = records.slice(start, start + pageSize);
  return { records: pageRecords, total, page, pageSize };
}

export interface AppendRecordInput {
  timeMs: number;
  formulaKey: string;
  formulaName: string;
  setName: string;
  groupName: string;
  scramble: string;
  scrambleIndex: number;
  image: string;
  algs: string[];
}

/**
 * 向指定会话追加一条练习记录，并返回追加后的完整历史（用于立即更新 UI）
 * @param sessionId 由 createPracticeSession 返回的会话 id
 */
export function appendFormulaPracticeRecord(
  cube: string,
  classId: string,
  sessionId: string,
  input: AppendRecordInput,
): FormulaPracticeRecord[] {
  if (!cube || !classId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[formulaPractice] appendFormulaPracticeRecord skipped: cube or classId empty', {
        cube,
        classId,
      });
    }
    return getFormulaPracticeHistory(cube, classId);
  }

  const data = loadStorageData(cube, classId);
  let sessionIdx = data.sessions.findIndex((s) => s.id === sessionId);

  // 若找不到会话（如刷新后 sessionId 丢失），创建新会话并追加记录，避免数据丢失
  if (sessionIdx < 0 && sessionId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[formulaPractice] session not found, creating fallback session', {
        sessionId,
        existingSessionIds: data.sessions.map((s) => s.id),
      });
    }
    const fallbackSession: PracticeSession = {
      id: generateSessionId(),
      createdAt: Date.now(),
      mode: 'sequential',
      selectedFormulas: [],
      records: [],
    };
    const sessions = [fallbackSession, ...data.sessions].slice(0, MAX_SESSIONS);
    sessionIdx = 0;
    saveStorageData(cube, classId, { version: 2, sessions });
    data.sessions = sessions;
  } else if (sessionIdx < 0) {
    return getFormulaPracticeHistory(cube, classId);
  }

  const record: FormulaPracticeRecord = {
    id: generateRecordId(),
    createdAt: Date.now(),
    timeMs: input.timeMs,
    formulaKey: input.formulaKey,
    formulaName: input.formulaName,
    setName: input.setName,
    groupName: input.groupName,
    scramble: input.scramble,
    scrambleIndex: input.scrambleIndex,
    image: input.image,
    algs: input.algs,
  };

  const sessions = [...data.sessions];
  const session = { ...sessions[sessionIdx] };
  session.records = [...session.records, record].slice(-MAX_RECORDS_PER_SESSION);
  sessions[sessionIdx] = session;

  // 若总记录数超限，移除最旧会话中的多余记录
  const totalRecords = sessions.reduce((sum, s) => sum + s.records.length, 0);
  if (totalRecords > MAX_TOTAL_RECORDS) {
    let toRemove = totalRecords - MAX_TOTAL_RECORDS;
    for (let i = sessions.length - 1; i >= 0 && toRemove > 0; i--) {
      const s = sessions[i];
      if (s.records.length <= toRemove) {
        toRemove -= s.records.length;
        sessions[i] = { ...s, records: [] };
      } else {
        sessions[i] = { ...s, records: s.records.slice(toRemove) };
        toRemove = 0;
      }
    }
  }

  saveStorageData(cube, classId, { version: 2, sessions });
  return flattenRecords(sessions);
}

/**
 * 删除单条记录
 */
export function deleteFormulaPracticeRecord(
  cube: string,
  classId: string,
  recordId: string,
): FormulaPracticeRecord[] {
  if (!cube || !classId) return getFormulaPracticeHistory(cube, classId);
  const data = loadStorageData(cube, classId);
  const sessions = data.sessions
    .map((s) => ({ ...s, records: s.records.filter((r) => r.id !== recordId) }))
    .filter((s) => s.records.length > 0);
  saveStorageData(cube, classId, { version: 2, sessions });
  return flattenRecords(sessions);
}

/**
 * 计算去头尾平均 (trimmed mean)
 * @param times 时间数组(ms)，按时间顺序（最新在前）
 * @param trimRatio 0-50，去掉最大和最小各 trimRatio% 的数据
 */
export function computeTrimmedMean(times: number[], trimRatio: number): number | null {
  if (times.length === 0) return null;
  const n = times.length;
  const trimCount = Math.floor((n * trimRatio) / 100);
  if (trimCount * 2 >= n) return null;
  const sorted = [...times].sort((a, b) => a - b);
  const trimmed = sorted.slice(trimCount, n - trimCount);
  return trimmed.reduce((s, t) => s + t, 0) / trimmed.length;
}

/**
 * 计算 ao50, ao100, ao1000
 */
export function computeAverages(
  records: FormulaPracticeRecord[],
  trimRatio: number,
): { ao50: number | null; ao100: number | null; ao1000: number | null } {
  const times = records.map((r) => r.timeMs);
  return {
    ao50: computeTrimmedMean(times.slice(0, 50), trimRatio),
    ao100: computeTrimmedMean(times.slice(0, 100), trimRatio),
    ao1000: computeTrimmedMean(times.slice(0, 1000), trimRatio),
  };
}

export function clearFormulaPracticeHistory(cube: string, classId: string): void {
  try {
    localStorage.removeItem(getStorageKey(cube, classId));
  } catch {
    // ignore
  }
}
