import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  changelogLocales,
  getChangelogLocale,
  getChangelogLoadError,
  loadChangelog,
  parseChangelog,
  parseLocalizedChangelog,
} from "../../../src/views/Changelog/parseChangelog.ts";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const manifest = JSON.parse(read("./manifest.json"));
const source = parseChangelog(read("../../CHANGELOG.md")).filter((entry) => !entry.isYear);
const sourceItems = source.flatMap((entry) => entry.items);
const messages = Object.fromEntries(changelogLocales.map((locale) => [locale, JSON.parse(read(`./${locale}.json`))]));

test("manifest matches every source date, scope, item, and position", () => {
  const keys = new Map();
  // Preserve the original 319 message keys when newer entries are prepended.
  const historical = source.filter((entry) => entry.date <= "2026-06-10");
  for (const entry of historical) {
    for (const item of entry.items) {
      const text = item.text.trim();
      if (!keys.has(text)) keys.set(text, String(keys.size + 1).padStart(3, "0"));
    }
  }
  const actual = manifest.groups.flatMap(([date, scope, items]) => items.map((item) => ({ date, scope, item })));
  const usedKeys = new Set(keys.values());
  const expected = [];
  for (const entry of source) {
    for (const item of entry.items) {
      const text = item.text.trim();
      if (!keys.has(text)) {
        const key = actual[expected.length]?.item;
        assert.match(key ?? "", /^\d{3}$/);
        assert.ok(Number(key) > 319 && !usedKeys.has(key), `Reused message key: ${key}`);
        keys.set(text, key);
        usedKeys.add(key);
      }
      expected.push({ date: entry.date, scope: item.scope, item: keys.get(text) });
    }
  }
  assert.equal(expected.length, 343);
  assert.equal(keys.size, 323);
  assert.equal(manifest.itemCount, 343);
  assert.deepEqual(actual, expected);
  assert.equal(new Set(actual.map(({ date, scope, item }) => `${date}/${scope}/${item}`)).size, 343);
});

for (const locale of changelogLocales) {
  test(`${locale}: all 343 records, 323 texts, identities and nested bullets`, () => {
    const entries = parseLocalizedChangelog(manifest, messages[locale]);
    const items = entries.flatMap((entry) => entry.items);
    assert.equal(items.length, 343);
    assert.equal(Object.keys(messages[locale]).length, 323);
    assert.deepEqual(entries.map((entry) => entry.date), source.map((entry) => entry.date));
    assert.deepEqual(items.map((item) => item.scope), sourceItems.map((item) => item.scope));
    const identities = manifest.groups.flatMap(([date, scope, keys]) => keys.map((key) => `${date}/${scope}/${key}`));
    assert.deepEqual(items.map((item) => item.id), identities);
    for (const [index, item] of items.entries()) {
      assert.ok(item.text.trim(), item.id);
      assert.equal((item.text.match(/^\s+- /gm) ?? []).length, (sourceItems[index].text.match(/^\s+- /gm) ?? []).length, item.id);
      if (locale !== "yue-Hant-HK") assert.notEqual(item.text.trim(), sourceItems[index].text.trim(), item.id);
      if (locale !== "en-US") assert.notEqual(item.text, messages["en-US"][item.id.split("/")[2]], item.id);
      if (locale === "ko") assert.match(item.text, /[가-힣]/, item.id);
      if (locale === "ja") assert.match(item.text, /[ぁ-ヿ]/, item.id);
    }
  });
}

test("rejects missing, empty, extra, duplicate and truncated resource data", () => {
  const en = messages["en-US"];
  const missing = { ...en };
  delete missing["001"];
  assert.throws(() => parseLocalizedChangelog(manifest, missing));
  assert.throws(() => parseLocalizedChangelog(manifest, { ...en, "001": " " }));
  assert.throws(() => parseLocalizedChangelog(manifest, { ...en, "999": "Extra" }));
  const duplicate = structuredClone(manifest);
  duplicate.groups[0][2].push("001");
  assert.throws(() => parseLocalizedChangelog(duplicate, en));
  assert.throws(() => parseLocalizedChangelog({ ...manifest, groups: [] }, en));
  assert.throws(() => parseLocalizedChangelog({ ...manifest, groups: manifest.groups.slice(1) }, en));
  assert.throws(() => parseLocalizedChangelog({ ...manifest, groups: [["2026-06-10", "前端", ["001"]]] }, en));
});

test("locale requests, HTTP/JSON/schema failures and aborts never fall back to Chinese", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  let mode = "ok";
  globalThis.fetch = async (url, { signal }) => {
    calls.push(url);
    signal.throwIfAborted();
    if (mode === "http") return new Response("Missing", { status: 404 });
    if (mode === "json") return new Response("<html>Fallback page</html>");
    if (mode === "schema") return Response.json({});
    if (url === "/CHANGELOG.md") return new Response(read("../../CHANGELOG.md"));
    if (url.endsWith("/manifest.json")) return Response.json(manifest);
    return Response.json(messages[url.split("/").at(-1).slice(0, -5)]);
  };
  try {
    for (const locale of [...changelogLocales, "zh-CN", "es", "ja", "en-US"]) {
      calls.length = 0;
      const entries = await loadChangelog(locale, new AbortController().signal);
      assert.equal(entries.flatMap((entry) => entry.items).length, 343);
      assert.equal(getChangelogLocale(locale), locale === "zh-CN" ? null : locale);
      assert.deepEqual(calls, locale === "zh-CN" ? ["/CHANGELOG.md"] : ["/i18n/changelog/manifest.json", `/i18n/changelog/${locale}.json`]);
      assert.ok(getChangelogLoadError(locale).length > 10);
    }
    for (mode of ["http", "json", "schema"]) {
      calls.length = 0;
      await assert.rejects(loadChangelog("fr", new AbortController().signal));
      assert.ok(!calls.includes("/CHANGELOG.md"));
    }
    mode = "ok";
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(loadChangelog("ko", controller.signal), { name: "AbortError" });
    calls.length = 0;
    await assert.rejects(loadChangelog("unknown", new AbortController().signal));
    assert.deepEqual(calls, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
