import {
  deleteScope, historyScope, historyTransaction, migrateHistoryScope,
  type RecordRow,
} from './formulaPracticeHistoryDb';

export const PAGE_SIZE = 20;

export interface FormulaPracticeRecord {
  id: string;
  createdAt: number;
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

export interface PracticeSession {
  id: string;
  createdAt: number;
  mode: 'sequential' | 'random' | 'nonRepeatRandom' | 'weightedRandom';
  selectedFormulas: string[];
  records: FormulaPracticeRecord[];
}

export interface HistoryPageResult {
  records: FormulaPracticeRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AppendRecordInput {
  /** Keep the same ID when retrying a pending record. Omit for a new random ID. */
  id?: string;
  /** If supplied, retries must use the same timestamp. */
  createdAt?: number;
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

export class PracticeSessionMissingError extends Error {
  readonly code = 'PRACTICE_SESSION_MISSING' as const;

  constructor(public readonly sessionId: string) {
    super(`Practice session not found: ${sessionId}`);
    this.name = 'PracticeSessionMissingError';
  }
}

async function library(cube: string, classId: string) {
  const scope = historyScope(cube, classId);
  const legacy = `${encodeURIComponent(cube)}:${encodeURIComponent(classId)}`;
  return { scope, db: await migrateHistoryScope(scope, legacy) };
}

export async function createPracticeSession(
  cube: string, classId: string,
  params: { mode: PracticeSession['mode']; selectedFormulas: string[] },
): Promise<string> {
  const { db, scope } = await library(cube, classId);
  const id = `s-${crypto.randomUUID()}`;
  await historyTransaction<void>(db, 'readwrite', (tx, done) => {
    tx.objectStore('sessions').add({ scope, id, createdAt: Date.now(), ...params });
    done();
  });
  return id;
}

/** Returns the committed record; matching scope/ID retries never write a second time. */
export async function appendFormulaPracticeRecord(
  cube: string, classId: string, sessionId: string, input: AppendRecordInput,
): Promise<FormulaPracticeRecord> {
  if (!sessionId) throw new PracticeSessionMissingError(sessionId);
  if (!Number.isFinite(input.timeMs) || input.timeMs < 0) throw new Error('Invalid practice time');
  if (input.id !== undefined && (typeof input.id !== 'string' || !input.id.trim())) {
    throw new Error('Invalid practice record ID');
  }
  if (input.createdAt !== undefined && (!Number.isFinite(input.createdAt) || input.createdAt < 0)) {
    throw new Error('Invalid practice record timestamp');
  }
  const explicitCreatedAt = input.createdAt !== undefined;
  // Snapshot pending input before any await so caller mutations cannot alter the write.
  const record: FormulaPracticeRecord = {
    ...input, algs: [...input.algs], id: input.id ?? crypto.randomUUID(), createdAt: input.createdAt ?? Date.now(),
  };
  const { db, scope } = await library(cube, classId);
  let failure: Error | undefined;
  try {
    return await historyTransaction<FormulaPracticeRecord>(db, 'readwrite', (tx, done) => {
      const records = tx.objectStore('records');
      const request = records.get([scope, record.id]);
      request.onsuccess = () => {
        const existing = request.result as RecordRow | undefined;
        if (existing) {
          const fields = ['timeMs', 'formulaKey', 'formulaName', 'setName', 'groupName',
            'scramble', 'scrambleIndex', 'image'] as const;
          if (existing.sessionId !== sessionId ||
              (explicitCreatedAt && existing.createdAt !== record.createdAt) ||
              fields.some((field) => existing[field] !== record[field]) ||
              existing.algs.length !== record.algs.length ||
              existing.algs.some((alg, index) => alg !== record.algs[index])) {
            failure = new Error(`Practice record ID conflict: ${record.id}`);
            tx.abort();
            return;
          }
          const committed: Partial<RecordRow> = { ...existing };
          delete committed.scope;
          delete committed.sessionId;
          done(committed as FormulaPracticeRecord);
          return;
        }
        const session = tx.objectStore('sessions').get([scope, sessionId]);
        session.onsuccess = () => {
          if (!session.result) {
            failure = new PracticeSessionMissingError(sessionId);
            tx.abort();
            return;
          }
          records.add({ ...record, scope, sessionId });
          done(record);
        };
      };
    });
  } catch (error) {
    throw failure ?? error;
  }
}

function readRecords(
  tx: IDBTransaction, scope: string, offset: number, limit: number,
  done: (records: FormulaPracticeRecord[]) => void,
): void {
  const records: FormulaPracticeRecord[] = [];
  const range = IDBKeyRange.bound([scope, -Infinity], [scope, Infinity, []]);
  const request = tx.objectStore('records').index('scopeCreatedAt').openCursor(range, 'prev');
  let skipped = false;
  request.onsuccess = () => {
    const cursor = request.result;
    if (!cursor || records.length >= limit) { done(records); return; }
    if (offset > 0 && !skipped) { skipped = true; cursor.advance(offset); return; }
    const record: Partial<RecordRow> = { ...cursor.value as RecordRow };
    delete record.scope;
    delete record.sessionId;
    records.push(record as FormulaPracticeRecord);
    if (records.length >= limit) done(records);
    else cursor.continue();
  };
}

/** Explicit full-history query for callers that need every record. Ordinary UI should page. */
export async function getFormulaPracticeHistory(cube: string, classId: string): Promise<FormulaPracticeRecord[]> {
  const { db, scope } = await library(cube, classId);
  return historyTransaction(db, 'readonly', (tx, done) => readRecords(tx, scope, 0, Infinity, done));
}

export async function getFormulaPracticeHistoryPage(
  cube: string, classId: string, page: number, pageSize: number = PAGE_SIZE,
): Promise<HistoryPageResult> {
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 ||
      !Number.isSafeInteger((page - 1) * pageSize)) throw new Error('Invalid history pagination');
  const { db, scope } = await library(cube, classId);
  return historyTransaction(db, 'readonly', (tx, done) => {
    const count = tx.objectStore('records').index('scope').count(scope);
    count.onsuccess = () => {
      readRecords(tx, scope, (page - 1) * pageSize, pageSize, (records) => {
        done({ records, total: count.result, page, pageSize });
      });
    };
  });
}

export async function getRecentFormulaPracticeHistory(
  cube: string, classId: string, limit: number = 1000,
): Promise<FormulaPracticeRecord[]> {
  return (await getFormulaPracticeHistoryPage(cube, classId, 1, limit)).records;
}

export async function getFormulaPracticeHistoryCount(cube: string, classId: string): Promise<number> {
  const { db, scope } = await library(cube, classId);
  return historyTransaction(db, 'readonly', (tx, done) => {
    const request = tx.objectStore('records').index('scope').count(scope);
    request.onsuccess = () => done(request.result);
  });
}

export interface FormulaPracticeFrequencyStats {
  items: Array<{
    formulaKey: string;
    formulaName: string;
    setName: string;
    groupName: string;
    count: number;
    /** Fraction of this library's records, from 0 to 1. */
    frequency: number;
  }>;
  total: number;
}

/** One cursor pass; memory grows with distinct formula keys, not record count. */
export async function getFormulaPracticeFrequencyStats(
  cube: string, classId: string,
): Promise<FormulaPracticeFrequencyStats> {
  const { db, scope } = await library(cube, classId);
  return historyTransaction(db, 'readonly', (tx, done) => {
    const items = new Map<string, FormulaPracticeFrequencyStats['items'][number]>();
    let total = 0;
    const range = IDBKeyRange.bound([scope, -Infinity], [scope, Infinity, []]);
    const request = tx.objectStore('records').index('scopeCreatedAt').openCursor(range, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const record = cursor.value as RecordRow;
        const item = items.get(record.formulaKey);
        if (item) item.count++;
        else items.set(record.formulaKey, {
          formulaKey: record.formulaKey, formulaName: record.formulaName,
          setName: record.setName, groupName: record.groupName, count: 1, frequency: 0,
        });
        total++;
        cursor.continue();
      } else {
        const result = [...items.values()];
        for (const item of result) item.frequency = item.count / total;
        result.sort((a, b) => b.count - a.count || a.formulaKey.localeCompare(b.formulaKey));
        done({ items: result, total });
      }
    };
  });
}

export async function deleteFormulaPracticeRecord(cube: string, classId: string, recordId: string): Promise<void> {
  const { db, scope } = await library(cube, classId);
  await historyTransaction<void>(db, 'readwrite', (tx, done) => {
    tx.objectStore('records').delete([scope, recordId]);
    done();
  });
}

export async function clearFormulaPracticeHistory(cube: string, classId: string): Promise<void> {
  const { db, scope } = await library(cube, classId);
  await historyTransaction<void>(db, 'readwrite', (tx, done) => {
    deleteScope(tx, 'records', scope);
    deleteScope(tx, 'sessions', scope);
    done();
  });
}

export function computeTrimmedMean(times: number[], trimRatio: number): number | null {
  if (!times.length || !Number.isFinite(trimRatio) || trimRatio < 0 || trimRatio > 50) return null;
  const trimCount = Math.floor(times.length * trimRatio / 100);
  if (trimCount * 2 >= times.length) return null;
  const sorted = [...times].sort((a, b) => a - b);
  const trimmed = sorted.slice(trimCount, times.length - trimCount);
  return trimmed.reduce((sum, time) => sum + time, 0) / trimmed.length;
}

export function computeAverages(
  records: FormulaPracticeRecord[], trimRatio: number,
): { ao50: number | null; ao100: number | null; ao1000: number | null } {
  const times = records.map((record) => record.timeMs);
  const average = (n: number) => times.length >= n ? computeTrimmedMean(times.slice(0, n), trimRatio) : null;
  return { ao50: average(50), ao100: average(100), ao1000: average(1000) };
}

export interface FormulaPracticeHistorySummary {
  total: number;
  recentRecords: FormulaPracticeRecord[];
  averages: ReturnType<typeof computeAverages>;
}

/** Snapshot-consistent total and averages over at most the latest 1000 records. */
export async function getFormulaPracticeHistorySummary(
  cube: string, classId: string, trimRatio: number = 5,
): Promise<FormulaPracticeHistorySummary> {
  const { total, records } = await getFormulaPracticeHistoryPage(cube, classId, 1, 1000);
  return { total, recentRecords: records, averages: computeAverages(records, trimRatio) };
}
