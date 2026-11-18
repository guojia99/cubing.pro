import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import {
  getCocktailDisplayName,
  getCocktailsResourceUrl,
  loadCocktailContent,
  type CocktailLocale,
} from "../../../lib/cocktailContent";
import type { Cocktail } from "../types";

const locales: CocktailLocale[] = ["en-US", "ja", "yue-Hant-HK", "ko", "fr", "es"];
const fields = ["ingredients", "method", "garnish"] as const;
const source: Cocktail[] = JSON.parse(readFileSync(resolve("public/iba/cocktails.json"), "utf8"));
const resources = new Map<string, unknown>([["/iba/cocktails.json", source]]);
for (const locale of locales) {
  resources.set(getCocktailsResourceUrl(locale), JSON.parse(readFileSync(
    resolve(`public/i18n/cocktails/${locale}.json`), "utf8",
  )));
}

test("all six resources cover the source without missing text or changed step counts", () => {
  assert.equal(source.length, 102);
  const slugs = source.map((row) => row.slug).sort();
  for (const locale of locales) {
    const data = resources.get(getCocktailsResourceUrl(locale)) as Record<string, Cocktail>;
    assert.deepEqual(Object.keys(data).sort(), slugs, locale);
    let ingredients = 0;
    let methods = 0;
    let garnishes = 0;
    for (const cocktail of source) {
      const row = data[cocktail.slug];
      assert.deepEqual(Object.keys(row).sort(), ["garnish", "ingredients", "method", "name"]);
      assert.ok(row.name.trim(), `${locale}/${cocktail.slug}/name`);
      for (const field of fields) {
        assert.equal(row[field].length, cocktail[field].length, `${locale}/${cocktail.slug}/${field}`);
        assert.ok(row[field].every((text) => typeof text === "string" && text.trim().length > 0));
      }
      row.ingredients.forEach((text, index) => {
        assert.deepEqual(text.match(/\d+(?:\.\d+)?/g) ?? [],
          cocktail.ingredients[index].match(/\d+(?:\.\d+)?/g) ?? [],
          `${locale}/${cocktail.slug}/ingredients/${index}: quantities and ages`);
      });
      if (locale !== "yue-Hant-HK") {
        const pattern = locale === "ja" ? /[ぁ-ヿ]/u : locale === "ko" ? /[가-힣]/u : /[a-zA-ZÀ-ÿ]/u;
        for (const text of [...row.method, ...row.garnish]) assert.match(text, pattern);
      }
      if (["en-US", "fr", "es", "ko"].includes(locale)) {
        assert.doesNotMatch(JSON.stringify(row), /[\u3400-\u9fff]/u, locale);
      }
      ingredients += row.ingredients.length;
      methods += row.method.length;
      garnishes += row.garnish.length;
    }
    assert.deepEqual([ingredients, methods, garnishes], [414, 209, 101]);
  }
});

test("loader uses locale resources, preserves metadata, deduplicates, cancels and retries", async () => {
  const originalFetch = globalThis.fetch;
  const calls = new Map<string, number>();
  const aborted = new Map<string, number>();
  const failures = new Map<string, number>();
  const invalid = new Set<string>();
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.set(url, (calls.get(url) ?? 0) + 1);
    await new Promise<void>((resolve, reject) => {
      const signal = init?.signal;
      const onAbort = () => {
        clearTimeout(timer);
        aborted.set(url, (aborted.get(url) ?? 0) + 1);
        reject(new DOMException("Aborted", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, 5);
      signal?.addEventListener("abort", onAbort, { once: true });
      if (signal?.aborted) onAbort();
    });
    const remaining = failures.get(url) ?? 0;
    if (remaining) {
      failures.set(url, remaining - 1);
      return new Response("Unavailable", { status: 503 });
    }
    const data = invalid.has(url) ? {} : resources.get(url);
    assert.ok(data, `Unexpected request: ${url}`);
    return new Response(JSON.stringify(data), { status: 200 });
  }) as typeof fetch;
  try {
    assert.equal(getCocktailsResourceUrl("zh-CN"), "/iba/cocktails.json");
    const cancelled = new AbortController();
    const first = loadCocktailContent("en-US", cancelled.signal);
    const second = loadCocktailContent("en-US");
    cancelled.abort();
    await assert.rejects(first, { name: "AbortError" });
    const english = await second;
    assert.equal(english.length, 102);
    assert.equal(calls.get("/iba/cocktails.json"), 1);
    assert.equal(calls.get(getCocktailsResourceUrl("en-US")), 1);
    assert.equal(aborted.size, 0, "one consumer must not cancel another");
    english[0].ingredients[0] = "mutated by caller";
    assert.notEqual((await loadCocktailContent("en-US"))[0].ingredients[0], "mutated by caller");
    assert.equal(calls.get(getCocktailsResourceUrl("en-US")), 1, "successful resource is cached");

    const stop = new AbortController();
    const french = loadCocktailContent("fr", stop.signal);
    stop.abort();
    await assert.rejects(french, { name: "AbortError" });
    await Promise.resolve();
    assert.equal(aborted.get(getCocktailsResourceUrl("fr")), 1, "last consumer aborts fetch");
    await loadCocktailContent("fr");
    assert.equal(calls.get(getCocktailsResourceUrl("fr")), 2, "aborted resources retry");

    failures.set(getCocktailsResourceUrl("es"), 1);
    await assert.rejects(loadCocktailContent("es"), /HTTP 503/);
    await loadCocktailContent("es");
    assert.equal(calls.get(getCocktailsResourceUrl("es")), 2, "HTTP failures retry");

    invalid.add(getCocktailsResourceUrl("ko"));
    await assert.rejects(loadCocktailContent("ko"), /Incomplete cocktail translations/);
    invalid.delete(getCocktailsResourceUrl("ko"));
    await loadCocktailContent("ko");
    assert.equal(calls.get(getCocktailsResourceUrl("ko")), 2, "invalid resources retry without fallback");

    const japaneseUrl = getCocktailsResourceUrl("ja");
    const japanese = resources.get(japaneseUrl) as Record<string, Cocktail>;
    resources.set(japaneseUrl, { ...japanese, alexander: { ...japanese.alexander, method: [] } });
    await assert.rejects(loadCocktailContent("ja"), /Invalid cocktail translation: ja\/alexander/);
    resources.set(japaneseUrl, japanese);
    await loadCocktailContent("ja");
    assert.equal(calls.get(japaneseUrl), 2, "an incomplete recipe is rejected and evicted");

    for (const locale of ["zh-CN", ...locales] as const) {
      const result = await loadCocktailContent(locale);
      const resource = resources.get(getCocktailsResourceUrl(locale)) as Record<string, Cocktail>;
      for (const [index, row] of result.entries()) {
        const original = source[index];
        const { name, ingredients, method, garnish, originalName, originalIngredients, ...metadata } = row;
        const { name: sourceName, ingredients: sourceIngredients, method: sourceMethod, garnish: sourceGarnish, ...originalMetadata } = original;
        assert.deepEqual(metadata, originalMetadata, `${locale}/${row.slug}: stable metadata`);
        assert.equal(originalName, sourceName);
        assert.deepEqual(originalIngredients, sourceIngredients);
        const expected = locale === "zh-CN" ? original : resource[row.slug];
        assert.deepEqual({ name, ingredients, method, garnish }, {
          name: expected.name, ingredients: expected.ingredients, method: expected.method, garnish: expected.garnish,
        });
        if (locale === "zh-CN") assert.deepEqual([ingredients, method, garnish], [sourceIngredients, sourceMethod, sourceGarnish]);
        else assert.equal(getCocktailDisplayName(row, locale), expected.name);
      }
    }
    assert.equal(getCocktailDisplayName(source[0], "zh-CN"), "亚历山大");
    const alreadyAborted = new AbortController();
    alreadyAborted.abort();
    await assert.rejects(loadCocktailContent("ja", alreadyAborted.signal), { name: "AbortError" });
    assert.throws(() => getCocktailsResourceUrl("xx" as CocktailLocale), /Unsupported/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
