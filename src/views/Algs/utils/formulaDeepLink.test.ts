import assert from "node:assert/strict";
import { test } from "node:test";
import type { AlgClassDetail } from "@/services/cubing-pro/algs/algs";
import { algDeepLinkEnUS, algDeepLinkZhCN } from "@/i18n/messages/algs-deep-link";
import { parseFormulaDeepLink, resolveFormulaDeepLink, type FormulaDeepLinkTarget } from "./formulaDeepLink";
import { getAlgsSelection, setAlgsSelection } from "./storage";

const target: FormulaDeepLinkTarget = {
  set: "TCLL+ 中文",
  group: "Group & / = ? # %",
  name: "Case ' 1",
  rawAlg: " R U R’ U' + (R2) ",
};

function query(value = target): string {
  return `?${new URLSearchParams({ set: value.set, group: value.group, case: value.name, alg: value.rawAlg })}`;
}

function dataset(): AlgClassDetail {
  return {
    name: "TCLL+",
    // Presentation keys intentionally exclude/reorder the source records.
    setKeys: ["Other set"],
    sets: [
      { name: "Other set", groups: [{ name: target.group, algs: [{ name: target.name, algs: [target.rawAlg] }] }] },
      {
        name: target.set,
        groups_keys: ["Other group"],
        groups: [
          { name: "Other group", algs: [{ name: target.name, algs: [target.rawAlg] }] },
          { name: target.group, algs: [
            { name: "Other case", algs: [target.rawAlg] },
            { name: target.name, algs: ["R U", target.rawAlg], scrambles: ["U' R'", "R2"] },
          ] },
        ],
      },
    ],
  };
}

test("parses the encoded source tuple losslessly, including plus signs and smart quotes", () => {
  assert.deepEqual(parseFormulaDeepLink(query()), { kind: "target", target });
  assert.deepEqual(parseFormulaDeepLink(query().slice(1)), { kind: "target", target });
  assert.deepEqual(parseFormulaDeepLink(`${query()}&sourceId=optional&unrelated=value`), { kind: "target", target });
  assert.deepEqual(parseFormulaDeepLink(query().replaceAll("+", "%20")), { kind: "target", target });
});

test("ignores unrelated queries but rejects every incomplete or duplicate tuple", () => {
  for (const search of ["", "?page=2", "?sourceId=only", "?setting=value"]) {
    assert.deepEqual(parseFormulaDeepLink(search), { kind: "none" });
  }
  for (const key of ["set", "group", "case", "alg"]) {
    const params = new URLSearchParams(query());
    params.delete(key);
    assert.deepEqual(parseFormulaDeepLink(params.toString()), { kind: "invalid" }, key);
    params.set(key, "");
    assert.deepEqual(parseFormulaDeepLink(params.toString()), { kind: "invalid" }, key);
    params.set(key, "   ");
    assert.deepEqual(parseFormulaDeepLink(params.toString()), { kind: "invalid" }, key);
    params.set(key, "value");
    params.append(key, "value");
    assert.deepEqual(parseFormulaDeepLink(params.toString()), { kind: "invalid" }, key);
  }
});

test("rejects malformed encodings and control characters without throwing", () => {
  for (const suffix of ["%", "%GG", "%C3%28", "%ED%A0%80", "%00", "%0A", "%7F"]) {
    assert.deepEqual(parseFormulaDeepLink(query({ ...target, rawAlg: "R" }) + suffix), { kind: "invalid" }, suffix);
  }
});

test("bounds names, formulas and the entire query before resolving", () => {
  assert.equal(parseFormulaDeepLink(query({ ...target, name: "n".repeat(512), rawAlg: "R".repeat(3999) })).kind, "target");
  for (const field of ["set", "group", "name"] as const) {
    assert.equal(parseFormulaDeepLink(query({ ...target, [field]: "n".repeat(513) })).kind, "invalid");
  }
  assert.equal(parseFormulaDeepLink(query({ ...target, rawAlg: "R".repeat(4000) })).kind, "invalid");
  const exactLimit = `${query()}&extra=`.padEnd(16000, "x");
  assert.equal(parseFormulaDeepLink(exactLimit).kind, "target");
  assert.equal(parseFormulaDeepLink(`${exactLimit}x`).kind, "invalid");
});

test("resolves the exact variant in the complete dataset, retaining item identity and indices", () => {
  const data = dataset();
  const before = structuredClone(data);
  const resolved = resolveFormulaDeepLink(data, target);
  assert.equal(resolved.kind, "found");
  if (resolved.kind !== "found") return;
  assert.equal(resolved.index, 3);
  assert.equal(resolved.libraryIndex, 1);
  assert.equal(resolved.items.length, 4);
  assert.equal(resolved.items[resolved.index], resolved.item);
  assert.equal(resolved.item.alg, data.sets[1].groups[1].algs[1]);
  assert.equal(resolved.item.alg.algs[resolved.libraryIndex], target.rawAlg);
  assert.deepEqual(data, before);
});

test("never falls back to fuzzy names, aliases, normalized quotes, whitespace or a different formula", () => {
  for (const change of [
    { set: target.set.toLowerCase() }, { group: target.group + " " }, { name: "Case" },
    { name: "Case ’ 1" }, { rawAlg: target.rawAlg.trim() },
    { rawAlg: target.rawAlg.replace("’", "'") }, { rawAlg: "R U R'" },
  ]) {
    assert.deepEqual(resolveFormulaDeepLink(dataset(), { ...target, ...change }), { kind: "missing" });
  }
  assert.deepEqual(resolveFormulaDeepLink({ name: "Empty", sets: [] }, target), { kind: "missing" });
});

test("rejects duplicate tuples across cases, groups, sets and raw variants", () => {
  for (const duplicate of ["case", "group", "set", "variant"]) {
    const data = dataset();
    const set = data.sets[1];
    const group = set.groups[1];
    const alg = group.algs[1];
    if (duplicate === "case") group.algs.push(structuredClone(alg));
    if (duplicate === "group") set.groups.push(structuredClone(group));
    if (duplicate === "set") data.sets.push(structuredClone(set));
    if (duplicate === "variant") alg.algs.push(target.rawAlg);
    assert.deepEqual(resolveFormulaDeepLink(data, target), { kind: "ambiguous" }, duplicate);
  }
});

test("duplicate labels with different raw formulas are resolved by the complete tuple", () => {
  const data = dataset();
  data.sets[1].groups[1].algs.push({ name: target.name, algs: ["F R F'"] });
  assert.equal(resolveFormulaDeepLink(data, target).kind, "found");
});

test("stored library selections follow solution IDs and keep indexes for older records", (t) => {
  const values = new Map<string, string>();
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  const alg = { name: "OLL 45", algs: ["second", "first"], solutionIds: ["b", "a"] };
  const legacySelection = { source: "library", index: 1 };
  for (const record of [1, legacySelection, { ...legacySelection, solutionId: null }]) {
    values.set("algs_user_selection", JSON.stringify({ key: record }));
    assert.deepEqual(getAlgsSelection("key", alg), legacySelection);
    assert.deepEqual(getAlgsSelection("key"), legacySelection);
  }
  setAlgsSelection("key", { source: "library", index: 1, solutionId: "b" });
  assert.deepEqual(getAlgsSelection("key", alg), { source: "library", index: 0, solutionId: "b" });
  assert.deepEqual(getAlgsSelection("key", { ...alg, solutionIds: ["b", "b"] }), { source: "library", index: 0, solutionId: "b" });
  assert.equal(getAlgsSelection("key", { ...alg, solutionIds: ["a"] }), null);
  assert.deepEqual(getAlgsSelection("key", { name: alg.name, algs: alg.algs }), legacySelection);
  setAlgsSelection("key", { source: "custom", index: 1 });
  assert.deepEqual(getAlgsSelection("key", alg), { source: "custom", index: 1 });
});

test("all failure statuses and dismiss actions have matching Chinese and English messages", () => {
  assert.deepEqual(Object.keys(algDeepLinkZhCN), Object.keys(algDeepLinkEnUS));
  for (const key of Object.keys(algDeepLinkZhCN) as (keyof typeof algDeepLinkZhCN)[]) {
    assert.ok(algDeepLinkZhCN[key]);
    assert.ok(algDeepLinkEnUS[key]);
    assert.notEqual(algDeepLinkZhCN[key], algDeepLinkEnUS[key]);
  }
});
