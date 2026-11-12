import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// No test runner dependency: transpile this import-free helper with the project's TypeScript.
const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('./formulaPracticeTimer.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const helper = { exports: {} };
new Function('module', 'exports', compiled)(helper, helper.exports);
const { PracticeTimer, snapshotIdentity, buildPracticeSlots, formatPracticeTime } = helper.exports;

const question = (name) => ({ setName: 'S', groupName: 'G', alg: { name, algs: [`answer ${name}`], scrambles: [`scramble ${name}`, `alternate ${name}`], image: `<svg>${name}</svg>` } });
const snapshot = (patch = {}) => ({ cube: '333', classId: 'PLL', mode: 'sequential', trimRatio: 5, remindProficiency: true, algs: [question('A'), question('B')], ...patch });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = () => new Promise((resolve) => setImmediate(resolve));
function fixture(overrides = {}) {
  let now = 100;
  const writes = [];
  const sessions = [];
  const cleared = [];
  const timer = new PracticeTimer({
    now: () => now, random: () => 0.25, weight: () => 3,
    create: async (input) => { sessions.push(input); return `s${sessions.length}`; },
    append: async (scope, id, input) => { writes.push({ scope, id, input }); return { ...input, id: `r${writes.length}`, createdAt: 1234 }; },
    clear: async (scope) => { cleared.push(scope); }, ...overrides,
  });
  return { timer, writes, sessions, cleared, time: (value) => { now = value; } };
}

test('space preparation and matching release, synchronous double-input lock, fractional monotonic duration', async () => {
  const { timer, writes, time } = fixture();
  await timer.configure(snapshot());
  assert.equal(timer.arm('keyboard'), true);
  assert.equal(timer.getSnapshot().phase, 'armed');
  assert.equal(timer.arm('pointer:1'), false);
  timer.release('pointer:1');
  assert.equal(timer.getSnapshot().phase, 'armed');
  timer.release('keyboard');
  time(1334.5);
  timer.release('keyboard');
  timer.stop();
  timer.stop();
  timer.retry();
  assert.equal(timer.getSnapshot().phase, 'saving');
  assert.equal(timer.getSnapshot().index, 0);
  assert.equal(timer.arm('keyboard'), false);
  await flush();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].input.timeMs, 1234.5);
  assert.equal(timer.getSnapshot().index, 1);
  assert.equal(timer.getSnapshot().phase, 'ready');
});

test('failed save retains the exact pending input and snapshot, retry advances once only', async () => {
  const first = deferred();
  const second = deferred();
  const calls = [];
  const { timer, time } = fixture({ append: (scope, id, input) => { calls.push({ scope, id, input }); return calls.length === 1 ? first.promise : second.promise; } });
  await timer.configure(snapshot());
  timer.arm('keyboard'); timer.release('keyboard'); time(1200); timer.stop();
  const pending = timer.getSnapshot().pending;
  assert.equal(typeof pending.id, 'string');
  assert.equal(typeof pending.createdAt, 'number');
  first.reject(new Error('transaction aborted'));
  await flush();
  assert.equal(timer.getSnapshot().phase, 'error');
  assert.strictEqual(timer.getSnapshot().pending, pending);
  timer.navigate(1);
  assert.equal(timer.getSnapshot().index, 0);
  assert.equal(await timer.configure(snapshot({ cube: '222' })), false);
  timer.retry(); timer.retry(); timer.stop();
  assert.equal(calls.length, 2);
  assert.strictEqual(calls[0].input, calls[1].input);
  assert.strictEqual(calls[0].scope, calls[1].scope);
  second.resolve({ ...pending, id: 'committed', createdAt: 1 });
  await flush();
  assert.equal(timer.getSnapshot().index, 1);
  assert.equal(timer.getSnapshot().revision, 1);
  assert.equal(timer.getSnapshot().pending, null);
  timer.retry();
  assert.equal(calls.length, 2);
});

const missingSession = () => Object.assign(new Error('session removed'), { code: 'PRACTICE_SESSION_MISSING' });

test('external clear/import removal recovers original snapshot, cursor and stable pending identity once', async () => {
  const calls = [];
  const { timer, sessions } = fixture({ append: async (scope, id, input) => {
    calls.push({ scope, id, input });
    if (id === 's1') throw missingSession();
    return { ...input };
  } });
  await timer.configure(snapshot());
  timer.navigate(1);
  const original = timer.getSnapshot().snapshot;
  const slots = timer.getSnapshot().slots;
  // A paused/reopened timer keeps the ID until the store reports it missing.
  await timer.configure(snapshot());
  timer.arm('keyboard'); timer.release('keyboard'); timer.stop();
  const pending = timer.getSnapshot().pending;
  timer.stop(); timer.retry();
  await flush();
  assert.equal(sessions.length, 2);
  assert.strictEqual(sessions[1], original);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].id, 's1');
  assert.equal(calls[1].id, 's2');
  assert.strictEqual(calls[1].input, pending);
  assert.strictEqual(calls[0].input, pending);
  assert.equal(calls[1].input.formulaName, 'B');
  assert.equal(timer.getSnapshot().lastRecord.id, pending.id);
  assert.equal(timer.getSnapshot().lastRecord.createdAt, pending.createdAt);
  assert.strictEqual(timer.getSnapshot().slots, slots);
  assert.strictEqual(timer.getSnapshot().snapshot, original);
  assert.equal(timer.getSnapshot().phase, 'ready');
  assert.equal(timer.getSnapshot().sessionId, 's2');
  assert.equal(timer.getSnapshot().index, 0);
  assert.equal(timer.getSnapshot().revision, 1);
  timer.retry();
  assert.equal(calls.length, 2);
});

test('recovery creation failure retains pending, invalidates ID, and explicit retry recreates safely', async () => {
  const creation = deferred();
  const creates = [];
  const appends = [];
  const { timer } = fixture({
    create: (scope) => { creates.push(scope); return creates.length === 2 ? creation.promise : Promise.resolve(`s${creates.length}`); },
    append: async (scope, id, input) => {
      appends.push({ scope, id, input });
      if (id === 's1') throw missingSession();
      return { ...input };
    },
  });
  await timer.configure(snapshot());
  timer.arm('keyboard'); timer.release('keyboard'); timer.stop();
  const pending = timer.getSnapshot().pending;
  await flush();
  assert.equal(timer.getSnapshot().phase, 'saving');
  assert.equal(timer.getSnapshot().sessionId, null);
  assert.equal(timer.arm('keyboard'), false);
  assert.equal(await timer.configure(snapshot({ cube: '222' })), false);
  creation.reject(new Error('quota'));
  await flush();
  assert.equal(timer.getSnapshot().phase, 'error');
  assert.strictEqual(timer.getSnapshot().pending, pending);
  assert.equal(timer.getSnapshot().index, 0);
  assert.equal(creates.length, 2);
  await flush();
  assert.equal(creates.length, 2, 'no automatic retry loop');
  timer.retry(); timer.retry();
  await flush();
  assert.equal(creates.length, 3);
  assert.strictEqual(creates[2], creates[0]);
  assert.equal(appends.length, 2);
  assert.equal(appends[1].id, 's3');
  assert.strictEqual(appends[1].input, pending);
  assert.equal(timer.getSnapshot().lastRecord.id, pending.id);
  assert.equal(timer.getSnapshot().pending, null);
  assert.equal(timer.getSnapshot().phase, 'ready');
});

test('a recreated session removed again stops after one recovery, retry makes one more attempt', async () => {
  let missing = true;
  const calls = [];
  const { timer, sessions } = fixture({ append: async (scope, id, input) => {
    calls.push({ scope, id, input });
    if (missing) throw missingSession();
    return { ...input };
  } });
  await timer.configure(snapshot());
  timer.arm('keyboard'); timer.release('keyboard'); timer.stop();
  const pending = timer.getSnapshot().pending;
  await flush(); await flush();
  assert.equal(sessions.length, 2);
  assert.equal(calls.length, 2);
  assert.equal(timer.getSnapshot().sessionId, null);
  assert.equal(timer.getSnapshot().phase, 'error');
  assert.strictEqual(timer.getSnapshot().pending, pending);
  missing = false;
  timer.retry();
  await flush();
  assert.equal(sessions.length, 3);
  assert.equal(calls.length, 3);
  assert.strictEqual(calls[2].input, pending);
  assert.equal(timer.getSnapshot().revision, 1);
});

test('ordinary append failures never recreate a session or match an error message alone', async () => {
  const { timer, sessions } = fixture({ append: async () => { throw new Error('Practice session not found'); } });
  await timer.configure(snapshot());
  timer.arm('keyboard'); timer.release('keyboard'); timer.stop();
  await flush();
  assert.equal(timer.getSnapshot().phase, 'error');
  assert.equal(timer.getSnapshot().sessionId, 's1');
  assert.equal(sessions.length, 1);
});

test('ambiguous acknowledgement after recovered append retries the same ID without duplicate records', async () => {
  const committed = new Map();
  const attempts = [];
  let loseAcknowledgement = true;
  const { timer, sessions } = fixture({ append: async (scope, id, input) => {
    attempts.push({ scope, id, input });
    if (id === 's1') throw missingSession();
    if (!committed.has(input.id)) committed.set(input.id, { ...input });
    if (loseAcknowledgement) { loseAcknowledgement = false; throw new Error('lost response'); }
    return committed.get(input.id);
  } });
  await timer.configure(snapshot());
  timer.arm('keyboard'); timer.release('keyboard'); timer.stop();
  const pending = timer.getSnapshot().pending;
  await flush();
  assert.equal(timer.getSnapshot().phase, 'error');
  assert.equal(timer.getSnapshot().sessionId, 's2');
  timer.retry(); timer.retry();
  await flush();
  assert.equal(sessions.length, 2);
  assert.equal(attempts.length, 3);
  assert.strictEqual(attempts[2].input, pending);
  assert.equal(attempts[2].id, 's2');
  assert.equal(committed.size, 1);
  assert.equal(timer.getSnapshot().index, 1);
  assert.equal(timer.getSnapshot().revision, 1);
  assert.equal(timer.getSnapshot().lastRecord.id, pending.id);
});

test('interrupt and pointercancel never write a result or start on a late release', async () => {
  const { timer, writes } = fixture();
  await timer.configure(snapshot());
  timer.arm('pointer:7'); timer.cancelArm('pointer:8');
  assert.equal(timer.getSnapshot().phase, 'armed');
  timer.cancelArm('pointer:7'); timer.release('pointer:7');
  assert.equal(timer.getSnapshot().phase, 'ready');
  timer.arm('keyboard'); timer.interrupt(); timer.release('keyboard');
  assert.equal(timer.getSnapshot().phase, 'ready');
  timer.arm('pointer:7'); timer.release('pointer:7'); timer.interrupt(); timer.stop();
  assert.equal(timer.getSnapshot().interrupted, true);
  await flush();
  assert.equal(writes.length, 0);
});

test('same configuration resumes cursor/session, all identity inputs create a fresh session', async () => {
  const { timer, sessions } = fixture();
  const input = snapshot();
  await timer.configure(input); timer.navigate(1);
  assert.equal(await timer.configure(snapshot()), true);
  assert.equal(timer.getSnapshot().index, 1);
  assert.equal(sessions.length, 1);
  const identities = [
    snapshot({ cube: '222' }), snapshot({ classId: 'OLL' }), snapshot({ mode: 'random' }),
    snapshot({ trimRatio: 10 }), snapshot({ remindProficiency: false }), snapshot({ algs: [question('A')] }),
    snapshot({ algs: [question('B'), question('A')] }),
    snapshot({ algs: [{ ...question('A'), alg: { ...question('A').alg, scrambles: ['changed'] } }, question('B')] }),
    snapshot({ algs: [{ ...question('A'), alg: { ...question('A').alg, algs: ['changed'] } }, question('B')] }),
    snapshot({ algs: [{ ...question('A'), alg: { ...question('A').alg, image: 'changed' } }, question('B')] }),
  ];
  for (const changed of identities) {
    assert.notEqual(snapshotIdentity(changed), snapshotIdentity(input));
    await timer.configure(changed);
    assert.equal(timer.getSnapshot().index, 0);
  }
  assert.equal(sessions.length, identities.length + 1);
});

test('session display and writes share a detached question snapshot', async () => {
  const { timer, writes, sessions } = fixture();
  const input = snapshot();
  await timer.configure(input);
  input.algs[0].alg.name = 'mutated';
  input.algs[0].alg.scrambles[0] = 'mutated';
  input.algs[0].alg.algs.push('mutated');
  assert.equal(timer.getSnapshot().snapshot.algs[0].alg.name, 'A');
  assert.strictEqual(timer.getSnapshot().snapshot, sessions[0]);
  timer.arm('keyboard'); timer.release('keyboard'); timer.stop();
  await flush();
  assert.strictEqual(writes[0].scope, sessions[0]);
  assert.equal(writes[0].input.formulaName, 'A');
  assert.equal(writes[0].input.scramble, 'scramble A');
  assert.deepEqual(writes[0].input.algs, ['answer A']);
  assert.equal(writes[0].input.image, '<svg>A</svg>');
});

test('asynchronous session creation is locked; failures can retry without a stale ID', async () => {
  const create = deferred();
  let calls = 0;
  const { timer } = fixture({ create: () => { calls++; return calls === 1 ? create.promise : Promise.resolve('retry'); } });
  const started = timer.configure(snapshot());
  assert.equal(timer.getSnapshot().phase, 'loading');
  assert.equal(await timer.configure(snapshot({ cube: '222' })), false);
  assert.equal(timer.arm('keyboard'), false);
  create.reject(new Error('blocked'));
  assert.equal(await started, false);
  assert.equal(timer.getSnapshot().sessionId, null);
  assert.equal(await timer.configure(snapshot()), true);
  assert.equal(timer.getSnapshot().sessionId, 'retry');
});

test('clear locks input, rebuilds a valid session, does not reuse the deleted ID', async () => {
  const clear = deferred();
  const { timer, sessions, writes } = fixture({ clear: () => clear.promise });
  await timer.configure(snapshot());
  const clearing = timer.clearHistory();
  assert.equal(timer.getSnapshot().phase, 'clearing');
  assert.equal(timer.arm('keyboard'), false);
  assert.equal(await timer.clearHistory(), false);
  clear.resolve();
  assert.equal(await clearing, true);
  assert.equal(sessions.length, 2);
  assert.equal(timer.getSnapshot().sessionId, 's2');
  timer.arm('keyboard'); timer.release('keyboard'); timer.stop();
  await flush();
  assert.equal(writes[0].id, 's2');
});

test('clear failure preserves the active session; rebuild failure removes deleted session ID', async () => {
  const { timer } = fixture({ clear: async () => { throw new Error('abort'); } });
  await timer.configure(snapshot());
  assert.equal(await timer.clearHistory(), false);
  assert.equal(timer.getSnapshot().sessionId, 's1');
  let attempts = 0;
  const rebuilt = fixture({ create: async () => { if (++attempts > 1) throw new Error('quota'); return 'first'; } });
  await rebuilt.timer.configure(snapshot());
  assert.equal(await rebuilt.timer.clearHistory(), false);
  assert.equal(rebuilt.timer.getSnapshot().sessionId, null);
  assert.equal(rebuilt.timer.getSnapshot().phase, 'error');
  assert.equal(rebuilt.timer.arm('keyboard'), false);
});

test('a committed result cannot be retried if next-round scheduling throws', async () => {
  let bad = false;
  const { timer, writes } = fixture({ weight: () => { if (bad) throw new Error('bad weight provider'); return 3; } });
  await timer.configure(snapshot({ mode: 'weightedRandom' }));
  timer.navigate(1);
  timer.arm('keyboard'); timer.release('keyboard'); bad = true; timer.stop();
  await flush();
  assert.equal(timer.getSnapshot().phase, 'ready');
  assert.equal(timer.getSnapshot().pending, null);
  timer.retry();
  assert.equal(writes.length, 1);
});

test('old and new libraries have isolated pending saves and subscriptions', async () => {
  const oldWrite = deferred();
  const old = fixture({ append: () => oldWrite.promise });
  const current = fixture();
  let updates = 0;
  const unsubscribe = old.timer.subscribe(() => updates++);
  await old.timer.configure(snapshot());
  old.timer.arm('keyboard'); old.timer.release('keyboard'); old.timer.stop();
  const previousUpdates = updates;
  unsubscribe(); old.timer.interrupt();
  await current.timer.configure(snapshot({ classId: 'OLL' }));
  oldWrite.resolve({ ...old.timer.getSnapshot().pending, id: 'old', createdAt: 1 });
  await flush();
  assert.equal(updates, previousUpdates);
  assert.equal(current.timer.getSnapshot().lastRecord, null);
  assert.equal(current.timer.getSnapshot().snapshot.classId, 'OLL');
  assert.equal(old.timer.getSnapshot().lastRecord.id, 'old');
});

test('four existing mode semantics and empty/no-scramble guards', async () => {
  for (const mode of ['sequential', 'random', 'nonRepeatRandom', 'weightedRandom']) {
    const slots = buildPracticeSlots(snapshot({ mode }), () => 0.25, () => 3);
    assert.equal(slots.length, 2);
    assert.ok(slots.every((slot) => slot.scrambleIdx === 0));
    if (mode !== 'weightedRandom') assert.equal(new Set(slots.map((slot) => slot.algIdx)).size, 2);
  }
  const { timer, sessions } = fixture();
  assert.equal(await timer.configure(snapshot({ algs: [] })), false);
  assert.equal(sessions.length, 0);
  await timer.configure(snapshot({ algs: [{ ...question('A'), alg: { name: 'A', algs: [], scrambles: [] } }] }));
  assert.equal(timer.arm('keyboard'), false);
  timer.navigate(-1);
  assert.equal(timer.getSnapshot().index, 0);
});

test('time formatting uses centiseconds and handles minute boundaries', () => {
  assert.equal(formatPracticeTime(0), '00.00');
  assert.equal(formatPracticeTime(59999.99), '59.99');
  assert.equal(formatPracticeTime(60000), '1:00.00');
  assert.equal(formatPracticeTime(123456.7), '2:03.45');
});
