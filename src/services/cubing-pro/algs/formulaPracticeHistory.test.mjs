import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';

// Run with tsx; fake-indexeddb may be installed outside the repository.
const require = createRequire(process.env.HISTORY_TEST_TOOLS
  ? `${process.env.HISTORY_TEST_TOOLS}/package.json` : import.meta.url);
const fake = require('fake-indexeddb');
Object.assign(globalThis, { indexedDB: fake.indexedDB, IDBKeyRange: fake.IDBKeyRange });

class Storage {
  values = new Map();
  failWrite = false;
  failRemove = false;
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) {
    if (this.failWrite) throw new Error('QuotaExceededError');
    this.values.set(key, String(value));
  }
  removeItem(key) {
    if (this.failRemove) throw new Error('Cleanup denied');
    this.values.delete(key);
  }
  clear() { this.values.clear(); }
}
const storage = new Storage();
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });

const history = await import('./formulaPracticeHistory.ts');
const dbApi = await import('./formulaPracticeHistoryDb.ts');
const backup = await import('./practiceConfigExport.ts');
const selection = await import('./formulaPracticeSelection.ts');
const config = await import('./formulaPracticeConfig.ts');
const input = {
  timeMs: 1200, formulaKey: 'S:G:F', formulaName: 'F', setName: 'S', groupName: 'G',
  scramble: "R U R'", scrambleIndex: 0, image: '<svg>keep</svg>', algs: ['R U'],
};
const record = (id, createdAt = 1) => ({ ...input, id, createdAt });
const snapshot = (records, id = 'session') => ({ version: 2, sessions: [{
  id, createdAt: 1, mode: 'random', selectedFormulas: ['S:G:F'], records,
}] });

test('practice configuration rejects invalid values and failed writes instead of reporting success', () => {
  storage.failWrite = true;
  try { assert.throws(() => config.saveFormulaPracticeConfig('3', 'config', { trimRatio: 10 }), /QuotaExceededError/); }
  finally { storage.failWrite = false; }
  assert.throws(() => config.saveFormulaPracticeConfig('3', 'config', { trimRatio: NaN }), /Invalid practice configuration/);
  config.saveFormulaPracticeConfig('3', 'config', { trimRatio: 10, remindProficiency: false });
  assert.deepEqual(config.getFormulaPracticeConfig('3', 'config'), { trimRatio: 10, remindProficiency: false });
});

test('old arrays, numeric/string v1/v2, both key styles migrate losslessly and idempotently', async () => {
  const formats = [
    [{ ...record('array'), time: 900, timeMs: undefined }],
    { version: 1, records: [record('v1')] },
    { version: '1', records: [record('string-v1')] },
    snapshot([record('v2')]),
    { ...snapshot([record('string-v2')]), version: '2' },
  ];
  for (let i = 0; i < formats.length; i++) {
    const classId = `legacy${i}`;
    const key = `${dbApi.HISTORY_PREFIX}3:${classId}`;
    storage.setItem(key, JSON.stringify(formats[i]));
    const first = await history.getFormulaPracticeHistory('3', classId);
    assert.equal(first.length, 1);
    assert.equal(first[0].image, input.image);
    if (i === 0) assert.equal(first[0].timeMs, 900);
    assert.equal(storage.getItem(key), null);
    assert.deepEqual(await history.getFormulaPracticeHistory('3', classId), first);
  }
  storage.setItem(`${dbApi.HISTORY_PREFIX}3-both`, JSON.stringify(snapshot([record('a')])));
  storage.setItem(`${dbApi.HISTORY_PREFIX}3:both`, JSON.stringify(snapshot([record('b')])));
  assert.equal((await history.getFormulaPracticeHistory('3', 'both')).length, 2);
});

test('migration abort retains the original source and rolls back all rows', async () => {
  const key = `${dbApi.HISTORY_PREFIX}3-abort`;
  const raw = JSON.stringify(snapshot([record('abort-record')]));
  storage.setItem(key, raw);
  const original = fake.IDBObjectStore.prototype.put;
  fake.IDBObjectStore.prototype.put = function (...args) {
    const request = original.apply(this, args);
    if (this.name === 'records') request.addEventListener('success', () => this.transaction.abort());
    return request;
  };
  try { await assert.rejects(history.getFormulaPracticeHistory('3', 'abort')); }
  finally { fake.IDBObjectStore.prototype.put = original; }
  assert.equal(storage.getItem(key), raw);
  assert.equal((await history.getFormulaPracticeHistory('3', 'abort')).length, 1);
});

test('commit followed by failed cleanup is retryable without duplicates', async () => {
  const key = `${dbApi.HISTORY_PREFIX}3-retry`;
  const raw = JSON.stringify([{ time: 20, formulaName: 'old' }]);
  storage.setItem(key, raw);
  storage.failRemove = true;
  try {
    assert.equal((await history.getFormulaPracticeHistory('3', 'retry')).length, 1);
    assert.equal((await history.getFormulaPracticeHistory('3', 'retry')).length, 1);
  }
  finally { storage.failRemove = false; }
  assert.equal(storage.getItem(key), raw);
  assert.equal((await history.getFormulaPracticeHistory('3', 'retry')).length, 1);
  assert.equal(storage.getItem(key), null);
});

test('invalid or conflicting migration never deletes source data', async () => {
  const key = `${dbApi.HISTORY_PREFIX}3-invalid`;
  storage.setItem(key, '{bad JSON');
  await assert.rejects(history.getFormulaPracticeHistory('3', 'invalid'));
  assert.equal(storage.getItem(key), '{bad JSON');
  storage.removeItem(key);
  const conflict = `${dbApi.HISTORY_PREFIX}3:both`;
  const raw = JSON.stringify(snapshot([{ ...record('a'), timeMs: 999 }]));
  storage.setItem(conflict, raw);
  await assert.rejects(history.getFormulaPracticeHistory('3', 'both'));
  assert.equal(storage.getItem(conflict), raw);
  storage.removeItem(conflict);
});

test('unlimited sessions/records, scoped count, indexed pagination and bounded summary', async () => {
  const sessions = Array.from({ length: 65 }, (_, s) => ({
    ...snapshot([]).sessions[0], id: `session${s}`,
    records: Array.from({ length: 25 }, (_, r) => record(`r${s * 25 + r}`, s * 25 + r)),
  }));
  await dbApi.importHistory({ '3-large': { version: 2, sessions } });
  const id = await history.createPracticeSession('3', 'large', { mode: 'random', selectedFormulas: [] });
  for (let i = 0; i < 105; i++) await history.appendFormulaPracticeRecord('3', 'large', id, input);
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'large'), 1730);
  const all = await history.getFormulaPracticeHistory('3', 'large');
  const page = await history.getFormulaPracticeHistoryPage('3', 'large', 3, 17);
  assert.equal(page.total, 1730);
  assert.deepEqual(page.records, all.slice(34, 51));
  assert.deepEqual((await history.getFormulaPracticeHistoryPage('3', 'large', 10000)).records, []);
  assert.equal((await history.getRecentFormulaPracticeHistory('3', 'large', 7)).length, 7);
  const summary = await history.getFormulaPracticeHistorySummary('3', 'large');
  assert.equal(summary.total, 1730);
  assert.equal(summary.recentRecords.length, 1000);
  assert.equal(summary.averages.ao1000, 1200);
  await assert.rejects(history.getFormulaPracticeHistoryPage('3', 'large', 0));
  await assert.rejects(history.getFormulaPracticeHistoryPage('3', 'large', 1, 0));
});

test('append does not scan/rewrite history, missing sessions reject, aborted writes reject', async () => {
  const id = await history.createPracticeSession('3', 'write', { mode: 'sequential', selectedFormulas: [] });
  const cursor = fake.IDBIndex.prototype.openCursor;
  fake.IDBIndex.prototype.openCursor = () => { throw new Error('Unexpected full history scan'); };
  try {
    const saved = await history.appendFormulaPracticeRecord('3', 'write', id, input);
    assert.equal(saved.image, input.image);
    await assert.rejects(history.appendFormulaPracticeRecord('3', 'write', 'missing', input), /not found/);
  } finally { fake.IDBIndex.prototype.openCursor = cursor; }
  const add = fake.IDBObjectStore.prototype.add;
  fake.IDBObjectStore.prototype.add = function (...args) {
    const request = add.apply(this, args);
    request.addEventListener('success', () => this.transaction.abort());
    return request;
  };
  try {
    await assert.rejects(history.createPracticeSession('3', 'write', { mode: 'random', selectedFormulas: [] }));
    await assert.rejects(history.appendFormulaPracticeRecord('3', 'write', id, input));
  } finally { fake.IDBObjectStore.prototype.add = add; }
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'write'), 1);
});

test('delete/clear are scoped and do not resurrect migrated records', async () => {
  const entries = await history.getFormulaPracticeHistory('3', 'both');
  await history.deleteFormulaPracticeRecord('3', 'both', entries[0].id);
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'both'), 1);
  await history.clearFormulaPracticeHistory('3', 'both');
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'both'), 0);
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'large'), 1730);
});

test('delete/clear transaction failures reject and preserve records', async () => {
  const id = await history.createPracticeSession('3', 'delete-failure', { mode: 'random', selectedFormulas: [] });
  const saved = await history.appendFormulaPracticeRecord('3', 'delete-failure', id, input);
  const original = fake.IDBObjectStore.prototype.delete;
  fake.IDBObjectStore.prototype.delete = function (...args) {
    const request = original.apply(this, args);
    request.addEventListener('success', () => this.transaction.abort());
    return request;
  };
  try {
    await assert.rejects(history.deleteFormulaPracticeRecord('3', 'delete-failure', saved.id));
    await assert.rejects(history.clearFormulaPracticeHistory('3', 'delete-failure'));
  } finally { fake.IDBObjectStore.prototype.delete = original; }
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'delete-failure'), 1);
});

test('aoN is null until N records are available', () => {
  const records = Array.from({ length: 1000 }, (_, i) => record(`avg${i}`));
  assert.deepEqual(history.computeAverages(records.slice(0, 49), 5), { ao50: null, ao100: null, ao1000: null });
  assert.deepEqual(history.computeAverages(records.slice(0, 50), 5), { ao50: 1200, ao100: null, ao1000: null });
  assert.deepEqual(history.computeAverages(records.slice(0, 100), 5), { ao50: 1200, ao100: 1200, ao1000: null });
  assert.equal(history.computeAverages(records.slice(0, 999), 5).ao1000, null);
  assert.equal(history.computeAverages(records, 5).ao1000, 1200);
});

test('async backup round trip includes DB, empty sessions and actual custom keys', async () => {
  storage.setItem('algs_custom_3:OLL:S:G:F', JSON.stringify(['R U', 'L U']));
  storage.setItem('algs:formula_practice_config:3-large', JSON.stringify({ mode: 'random' }));
  const exported = await backup.exportPracticeConfig();
  assert.equal(exported.version, 2);
  assert.equal(exported.formulaPracticeHistory['3-large'].sessions.length, 66);
  assert.deepEqual(exported.customAlgs['3:OLL:S:G:F'], ['R U', 'L U']);
  await history.clearFormulaPracticeHistory('3', 'large');
  storage.clear();
  assert.deepEqual(await backup.importPracticeConfig(JSON.stringify(exported)), { success: true });
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'large'), 1730);
  assert.deepEqual(JSON.parse(storage.getItem('algs_custom_3:OLL:S:G:F')), ['R U', 'L U']);
  assert.deepEqual((await backup.exportPracticeConfig()).formulaPracticeHistory, exported.formulaPracticeHistory);
});

test('version 1 backup restores history to IndexedDB and custom formulas to actual keys', async () => {
  const data = { version: 1, formulaPracticeHistory: {
    '3:imported': [{ ...record('old-import'), time: 1200 }],
  }, customFormulas: { '3:PLL:F': ['R U'] } };
  assert.deepEqual(await backup.importPracticeConfig(JSON.stringify(data)), { success: true });
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'imported'), 1);
  assert.deepEqual(JSON.parse(storage.getItem('algs_custom_3:PLL:F')), ['R U']);
  assert.equal(storage.getItem(`${dbApi.HISTORY_PREFIX}3:imported`), null);
});

test('import reports localStorage/DB failure and restores previous settings', async () => {
  storage.failWrite = true;
  try {
    assert.equal((await backup.importPracticeConfig(JSON.stringify({ version: 2, config: { fail: {} } }))).success, false);
  } finally { storage.failWrite = false; }
  storage.setItem('algs:formula_practice_config:rollback', 'original');
  const put = fake.IDBObjectStore.prototype.put;
  fake.IDBObjectStore.prototype.put = function (...args) {
    const request = put.apply(this, args);
    if (this.name === 'records') request.addEventListener('success', () => this.transaction.abort());
    return request;
  };
  try {
    const result = await backup.importPracticeConfig(JSON.stringify({ version: 2,
      config: { rollback: { changed: true } },
      formulaPracticeHistory: { '3-large': snapshot([record('replacement')]) },
    }));
    assert.equal(result.success, false);
    assert.equal(storage.getItem('algs:formula_practice_config:rollback'), 'original');
  } finally { fake.IDBObjectStore.prototype.put = put; }
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'large'), 1730);
  assert.equal((await backup.importPracticeConfig('{bad')).success, false);
  assert.equal((await backup.importPracticeConfig('{"version":9}')).success, false);
});

test('selection only removes legacy key after verified save, save failure throws', () => {
  const key = 'algs:formula_practice_selection:3:OLL';
  const data = { selectedSets: ['S'], selectedGroups: [], selectedFormulas: [] };
  storage.setItem(key, JSON.stringify(data));
  storage.failWrite = true;
  try {
    assert.equal(selection.getFormulaPracticeSelection('3', 'OLL'), null);
    assert.notEqual(storage.getItem(key), null);
    assert.throws(() => selection.saveFormulaPracticeSelection('3', 'OLL', data));
  } finally { storage.failWrite = false; }
  assert.deepEqual(selection.getFormulaPracticeSelection('3', 'OLL'), data);
  assert.equal(storage.getItem(key), null);
});

test('concurrent appends commit independent rows without lost writes', async () => {
  const id = await history.createPracticeSession('3', 'concurrent', { mode: 'random', selectedFormulas: [] });
  const records = await Promise.all(Array.from({ length: 50 }, () =>
    history.appendFormulaPracticeRecord('3', 'concurrent', id, input)));
  assert.equal(new Set(records.map((r) => r.id)).size, 50);
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'concurrent'), 50);
});

test('same scope/ID retries return the original commit without any record writes', async () => {
  const sessionId = await history.createPracticeSession('3', 'idempotent', { mode: 'random', selectedFormulas: [] });
  const pending = { ...input, id: 'pending-record', createdAt: 12345 };
  const saved = await history.appendFormulaPracticeRecord('3', 'idempotent', sessionId, pending);
  assert.equal(saved.id, pending.id);
  assert.equal(saved.createdAt, pending.createdAt);
  const originalAdd = fake.IDBObjectStore.prototype.add;
  const originalPut = fake.IDBObjectStore.prototype.put;
  fake.IDBObjectStore.prototype.add = () => { throw new Error('Retry must not add'); };
  fake.IDBObjectStore.prototype.put = () => { throw new Error('Retry must not put'); };
  try {
    const reordered = Object.fromEntries(Object.entries(pending).reverse());
    assert.deepEqual(await history.appendFormulaPracticeRecord('3', 'idempotent', sessionId, reordered), saved);
    assert.deepEqual(await history.appendFormulaPracticeRecord('3', 'idempotent', sessionId, { ...saved }), saved);
  } finally {
    fake.IDBObjectStore.prototype.add = originalAdd;
    fake.IDBObjectStore.prototype.put = originalPut;
  }
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'idempotent'), 1);
  assert.equal((await history.getFormulaPracticeFrequencyStats('3', 'idempotent')).items[0].count, 1);
});

test('ID-only retries retain the first server-generated timestamp', async () => {
  const sessionId = await history.createPracticeSession('3', 'id-only', { mode: 'random', selectedFormulas: [] });
  const pending = { ...input, id: 'id-only' };
  const saved = await history.appendFormulaPracticeRecord('3', 'id-only', sessionId, pending);
  const now = Date.now;
  Date.now = () => saved.createdAt + 10000;
  try {
    assert.deepEqual(await history.appendFormulaPracticeRecord('3', 'id-only', sessionId, pending), saved);
  } finally { Date.now = now; }
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'id-only'), 1);
});

test('conflicting input or session for an existing scope/ID rejects without overwriting', async () => {
  const sessionId = await history.createPracticeSession('3', 'id-conflict', { mode: 'random', selectedFormulas: [] });
  const pending = { ...input, id: 'conflict', createdAt: 100 };
  const saved = await history.appendFormulaPracticeRecord('3', 'id-conflict', sessionId, pending);
  for (const change of [
    { timeMs: 1 }, { formulaKey: 'other' }, { formulaName: 'other' }, { setName: 'other' },
    { groupName: 'other' }, { scramble: 'other' }, { scrambleIndex: 1 }, { image: 'other' },
    { algs: ['other'] }, { algs: [...input.algs, 'other'] }, { createdAt: 101 },
  ]) {
    await assert.rejects(history.appendFormulaPracticeRecord('3', 'id-conflict', sessionId,
      { ...pending, ...change }), /ID conflict/);
  }
  const other = await history.createPracticeSession('3', 'id-conflict', { mode: 'random', selectedFormulas: [] });
  await assert.rejects(history.appendFormulaPracticeRecord('3', 'id-conflict', other, pending), /ID conflict/);
  assert.deepEqual(await history.getFormulaPracticeHistory('3', 'id-conflict'), [saved]);
});

test('concurrent identical IDs commit once, concurrent conflicting IDs reject one request', async () => {
  const sessionId = await history.createPracticeSession('3', 'id-concurrent', { mode: 'random', selectedFormulas: [] });
  const pending = { ...input, id: 'concurrent-once' };
  const saved = await Promise.all(Array.from({ length: 25 }, () =>
    history.appendFormulaPracticeRecord('3', 'id-concurrent', sessionId, pending)));
  assert.ok(saved.every((value) => JSON.stringify(value) === JSON.stringify(saved[0])));
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'id-concurrent'), 1);
  const conflicts = await Promise.allSettled([
    history.appendFormulaPracticeRecord('3', 'id-concurrent', sessionId, { ...input, id: 'race', timeMs: 1 }),
    history.appendFormulaPracticeRecord('3', 'id-concurrent', sessionId, { ...input, id: 'race', timeMs: 2 }),
  ]);
  assert.equal(conflicts.filter((r) => r.status === 'fulfilled').length, 1);
  assert.match(conflicts.find((r) => r.status === 'rejected').reason.message, /ID conflict/);
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'id-concurrent'), 2);
});

test('aborted append can retry the same pending ID and IDs are scoped to a library', async () => {
  const sessionId = await history.createPracticeSession('3', 'id-abort', { mode: 'random', selectedFormulas: [] });
  const pending = { ...input, id: 'retry-aborted', createdAt: 0 };
  const original = fake.IDBObjectStore.prototype.add;
  fake.IDBObjectStore.prototype.add = function (...args) {
    const request = original.apply(this, args);
    if (this.name === 'records') request.addEventListener('success', () => this.transaction.abort());
    return request;
  };
  try { await assert.rejects(history.appendFormulaPracticeRecord('3', 'id-abort', sessionId, pending)); }
  finally { fake.IDBObjectStore.prototype.add = original; }
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'id-abort'), 0);
  assert.deepEqual(await history.appendFormulaPracticeRecord('3', 'id-abort', sessionId, pending), pending);
  const other = await history.createPracticeSession('3', 'id-other-scope', { mode: 'random', selectedFormulas: [] });
  await history.appendFormulaPracticeRecord('3', 'id-other-scope', other, { ...pending, timeMs: 999 });
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'id-abort'), 1);
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'id-other-scope'), 1);
});

test('invalid optional IDs/timestamps reject before writing', async () => {
  for (const change of [{ id: '' }, { id: ' ' }, { id: 1 },
    { createdAt: NaN }, { createdAt: Infinity }, { createdAt: -1 }]) {
    await assert.rejects(history.appendFormulaPracticeRecord('3', 'invalid-input', 'session',
      { ...input, ...change }), /Invalid practice record/);
  }
});

test('frequency stats aggregate all records using a cursor, keep latest metadata, and isolate scope', async () => {
  const rows = Array.from({ length: 1505 }, (_, i) => ({
    ...record(`frequency${i}`, i), formulaKey: i < 1000 ? 'A' : 'B', formulaName: `name${i}`,
  }));
  await dbApi.importHistory({ '3-frequency': snapshot(rows) });
  const originalStoreGetAll = fake.IDBObjectStore.prototype.getAll;
  const originalIndexGetAll = fake.IDBIndex.prototype.getAll;
  const originalCursor = fake.IDBIndex.prototype.openCursor;
  let cursorCalls = 0;
  fake.IDBObjectStore.prototype.getAll = () => { throw new Error('Must not materialize history'); };
  fake.IDBIndex.prototype.getAll = () => { throw new Error('Must not materialize history'); };
  fake.IDBIndex.prototype.openCursor = function (...args) {
    cursorCalls++;
    assert.equal(this.name, 'scopeCreatedAt');
    return originalCursor.apply(this, args);
  };
  try {
    assert.deepEqual(await history.getFormulaPracticeFrequencyStats('3', 'frequency'), {
      total: 1505,
      items: [
        { formulaKey: 'A', formulaName: 'name999', setName: 'S', groupName: 'G', count: 1000, frequency: 1000 / 1505 },
        { formulaKey: 'B', formulaName: 'name1504', setName: 'S', groupName: 'G', count: 505, frequency: 505 / 1505 },
      ],
    });
    assert.equal(cursorCalls, 1);
    assert.deepEqual(await history.getFormulaPracticeFrequencyStats('3', 'frequency-empty'), { items: [], total: 0 });
  } finally {
    fake.IDBObjectStore.prototype.getAll = originalStoreGetAll;
    fake.IDBIndex.prototype.getAll = originalIndexGetAll;
    fake.IDBIndex.prototype.openCursor = originalCursor;
  }
  await history.deleteFormulaPracticeRecord('3', 'frequency', 'frequency0');
  const afterDelete = await history.getFormulaPracticeFrequencyStats('3', 'frequency');
  assert.equal(afterDelete.total, 1504);
  assert.equal(afterDelete.items[0].count, 999);
  assert.equal(afterDelete.items[0].frequency, 999 / 1504);
  await history.clearFormulaPracticeHistory('3', 'frequency');
  assert.deepEqual(await history.getFormulaPracticeFrequencyStats('3', 'frequency'), { items: [], total: 0 });
});

test('concurrent migrations deduplicate the same legacy source', async () => {
  const key = `${dbApi.HISTORY_PREFIX}3:concurrent-migration`;
  storage.setItem(key, JSON.stringify(Array.from({ length: 30 }, (_, i) => ({ time: i + 1 }))));
  const results = await Promise.all(Array.from({ length: 10 }, () =>
    history.getFormulaPracticeHistory('3', 'concurrent-migration')));
  assert.ok(results.every((records) => records.length === 30));
  assert.equal(storage.getItem(key), null);
});

test('migration/export preserve encoded colon and literal hyphen library keys', async () => {
  const cube = 'cube-hyphen';
  const classId = 'class:with-hyphen';
  const legacy = `${encodeURIComponent(cube)}:${encodeURIComponent(classId)}`;
  const scope = dbApi.historyScope(cube, classId);
  storage.setItem(`${dbApi.HISTORY_PREFIX}${legacy}`, JSON.stringify(snapshot([record('special')])));
  const exported = await backup.exportPracticeConfig();
  assert.equal(exported.formulaPracticeHistory[scope].sessions[0].records.length, 1);
  await history.clearFormulaPracticeHistory(cube, classId);
  storage.setItem(`${dbApi.HISTORY_PREFIX}${legacy}`, JSON.stringify(snapshot([record('stale')])));
  assert.deepEqual(await backup.importPracticeConfig(JSON.stringify(exported)), { success: true });
  assert.equal(storage.getItem(`${dbApi.HISTORY_PREFIX}${legacy}`), null);
  assert.deepEqual((await history.getFormulaPracticeHistory(cube, classId)).map((r) => r.id), ['special']);
});

test('import cleanup failure preserves committed config/history and cannot resurrect replaced legacy rows', async () => {
  const key = `${dbApi.HISTORY_PREFIX}3:cleanup-import`;
  const configKey = 'algs:formula_practice_config:cleanup-import';
  storage.setItem(key, JSON.stringify(snapshot([record('stale')])));
  storage.setItem(configKey, JSON.stringify({ mode: 'old' }));
  storage.failRemove = true;
  try {
    const result = await backup.importPracticeConfig(JSON.stringify({ version: 2,
      config: { 'cleanup-import': { mode: 'new' } },
      formulaPracticeHistory: { '3-cleanup-import': snapshot([record('replacement')]) },
    }));
    assert.deepEqual(result, { success: true });
    assert.deepEqual(JSON.parse(storage.getItem(configKey)), { mode: 'new' });
    assert.notEqual(storage.getItem(key), null);
    assert.deepEqual((await history.getFormulaPracticeHistory('3', 'cleanup-import')).map((r) => r.id), ['replacement']);
    await history.clearFormulaPracticeHistory('3', 'cleanup-import');
    assert.deepEqual(await history.getFormulaPracticeHistory('3', 'cleanup-import'), []);
  } finally { storage.failRemove = false; }
  assert.deepEqual(await history.getFormulaPracticeHistory('3', 'cleanup-import'), []);
  assert.equal(storage.getItem(key), null);
  assert.deepEqual(JSON.parse(storage.getItem(configKey)), { mode: 'new' });
});

test('hyphen/colon arrays and v1 sources merge synthetic sessions with different timestamps', async () => {
  for (const reverse of [false, true]) {
    const classId = `dual-legacy-${reverse}`;
    const newer = [record('dual-new', 300), record('dual-shared', 200)];
    const older = { version: 1, records: [record('dual-shared', 200), record('dual-old', 100)] };
    const key = `${dbApi.HISTORY_PREFIX}3-${classId}`;
    const legacyKey = `${dbApi.HISTORY_PREFIX}3:${classId}`;
    storage.setItem(key, JSON.stringify(reverse ? older : newer));
    storage.setItem(legacyKey, JSON.stringify(reverse ? newer : older));
    const entries = await history.getFormulaPracticeHistory('3', classId);
    assert.deepEqual(entries.map((r) => r.id), ['dual-new', 'dual-shared', 'dual-old']);
    assert.equal(storage.getItem(key), null);
    assert.equal(storage.getItem(legacyKey), null);
    assert.equal((await dbApi.exportHistory())[`3-${classId}`].sessions[0].createdAt, 100);
    const sessionId = await history.createPracticeSession('3', classId, { mode: 'random', selectedFormulas: [] });
    await history.appendFormulaPracticeRecord('3', classId, sessionId, input);
    assert.equal(await history.getFormulaPracticeHistoryCount('3', classId), 4);
  }
});

test('dual-key v1/array imports merge synthetic metadata and strictly reject record conflicts', async () => {
  for (const reverse of [false, true]) {
    const scope = `3-dual-import-${reverse}`;
    const newer = [record('import-new', 300), record('import-shared', 200)];
    const older = { version: '1', records: [record('import-shared', 200), record('import-old', 100)] };
    const sources = [[scope, newer], [scope.replace('-', ':'), older]];
    if (reverse) sources.reverse();
    const result = await backup.importPracticeConfig(JSON.stringify({ version: 1,
      formulaPracticeHistory: Object.fromEntries(sources),
    }));
    assert.deepEqual(result, { success: true });
    const exported = (await dbApi.exportHistory())[scope];
    assert.equal(exported.sessions.length, 1);
    assert.equal(exported.sessions[0].createdAt, 100);
    assert.equal(exported.sessions[0].records.length, 3);
    const conflict = await backup.importPracticeConfig(JSON.stringify({ version: 1,
      config: { 'dual-import-conflict': { changed: true } },
      formulaPracticeHistory: {
        [scope]: newer,
        [scope.replace('-', ':')]: { version: 1, records: [{ ...record('import-shared', 200), timeMs: 1 }] },
      },
    }));
    assert.equal(conflict.success, false);
    assert.equal(storage.getItem('algs:formula_practice_config:dual-import-conflict'), null);
    assert.deepEqual((await dbApi.exportHistory())[scope], exported);
  }
});

test('dual-key legacy record conflicts retain failing source and committed rows', async () => {
  const scope = '3-dual-record-conflict';
  const key = `${dbApi.HISTORY_PREFIX}${scope}`;
  const legacyKey = `${dbApi.HISTORY_PREFIX}3:dual-record-conflict`;
  const first = [record('strict-record', 300)];
  const conflict = JSON.stringify({ version: 1, records: [record('strict-record', 100)] });
  storage.setItem(key, JSON.stringify(first));
  storage.setItem(legacyKey, conflict);
  await assert.rejects(history.getFormulaPracticeHistory('3', 'dual-record-conflict'));
  assert.equal(storage.getItem(legacyKey), conflict);
  storage.removeItem(legacyKey);
  assert.deepEqual(await history.getFormulaPracticeHistory('3', 'dual-record-conflict'), first);
  assert.equal((await dbApi.exportHistory())[scope].sessions[0].createdAt, 300);
});

test('normal v2 session metadata conflicts still reject migration/import', async () => {
  const scope = '3-real-session-conflict';
  const first = snapshot([record('real-one')]);
  const second = snapshot([record('real-two')]);
  second.sessions[0].createdAt = 2;
  storage.setItem(`${dbApi.HISTORY_PREFIX}${scope}`, JSON.stringify(first));
  const legacyKey = `${dbApi.HISTORY_PREFIX}3:real-session-conflict`;
  storage.setItem(legacyKey, JSON.stringify(second));
  await assert.rejects(history.getFormulaPracticeHistory('3', 'real-session-conflict'));
  assert.notEqual(storage.getItem(legacyKey), null);
  storage.removeItem(legacyKey);
  await assert.rejects(dbApi.importHistory({ [scope]: first, '3:real-session-conflict': second }), /session metadata/);
  assert.equal(await history.getFormulaPracticeHistoryCount('3', 'real-session-conflict'), 1);
});

test('append exposes identifiable missing-session errors after external clear/import', async () => {
  for (const replacement of ['clear', 'import']) {
    const classId = `missing-${replacement}`;
    const sessionId = await history.createPracticeSession('3', classId, { mode: 'random', selectedFormulas: [] });
    const pending = { ...input, id: `pending-${replacement}`, createdAt: 100 };
    await history.appendFormulaPracticeRecord('3', classId, sessionId, pending);
    if (replacement === 'clear') await history.clearFormulaPracticeHistory('3', classId);
    else await dbApi.importHistory({ [`3-${classId}`]: { version: 2, sessions: [] } });
    await assert.rejects(history.appendFormulaPracticeRecord('3', classId, sessionId, pending), (error) => {
      assert.ok(error instanceof history.PracticeSessionMissingError);
      assert.equal(error.name, 'PracticeSessionMissingError');
      assert.equal(error.code, 'PRACTICE_SESSION_MISSING');
      assert.equal(error.sessionId, sessionId);
      return true;
    });
    assert.equal(await history.getFormulaPracticeHistoryCount('3', classId), 0);
    const renewed = await history.createPracticeSession('3', classId, { mode: 'random', selectedFormulas: [] });
    assert.deepEqual(await history.appendFormulaPracticeRecord('3', classId, renewed, pending), pending);
    assert.equal(await history.getFormulaPracticeHistoryCount('3', classId), 1);
  }
  await assert.rejects(history.appendFormulaPracticeRecord('3', 'empty-session', '', input),
    { code: 'PRACTICE_SESSION_MISSING', sessionId: '' });
});

test('no IndexedDB rejects reads/exports and import returns failure', () => {
  const result = execFileSync(process.execPath, [
    '--import', require.resolve('tsx'),
    '--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      const historyModule = await import('./src/services/cubing-pro/algs/formulaPracticeHistory.ts');
      const { getFormulaPracticeHistory } = historyModule.default ?? historyModule;
      const backupModule = await import('./src/services/cubing-pro/algs/practiceConfigExport.ts');
      const { exportPracticeConfig, importPracticeConfig } = backupModule.default ?? backupModule;
      globalThis.localStorage = { length: 0, getItem: () => null };
      await assert.rejects(getFormulaPracticeHistory('3', 'x'), /unavailable/);
      await assert.rejects(exportPracticeConfig(), /unavailable/);
      assert.equal((await importPracticeConfig(JSON.stringify({ version: 2,
        formulaPracticeHistory: { '3-x': { version: 2, sessions: [] } }
      }))).success, false);
    `,
  ], { encoding: 'utf8' });
  assert.equal(result, '');
});
