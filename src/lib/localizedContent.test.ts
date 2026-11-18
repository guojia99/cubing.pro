import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SUPPORTED_LOCALES, type Locale } from "../i18n/locales";
import type {
  OtherLink,
  OtherLinks,
  Thank,
} from "../services/cubing-pro/public/types";
import {
  resolveLocalizedContent,
  type CompetitionContentLocalization,
  type ContentTranslations,
} from "./localizedContent";

const original = "source fixture\r\n[link](https://example.invalid)";
const hash = (text: string) => `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
const sourceHash = hash(original);
const resourceId = "external-link:fixture";
const options = { resourceId, original, locale: "en-US", sourceLocale: "zh-CN", field: "desc", sourceHash } as const;
const entry = (overrides: Record<string, unknown> = {}) => ({
  resourceId, field: "desc" as const, locale: "en-US" as const, text: "fixture", sourceHash, ...overrides,
});

test("legacy public payloads remain valid without proposed localization fields", () => {
  const link: OtherLink = { key: "fixture", name: "Fixture", desc: original, url: "https://example.invalid", icon: "", icon_url: "" };
  const links: OtherLinks = { tops: [], groups: [], group_map: {}, links: [link] };
  const thank: Thank = { wcaID: "", nickname: "Fixture", amount: 0, avatar: "", other: original };
  assert.equal(links.links[0].desc, original);
  assert.equal(thank.other, original);
  assert.deepEqual(resolveLocalizedContent(options), {
    status: "original", text: original, locale: "zh-CN", reason: "translation-missing",
  });
});

test("all seven stable locales select only their exact field and retain exact text", () => {
  for (const { key: locale } of SUPPORTED_LOCALES) {
    // Deliberately synthetic fixtures, not publishable translations.
    const text = `  fixture:${locale}\n$& {value}  `;
    const translations = { [locale]: { desc: { ...entry(), text, locale } } };
    assert.deepEqual(resolveLocalizedContent({ ...options, sourceLocale: undefined, locale, translations }), {
      status: "translated", text, locale,
    });
  }
});

test("original locale is original, and an unknown source language is not guessed", () => {
  assert.equal(resolveLocalizedContent({ ...options, locale: "zh-CN" }).status, "original");
  assert.deepEqual(resolveLocalizedContent({ ...options, sourceLocale: undefined }), {
    status: "original", text: original, locale: undefined, reason: "translation-missing",
  });
  assert.deepEqual(resolveLocalizedContent({ ...options, sourceLocale: "unknown" as Locale }), {
    status: "original", text: original, locale: undefined, reason: "translation-missing",
  });
});

test("changed source bytes invalidate hash-bound translations", () => {
  const translations = { "en-US": { desc: entry() } };
  for (const changed of [`${original}!`, original.replace("\r\n", "\n"), `${original} `]) {
    const result = resolveLocalizedContent({ ...options, original: changed, sourceHash: hash(changed), translations });
    assert.equal(result.status, "original");
    assert.equal(result.text, changed);
    if (result.status === "original") assert.equal(result.reason, "translation-stale");
  }
});

test("version-only checks work and every supplied freshness constraint must agree", () => {
  const translations = { "en-US": { desc: { ...entry(), sourceHash: undefined, sourceVersion: "v2" } } };
  assert.equal(resolveLocalizedContent({ ...options, sourceHash: undefined, sourceVersion: "v2", translations }).status, "translated");
  const stale = resolveLocalizedContent({ ...options, sourceHash: undefined, sourceVersion: "v3", translations });
  assert.ok(stale.status === "original" && stale.reason === "translation-stale");
  const both = { "en-US": { desc: { ...entry(), sourceVersion: "v2" } } };
  assert.equal(resolveLocalizedContent({ ...options, sourceVersion: "v2", translations: both }).status, "translated");
  const mismatch = resolveLocalizedContent({ ...options, sourceVersion: "v3", translations: both });
  assert.ok(mismatch.status === "original" && mismatch.reason === "translation-stale");
  const changedHash = resolveLocalizedContent({
    ...options, original: `${original}!`, sourceHash: hash(`${original}!`), sourceVersion: "v2", translations: both,
  });
  assert.ok(changedHash.status === "original" && changedHash.reason === "translation-stale");
  for (const value of [
    { ...options, translations },
    { ...options, translations: both },
    { ...options, sourceHash: undefined, translations: { "en-US": { desc: entry() } } },
  ]) {
    const result = resolveLocalizedContent(value);
    assert.ok(result.status === "original" && result.reason === "source-unverified");
  }
});

test("unversioned, malformed and empty translations never count as translated", () => {
  for (const malformed of [
    { text: "fixture" }, { text: "fixture", sourceHash: "old-hash" },
    { text: "fixture", sourceHash: "" }, { text: "fixture", sourceVersion: 2 },
    { text: "" }, { text: " \n " }, { text: 42 }, "fixture", [],
  ]) {
    const result = resolveLocalizedContent({
      ...options, translations: { "en-US": { desc: typeof malformed === "object" && !Array.isArray(malformed)
        ? { ...entry(), sourceHash: undefined, ...malformed } : malformed } } as ContentTranslations<"desc">,
    });
    assert.equal(result.status, "original");
  }
});

test("missing originals cannot be replaced by unverifiable cached translations", () => {
  for (const empty of [undefined, null, "", " \n "]) {
    assert.deepEqual(resolveLocalizedContent({
      ...options, original: empty, translations: { "en-US": { desc: entry() } },
    }), { status: "missing", text: null, locale: undefined, reason: "source-missing" });
  }
});

test("no English fallback, field crossover, inherited values or unsupported locale aliases", () => {
  const translations = { "en-US": { desc: entry() } };
  assert.equal(resolveLocalizedContent({ ...options, locale: "ja", translations }).status, "original");
  assert.equal(resolveLocalizedContent<"name" | "desc">({ ...options, field: "name", translations }).status, "original");
  for (const locale of ["ja-JP", "en", "__proto__", Object.create(null)] as Locale[]) {
    const result = resolveLocalizedContent({ ...options, locale, translations });
    assert.ok(result.status === "original" && result.reason === "unsupported-locale");
  }
  const inherited = [
    Object.create(translations),
    { "en-US": Object.create(translations["en-US"]) },
    { "en-US": { desc: Object.create(translations["en-US"].desc) } },
    ...["resourceId", "field", "locale", "text", "sourceHash"].map((key) => {
      const own: Record<string, unknown> = entry();
      const inherited = { [key]: own[key] };
      delete own[key];
      return { "en-US": { desc: Object.assign(Object.create(inherited), own) } };
    }),
  ];
  for (const value of inherited) {
    assert.equal(resolveLocalizedContent({ ...options, translations: value }).status, "original");
  }
});

test("group overlays preserve original identities and are field-bound", () => {
  const groups: OtherLinks = {
    groups: ["source-group"], group_map: { "source-group": ["fixture"] }, tops: [], links: [],
    groupIds: { "source-group": "group-1" },
    translations: { "fr": { "group-1": {
      resourceId: "external-link-groups:site", field: "group-1", locale: "fr",
      text: "fixture:fr", sourceHash: hash("source-group"),
    } } },
  };
  const before = JSON.stringify(groups);
  assert.equal(resolveLocalizedContent({
    resourceId: "external-link-groups:site", original: groups.groups[0], locale: "fr", field: "group-1",
    sourceHash: hash(groups.groups[0]), translations: groups.translations,
  }).text, "fixture:fr");
  assert.equal(JSON.stringify(groups), before);
  assert.deepEqual(groups.group_map[groups.groups[0]], ["fixture"]);
  const proposed: CompetitionContentLocalization = {
    translations: { ja: { RuleMD: {
      resourceId: "competition:42", field: "RuleMD", locale: "ja", text: "fixture:ja", sourceHash,
    } } },
  };
  assert.equal(resolveLocalizedContent({
    ...options, resourceId: "competition:42", locale: "ja", field: "RuleMD", translations: proposed.translations,
  }).status, "translated");
});

test("same source text cannot authorize a translation for a different resource, field or locale", () => {
  for (const overrides of [
    { resourceId: "external-link:another" }, { field: "name" }, { locale: "fr" },
  ]) {
    const result = resolveLocalizedContent({
      ...options, translations: { "en-US": { desc: entry(overrides) } },
    });
    assert.deepEqual(result, {
      status: "original", text: original, locale: "zh-CN", reason: "translation-mismatch",
    });
  }
  for (const overrides of [{ resourceId: "" }, { resourceId: undefined }, { field: "" }]) {
    const result = resolveLocalizedContent({ ...options, ...overrides } as typeof options);
    assert.ok(result.status === "original" && result.reason === "identity-unverified");
  }
});

test("invalid freshness metadata fails closed, including nulls, inherited revisions and invalid current hashes", () => {
  for (const current of ["", "SHA256:" + "a".repeat(64), "sha256:" + "A".repeat(64), null, 2]) {
    const result = resolveLocalizedContent({
      ...options, sourceHash: current as string, translations: { "en-US": { desc: entry() } },
    });
    assert.ok(result.status === "original" && result.reason === "source-unverified");
  }
  for (const suffix of ["\n", "\r", "\r\n", "\u2028", " "]) {
    const invalidHash = `${sourceHash}${suffix}`;
    const result = resolveLocalizedContent({
      ...options, sourceHash: invalidHash,
      translations: { "en-US": { desc: { ...entry(), sourceHash: invalidHash } } },
    });
    assert.ok(result.status === "original" && result.reason === "source-unverified");
  }
  const inherited = Object.assign(Object.create({ sourceVersion: "v2" }), options, {
    sourceHash: undefined,
    translations: { "en-US": { desc: { ...entry(), sourceHash: undefined, sourceVersion: "v2" } } },
  });
  const result = resolveLocalizedContent(inherited);
  assert.ok(result.status === "original" && result.reason === "source-unverified");
});

test("missing or malformed entry identities retain diagnostics and original text", () => {
  for (const malformed of [
    null, undefined, [], "fixture", { ...entry(), resourceId: null },
    { ...entry(), field: "" }, { ...entry(), locale: "" },
  ]) {
    const result = resolveLocalizedContent({
      ...options, translations: { "en-US": { desc: malformed } } as ContentTranslations<"desc">,
    });
    assert.ok(result.status === "original");
    assert.equal(result.text, original);
    assert.equal(result.reason, malformed == null ? "translation-missing" : "translation-invalid");
  }
});

test("hash contract covers decoded UTF-8 without Unicode normalization", () => {
  assert.equal(hash("工具"), "sha256:5ca6730d441522017552bf309fcddbed161b77440dc3a11d9945788d802afdb3");
  const translations = { "en-US": { desc: { ...entry(), sourceHash: hash("é") } } };
  const result = resolveLocalizedContent({ ...options, original: "e\u0301", sourceHash: hash("e\u0301"), translations });
  assert.ok(result.status === "original" && result.reason === "translation-stale");
});

test("HTML is returned verbatim without asserting rendering safety or mutating input", () => {
  const text = '<img src=x onerror="alert(1)"><script>fixture</script>';
  const value = { ...options, translations: { "en-US": { desc: { ...entry(), text } } } };
  const before = JSON.stringify(value);
  assert.deepEqual(resolveLocalizedContent(value), { status: "translated", text, locale: "en-US" });
  assert.equal(JSON.stringify(value), before);
});

test("documented JSON examples match the helper contract and exact source hashes", () => {
  const contract = readFileSync(new URL("../../docs/project/internationalization-content-contract.md", import.meta.url), "utf8");
  const examples = [...contract.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1]));
  assert.equal(examples.length, 3);
  const [links, thank, competition] = examples;
  const link = links.links[0];
  for (const [record, id, field, source] of [
    [links, "external-link-groups:site", links.groupIds[links.groups[0]], links.groups[0]],
    [link, `external-link:${link.key}`, "desc", link.desc],
    [thank, `acknowledgment:${thank.contentId}`, "other", thank.other],
    [competition, `competition:${competition.id}`, "RuleMD", competition.RuleMD],
    [competition, `competition:${competition.id}`, "IllustrateHTML", competition.IllustrateHTML],
  ] as const) {
    assert.deepEqual(resolveLocalizedContent({
      resourceId: id, original: source, locale: "en-US", field,
      sourceLocale: record.sourceLocale, sourceHash: hash(source), translations: record.translations,
    }), { status: "translated", text: record.translations["en-US"][field].text, locale: "en-US" });
    const changed = resolveLocalizedContent({
      resourceId: id, original: `${source}!`, locale: "en-US", field,
      sourceHash: hash(`${source}!`), translations: record.translations,
    });
    assert.ok(changed.status === "original" && changed.reason === "translation-stale");
  }
});
