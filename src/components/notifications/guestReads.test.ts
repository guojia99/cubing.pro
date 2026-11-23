import assert from "node:assert/strict";
import test from "node:test";

import { ANNOUNCEMENT_READS_KEY, LEGACY_CLOSED_REVISIONS_KEY, announcementNotifications, paginateAnnouncements, readGuestAnnouncements, rememberGuestAnnouncement } from "./guestReads";

const at = "2026-11-24T10:00:00Z";
const a = { id: "a", revision: "1", title: "A", text: "Notice A", publishedAt: at };
const b = { ...a, id: "b", title: "B", text: "Notice B" };

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
  };
}

test("guest reads preserve legacy dismissed IDs across revisions and republications", () => {
  const saved = storage({ [LEGACY_CLOSED_REVISIONS_KEY]: JSON.stringify({ a: "old-revision" }) });
  const reads = readGuestAnnouncements(saved);
  assert.ok(announcementNotifications([{ ...a, revision: "new", publishedAt: "2026-11-25T10:00:00Z" }], reads)[0].readAt);
  rememberGuestAnnouncement(saved, "b", at);
  assert.deepEqual([...readGuestAnnouncements(saved).keys()].sort(), ["a", "b"]);
  assert.equal(readGuestAnnouncements(saved).get("b"), at);
});

test("invalid storage entries do not hide active notices", () => {
  for (const value of ["{", "[]", "null", "42", '{"a":false}', '{"a":"invalid-date"}']) {
    const saved = storage({ [ANNOUNCEMENT_READS_KEY]: value });
    assert.equal(announcementNotifications([a], readGuestAnnouncements(saved))[0].readAt, null);
  }
});

test("guest pagination has deterministic ordering, total unread and a clamped page", () => {
  const items = announcementNotifications([a, b], new Map([["a", at]]));
  assert.deepEqual(items.map(item => item.id), ["site-announcement:b", "site-announcement:a"]);
  const first = paginateAnnouncements(items, 1, 1);
  assert.equal(first.items[0].id, "site-announcement:b");
  assert.equal(first.total, 2);
  assert.equal(first.unread, 1);
  const last = paginateAnnouncements(items, 99, 1);
  assert.equal(last.page, 2);
  assert.equal(last.items[0].id, "site-announcement:a");
  assert.deepEqual(paginateAnnouncements([], 99, 20), { items: [], total: 0, unread: 0, page: 1 });
});
