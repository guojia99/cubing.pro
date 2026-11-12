import type { FormulaPracticeRecord, PracticeSession } from './formulaPracticeHistory';

export const HISTORY_PREFIX = 'algs:formula_practice_history:';
export type SessionRow = Omit<PracticeSession, 'records'> & { scope: string };
export type RecordRow = FormulaPracticeRecord & { scope: string; sessionId: string };
export interface HistorySnapshot { version: 2; sessions: PracticeSession[] }

let database: Promise<IDBDatabase> | undefined;

export function openHistoryDb(): Promise<IDBDatabase> {
  if (!database) {
    database = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is unavailable'));
        return;
      }
      const request = indexedDB.open('cubing-pro-formula-practice-history', 1);
      let blocked = false;
      request.onupgradeneeded = () => {
        const db = request.result;
        const sessions = db.createObjectStore('sessions', { keyPath: ['scope', 'id'] });
        sessions.createIndex('scope', 'scope');
        const records = db.createObjectStore('records', { keyPath: ['scope', 'id'] });
        records.createIndex('scope', 'scope');
        records.createIndex('scopeCreatedAt', ['scope', 'createdAt', 'id']);
        records.createIndex('session', ['scope', 'sessionId']);
        db.createObjectStore('migrations', { keyPath: 'key' });
      };
      request.onerror = () => reject(request.error ?? new Error('Cannot open history database'));
      request.onblocked = () => {
        blocked = true;
        reject(new Error('History database upgrade is blocked; close other tabs'));
      };
      request.onsuccess = () => {
        const db = request.result;
        if (blocked) { db.close(); return; }
        db.onversionchange = () => { db.close(); database = undefined; };
        resolve(db);
      };
    }).catch((error) => { database = undefined; throw error; });
  }
  return database;
}

/** Resolve only on commit, including failures after individual requests succeed. */
export function historyTransaction<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  work: (tx: IDBTransaction, result: (value: T) => void) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['sessions', 'records', 'migrations'], mode);
    let value: T;
    let failure: unknown;
    tx.oncomplete = () => resolve(value);
    tx.onabort = () => reject(failure ?? tx.error ?? new Error('History transaction aborted'));
    tx.onerror = () => { failure ??= tx.error; };
    try { work(tx, (next) => { value = next; }); }
    catch (error) { failure = error; tx.abort(); }
  });
}

export function historyScope(cube: string, classId: string): string {
  if (!cube || !classId) throw new Error('cube and classId are required');
  return `${encodeURIComponent(cube)}-${encodeURIComponent(classId)}`;
}

export function canonicalHistoryScope(scope: string): string {
  return scope.replace(':', '-');
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid history entry');
  return value as Record<string, unknown>;
}

function strings(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw new Error('Invalid history string array');
  return value;
}

function number(value: unknown, fallback = 0): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid history number');
  return value;
}

function text(value: unknown, fallback = ''): string {
  if (value === undefined) return fallback;
  if (typeof value !== 'string') throw new Error('Invalid history text');
  return value;
}

export function normalizeHistory(value: unknown): HistorySnapshot {
  if (typeof value === 'string') value = JSON.parse(value);
  const record = (value: unknown, index: number): FormulaPracticeRecord => {
    const r = object(value);
    return {
      ...r,
      id: text(r.id) || `legacy-record-${number(r.createdAt)}-${index}`,
      createdAt: number(r.createdAt), timeMs: number(r.timeMs ?? r.time),
      formulaKey: text(r.formulaKey, `${r.setName ?? ''}:${r.groupName ?? ''}:${r.formulaName ?? ''}`),
      formulaName: text(r.formulaName), setName: text(r.setName), groupName: text(r.groupName),
      scramble: text(r.scramble), scrambleIndex: number(r.scrambleIndex),
      image: text(r.image), algs: strings(r.algs),
    };
  };
  let legacy: unknown[];
  if (Array.isArray(value)) legacy = value;
  else {
    const data = object(value);
    if (String(data.version) === '2') {
      if (!Array.isArray(data.sessions)) throw new Error('Invalid history sessions');
      const sessions = data.sessions.map((value, index): PracticeSession => {
        const s = object(value);
        const mode = s.mode ?? 'sequential';
        if (!['sequential', 'random', 'nonRepeatRandom', 'weightedRandom'].includes(String(mode))) throw new Error('Invalid practice mode');
        if (!Array.isArray(s.records)) throw new Error('Invalid session records');
        return {
          ...s, id: text(s.id) || `legacy-session-${number(s.createdAt)}-${index}`,
          createdAt: number(s.createdAt), mode: mode as PracticeSession['mode'],
          selectedFormulas: strings(s.selectedFormulas), records: s.records.map(record),
        };
      });
      return { version: 2, sessions };
    }
    if (String(data.version) !== '1' || !Array.isArray(data.records)) throw new Error('Unsupported history format');
    legacy = data.records;
  }
  const records = legacy.map(record).reverse();
  return { version: 2, sessions: records.length ? [{
    id: 'legacy-session', createdAt: records[0].createdAt,
    mode: 'sequential', selectedFormulas: [], records,
  }] : [] };
}

function mergeSessionMetadata(
  existing: Omit<PracticeSession, 'records'>,
  incoming: Omit<PracticeSession, 'records'>,
): Omit<PracticeSession, 'records'> {
  const synthetic = (session: Omit<PracticeSession, 'records'>) =>
    session.id === 'legacy-session' && session.mode === 'sequential' && session.selectedFormulas.length === 0;
  if (synthetic(existing) && synthetic(incoming)) {
    return { ...existing, createdAt: Math.min(existing.createdAt, incoming.createdAt) };
  }
  if (existing.id !== incoming.id || existing.createdAt !== incoming.createdAt || existing.mode !== incoming.mode ||
      existing.selectedFormulas.length !== incoming.selectedFormulas.length ||
      existing.selectedFormulas.some((formula, index) => formula !== incoming.selectedFormulas[index])) {
    throw new Error('Conflicting history session metadata');
  }
  return existing;
}

/** Cleanup cannot undo commit; fingerprints prevent retained sources from being reimported. */
function cleanupHistorySource(key: string, raw: string): void {
  try {
    if (localStorage.getItem(key) === raw) localStorage.removeItem(key);
  } catch {
    // Do not turn a committed write into failure or trigger settings rollback.
  }
}

export function putHistory(tx: IDBTransaction, scope: string, data: HistorySnapshot, merge: boolean): void {
  const sessions = tx.objectStore('sessions');
  const records = tx.objectStore('records');
  const recordIds = new Set<string>();
  const sessionIds = new Set<string>();
  for (const session of data.sessions) {
    if (sessionIds.has(session.id)) throw new Error('Duplicate history session ID');
    sessionIds.add(session.id);
    const { records: entries, ...metadata } = session;
    const row: SessionRow = { ...metadata, scope };
    if (merge) {
      const existing = sessions.get([scope, row.id]);
      existing.onsuccess = () => {
        if (!existing.result) sessions.put(row);
        else {
          try {
            const metadata = mergeSessionMetadata(existing.result as SessionRow, row);
            if (metadata.createdAt !== existing.result.createdAt) sessions.put({ ...metadata, scope });
          } catch { tx.abort(); }
        }
      };
    } else sessions.put(row);
    for (const entry of entries) {
      if (recordIds.has(entry.id)) throw new Error('Duplicate history record ID');
      recordIds.add(entry.id);
      const row: RecordRow = { ...entry, scope, sessionId: session.id };
      if (merge) {
        const existing = records.get([scope, row.id]);
        existing.onsuccess = () => {
          if (!existing.result) records.put(row);
          else if (JSON.stringify(existing.result) !== JSON.stringify(row)) tx.abort();
        };
      } else records.put(row);
    }
  }
}

export function deleteScope(tx: IDBTransaction, store: 'sessions' | 'records', scope: string): void {
  const request = tx.objectStore(store).index('scope').openKeyCursor(IDBKeyRange.only(scope));
  request.onsuccess = () => {
    const cursor = request.result;
    if (cursor) { tx.objectStore(store).delete(cursor.primaryKey); cursor.continue(); }
  };
}

export async function migrateHistoryScope(scope: string, legacyScope?: string): Promise<IDBDatabase> {
  const db = await openHistoryDb();
  const sources = [...new Set(legacyScope ? [scope, legacyScope] : [scope])];
  for (const source of sources) {
    const key = `${HISTORY_PREFIX}${source}`;
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    const fingerprint = Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, '0')).join('');
    await historyTransaction<void>(db, 'readwrite', (tx, done) => {
      const migrations = tx.objectStore('migrations');
      const request = migrations.get(key);
      request.onsuccess = () => {
        if (request.result?.fingerprint !== fingerprint) {
          try {
            putHistory(tx, scope, normalizeHistory(raw), true);
            migrations.put({ key, fingerprint });
          } catch { tx.abort(); }
        }
        done();
      };
    });
    // A committed marker makes retries idempotent even if cleanup fails or records are later deleted.
    await historyTransaction<void>(db, 'readonly', (tx, done) => {
      const request = tx.objectStore('migrations').get(key);
      request.onsuccess = () => {
        if (request.result?.fingerprint !== fingerprint) tx.abort();
        else done();
      };
    });
    cleanupHistorySource(key, raw);
  }
  return db;
}

export async function exportHistory(): Promise<Record<string, HistorySnapshot>> {
  const sources: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(HISTORY_PREFIX)) sources.push(key.slice(HISTORY_PREFIX.length));
  }
  for (const source of sources) await migrateHistoryScope(canonicalHistoryScope(source), source);
  const db = await openHistoryDb();
  return historyTransaction(db, 'readonly', (tx, done) => {
    const result: Record<string, HistorySnapshot> = Object.create(null);
    const sessions = new Map<string, PracticeSession>();
    const request = tx.objectStore('sessions').openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const { scope, ...metadata } = cursor.value as SessionRow;
        const session = { ...metadata, records: [] as FormulaPracticeRecord[] };
        (result[scope] ??= { version: 2, sessions: [] }).sessions.push(session);
        sessions.set(JSON.stringify([scope, session.id]), session);
        cursor.continue();
      } else {
        const records = tx.objectStore('records').openCursor();
        records.onsuccess = () => {
          const cursor = records.result;
          if (cursor) {
            const { scope, sessionId, ...record } = cursor.value as RecordRow;
            const session = sessions.get(JSON.stringify([scope, sessionId]));
            if (!session) { tx.abort(); return; }
            session.records.push(record);
            cursor.continue();
          } else {
            for (const data of Object.values(result)) {
              data.sessions.sort((a, b) => b.createdAt - a.createdAt);
              for (const session of data.sessions) session.records.sort((a, b) => a.createdAt - b.createdAt);
            }
            done(result);
          }
        };
      }
    };
  });
}

/** Replace only libraries present in the backup; commit all those libraries together. */
export async function importHistory(histories: Record<string, unknown>): Promise<void> {
  const data = new Map<string, HistorySnapshot>();
  for (const [source, value] of Object.entries(histories)) {
    const scope = canonicalHistoryScope(source);
    const snapshot = normalizeHistory(value);
    const previous = data.get(scope);
    if (previous) {
      // Both colon and hyphen keys can occur in old backups. Merge identical records by ID.
      for (const session of snapshot.sessions) {
        const existing = previous.sessions.find((s) => s.id === session.id);
        if (!existing) previous.sessions.push(session);
        else {
          existing.createdAt = mergeSessionMetadata(existing, session).createdAt;
          for (const record of session.records) {
            const old = existing.records.find((r) => r.id === record.id);
            if (!old) existing.records.push(record);
            else if (JSON.stringify(old) !== JSON.stringify(record)) throw new Error('Conflicting backup record IDs');
          }
        }
      }
    } else data.set(scope, snapshot);
  }
  const db = await openHistoryDb();
  const obsolete: Array<{ key: string; raw: string; fingerprint: string }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(HISTORY_PREFIX) && data.has(canonicalHistoryScope(key.slice(HISTORY_PREFIX.length)))) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
        const fingerprint = Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, '0')).join('');
        obsolete.push({ key, raw, fingerprint });
      }
    }
  }
  await historyTransaction<void>(db, 'readwrite', (tx, done) => {
    // Mark replaced legacy sources in the same commit, including when later cleanup is denied.
    for (const { key, fingerprint } of obsolete) tx.objectStore('migrations').put({ key, fingerprint });
    for (const [scope, snapshot] of data) {
      // Queue insertion after cursor deletion has finished, so it cannot delete imported rows.
      let remaining = 2;
      for (const store of ['sessions', 'records'] as const) {
        const request = tx.objectStore(store).index('scope').openKeyCursor(IDBKeyRange.only(scope));
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) { tx.objectStore(store).delete(cursor.primaryKey); cursor.continue(); }
          else if (--remaining === 0) {
            try { putHistory(tx, scope, snapshot, false); } catch { tx.abort(); }
          }
        };
      }
    }
    done();
  });
  // Do not allow pre-import localStorage history to reappear on the next read.
  for (const { key, raw } of obsolete) {
    cleanupHistorySource(key, raw);
  }
}
