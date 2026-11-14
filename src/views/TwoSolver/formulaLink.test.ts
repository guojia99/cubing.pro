import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { before, test } from "node:test";
import { build } from "esbuild";
import type { AlgClassDetail } from "../../services/cubing-pro/algs/algs";
import { parseFormulaDeepLink, resolveFormulaDeepLink } from "../Algs/utils/formulaDeepLink";
import { formulaLibraryLink } from "./formulaLink";
import type { Library } from "./engine/library";
import type { CubeModel } from "./engine/state";
import type { MethodData, MethodId, SearchOptions, Solution } from "./engine/types";

// API class aliases and source set names are independent namespaces.
const mappings: [MethodId, string, string][] = [
  ["CLL", "CLL", "CLL"], ["EG1", "EG1", "EG-1"],
  ["EG2", "EG2", "EG-2"], ["LEG1", "LEG", "LEG-1"],
  ["TCLL+", "TCLL+", "TCLL+"], ["TCLL-", "TCLL-", "TCLL-"],
  ["LS1", "LS1", "LS-1"], ["LS2", "LS2", "LS-2"], ["LS3", "LS3", "LS-3"],
  ["LS4", "LS4", "LS-4"], ["LS5", "LS5", "LS-5"], ["LS6", "LS6", "LS-6"],
  ["LS7", "LS7", "LS-7"], ["LS8", "LS8", "LS-8"], ["LS9", "LS9", "LS-9"],
  ["CBL", "CBL", "CBL"], ["EGLS1", "EGLS1", "EG1LS"],
  ["EGLS2", "EGLS2", "EG2LS"], ["TEG1", "TEG1", "TEG-1"],
  ["TEG2", "TEG2", "TEG-2"], ["FH", "FH", "FH"],
];
const datasets = new Map<MethodId, MethodData>();
const classes = new Map<string, AlgClassDetail>();
type Engine = typeof import("./engine/state") & typeof import("./engine/library") &
  typeof import("./engine/search") & typeof import("./engine/types");
let engine: Engine;
let model: CubeModel;
let Alg: typeof import("cubing/alg").Alg;

function data(id: MethodId): MethodData {
  const value = datasets.get(id);
  assert.ok(value, id);
  return value;
}

function solution(method: MethodId, sourceApi: string, source?: Solution["source"]): Solution {
  return {
    id: "source-link", method, sourceApi, source, caseName: source?.name ?? "CLL Skip",
    group: source?.group ?? "Skip", color: "D", orientation: "x", base: "R",
    preAuf: "U", algorithm: "F R F'", postAuf: "U2", original: "x R U F R F' U2",
    execution: "R U F R F' U2", baseMoves: 1, moves: 6, originalMoves: 6, cancelled: 0,
    ergonomics: { score: 0, cost: 0, regrips: 0, rotations: 0, confidence: "estimated", notes: [] },
  };
}

function roundTrip(value: Solution) {
  const href = formulaLibraryLink(value);
  assert.ok(href, value.caseName);
  const url = new URL(href, "http://localhost");
  assert.equal(url.pathname, `/algs/222/${encodeURIComponent(value.sourceApi)}/`);
  assert.deepEqual([...url.searchParams.keys()], ["set", "group", "case", "alg"]);
  const parsed = parseFormulaDeepLink(url.search);
  assert.equal(parsed.kind, "target");
  if (parsed.kind !== "target") throw new Error("Expected an exact source tuple");
  assert.deepEqual(parsed.target, value.source);
  const api = classes.get(value.sourceApi);
  assert.ok(api, value.sourceApi);
  const resolved = resolveFormulaDeepLink(api, parsed.target);
  assert.equal(resolved.kind, "found", `${value.method}: ${JSON.stringify(parsed.target)}`);
  if (resolved.kind !== "found") throw new Error("Source did not resolve uniquely");
  assert.equal(resolved.item.setName, value.source!.set);
  assert.equal(resolved.item.groupName, value.source!.group);
  assert.equal(resolved.item.alg.name, value.source!.name);
  assert.equal(resolved.item.alg.algs[resolved.libraryIndex], value.source!.rawAlg);
  return { href, url, resolved };
}

before(async () => {
  // Match engine.test.ts: cubing's import-only modules need an in-memory ESM bundle.
  const bundle = await build({
    stdin: {
      contents: ["state", "library", "search", "types"]
        .map(name => `export * from "./engine/${name}";`).join("\n") +
        '\nexport { Alg } from "cubing/alg";',
      resolveDir: __dirname,
    },
    bundle: true, write: false, platform: "node", format: "esm",
  });
  const runtime = await import(`data:text/javascript;base64,${Buffer.from(
    bundle.outputFiles[0].text + "\n//# sourceURL=two-solver-formula-link-test-runtime.mjs",
  ).toString("base64")}`);
  engine = runtime;
  Alg = runtime.Alg;
  model = await engine.CubeModel.create();
  for (const [id, api] of mappings) {
    const dataset: MethodData = JSON.parse(readFileSync(
      path.resolve(__dirname, `../../../public/two-solver/data/${id}.json`), "utf8",
    ));
    assert.equal(dataset.method, id);
    datasets.set(id, dataset);
    // Materialize the real API shape from source data only. No backend/runtime imports.
    const detail: AlgClassDetail = { name: api, setKeys: [], sets: [] };
    for (const record of dataset.records) {
      assert.ok(record.set, `${id}/${record.name} must retain algset`);
      let set = detail.sets.find(item => item.name === record.set);
      if (!set) {
        set = { name: record.set, groups_keys: [], groups: [] };
        detail.sets.push(set);
        detail.setKeys!.push(set.name);
      }
      let group = set.groups.find(item => item.name === record.group);
      if (!group) {
        group = { name: record.group, algs: [] };
        set.groups.push(group);
        set.groups_keys!.push(group.name);
      }
      group.algs.push({ name: record.name, algs: [...record.algs] });
    }
    classes.set(api, detail);
  }
});

test("all 21 method/API/source-set mappings round-trip all 8,684 public records uniquely", () => {
  assert.deepEqual(engine.METHODS.map(({ id, api }) => [id, api]), mappings.map(([id, api]) => [id, api]));
  let records = 0;
  let variants = 0;
  for (const [id, api, sourceSet] of mappings) {
    const seen = new Set<string>();
    const detail = classes.get(api)!;
    const before = JSON.stringify(detail);
    assert.deepEqual(detail.setKeys, [sourceSet]);
    for (const record of data(id).records) {
      records++;
      assert.equal(record.set, sourceSet);
      assert.ok(record.algs.length > 0);
      for (const rawAlg of record.algs) {
        const source = { set: record.set!, group: record.group, name: record.name, rawAlg };
        const key = JSON.stringify(source);
        assert.ok(!seen.has(key), `${id}: duplicate source ${key}`);
        seen.add(key);
        roundTrip(solution(id, api, source));
        variants++;
      }
    }
    assert.equal(JSON.stringify(detail), before, "resolving must not mutate library data");
  }
  assert.equal(records, 8684);
  assert.ok(variants >= records);
});

test("links preserve LEG1/LEG/LEG-1, EG1/EG-1 and percent-encoded TCLL+ exactly", () => {
  for (const id of ["LEG1", "EG1", "TCLL+"] as const) {
    const [, api, set] = mappings.find(([method]) => method === id)!;
    const record = data(id).records[0];
    const source = { set, group: record.group, name: record.name, rawAlg: record.algs[0] };
    const { href, url } = roundTrip(solution(id, api, source));
    assert.equal(href, `/algs/222/${encodeURIComponent(api)}/?${new URLSearchParams({
      set, group: source.group, case: source.name, alg: source.rawAlg,
    })}`);
    if (id === "TCLL+") {
      assert.ok(href.startsWith("/algs/222/TCLL%2B/?set=TCLL%2B&"));
      assert.equal(url.searchParams.get("set"), "TCLL+");
    }
    if (id === "LEG1") assert.ok(!href.includes("/LEG1/"));
    if (id === "EG1") assert.equal(url.searchParams.get("set"), "EG-1");
  }
});

test("missing source and every incomplete source hide the link, including synthetic skips", () => {
  const skip = solution("CLL", "CLL");
  assert.equal(formulaLibraryLink(skip), null);
  const complete = { set: "CLL", group: "Sune", name: "Source", rawAlg: "R U R'" };
  for (const key of ["set", "group", "name", "rawAlg"] as const) {
    assert.equal(formulaLibraryLink({ ...skip, source: { ...complete, [key]: "" } }), null, key);
  }
});

test("complete tuple disambiguates repeated case names across sets and groups", () => {
  const source = { set: "Set + %", group: "Group & /", name: "Same case", rawAlg: " (U) R U R’ " };
  const detail: AlgClassDetail = { name: "CLL", sets: [
    { name: "Other set", groups: [{ name: source.group, algs: [{ name: source.name, algs: [source.rawAlg] }] }] },
    { name: source.set, groups: [
      { name: "Other group", algs: [{ name: source.name, algs: [source.rawAlg] }] },
      { name: source.group, algs: [{ name: source.name, algs: ["R U", source.rawAlg] }] },
    ] },
  ] };
  const href = formulaLibraryLink(solution("CLL", "CLL", source))!;
  const parsed = parseFormulaDeepLink(new URL(href, "http://localhost").search);
  assert.deepEqual(parsed, { kind: "target", target: source });
  const found = resolveFormulaDeepLink(detail, source);
  assert.equal(found.kind, "found");
  if (found.kind !== "found") return;
  assert.equal(found.item.alg, detail.sets[1].groups[1].algs[0]);
  assert.equal(found.libraryIndex, 1);
  for (const change of [{ name: "Same" }, { rawAlg: source.rawAlg.trim() }, { group: "missing" }]) {
    assert.deepEqual(resolveFormulaDeepLink(detail, { ...source, ...change }), { kind: "missing" });
  }
});

test("indexing all 21 representative methods retains original source despite alignment prefixes", async () => {
  const library = await engine.buildLibrary(model, mappings.map(([id]) => ({
    method: id, records: [{ ...data(id).records[0], algs: [data(id).records[0].algs[0]] }],
  })));
  assert.equal(library.loaded, 21);
  assert.equal(library.rejected, 0);
  const covered = new Set<MethodId>();
  let aligned = 0;
  for (const entries of library.index.values()) for (const entry of entries) {
    if (entry.name === "CLL Skip") {
      assert.equal(entry.source, undefined);
      continue;
    }
    covered.add(entry.method);
    const record = data(entry.method).records[0];
    assert.deepEqual(entry.source, { set: record.set, group: record.group, name: record.name, rawAlg: record.algs[0] });
    roundTrip(solution(entry.method, entry.sourceApi, entry.source));
    if (entry.algorithm.join(" ") !== entry.source!.rawAlg) aligned++;
  }
  assert.equal(covered.size, 21);
  assert.ok(aligned > 0, "exercise indexed alignment prefixes that differ from the retained raw source");
});

test("actual default full-EG search returns only exact public source records and resolvable links", async t => {
  const library = await engine.buildLibrary(model, engine.DEFAULT_METHODS.map(data));
  assert.equal(library.loaded + library.rejected, 798);
  const requested: SearchOptions = {
    methods: [...engine.DEFAULT_METHODS], colors: [..."URFDLB"], maxDepth: 5,
    familyDepths: { ...engine.DEFAULT_FAMILY_DEPTHS }, moveSet: "ruf", maxSolutions: 20,
    timeLimitMs: 8000, maxOverlap: 1, forbidTransitionRotations: true,
  };
  const scramble = "R U R' F2 U' R2 F U2 R'";
  const result = await engine.search(model, library, scramble, requested);
  assert.equal(result.solutions.length, 20);
  let transformed = 0;
  for (const value of result.solutions) {
    assert.ok(value.source, value.caseName);
    const source = value.source;
    const matches = data(value.method).records.flatMap(record => record.algs.filter(raw =>
      record.set === source.set && record.group === source.group && record.name === source.name && raw === source.rawAlg));
    assert.equal(matches.length, 1, JSON.stringify(source));
    assert.ok(model.solved(model.applySequence(engine.SOLVED, engine.parseMoves(`${scramble} ${value.orientation} ${value.execution}`))));
    roundTrip(value);
    if (value.algorithm !== source.rawAlg) {
      transformed++;
      assert.equal(new URL(formulaLibraryLink(value)!, "http://localhost").searchParams.get("alg"), source.rawAlg);
    }
  }
  t.diagnostic(`${result.solutions.length} actual solutions; ${transformed} execution formulas differ from raw source`);
});

test("actual prefixed-source search links original raw strings when c.algorithm has a different prefix", async () => {
  const record = data("TCLL-").records[0];
  assert.ok(record.algs[0].startsWith("x "));
  const library = await engine.buildLibrary(model, [{ method: "TCLL-", records: [record] }]);
  const result = await engine.search(model, library, new Alg(record.algs[0]).invert().toString(), {
    methods: ["TCLL-"], colors: [..."URFDLB"], maxDepth: 0, moveSet: "ruf",
    maxSolutions: 100, timeLimitMs: 10000, forbidTransitionRotations: false,
  });
  assert.ok(result.solutions.length > 0);
  assert.ok(result.solutions.some(value => value.algorithm !== record.algs[0]
    && value.algorithm.split(" ")[0] !== record.algs[0].split(" ")[0]));
  for (const value of result.solutions) {
    assert.equal(value.source?.rawAlg, record.algs[0]);
    roundTrip(value);
  }
});

test("finish rotations survive search without changing retained source or link; skips have no origin", async () => {
  const record = data("CLL").records[0];
  const built = await engine.buildLibrary(model, [{ method: "CLL", records: [record] }]);
  const requested: SearchOptions = {
    methods: ["CLL"], colors: [..."URFDLB"], maxDepth: 0, moveSet: "ruf",
    maxSolutions: 100, timeLimitMs: 10000, forbidTransitionRotations: false,
  };
  const scramble = new Alg(record.algs[0]).invert().toString();
  const source = { set: record.set!, group: record.group, name: record.name, rawAlg: record.algs[0] };
  for (const rotation of ["x", "y2", "z'"]) {
    const library: Library = { ...built, index: new Map([...built.index].map(([key, entries]) => [key,
      entries.filter(entry => entry.source).map(entry => ({ ...entry, algorithm: [...entry.algorithm, rotation] })),
    ])) };
    const before = JSON.stringify([...library.index]);
    const result = await engine.search(model, library, scramble, requested);
    assert.ok(result.solutions.length > 0, rotation);
    assert.ok(result.solutions.some(value => value.algorithm.endsWith(rotation)), rotation);
    for (const value of result.solutions) {
      assert.deepEqual(value.source, source);
      roundTrip(value);
    }
    assert.equal(JSON.stringify([...library.index]), before);
  }
  const skips = await engine.buildLibrary(model, [{ method: "CLL", records: [] }]);
  const result = await engine.search(model, skips, "U", requested);
  assert.ok(result.solutions.length > 0);
  for (const value of result.solutions) {
    assert.equal(value.caseName, "CLL Skip");
    assert.equal(value.source, undefined);
    assert.equal(formulaLibraryLink(value), null);
  }
});
