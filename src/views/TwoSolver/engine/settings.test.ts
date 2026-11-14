import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { before, test } from "node:test";
import { build } from "esbuild";
import type { KPattern, KPuzzle } from "cubing/kpuzzle";
import type { Library } from "./library";
import type { CubeModel } from "./state";
import type { FamilyDepths, MethodData, MethodId, SearchOptions, SearchResult, Solution } from "./types";

type Engine = typeof import("./state") & typeof import("./library") &
  typeof import("./search") & typeof import("./types");

// Keep the oracle independent of familyOf and METHODS' family metadata.
const families = {
  EG: ["CLL", "EG1", "EG2", "LEG1"], TCLL: ["TCLL+", "TCLL-"],
  LS: ["LS1", "LS2", "LS3", "LS4", "LS5", "LS6", "LS7", "LS8", "LS9"],
  EGLS: ["EGLS1", "EGLS2"], FH: ["FH"], CBL: ["CBL"], TEG: ["TEG1", "TEG2"],
} satisfies Record<keyof FamilyDepths, MethodId[]>;
const familyNames = Object.keys(families) as (keyof FamilyDepths)[];
const methods = Object.values(families).flat();
const defaults: FamilyDepths = { EG: 5, TCLL: 4, LS: 4, EGLS: 3, FH: 3, CBL: 2, TEG: 3 };
const tokens = (text: string) => text.trim().split(/\s+/).filter(Boolean);
let engine: Engine;
let model: CubeModel;
let kp: KPuzzle;
let Alg: typeof import("cubing/alg").Alg;
let library: Library;
const sources = new Map<MethodId, MethodData>();
const solved = new Set<string>();

function key(pattern: KPattern): string {
  const { pieces, orientation } = pattern.patternData.CORNERS;
  return pieces.map((piece, i) => `${piece}:${orientation[i]}`).join(",");
}

function options(overrides: Partial<SearchOptions> = {}): SearchOptions {
  // maxDepth remains explicit to exercise callers using the legacy API.
  return { methods: [...methods], colors: [..."URFDLB"], maxDepth: 0,
    moveSet: "ruf", maxSolutions: 2000, timeLimitMs: 10000, ...overrides };
}

function depths(value: number): FamilyDepths {
  return { EG: value, TCLL: value, LS: value, EGLS: value, FH: value, CBL: value, TEG: value };
}

function familyFor(method: MethodId): keyof FamilyDepths {
  const family = familyNames.find(name => (families[name] as MethodId[]).includes(method));
  assert.ok(family, `Unknown method ${method}`);
  return family;
}

function verify(scramble: string, result: SearchResult, requested: SearchOptions): void {
  const initial = kp.defaultPattern().applyAlg(scramble);
  for (const solution of result.solutions) {
    const context = `${solution.method}/${solution.caseName}: ${solution.original}`;
    assert.ok(requested.methods.includes(solution.method), context);
    assert.ok(requested.colors.includes(solution.color), context);
    const limit = requested.familyDepths?.[familyFor(solution.method)] ?? requested.maxDepth;
    assert.ok(solution.baseMoves <= limit, `Family depth ${limit}: ${context}`);
    assert.equal(tokens(solution.base).length, solution.baseMoves, context);
    assert.ok(tokens(solution.base).every(move => /^[RUF](?:2|')?$/.test(move)), context);
    assert.ok(solved.has(key(initial.applyAlg(`${solution.orientation} ${solution.execution}`))), `Execution replay: ${context}`);
    assert.ok(solved.has(key(initial.applyAlg(solution.original))), `Original replay: ${context}`);
    // Compare exact final frames too, rather than accepting any solved rotation.
    assert.equal(key(initial.applyAlg(`${solution.orientation} ${solution.execution}`)),
      key(initial.applyAlg(solution.original)), `Exact replay: ${context}`);
    const boundary = solution.boundary;
    assert.ok(boundary, `Missing boundary: ${context}`);
    assert.equal(boundary.left, solution.base, context);
    assert.equal(boundary.right, [solution.preAuf, solution.algorithm, solution.postAuf].filter(Boolean).join(" "), context);
    assert.equal(boundary.leftMarked.length, tokens(boundary.left).length, context);
    assert.equal(boundary.rightMarked.length, tokens(boundary.right).length, context);
    assert.ok([...boundary.leftMarked, ...boundary.rightMarked].every(value => typeof value === "boolean"), context);
    assert.ok(Number.isInteger(boundary.overlap) && boundary.overlap >= 0 && boundary.overlap <= (requested.maxOverlap ?? 1), context);
    assert.equal(solution.originalMoves, tokens([solution.base, boundary.right].join(" ")).filter(move => /^[URFDLB]/.test(move)).length, context);
    assert.equal(solution.moves, tokens(solution.execution).filter(move => /^[URFDLB]/.test(move)).length, context);
    assert.equal(solution.cancelled, solution.originalMoves - solution.moves, context);
  }
}

function identities(solutions: Solution[]): string[] {
  return solutions.map(({ method, color, orientation, execution, baseMoves }) =>
    JSON.stringify([method, color, orientation, execution, baseMoves])).sort();
}

before(async () => {
  // cubing has import-only exports; match the existing in-memory ESM runtime.
  const bundled = await build({ stdin: { resolveDir: __dirname, contents:
    ["state", "library", "search", "types"].map(name => `export * from "./${name}";`).join("\n") +
    '\nexport { cube2x2x2 } from "cubing/puzzles"; export { Alg } from "cubing/alg";' },
  bundle: true, write: false, platform: "node", format: "esm" });
  const runtime = await import(`data:text/javascript;base64,${Buffer.from(
    bundled.outputFiles[0].text + "\n//# sourceURL=two-solver-settings-runtime.mjs",
  ).toString("base64")}`);
  engine = runtime;
  Alg = runtime.Alg;
  model = await engine.CubeModel.create();
  kp = await runtime.cube2x2x2.kpuzzle();
  const rotations = [kp.defaultPattern()];
  solved.add(key(rotations[0]));
  for (let i = 0; i < rotations.length; i++) for (const move of ["x", "y", "z"]) {
    const pattern = rotations[i].applyMove(move);
    if (solved.has(key(pattern))) continue;
    solved.add(key(pattern));
    rotations.push(pattern);
  }
  assert.equal(solved.size, 24);
  // One real formula per method, built together once, covers all seven families
  // without repeating the full catalog suite's expensive dataset build.
  for (const method of methods) {
    const dataset = JSON.parse(readFileSync(path.resolve(__dirname,
      `../../../../public/two-solver/data/${method}.json`), "utf8")) as MethodData;
    assert.equal(dataset.method, method);
    const record = dataset.records[0];
    assert.ok(record?.algs[0], method);
    sources.set(method, { method, records: [{ ...record, algs: [record.algs[0]] }] });
  }
  library = await engine.buildLibrary(model, [...sources.values()]);
  assert.equal(library.loaded, methods.length);
  assert.equal(library.rejected, 0);
  assert.deepEqual([...new Set([...library.index.values()].flat().map(entry => entry.method))].sort(), [...methods].sort());
});

test("family defaults are exact and exported depthFor maps every method, retaining legacy fallback and zero", () => {
  assert.deepEqual(engine.DEFAULT_FAMILY_DEPTHS, defaults);
  assert.equal(typeof engine.depthFor, "function");
  for (const family of familyNames) for (const method of families[family]) {
    assert.equal(engine.familyOf(method), family, method);
    assert.equal(engine.depthFor(options({ maxDepth: 2 }), method), 2, method);
    assert.equal(engine.depthFor(options({ maxDepth: 0, familyDepths: { ...defaults } }), method), defaults[family], method);
    assert.equal(engine.depthFor(options({ maxDepth: 6, familyDepths: depths(0) }), method), 0, method);
  }
});

test("all-family search applies each candidate's own depth, independently of the legacy baseline", async t => {
  const libraryBefore = structuredClone(library);
  for (const [index, family] of familyNames.entries()) await t.test(family, async () => {
    const method = families[family][0];
    const source = sources.get(method)!;
    const scramble = `${new Alg(source.records[0].algs[0]).invert()} F' U' R'`;
    const legacy = options({ maxDepth: 3, maxOverlap: 0 });
    const baseline = await engine.search(model, library, scramble, legacy);
    assert.equal(baseline.reason, "complete", `${family}: baseline must not truncate or time out`);
    assert.equal(baseline.complete, true);
    assert.equal(baseline.depthReached, 3);
    verify(scramble, baseline, legacy);
    assert.ok(baseline.solutions.some(solution => solution.method === method && solution.baseMoves === 3),
      `${family}: exercise a real three-move candidate`);
    const baselineBefore = structuredClone(baseline);
    for (const ownDepth of [3, 2]) {
      const familyDepths = Object.fromEntries(familyNames.map((name, i) =>
        [name, (i - index + ownDepth + 8) % 4])) as FamilyDepths;
      const requested = options({ maxDepth: 0, familyDepths, maxOverlap: 0 });
      const before = structuredClone(requested);
      Object.freeze(requested.methods);
      Object.freeze(requested.colors);
      Object.freeze(familyDepths);
      Object.freeze(requested);
      const result = await engine.search(model, library, scramble, requested);
      assert.equal(result.reason, "complete");
      assert.equal(result.complete, true);
      assert.equal(result.depthReached, 3, "Enabled family depths override maxDepth=0");
      verify(scramble, result, requested);
      const expected = baseline.solutions.filter(solution => solution.baseMoves <= familyDepths[familyFor(solution.method)]);
      assert.deepEqual(identities(result.solutions), identities(expected), "Mixed limits must retain every eligible legacy candidate");
      if (ownDepth === 3) assert.ok(result.solutions.some(solution => solution.method === method && solution.baseMoves === 3),
        `${family}: retain the candidate at its exact family limit`);
      else assert.ok(expected.length < baseline.solutions.length, `${family}: lowering its limit must filter candidates`);
      assert.deepEqual(requested, before, "Search must not mutate nested options");
      assert.deepEqual(baseline, baselineBefore, "Later searches must preserve complete earlier results");
      assert.deepEqual(result.data, baseline.data);
      assert.deepEqual(library, libraryBefore, "Search must preserve the complete shared library");
      t.diagnostic(`${family} depth ${ownDepth}: ${baseline.solutions.length} legacy candidates, ${result.solutions.length} within mixed limits`);
    }
  });
});

test("effective depth considers enabled families only: EG zero ignores disabled FH six and legacy six", async () => {
  const requested = options({ methods: [...families.EG], maxDepth: 6,
    familyDepths: { ...depths(0), FH: 6 } });
  const before = structuredClone(requested);
  const scramble = new Alg(sources.get("CLL")!.records[0].algs[0]).invert().toString();
  const progress: string[] = [];
  const result = await engine.search(model, library, scramble, requested, text => progress.push(text));
  assert.equal(result.reason, "complete");
  assert.equal(result.complete, true);
  assert.equal(result.depthReached, 0);
  assert.equal(progress.length, 1, "Only depth zero should be traversed");
  assert.ok(result.solutions.length > 0);
  assert.ok(result.solutions.every(solution => solution.baseMoves === 0));
  verify(scramble, result, requested);
  assert.deepEqual(requested, before);
});

test("enabled family maximum overrides both a larger and a smaller legacy maxDepth", async () => {
  const scramble = "R U2 F' R2 U F2";
  const requested = options({ methods: ["CLL", "LS9"], maxDepth: 6,
    familyDepths: { EG: 1, LS: 2, TCLL: 6, EGLS: 6, FH: 6, CBL: 6, TEG: 6 } });
  const before = structuredClone(requested);
  const high = await engine.search(model, library, scramble, requested);
  const highBefore = structuredClone(high);
  const lowOptions = { ...requested, maxDepth: 0 };
  const low = await engine.search(model, library, scramble, lowOptions);
  for (const [result, settings] of [[high, requested], [low, lowOptions]] as const) {
    assert.equal(result.reason, "complete");
    assert.equal(result.complete, true);
    assert.equal(result.depthReached, 2);
    verify(scramble, result, settings);
  }
  assert.equal(high.nodes, low.nodes);
  assert.deepEqual(identities(high.solutions), identities(low.solutions));
  assert.deepEqual(high, highBefore);
  assert.deepEqual(requested, before);
});

test("search passes maxOverlap 0/1/2 through to execution and boundary masks; omitted means one", async () => {
  // An exact-state candidate with two explicit inverse pairs at the stage join.
  // Fix the grip so a different orientation cannot hide the selected F U path.
  const finish = tokens(sources.get("CLL")!.records[0].algs[0]);
  const right = ["U'", "F'", ...finish];
  const inverse = new Alg(right.join(" ")).invert().toString();
  const target = kp.defaultPattern().applyAlg(inverse).patternData.CORNERS;
  const state = Uint8Array.from(target.pieces, (piece, i) => piece * 3 + target.orientation[i]);
  const crafted: Library = { loaded: 1, rejected: 0,
    masks: new Set([model.mask(state, "D")]),
    index: new Map([[model.key(state), [{ method: "CLL", name: "Two-pair boundary fixture",
      group: "Settings", sourceApi: "CLL", color: model.colorNormalizers[state[7]][engine.FACE_NAMES.indexOf("D")],
      algorithm: right, preAuf: "", postAuf: "" }]]]),
  };
  const fixedGrip = Object.create(model) as CubeModel;
  fixedGrip.rotations = [model.rotations.find(rotation => rotation.tokens.length === 0)!];
  const scramble = `${inverse} U' F'`;
  const libraryBefore = structuredClone(crafted);
  const retained: { result: SearchResult; snapshot: SearchResult }[] = [];
  const executions = new Map<number, string>();
  for (const maxOverlap of [0, 1, 2, undefined]) {
    const requested = options({ methods: ["CLL"], colors: ["D"], maxDepth: 0,
      familyDepths: { ...depths(0), EG: 2 }, ...(maxOverlap === undefined ? {} : { maxOverlap }) });
    const before = structuredClone(requested);
    const result = await engine.search(fixedGrip, crafted, scramble, requested);
    assert.equal(result.reason, "complete");
    assert.equal(result.complete, true);
    assert.equal(result.depthReached, 2);
    verify(scramble, result, requested);
    const overlap = maxOverlap ?? 1;
    const expectedExecution = [
      ["F", "U", ...right], ["F", "F'", ...finish], finish,
    ][overlap].join(" ");
    const solution = result.solutions.find(value => value.base === "F U" && value.execution === expectedExecution);
    assert.ok(solution, `Missing F U candidate for maxOverlap=${String(maxOverlap)}: ${result.solutions.map(value => `${value.base} // ${value.execution}`).join("; ")}`);
    assert.equal(solution.boundary!.overlap, overlap);
    assert.deepEqual(solution.boundary!.leftMarked, [[false, false], [false, true], [true, true]][overlap]);
    assert.deepEqual(solution.boundary!.rightMarked, [overlap >= 1, overlap >= 2, ...finish.map(() => false)]);
    assert.equal(solution.cancelled, overlap * 2);
    if (maxOverlap === undefined) assert.equal(solution.execution, executions.get(1));
    else executions.set(maxOverlap, solution.execution);
    assert.deepEqual(requested, before);
    assert.deepEqual(crafted, libraryBefore);
    for (const earlier of retained) assert.deepEqual(earlier.result, earlier.snapshot, "Subsequent searches must not mutate returned copies");
    retained.push({ result, snapshot: structuredClone(result) });
  }
  assert.equal(new Set(executions.values()).size, 3);
});

test("search rejects incomplete or invalid family depths and invalid overlap without mutating options", async t => {
  const invalid: { label: string; settings: Partial<SearchOptions> }[] = [];
  for (const family of familyNames) {
    const incomplete: Partial<FamilyDepths> = { ...defaults };
    delete incomplete[family];
    invalid.push({ label: `missing ${family}`, settings: { familyDepths: incomplete as FamilyDepths } });
    for (const value of [-1, 7, 0.5, NaN]) invalid.push({ label: `${family}=${String(value)}`,
      settings: { familyDepths: { ...defaults, [family]: value } } });
  }
  for (const value of [-1, 7, 0.5, NaN]) invalid.push({ label: `maxOverlap=${String(value)}`, settings: { maxOverlap: value } });
  for (const { label, settings } of invalid) await t.test(label, async () => {
    // Invalid values in disabled families must also be rejected.
    const requested = options({ methods: ["CLL"], ...settings });
    const before = structuredClone(requested);
    await assert.rejects(() => engine.search(model, library, "R U F R", requested), label);
    assert.deepEqual(requested, before, "Validation must preserve even NaN and missing keys");
  });
});
