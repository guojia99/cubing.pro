import assert from "node:assert/strict";
import { test } from "node:test";
import { twoSolverMainEnUS, twoSolverMainZhCN } from "../../i18n/messages/two-solver-main";
import { twoSolverDetailEnUS, twoSolverDetailZhCN } from "../../i18n/messages/two-solver-detail";
import { twoSolverEngineEnUS, twoSolverEngineZhCN } from "../../i18n/messages/two-solver-engine";

for (const [name, zh, en] of [
  ["workbench", twoSolverMainZhCN, twoSolverMainEnUS],
  ["detail", twoSolverDetailZhCN, twoSolverDetailEnUS],
  ["engine", twoSolverEngineZhCN, twoSolverEngineEnUS],
] as const) {
  test(`${name} catalogs have matching complete keys and interpolation parameters`, () => {
    assert.deepEqual(Object.keys(en).sort(), Object.keys(zh).sort());
    const placeholders = (value: string) => [...value.matchAll(/\{([\w]+)\}/g)].map(match => match[1]).sort();
    for (const [key, value] of Object.entries(zh)) {
      const translation = (en as Record<string, string>)[key];
      assert.ok(value.trim() && translation.trim(), key);
      // Language names stay in their own language, as in the site's selector.
      if (key !== "two.main.language.zh") assert.doesNotMatch(translation, /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u, key);
      assert.deepEqual(placeholders(translation), placeholders(value), key);
    }
  });
}
