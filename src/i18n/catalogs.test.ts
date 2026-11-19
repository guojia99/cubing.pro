import assert from "node:assert/strict";
import test from "node:test";
import {
  catalogs,
  getIntlLocale,
  isLocale,
  LOCALE_STORAGE_KEY,
  readStoredLocale,
  SUPPORTED_LOCALES,
  translate,
  translateWithParams,
  writeStoredLocale,
  type Locale,
  type MessageKey,
} from "./index";
import { applyPlural } from "./plurals";
import { advertisementZhCN, getAdvertisementMessages, type AdvertisementMessageKey } from "./messages/advertisements";

const localeKeys = ["zh-CN", "en-US", "ja", "yue-Hant-HK", "ko", "fr", "es"] as const;
const emptyAllowlist = [
  { locale: "en-US", key: "wca.results.prStreakBreakAtSuffix", reason: "English uses the preceding 'Broken at' label; no suffix after the competition name." },
  { locale: "en-US", key: "wca.results.prStreakBreakPrevSuffix", reason: "English uses the preceding 'Previous streak' label; no suffix after the count." },
] as const;

test("advertisement domain messages are registered in all seven root catalogs", () => {
  for (const locale of localeKeys) {
    for (const key of Object.keys(advertisementZhCN) as AdvertisementMessageKey[]) {
      assert.equal(translate(locale, key), getAdvertisementMessages(locale)(key));
      assert.notEqual(translate(locale, key), key);
    }
  }
});

function placeholders(value: string) {
  return [...new Set([...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort();
}

test("root catalogs contain exactly the registered seven languages and identical keys", () => {
  assert.deepEqual(Object.keys(catalogs).sort(), [...localeKeys].sort());
  const keys = Object.keys(catalogs["zh-CN"]).sort();
  assert.ok(keys.length > 100, "Import the real root catalogs, not a miniature fixture");
  for (const locale of localeKeys) assert.deepEqual(Object.keys(catalogs[locale]).sort(), keys, locale);
  for (const locale of localeKeys) {
    for (const key of keys) assert.equal(translate(locale, key as MessageKey), catalogs[locale][key as MessageKey]);
  }
});

test("every root value is text with matching placeholders and only reviewed empty values", () => {
  const used = new Set<string>();
  const allowed = new Map(emptyAllowlist.map(item => [`${item.locale}:${item.key}`, item.reason]));
  assert.equal(allowed.size, emptyAllowlist.length, "No duplicate empty exceptions");
  assert.ok(emptyAllowlist.every(item => item.reason.trim()));
  const failures: string[] = [];
  for (const locale of localeKeys) {
    for (const [key, value] of Object.entries(catalogs[locale])) {
      const identity = `${locale}:${key}`;
      if (typeof value !== "string") {
        failures.push(`${identity}: expected string`);
        continue;
      }
      if (!value.trim()) {
        if (value === "" && allowed.has(identity)) used.add(identity);
        else failures.push(`${identity}: unexpected empty/whitespace translation`);
      }
      const base = catalogs["zh-CN"][key as MessageKey];
      if (typeof base === "string" && JSON.stringify(placeholders(value)) !== JSON.stringify(placeholders(base))) {
        failures.push(`${identity}: placeholders ${JSON.stringify(placeholders(value))} != ${JSON.stringify(placeholders(base))}`);
      }
    }
  }
  for (const identity of allowed.keys()) if (!used.has(identity)) failures.push(`${identity}: stale empty exception`);
  assert.deepEqual(failures, []);
});

test("locale registry is unique, has translated names and usable Intl locale mappings", () => {
  assert.deepEqual(SUPPORTED_LOCALES.map(item => item.key), [...localeKeys]);
  assert.deepEqual(SUPPORTED_LOCALES.map(item => item.intl), ["zh-CN", "en-US", "ja-JP", "zh-HK", "ko-KR", "fr-FR", "es-ES"]);
  for (const field of ["key", "label", "labelKey", "flag"] as const) {
    assert.equal(new Set(SUPPORTED_LOCALES.map(item => item[field])).size, 7, field);
  }
  assert.equal(LOCALE_STORAGE_KEY, "cubing_pro_locale", "Preserve persisted language preference");
  for (const item of SUPPORTED_LOCALES) {
    assert.equal(isLocale(item.key), true);
    assert.equal(getIntlLocale(item.key), item.intl);
    assert.ok(Intl.DateTimeFormat.supportedLocalesOf([item.intl]).length, item.intl);
    assert.doesNotThrow(() => new Intl.NumberFormat(item.intl).format(1234.5));
    assert.match(item.flag, /^[a-z]{2}$/);
    for (const locale of localeKeys) {
      assert.ok(Object.hasOwn(catalogs[locale], item.labelKey), `${locale}:${item.labelKey}`);
      assert.ok(translate(locale, item.labelKey).trim());
    }
  }
});

test("invalid locale inputs are rejected and translation/Intl safely fall back", () => {
  const key: MessageKey = "lang.en";
  for (const invalid of [undefined, null, "", "en", "zh", "ja-JP", " fr", "fr ", "FR", "../en-US", "__proto__", "constructor", "prototype", "toString", 0, false, {}, []]) {
    assert.equal(isLocale(invalid), false, String(invalid));
    assert.equal(translate(invalid as Locale, key), catalogs["zh-CN"][key]);
    assert.equal(getIntlLocale(invalid as Locale), "zh-CN");
  }
  const missing = "__i18n_test_missing_key__" as MessageKey;
  for (const locale of localeKeys) assert.equal(translate(locale, missing), missing);
});

test("unknown keys and prototype-shaped locale inputs never expose inherited catalog values", () => {
  for (const locale of [...localeKeys, "__proto__", "constructor", "toString"]) {
    for (const key of ["__proto__", "constructor", "toString", "valueOf", "hasOwnProperty"]) {
      assert.equal(translate(locale as Locale, key as MessageKey), key, `${locale}:${key}`);
      assert.equal(translateWithParams(locale as Locale, key as MessageKey, {}), key);
    }
  }
});

test("invalid locale objects cannot coerce themselves into a catalog key or throw", () => {
  const invalidInputs = [
    Object.create(null),
    { toString: () => "en-US" },
    { [Symbol.toPrimitive]: () => { throw new Error("Unexpected locale coercion"); } },
  ];
  for (const value of invalidInputs) {
    assert.equal(isLocale(value), false);
    assert.equal(getIntlLocale(value as Locale), "zh-CN");
    assert.equal(translate(value as Locale, "lang.zh"), catalogs["zh-CN"]["lang.zh"]);
    assert.equal(translateWithParams(value as Locale, "lang.zh", {}), catalogs["zh-CN"]["lang.zh"]);
  }
});

test("params preserve dollar replacement tokens literally, numbers, repeats and missing params", () => {
  for (const locale of localeKeys) {
    const entries = Object.entries(catalogs[locale]) as [MessageKey, string][];
    const parameterized = entries.filter(([, value]) => placeholders(value).length);
    assert.ok(parameterized.length > 0, locale);
    for (const [key, value] of parameterized) {
      const names = placeholders(value);
      for (const literal of ["$&", "$`", "$'", "$$", "$& $` $'", "{other}", `{${names[0]}}`, 0, 42]) {
        const params = Object.fromEntries(names.map(name => [name, literal]));
        const expected = applyPlural(locale, key, value, params).split(/\{\w+\}/g).join(String(literal));
        assert.equal(translateWithParams(locale, key, params), expected, `${locale}:${key}:${literal}`);
      }
      assert.equal(translateWithParams(locale, key, {}), value, `${locale}:${key}: missing params`);
      const distinct = Object.fromEntries(names.map((name, index) => [name, `$&:{${names[(index + 1) % names.length]}}:${index}`]));
      const expectedDistinct = value.split(/\{(\w+)\}/g).map((part, index) =>
        index % 2 ? distinct[part] : part).join("");
      assert.equal(translateWithParams(locale, key, distinct), expectedDistinct, `${locale}:${key}: distinct params`);
      const inherited = Object.create(Object.fromEntries(names.map(name => [name, "inherited"])));
      assert.equal(translateWithParams(locale, key, inherited), value, "Only own params substitute");
    }
  }
});

// Each fake window is restored synchronously, even if an assertion fails.
function withWindow(value: unknown, run: () => void) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  try {
    if (value === undefined) Reflect.deleteProperty(globalThis, "window");
    else Object.defineProperty(globalThis, "window", { configurable: true, value });
    run();
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

test("storage handles SSR, all languages, invalid values and blocked getter/read/write", () => {
  withWindow(undefined, () => {
    assert.equal(readStoredLocale(), "zh-CN");
    assert.doesNotThrow(() => writeStoredLocale("fr"));
  });
  let stored: string | null = null;
  let writes = 0;
  const storage = {
    getItem(key: string) { assert.equal(key, LOCALE_STORAGE_KEY); return stored; },
    setItem(key: string, value: string) { assert.equal(key, LOCALE_STORAGE_KEY); stored = value; writes += 1; },
  };
  withWindow({ localStorage: storage }, () => {
    for (const locale of localeKeys) {
      writeStoredLocale(locale);
      assert.equal(stored, locale);
      assert.equal(readStoredLocale(), locale);
    }
    for (const invalid of [null, "", "en", "ja-JP", " fr", "fr ", "FR", "__proto__", "constructor", "../fr"]) {
      stored = invalid;
      assert.equal(readStoredLocale(), "zh-CN");
      writeStoredLocale(invalid as Locale);
      assert.equal(stored, invalid);
    }
    assert.equal(writes, localeKeys.length, "Invalid locales must not be persisted");
  });
  const denied = () => { throw new Error("Storage access denied"); };
  for (const [window, expected] of [
    [{ get localStorage() { return denied(); } }, "zh-CN"],
    [{ localStorage: { getItem: denied, setItem: denied } }, "zh-CN"],
    [{ localStorage: { getItem: () => "fr", setItem: denied } }, "fr"],
    [{ localStorage: { getItem: denied, setItem: storage.setItem } }, "zh-CN"],
    [{ localStorage: undefined }, "zh-CN"],
  ] as const) {
    withWindow(window, () => {
      assert.doesNotThrow(() => writeStoredLocale("es"));
      assert.equal(readStoredLocale(), expected);
    });
  }
});
