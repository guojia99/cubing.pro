import assert from "node:assert/strict";
import test from "node:test";

import { CLOSED_REVISIONS_KEY, readClosedRevisions, rememberClosedRevisions, unseenAnnouncements } from "./announcementDismissal";

const oldA = { id: "a", revision: "a-1", text: "A", href: "" };
const oldB = { id: "b", revision: "b-1", text: "B", href: "/welcome/" };
const newB = { ...oldB, revision: "b-2", text: "B changed" };
const announcementC = { id: "c", revision: "c-1", text: "C", href: "" };

function makeStorage(value: string | null = null) {
  return {
    getItem(key: string) { assert.equal(key, CLOSED_REVISIONS_KEY); return value; },
    setItem(key: string, contents: string) { assert.equal(key, CLOSED_REVISIONS_KEY); value = contents; },
  };
}

test("dismiss the shown revisions and only a changed or new announcement reappears", () => {
  const storage = makeStorage();
  assert.deepEqual(unseenAnnouncements([oldB, oldA], readClosedRevisions(storage)), [oldB, oldA]);
  rememberClosedRevisions(storage, [oldB, oldA]);
  assert.deepEqual(unseenAnnouncements([oldB, oldA], readClosedRevisions(storage)), []);
  assert.deepEqual(unseenAnnouncements([newB, oldA], readClosedRevisions(storage)), [newB]);
  rememberClosedRevisions(storage, [newB]);
  assert.deepEqual(unseenAnnouncements([newB, oldA], readClosedRevisions(storage)), []);
  assert.deepEqual(unseenAnnouncements([announcementC, oldA], readClosedRevisions(storage)), [announcementC]);
  assert.deepEqual(unseenAnnouncements([], readClosedRevisions(storage)), []);
});

test("empty or malformed browser storage does not suppress an active announcement", () => {
  for (const bad of [null, "", "{", "[]", "42", '{"a":false}']) {
    assert.deepEqual(unseenAnnouncements([oldA], readClosedRevisions(makeStorage(bad))), [oldA]);
  }
});
