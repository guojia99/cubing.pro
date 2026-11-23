import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { clearForumLoginResume, consumeForumLoginResume, readForumLoginResume, saveForumLoginResume } from "./forumResume";

const key = "cubing_pro_forum_login_resume";
const resume = { pathname: "/algs/", thread: { kind: "solution", id: "0123456789abcdef", commentId: 42 }, tab: "recent" } as const;

function withSessionStorage(context: TestContext) {
  const entries = new Map<string, string>();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { sessionStorage: {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  } } });
  context.after(() => { Reflect.deleteProperty(globalThis, "window"); });
  return entries;
}

test("a matching path restores the recent discussion and comment only once, regardless of trailing slash", context => {
  withSessionStorage(context);
  const now = Date.now();
  context.mock.method(Date, "now", () => now);
  assert.equal(saveForumLoginResume(resume), true);
  assert.equal(consumeForumLoginResume("/algs/333/OLL/"), null);
  const expected = { ...resume, pathname: "/algs", ts: now };
  assert.deepEqual(readForumLoginResume("/algs"), expected);
  assert.deepEqual(consumeForumLoginResume("/algs/"), expected);
  assert.equal(readForumLoginResume("/algs"), null);
});

test("expired and malformed records are discarded", context => {
  const entries = withSessionStorage(context);
  let now = Date.now();
  context.mock.method(Date, "now", () => now);
  saveForumLoginResume(resume);
  now += 30 * 60 * 1000 - 1;
  assert.ok(readForumLoginResume("/algs"));
  now++;
  assert.equal(consumeForumLoginResume("/algs"), null);
  assert.equal(entries.has(key), false);
  for (const raw of ["{invalid", JSON.stringify({ ...resume, ts: now, thread: { kind: "unknown", id: "abc" } })]) {
    entries.set(key, raw);
    assert.equal(readForumLoginResume("/algs"), null);
    assert.equal(entries.has(key), false);
  }
});

test("unavailable browser storage does not prevent login", () => {
  assert.equal(saveForumLoginResume(resume), false);
  assert.equal(readForumLoginResume("/algs"), null);
  assert.equal(consumeForumLoginResume("/algs"), null);
  assert.equal(clearForumLoginResume(), false);
});
