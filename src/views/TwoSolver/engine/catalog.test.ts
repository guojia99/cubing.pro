import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { before, test } from "node:test";
import { build } from "esbuild";
import type { KPattern, KPuzzle } from "cubing/kpuzzle";
import type { CubeModel } from "./state";
import type { Library } from "./library";
import type { MethodData, MethodId, SearchOptions, Solution } from "./types";

type Engine = typeof import("./state") & typeof import("./structure") &
  typeof import("./library") & typeof import("./search") & typeof import("./types");
type Fixture = { raw: string; name: string; inverse: string; pattern: KPattern; color: string };
let engine: Engine;
let model: CubeModel;
let kp: KPuzzle;
let Alg: typeof import("cubing/alg").Alg;
let Pattern: typeof import("cubing/kpuzzle").KPattern;
let library: Library;
let buildMs: number;
const datasets = new Map<MethodId, MethodData>();
const fixtures = new Map<MethodId, Fixture>();
const counts = new Map<MethodId, { accepted: number; rejected: number }>();
const slotTargets = new Map<string, Set<MethodId>>();
const rotations: { text: string; pattern: KPattern }[] = [];
const solved = new Set<string>();
const faces = ["URF", "UBR", "ULB", "UFL", "DFR", "DLF", "DBL", "DRB"];
const sides = [[4, 1, 5, 2], [4, 2, 7, 1], [6, 1, 7, 2], [5, 1, 6, 2]];
const aufs = ["", "U", "U2", "U'"];
const lsMethods = Array.from({ length: 9 }, (_, i) => `LS${i + 1}` as MethodId);
const slotMethods: MethodId[] = [...lsMethods, "EGLS1", "EGLS2"];

function codes(pattern: KPattern): number[] {
  const { pieces, orientation } = pattern.patternData.CORNERS;
  return pieces.map((piece, i) => piece * 3 + orientation[i]);
}

function key(pattern: KPattern): string { return codes(pattern).join(","); }

function stickers(pattern: KPattern): string[][] {
  return codes(pattern).map(code => [0, 1, 2].map(j => faces[Math.floor(code / 3)][(j - code % 3 + 3) % 3]));
}

// This oracle uses public KPuzzle stickers and solved color frames only. It
// never consults catalog names, engine.describe, or engine normalizers.
function geometry(pattern: KPattern, color: string) {
  const rows = stickers(pattern);
  const twists = rows.slice(4).map(row => row.indexOf(color));
  const lower = twists.filter(twist => twist >= 0).length;
  const down = twists.filter(twist => twist === 0).length;
  const bars = (values: string[][]) => sides.flatMap(([a, j, b, k], i) => values[a][j] === values[b][k] ? ["FRBL"[i]] : []);
  const untwisted = rows.map((row, i) => i < 4 || !row.includes(color) ? row :
    [0, 1, 2].map(j => row[(row.indexOf(color) + j) % 3]));
  let insertionBars: number | undefined;
  let lsId: number | undefined;
  if (lower === 3 && down === 3) {
    const missing = rows.findIndex((row, i) => i >= 4 && !row.includes(color));
    const incoming = rows.findIndex((row, i) => i < 4 && row.includes(color));
    const completed = rows.map(row => [...row]);
    completed[missing] = [0, 1, 2].map(j => rows[incoming][(rows[incoming].indexOf(color) + j) % 3]);
    insertionBars = bars(completed).length;
    for (const turn of ["", "y", "y2", "y'"]) {
      const aligned = turn ? pattern.applyAlg(turn) : pattern;
      if (stickers(aligned)[4].includes(color)) continue;
      const values = codes(aligned);
      const frame = rotations.find(rotation => codes(rotation.pattern)[7] === values[7]);
      assert.ok(frame);
      const recoloring = codes(frame.pattern).flatMap(code => [0, 1, 2].map(o => Math.floor(code / 3) * 3 + (code % 3 + o) % 3));
      const normalized = values.map(code => recoloring.indexOf(code));
      if (![5, 6, 7].every(i => normalized[i] === i * 3)) continue;
      const incomingCode = normalized.find(code => Math.floor(code / 3) === 4);
      assert.notEqual(incomingCode, undefined);
      lsId = [0, 2, 1].indexOf(incomingCode! % 3) * 3 + normalized[4] % 3 + 1;
    }
  }
  return { lower, down, twists, bars: bars(rows), residualBars: lower === 4 ? bars(untwisted) : [],
    pairedDownBar: sides.some(([a, j, b, k]) => rows[a][0] === color && rows[b][0] === color && rows[a][j] === rows[b][k]),
    insertionBars, lsId };
}

function accepts(method: MethodId, pattern: KPattern, color: string, info = geometry(pattern, color)): boolean {
  const { lower, down, twists, residualBars: bars } = info;
  if (method === "CBL") return lower === 4;
  if (method === "FH") return lower === 4 && down === 2 && info.pairedDownBar && new Set(twists.filter(t => t > 0)).size === 1;
  if (["CLL", "EG1", "EG2", "LEG1"].includes(method)) return down === 4 &&
    (method === "CLL" ? bars.length === 4 : method === "EG2" ? bars.length === 0 : bars.length === 1 && bars[0] === (method === "LEG1" ? "L" : "B"));
  if (method.startsWith("TCLL") || method.startsWith("TEG")) return lower === 4 && down === 3 &&
    (method === "TEG1" ? bars.length === 1 : method === "TEG2" ? bars.length === 0 : bars.length === 4 && twists.includes(method === "TCLL+" ? 1 : 2));
  return lower === 3 && down === 3 && (method === "EGLS1" ? info.insertionBars === 1 : method === "EGLS2" ? info.insertionBars === 0 : info.lsId === Number(method.slice(2)));
}

function data(method: MethodId): MethodData {
  const dataset = datasets.get(method);
  assert.ok(dataset, method);
  return dataset;
}

function fixture(method: MethodId): Fixture {
  const value = fixtures.get(method);
  assert.ok(value, `No geometrically validated real inverse for ${method}`);
  return value;
}

function targetFamilies(raw: string): Set<MethodId> {
  const cached = slotTargets.get(raw);
  if (cached) return cached;
  const found = new Set<MethodId>();
  const formula = engine.parseMoves(raw).join(" ");
  for (const post of aufs) {
    const inverse = new Alg(`${formula} ${post}`).invert().toString();
    const target = kp.defaultPattern().applyAlg(inverse);
    for (const rotation of rotations) {
      const pattern = target.applyAlg(rotation.text);
      for (const color of "URFDLB") {
        const info = geometry(pattern, color);
        if (info.lower !== 3 || info.down !== 3) continue;
        if (info.lsId !== undefined) found.add(`LS${info.lsId}` as MethodId);
        if (info.insertionBars === 1) found.add("EGLS1");
        if (info.insertionBars === 0) found.add("EGLS2");
      }
    }
  }
  slotTargets.set(raw, found);
  return found;
}

function foreignFormula(source: MethodId, wrongLabel: MethodId): { raw: string; name: string } {
  for (const record of data(source).records) for (const raw of record.algs) {
    const targets = targetFamilies(raw);
    if (targets.has(source) && !targets.has(wrongLabel)) return { raw, name: record.name };
  }
  assert.fail(`No real ${source} target excludes ${wrongLabel} across all colors, 24 rotations and post-AUFs`);
}

function options(overrides: Partial<SearchOptions> = {}): SearchOptions {
  return { methods: engine.METHODS.map(({ id }) => id), colors: [..."URFDLB"], maxDepth: 3,
    maxSolutions: 500, timeLimitMs: 10000, moveSet: "ruf", ...overrides };
}

function verify(scramble: string, solutions: Solution[], requested: SearchOptions): void {
  assert.ok(solutions.length, `No solutions: ${scramble}`);
  const initial = kp.defaultPattern().applyAlg(scramble);
  for (const solution of solutions) {
    const context = `${solution.method}/${solution.caseName}/${solution.color}: ${scramble} // ${solution.original}`;
    assert.ok(requested.methods.includes(solution.method), context);
    assert.ok(requested.colors.includes(solution.color), context);
    assert.ok(solved.has(key(initial.applyAlg(`${solution.orientation} ${solution.execution}`))), `Independent execution replay: ${context}`);
    assert.ok(solved.has(key(initial.applyAlg(solution.original))), `Independent original replay: ${context}`);
    const tokens = (text: string) => text.trim().split(/\s+/).filter(Boolean);
    const tail = tokens([solution.base, solution.preAuf, solution.algorithm, solution.postAuf].join(" "));
    const original = tokens(solution.original);
    assert.deepEqual(original.slice(original.length - tail.length), tail, context);
    const grip = original.slice(0, original.length - tail.length).join(" ");
    const stage = initial.applyAlg(`${grip} ${solution.base}`);
    assert.ok(accepts(solution.method, stage, solution.color), `ORIGINAL stage predicate: ${context}; ${JSON.stringify(geometry(stage, solution.color))}`);
    assert.equal(engine.matchesStructure(solution.method, engine.describe(model, Uint8Array.from(codes(stage)), solution.color)), true, context);
    assert.equal(tokens(solution.base).length, solution.baseMoves, context);
    assert.ok(solution.baseMoves <= requested.maxDepth, context);
    assert.ok(tokens(solution.base).every(move => (requested.moveSet === "ruf" ? /^[RUF](?:2|')?$/ : /^[URFDLB](?:2|')?$/).test(move)), context);
    const source = engine.METHODS.find(method => method.id === solution.method);
    assert.equal(solution.sourceApi, source?.api, context);
    if (solution.caseName !== "CLL Skip") assert.ok(data(solution.method).records.some(record => record.name === solution.caseName && record.group === solution.group), `Source category leakage: ${context}`);
  }
}

before(async () => {
  // Match engine.test.ts: bundle import-only cubing into ESM rather than asking
  // tsx's CommonJS transform to evaluate named ESM exports through require().
  const result = await build({ stdin: { resolveDir: __dirname, contents:
    ["state", "structure", "library", "search", "types"].map(name => `export * from "./${name}";`).join("\n") +
    '\nexport { cube2x2x2 } from "cubing/puzzles"; export { Alg } from "cubing/alg"; export { KPattern } from "cubing/kpuzzle";' },
  bundle: true, write: false, platform: "node", format: "esm" });
  const runtime = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text + "\n//# sourceURL=two-solver-catalog-runtime.mjs").toString("base64")}`);
  engine = runtime;
  Alg = runtime.Alg;
  Pattern = runtime.KPattern;
  model = await engine.CubeModel.create();
  kp = await runtime.cube2x2x2.kpuzzle();
  rotations.push({ text: "", pattern: kp.defaultPattern() });
  solved.add(key(kp.defaultPattern()));
  for (let i = 0; i < rotations.length; i++) for (const turn of ["x", "y", "z"]) {
    const pattern = rotations[i].pattern.applyAlg(turn);
    if (solved.has(key(pattern))) continue;
    solved.add(key(pattern));
    rotations.push({ text: `${rotations[i].text} ${turn}`.trim(), pattern });
  }
  assert.equal(rotations.length, 24);
  assert.equal(engine.METHODS.length, 21);
  for (const { id } of engine.METHODS) {
    const parsed = JSON.parse(readFileSync(path.resolve(__dirname, `../../../../public/two-solver/data/${id}.json`), "utf8")) as MethodData;
    assert.equal(parsed.method, id);
    assert.ok(parsed.records.length, id);
    for (const record of parsed.records) {
      assert.equal(typeof record.name, "string");
      assert.equal(typeof record.group, "string");
      assert.ok(record.algs.length && record.algs.every(raw => typeof raw === "string" && raw.trim()), `${id}/${record.name}`);
    }
    datasets.set(id, parsed);
    for (const record of parsed.records) {
      for (const raw of record.algs) {
        const inverse = new Alg(engine.parseMoves(raw).join(" ")).invert().toString();
        const target = kp.defaultPattern().applyAlg(inverse);
        for (const rotation of rotations) {
          const pattern = target.applyAlg(rotation.text);
          const color = [..."URFDLB"].find(color => accepts(id, pattern, color));
          if (color) { fixtures.set(id, { raw, name: record.name, inverse, pattern, color }); break; }
        }
        if (fixtures.has(id)) break;
      }
      if (fixtures.has(id)) break;
    }
    fixture(id);
  }
  const started = performance.now();
  library = await engine.buildLibrary(model, engine.METHODS.map(({ id }) => data(id)));
  buildMs = performance.now() - started;
}, { timeout: 180000 });

test("ALL21 complete datasets: per-family acceptance, rejection, full entries and build duration", t => {
  const entries = [...library.index.values()].flat();
  for (const { id, api } of engine.METHODS) {
    const records = data(id).records;
    const familyEntries = entries.filter(entry => entry.method === id && entry.name !== "CLL Skip");
    let accepted = 0, rejected = 0;
    for (const record of records) for (const raw of record.algs) {
      let valid = false;
      let formula: string[];
      try { formula = engine.parseMoves(raw); }
      catch { rejected++; continue; }
      if (formula.length) outer: for (const post of aufs) {
        const inverse = new Alg(`${formula.join(" ")} ${post}`).invert();
        const target = kp.defaultPattern().applyAlg(inverse);
        for (const rotation of rotations) {
          const pattern = target.applyAlg(rotation.text);
          if ([..."URFDLB"].some(color => accepts(id, pattern, color))) { valid = true; break outer; }
        }
      }
      if (valid) accepted++; else rejected++;
    }
    counts.set(id, { accepted, rejected });
    assert.ok(accepted > 0, id);
    assert.ok(familyEntries.every(entry => entry.sourceApi === api && records.some(record => record.name === entry.name && record.group === entry.group)), `${id}: source category leakage`);
    t.diagnostic(`${id}: ${accepted} accepted, ${rejected} rejected, ${familyEntries.length} indexed entries (${records.length} source formulas)`);
  }
  const sources = [...datasets.values()].reduce((sum, dataset) => sum + dataset.records.reduce((n, record) => n + record.algs.length, 0), 0);
  t.diagnostic(`ALL21: ${library.loaded} accepted, ${library.rejected} rejected / ${sources} formulas; ${entries.length} full entries, ${library.index.size} state keys, ${library.masks.size} masks; ${Math.round(buildMs)}ms build`);
  assert.equal(library.loaded + library.rejected, sources);
  assert.equal([...counts.values()].reduce((sum, count) => sum + count.accepted, 0), library.loaded);
  assert.equal([...counts.values()].reduce((sum, count) => sum + count.rejected, 0), library.rejected);
});

test("every full-library indexed target satisfies its own method predicate and color mask", () => {
  for (const [packed, entries] of library.index) {
    let remaining = packed;
    const values = Array<number>(8);
    for (let i = 7; i >= 0; i--) { values[i] = remaining % 24; remaining = Math.floor(remaining / 24); }
    const pattern = new Pattern(kp, { CORNERS: { pieces: values.map(value => Math.floor(value / 3)), orientation: values.map(value => value % 3) } });
    const byColor = new Map<string, ReturnType<typeof geometry>>();
    for (const entry of entries) {
      let info = byColor.get(entry.color);
      if (!info) { info = geometry(pattern, entry.color); byColor.set(entry.color, info); }
      assert.ok(accepts(entry.method, pattern, entry.color, info), `Indexed category leakage: ${entry.method}/${entry.name}/${entry.color}/${values.join(",")}`);
      assert.ok(library.masks.has(model.mask(Uint8Array.from(values), entry.color)), `Missing target mask: ${entry.method}/${entry.name}`);
    }
  }
});

test("real canonical inverses agree with geometry in all 24 rotations, with upper-only AUF changes", () => {
  for (const { id } of engine.METHODS) {
    const source = fixture(id);
    let accepted = 0;
    for (const rotation of rotations) for (const auf of aufs) {
      const pattern = source.pattern.applyAlg(`${rotation.text} ${auf}`);
      const before = codes(source.pattern.applyAlg(rotation.text));
      assert.deepEqual(codes(pattern).slice(4), before.slice(4), "U AUF must leave the entire lower layer unchanged");
      const state = Uint8Array.from(codes(pattern));
      for (const color of "URFDLB") {
        const expected = accepts(id, pattern, color);
        assert.equal(engine.matchesStructure(id, engine.describe(model, state, color)), expected, `${id}/${source.name}/${rotation.text}/${auf}/${color}`);
        if (expected) accepted++;
      }
    }
    assert.ok(accepted >= 4, `${id}: canonical inverse must have an accepted frame for every AUF`);
  }
});

test("each LS subtype rejects a geometrically foreign real LS target pasted under its label", async t => {
  for (const target of lsMethods) await t.test(target, async () => {
    // A formula may legitimately solve several colors with different LS ids.
    // Prove the wrong label is absent in every frame before asserting rejection.
    for (const source of lsMethods.filter(method => method !== target)) {
      const real = foreignFormula(source, target);
      const pasted = await engine.buildLibrary(model, [{ method: target, records: [{ name: `${source} pasted as ${target}`, group: "Regression", algs: [real.raw] }] }]);
      assert.equal(pasted.loaded, 0, `${source} accepted as ${target}`);
      assert.equal(pasted.rejected, 1, `${source} rejected as ${target}`);
      assert.equal(pasted.index.size, 0);
      assert.equal(pasted.masks.size, 0);
    }
  });
});

test("EGLS1, all nine ordinary LS subtypes, and EGLS2 have explicit geometric boundaries", async t => {
  for (const source of slotMethods) await t.test(source, async () => {
    const real = fixture(source);
    const info = geometry(real.pattern, real.color);
    assert.equal(info.lower, 3);
    assert.equal(info.down, 3);
    assert.equal(info.insertionBars, source === "EGLS1" ? 1 : source === "EGLS2" ? 0 : 4, source);
    assert.equal(info.lsId, source.startsWith("LS") ? Number(source.slice(2)) : undefined, source);
    for (const rotation of rotations) {
      const pattern = real.pattern.applyAlg(rotation.text);
      for (const color of "URFDLB") for (const target of slotMethods) {
        assert.equal(engine.matchesStructure(target, engine.describe(model, Uint8Array.from(codes(pattern)), color)), accepts(target, pattern, color), `${source} vs ${target}/${rotation.text}/${color}`);
      }
    }
    for (const target of source.startsWith("LS") ? ["EGLS1", "EGLS2"] as const : slotMethods.filter(id => id !== source)) {
      const foreign = foreignFormula(source, target);
      const pasted = await engine.buildLibrary(model, [{ method: target, records: [{ name: `${source} foreign label`, group: "Regression", algs: [foreign.raw] }] }]);
      assert.equal(pasted.loaded, 0, `${source} leaked into ${target}`);
      assert.equal(pasted.rejected, 1);
    }
  });
});

test("FH precision requires the bar between the two down corners, adjacency, and equal residual twists", () => {
  const real = fixture("FH");
  assert.ok(accepts("FH", real.pattern, real.color));
  const cases = [
    { name: "adjacent down pair with shared bar and equal twists", values: [2, 3, 6, 9, 14, 15, 18, 23], expected: true },
    { name: "diagonal down pair", values: [2, 3, 6, 9, 14, 15, 20, 21], expected: false },
    { name: "adjacent down pair without their shared bar", values: [2, 3, 6, 9, 14, 18, 15, 23], expected: false },
    { name: "paired down bar but opposite residual twists", values: [0, 3, 6, 9, 13, 15, 18, 23], expected: false },
    { name: "unrelated bar between the two twisted corners", values: [0, 3, 6, 9, 14, 15, 21, 19], expected: false },
  ];
  for (const entry of cases) {
    assert.equal(new Set(entry.values.map(code => Math.floor(code / 3))).size, 8, entry.name);
    assert.equal(entry.values.reduce((sum, code) => sum + code % 3, 0) % 3, 0, `${entry.name}: physically valid twist sum`);
    const info = engine.describe(model, Uint8Array.from(entry.values), "D");
    assert.equal(info.lower, 4, entry.name);
    assert.equal(info.down, 2, entry.name);
    assert.equal(engine.matchesStructure("FH", info), entry.expected, entry.name);
  }
  const noBar = engine.describe(model, Uint8Array.from(cases[4].values), "D");
  assert.ok(noBar.bars.length > 0, "Negative fixture must contain a real unrelated bar");
  assert.equal(noBar.pairedDownBar, false, "An arbitrary bar is insufficient for FH");
});

test("ALL21 canonical inverse searches return their own method with independent replay and original-stage validation", async t => {
  for (const { id } of engine.METHODS) await t.test(id, async () => {
    const source = fixture(id);
    const requested = options({ methods: [id], maxDepth: 0 });
    const result = await engine.search(model, library, source.inverse, requested);
    assert.notEqual(result.reason, "time", id);
    verify(source.inverse, result.solutions, requested);
    assert.ok(result.solutions.some(solution => solution.method === id && solution.caseName === source.name && solution.baseMoves === 0), `${id}: missing real inverse result`);
  });
});

test("ALL21 solves two seeded scrambled states at RUF depth 3, independently replaying every output", async t => {
  let seed = 0x21ca7a10;
  const next = (n: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed >>> 8) % n; };
  for (let trial = 0; trial < 2; trial++) {
    const moves: string[] = [];
    for (let i = 0; i < 11; i++) {
      const candidates = [..."RUF"].filter(face => face !== moves.at(-1)?.[0]);
      moves.push(candidates[next(candidates.length)] + ["", "2", "'"][next(3)]);
    }
    const scramble = moves.join(" ");
    await t.test(`seeded ${trial + 1}: ${scramble}`, async () => {
      assert.deepEqual([...new Set(moves.map(move => move[0]))].sort(), ["F", "R", "U"]);
      assert.equal(engine.isCompetitionDistance(model, scramble), true);
      const requested = options();
      const result = await engine.search(model, library, scramble, requested);
      t.diagnostic(`${scramble}: ${result.solutions.length} results, methods ${[...new Set(result.solutions.map(solution => solution.method))].join(", ")}; depth ${result.depthReached}, ${result.nodes} nodes, ${Math.round(result.elapsedMs)}ms, ${result.reason}`);
      assert.notEqual(result.reason, "time");
      assert.equal(result.depthReached, 3);
      verify(scramble, result.solutions, requested);
      assert.ok(result.solutions.some(solution => solution.baseMoves > 0), "Exercise a nonempty RUF stage");
    });
  }
});

test("maxSolutions 1 retains the best result after traversing every selected depth and grip", async () => {
  const source = fixture("LS1");
  const requested = options({ methods: ["LS1"], maxDepth: 2 });
  const progress: string[] = [];
  const full = await engine.search(model, library, source.inverse, requested);
  const limitedOptions = { ...requested, maxSolutions: 1 };
  const limited = await engine.search(model, library, source.inverse, limitedOptions, text => progress.push(text));
  assert.notEqual(full.reason, "time");
  assert.notEqual(limited.reason, "time");
  assert.ok(full.solutions.length > 1);
  assert.equal(limited.solutions.length, 1);
  assert.equal(limited.depthReached, requested.maxDepth);
  assert.equal(progress.length, requested.maxDepth + 1);
  assert.equal(limited.nodes, full.nodes, "The result cap must not stop DFS after the first formula/grip variant");
  assert.equal(limited.reason, "limit");
  assert.equal(limited.complete, false);
  assert.equal(limited.solutions[0].ergonomics.cost, full.solutions[0].ergonomics.cost);
  assert.equal(limited.solutions[0].moves, full.solutions[0].moves);
  verify(source.inverse, limited.solutions, limitedOptions);
});
