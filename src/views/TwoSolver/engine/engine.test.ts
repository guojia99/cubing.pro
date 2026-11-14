import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { before, test } from "node:test";
import { build } from "esbuild";
import type { KPattern, KPuzzle } from "cubing/kpuzzle";
import type { CubeModel } from "./state";
import type { Library } from "./library";
import type { MethodData, MethodId, SearchOptions, Solution } from "./types";

type Engine = typeof import("./state") & typeof import("./library") &
  typeof import("./search") & typeof import("./structure") &
  typeof import("./cancellation") & typeof import("./types");

let engine: Engine;
let model: CubeModel;
let kp: KPuzzle;
let oracleRotations: { tokens: string[]; pattern: KPattern }[];
let solvedOrientations: Set<string>;
const datasets = new Map<MethodId, MethodData>();
const faceMoves = [..."URFDLB"].flatMap(face => [face, `${face}2`, `${face}'`]);
const allMoves = [...faceMoves, ...[..."xyz"].flatMap(face => [face, `${face}2`, `${face}'`])];
// Sticker order is the public KPuzzle CORNERS convention, not engine output.
const cornerFaces = ["URF", "UBR", "ULB", "UFL", "DFR", "DLF", "DBL", "DRB"];

function patternKey(pattern: KPattern): string {
  const { pieces, orientation } = pattern.patternData.CORNERS;
  return pieces.map((piece, i) => `${piece}:${orientation[i]}`).join(",");
}

function codes(pattern: KPattern): number[] {
  const { pieces, orientation } = pattern.patternData.CORNERS;
  return pieces.map((piece, i) => piece * 3 + orientation[i]);
}

function stickers(pattern: KPattern): string[][] {
  const { pieces, orientation } = pattern.patternData.CORNERS;
  return pieces.map((piece, i) => [0, 1, 2].map(j => cornerFaces[piece][(j - orientation[i] + 3) % 3]));
}

function random(seed: number): (n: number) => number {
  return n => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
}

function randomSequence(next: (n: number) => number, length: number, moves = allMoves): string[] {
  return Array.from({ length }, () => moves[next(moves.length)]);
}

function data(method: MethodId): MethodData {
  const value = datasets.get(method);
  assert.ok(value, `Missing public dataset ${method}`);
  return value;
}

function representative(method: MethodId): MethodData {
  const record = data(method).records[0];
  return { method, records: [{ ...record, algs: [record.algs[0]] }] };
}

function inverseFormula(method: MethodId): string {
  // Invert the source with cubing/alg, never with the engine under test.
  return new oracleAlg(data(method).records[0].algs[0]).invert().toString();
}

let oracleAlg: typeof import("cubing/alg").Alg;

function options(overrides: Partial<SearchOptions> = {}): SearchOptions {
  return {
    methods: [...engine.DEFAULT_METHODS], colors: [..."URFDLB"], maxDepth: 0,
    moveSet: "ruf", maxSolutions: 500, timeLimitMs: 10000, ...overrides,
  };
}

function verifySolutions(scramble: string, solutions: Solution[], requested: SearchOptions): void {
  assert.ok(solutions.length > 0, `No solutions for ${scramble}`);
  const initial = kp.defaultPattern().applyAlg(scramble);
  for (const solution of solutions) {
    const context = `${solution.method}/${solution.caseName}: ${scramble} // ${solution.orientation} // ${solution.execution}`;
    assert.ok(requested.methods.includes(solution.method), `Unrequested method: ${context}`);
    assert.ok(requested.colors.includes(solution.color), `Unrequested color: ${context}`);
    assert.ok(solution.baseMoves <= requested.maxDepth, `Base depth: ${context}`);
    const base = solution.base.trim() ? solution.base.trim().split(/\s+/) : [];
    assert.equal(base.length, solution.baseMoves, context);
    assert.ok(base.every(move => (requested.moveSet === "ruf" ? /^[RUF](?:2|')?$/ : /^[URFDLB](?:2|')?$/).test(move)), `Base move set: ${context}`);
    const result = initial.applyAlg(`${solution.orientation} ${solution.execution}`);
    assert.ok(solvedOrientations.has(patternKey(result)), `Independent KPuzzle replay failed: ${context}`);
    assert.ok(solvedOrientations.has(patternKey(initial.applyAlg(solution.original))), `Original replay failed: ${context}`);
    // Cancellation can move a formula rotation into inspection. Geometry and
    // color metadata refer to the original search grip, before that rewrite.
    const tail = [solution.base, solution.preAuf, solution.algorithm, solution.postAuf].join(" ").trim().split(/\s+/).filter(Boolean);
    const original = solution.original.trim().split(/\s+/).filter(Boolean);
    assert.deepEqual(original.slice(original.length - tail.length), tail, context);
    const searchGrip = original.slice(0, original.length - tail.length).join(" ");
    const oriented = initial.applyAlg(`${searchGrip} ${solution.base}`);
    const downCount = stickers(oriented).slice(4).filter(corner => corner[0] === solution.color).length;
    if (engine.DEFAULT_METHODS.includes(solution.method)) assert.equal(downCount, 4, `Reported base color: ${context}`);
    assert.equal(solution.moves, (solution.execution.match(/\b[URFDLB](?:2|')?/g) ?? []).length, context);
    assert.equal(solution.cancelled, solution.originalMoves - solution.moves, context);
  }
}

before(async () => {
  // This package is CommonJS, while cubing exposes import-only entrypoints.
  // Bundle an ESM test runtime in memory so the required tsx command needs no
  // package.json edits, generated files, or custom Node flags.
  const result = await build({
    stdin: {
      contents: ["state", "library", "search", "structure", "cancellation", "types"]
        .map(name => `export * from "./${name}";`).join("\n") +
        '\nexport { cube2x2x2 } from "cubing/puzzles";\nexport { Alg } from "cubing/alg";',
      resolveDir: __dirname,
    },
    bundle: true, write: false, platform: "node", format: "esm",
  });
  const runtime = await import(`data:text/javascript;base64,${Buffer.from(
    result.outputFiles[0].text + "\n//# sourceURL=two-solver-test-runtime.mjs",
  ).toString("base64")}`);
  engine = runtime;
  oracleAlg = runtime.Alg;
  model = await engine.CubeModel.create();
  kp = await runtime.cube2x2x2.kpuzzle();
  oracleRotations = [{ tokens: [], pattern: kp.defaultPattern() }];
  solvedOrientations = new Set([patternKey(kp.defaultPattern())]);
  for (let i = 0; i < oracleRotations.length; i++) {
    for (const move of ["x", "y", "z"]) {
      const pattern = oracleRotations[i].pattern.applyMove(move);
      const key = patternKey(pattern);
      if (solvedOrientations.has(key)) continue;
      solvedOrientations.add(key);
      oracleRotations.push({ tokens: [...oracleRotations[i].tokens, move], pattern });
    }
  }
  for (const { id } of engine.METHODS) {
    const parsed = JSON.parse(readFileSync(path.resolve(__dirname, `../../../../public/two-solver/data/${id}.json`), "utf8")) as MethodData;
    assert.equal(parsed.method, id);
    assert.ok(parsed.records.length > 0);
    for (const record of parsed.records) {
      assert.equal(typeof record.name, "string");
      assert.equal(typeof record.group, "string");
      assert.ok(Array.isArray(record.algs) && record.algs.length > 0 && record.algs.every(alg => typeof alg === "string"));
    }
    datasets.set(id, parsed);
  }
});

test("CubeModel every supported move agrees with KPuzzle at every step of seeded sequences", () => {
  const next = random(0x2c0ffee);
  const solvedBefore = [...engine.SOLVED];
  for (let trial = 0; trial < 36; trial++) {
    const setup = randomSequence(next, 25);
    const state = model.applySequence(engine.SOLVED, setup);
    const pattern = kp.defaultPattern().applyAlg(setup.join(" "));
    assert.deepEqual([...state], codes(pattern));
    for (const move of allMoves) {
      const beforeState = [...state];
      assert.deepEqual([...model.apply(state, move)], codes(pattern.applyMove(move)), `trial ${trial}, move ${move}`);
      assert.deepEqual([...state], beforeState, "apply must not mutate its input");
    }
    let actual = state;
    let expected = pattern;
    for (const move of randomSequence(next, 60)) {
      actual = model.apply(actual, move);
      expected = expected.applyMove(move);
      assert.deepEqual([...actual], codes(expected), `trial ${trial}, step ${move}`);
    }
    assert.deepEqual(model.stickers(actual), stickers(expected));
    for (const color of "URFDLB") {
      const expectedMask = stickers(expected).flat().reduce((mask, sticker, i) => mask | (sticker === color ? 1 << i : 0), 0);
      assert.equal(model.mask(actual, color), expectedMask);
    }
  }
  assert.deepEqual([...engine.SOLVED], solvedBefore);
});

test("exactly 24 initial rotations and complete bijective normalizers cover every reference-corner code", () => {
  assert.equal(oracleRotations.length, 24);
  assert.equal(model.rotations.length, 24);
  assert.equal(new Set(model.rotations.map(rotation => model.rawKey(rotation.state))).size, 24);
  assert.equal(model.normalizers.length, 24);
  assert.equal(model.colorNormalizers.length, 24);
  assert.equal(model.rotationFaces.size, 24);
  for (const rotation of model.rotations) {
    assert.deepEqual([...rotation.state], codes(kp.defaultPattern().applyAlg(rotation.tokens.join(" "))));
    assert.ok(solvedOrientations.has(patternKey(kp.defaultPattern().applyAlg(rotation.tokens.join(" ")))));
    assert.equal(model.solved(rotation.state), true);
  }
  for (let code = 0; code < 24; code++) {
    const normalizer = model.normalizers[code];
    const colors = model.colorNormalizers[code];
    assert.ok(normalizer, `Missing normalizer ${code}`);
    assert.equal(normalizer.length, 24);
    assert.deepEqual([...normalizer].sort((a, b) => a - b), Array.from({ length: 24 }, (_, i) => i));
    assert.equal(normalizer[code], 21);
    assert.equal(colors.length, 6);
    assert.deepEqual([...colors].sort(), [..."URFDLB"].sort());
    for (let v = 0; v < 24; v++) {
      const recolored = [0, 1, 2].map(j => colors[engine.FACE_NAMES.indexOf(cornerFaces[Math.floor(v / 3)][(j - v % 3 + 3) % 3])]);
      const mapped = normalizer[v];
      assert.deepEqual(recolored, [0, 1, 2].map(j => cornerFaces[Math.floor(mapped / 3)][(j - mapped % 3 + 3) % 3]), `Color/code agreement ${code}/${v}`);
    }
  }
});

test("keys and matchingColor normalize all 24 global color frames on random states", () => {
  const next = random(0xc01025);
  const referenceCodes = new Set<number>();
  for (let trial = 0; trial < 20; trial++) {
    const sequence = randomSequence(next, 30);
    const state = model.applySequence(engine.SOLVED, sequence);
    for (const rotation of oracleRotations) {
      const pattern = rotation.pattern.applyAlg(sequence.join(" "));
      const colored = Uint8Array.from(codes(pattern));
      referenceCodes.add(colored[7]);
      assert.equal(model.key(colored), model.key(state), `trial ${trial}, frame ${rotation.tokens.join(" ")}`);
      assert.equal(model.solved(colored), solvedOrientations.has(patternKey(pattern)));
      for (const color of "URFDLB") {
        const normalized = model.colorNormalizers[colored[7]][engine.FACE_NAMES.indexOf(color)];
        assert.equal(engine.matchingColor(model, colored, normalized), color);
        const normalizedState = Uint8Array.from(colored, value => model.normalizers[colored[7]][value]);
        assert.equal(model.mask(colored, color), model.mask(normalizedState, normalized));
      }
    }
  }
  assert.equal(referenceCodes.size, 24);
});

test("parser retains parenthesized prefix AUF, expands bounded notation, and maps every two-layer wide move", () => {
  for (const auf of ["U", "U2", "U'"]) {
    const text = `(${auf}) y' R U2 R'`;
    assert.deepEqual(engine.parseMoves(text), [auf, "y'", "R", "U2", "R'"]);
    assert.deepEqual([...model.applySequence(engine.SOLVED, engine.parseMoves(text))], codes(kp.defaultPattern().applyAlg(text)));
  }
  for (const [text, canonical] of [
    ["RUR'U'", "R U R' U'"], ["(R U)3", "R U R U R U"],
    ["[R,U]", "R U R' U'"], ["[R:U2]", "R U2 R'"],
    ["(R U)'", "U' R'"], ["R2' U2'", "R2 U2"], ["R’ U′ F‘", "R' U' F'"],
  ]) {
    assert.deepEqual([...model.applySequence(engine.SOLVED, engine.parseMoves(text))], codes(kp.defaultPattern().applyAlg(canonical)), text);
  }
  // KPuzzle's 2x2 definition has no Rw move; an entire two-layer turn is a
  // whole-cube rotation. These explicit identities also check L/D/B signs.
  for (const [face, rotation, sign] of [["R", "x", 1], ["L", "x", -1], ["U", "y", 1], ["D", "y", -1], ["F", "z", 1], ["B", "z", -1]] as const) {
    for (const [suffix, power] of [["", 1], ["2", 2], ["'", 3]] as const) {
      for (const wide of [`${face}w${suffix}`, `${face.toLowerCase()}${suffix}`]) {
        const turns = (sign * power + 4) % 4;
        const expected = kp.defaultPattern().applyMove(rotation + (turns === 2 ? "2" : turns === 3 ? "'" : ""));
        assert.deepEqual([...model.applySequence(engine.SOLVED, engine.parseMoves(wide))], codes(expected), wide);
        assert.equal(engine.moveCount(engine.parseMoves(wide)), 0);
      }
    }
  }
  assert.equal(engine.parseMoves("R ".repeat(100)).length, 100);
  assert.equal(engine.parseMoves("(x)200").length, 200);
});

test("real EG-1 Pi 4 (Alg 5) retains its valid R3 turn as R prime", () => {
  const record = data("EG1").records.find(record => record.name === "EG-1 Pi 4 (Alg 5)");
  assert.ok(record, "The R3 regression must use an actual public formula");
  assert.ok(record.algs[0].includes("R3"));
  const expected = kp.defaultPattern().applyAlg(record.algs[0]);
  assert.deepEqual([...model.applySequence(engine.SOLVED, engine.parseMoves(record.algs[0]))], codes(expected));
});

for (const malformed of ["R (U", "R U)", "[R,U", "R @ U", "M", "E", "S", "Q", "2R", "3Rw", "Rww", "R0", "(R)nope"]) {
  test(`parser rejects malformed/unsupported notation ${JSON.stringify(malformed)}`, () => {
    assert.throws(() => engine.parseMoves(malformed));
  });
}

for (const [label, input] of [
  ["character budget", " ".repeat(4001)], ["layer-turn budget", "R ".repeat(101)],
  ["expanded rotation budget", "(x)201"], ["huge repeat", "(R U)2147483647"],
  ["huge empty repeat", "()2147483647"], ["nested multiplication", "((R U)20)20"],
  ["nested conjugate expansion", "[R:[U:[F:(R U)100]]]"],
  ["nesting depth", "(".repeat(14) + "R" + ")".repeat(14)],
]) {
  test(`parser rejects unbounded input: ${label}`, () => assert.throws(() => engine.parseMoves(input)));
}

test("simplify preserves exact KPuzzle transformation on seeded sequences and arbitrary starting states", () => {
  const next = random(0xca11ce1);
  for (let trial = 0; trial < 240; trial++) {
    const sequence = randomSequence(next, 10 + next(60));
    const before = [...sequence];
    const compact = engine.simplify(model, sequence);
    const start = kp.defaultPattern().applyAlg(randomSequence(next, 20).join(" "));
    assert.equal(patternKey(start.applyAlg(compact.join(" "))), patternKey(start.applyAlg(sequence.join(" "))), `trial ${trial}: ${sequence.join(" ")}`);
    assert.ok(compact.length <= sequence.length);
    assert.deepEqual(sequence, before);
    const orientation = oracleRotations[next(24)].tokens;
    const split = engine.splitInspection(model, orientation, compact);
    assert.equal(patternKey(start.applyAlg([...split.orientation, ...split.execution].join(" "))), patternKey(start.applyAlg([...orientation, ...compact].join(" "))));
    assert.ok(split.execution.length === 0 || !/^[xyz]/.test(split.execution[0]));
  }
});

for (const [text, expected] of [
  ["R R'", ""], ["U U2 U'", "U2"], ["x x' U U'", ""],
  ["U x' F'", "x'"], ["F x U'", "x"], ["R y F'", "y"],
  ["F y' R'", "y'"], ["U y U'", "y"], ["U2 x' F2", "x'"],
  ["R U x' F' R'", "x'"],
]) {
  test(`AUF/rotation boundary cancellation ${text} -> ${expected || "identity"}`, () => {
    const compact = engine.simplify(model, text.split(" "));
    assert.equal(compact.join(" "), expected);
    assert.equal(patternKey(kp.defaultPattern().applyAlg(compact.join(" "))), patternKey(kp.defaultPattern().applyAlg(text)));
  });
}

test("describe CBL finds an off-D target color even when the lower face is not monochromatic", () => {
  const scramble = inverseFormula("CBL");
  const state = Uint8Array.from(codes(kp.defaultPattern().applyAlg(scramble)));
  const info = engine.describe(model, state, "R");
  assert.deepEqual(info.twists, [0, 2, 1, 0]);
  assert.equal(info.lower, 4);
  assert.equal(info.down, 2);
  assert.equal(engine.matchesStructure("CBL", info), true);
  assert.equal(engine.matchesStructure("CLL", info), false);
  assert.equal(engine.matchesStructure("CBL", engine.describe(model, state, "D")), false);
});

test("FH requires two adjacent down stickers sharing a side bar and equal remaining twists", () => {
  const real = Uint8Array.from(codes(kp.defaultPattern().applyAlg(inverseFormula("FH"))));
  const info = engine.describe(model, real, "D");
  assert.deepEqual(info.twists, [2, 0, 0, 2]);
  assert.deepEqual(info.bars, ["L"]);
  assert.equal(info.pairedDownBar, true);
  assert.equal(engine.matchesStructure("FH", info), true);
  const adjacent = Uint8Array.from([2, 3, 6, 9, 14, 15, 18, 23]);
  assert.equal(engine.matchesStructure("FH", engine.describe(model, adjacent, "D")), true);
  const diagonal = Uint8Array.from([2, 3, 6, 9, 14, 15, 20, 21]);
  assert.equal(engine.describe(model, diagonal, "D").down, 2);
  assert.equal(engine.describe(model, diagonal, "D").pairedDownBar, false);
  assert.equal(engine.matchesStructure("FH", engine.describe(model, diagonal, "D")), false);
  const noBar = Uint8Array.from([2, 3, 6, 9, 14, 18, 15, 23]);
  assert.equal(engine.describe(model, noBar, "D").down, 2);
  assert.equal(engine.describe(model, noBar, "D").pairedDownBar, false);
  assert.equal(engine.matchesStructure("FH", engine.describe(model, noBar, "D")), false);
  const oppositeTwists = Uint8Array.from([0, 3, 6, 9, 13, 15, 18, 23]);
  assert.equal(engine.describe(model, oppositeTwists, "D").pairedDownBar, true);
  assert.equal(engine.matchesStructure("FH", engine.describe(model, oppositeTwists, "D")), false);
});

test("real TCLL/TEG inverse formulas distinguish twist sign and untwisted lower permutation", () => {
  const methods: MethodId[] = ["TCLL+", "TCLL-", "TEG1", "TEG2"];
  for (const method of methods) {
    const state = Uint8Array.from(codes(kp.defaultPattern().applyAlg(inverseFormula(method))));
    const info = engine.describe(model, state, "D");
    assert.equal(info.lower, 4, method);
    assert.equal(info.down, 3, method);
    assert.equal(info.residualBars.length, method === "TEG1" ? 1 : method === "TEG2" ? 0 : 4, method);
    if (method.startsWith("TCLL")) assert.ok(info.twists.includes(method === "TCLL+" ? 1 : 2));
    for (const candidate of methods) assert.equal(engine.matchesStructure(candidate, info), candidate === method, `${method} must distinguish ${candidate}`);
    for (const candidate of engine.DEFAULT_METHODS) assert.equal(engine.matchesStructure(candidate, info), false);
  }
});

test("competition distance rejects every <=3 six-face HTM state in every global orientation", t => {
  const states = new Map<string, { pattern: KPattern; tokens: string[] }>();
  let frontier = [{ pattern: kp.defaultPattern(), tokens: [] as string[] }];
  states.set(patternKey(frontier[0].pattern), frontier[0]);
  for (let depth = 1; depth <= 3; depth++) {
    const next = [] as typeof frontier;
    for (const entry of frontier) for (const move of faceMoves) {
      const pattern = entry.pattern.applyMove(move);
      const key = patternKey(pattern);
      if (states.has(key)) continue;
      const child = { pattern, tokens: [...entry.tokens, move] };
      states.set(key, child);
      next.push(child);
    }
    frontier = next;
  }
  const checked = new Set<string>();
  for (const entry of states.values()) for (const rotation of oracleRotations) {
    const key = patternKey(entry.pattern.applyAlg(rotation.tokens.join(" ")));
    if (checked.has(key)) continue;
    checked.add(key);
    const scramble = [...entry.tokens, ...rotation.tokens].join(" ");
    assert.equal(engine.isCompetitionDistance(model, scramble), false, `Short state accepted: ${scramble}`);
  }
  assert.ok(checked.size >= states.size);
  t.diagnostic(`${states.size} distinct six-face states through depth 3; ${checked.size} states including all orientations`);
  // These explicit 4+ examples are independently outside the exhaustive set.
  for (const scramble of ["R U F R", "R U R' U'", "L D B R", "R U2 F' R2 U F2"]) {
    assert.equal(checked.has(patternKey(kp.defaultPattern().applyAlg(scramble))), false, `Bad >=4 fixture: ${scramble}`);
    for (const rotation of oracleRotations) {
      assert.equal(engine.isCompetitionDistance(model, `${scramble} ${rotation.tokens.join(" ")}`), true, scramble);
    }
  }
});

test("buildLibrary rejects invalid/empty formulas without losing valid source metadata or progress", async () => {
  const record = data("CLL").records[0];
  const progress: string[] = [];
  const library = await engine.buildLibrary(model, [{ method: "CLL", records: [{ ...record, algs: [record.algs[0], "M", "", "(R U)2147483647"] }] }], text => progress.push(text));
  assert.equal(library.loaded, 1);
  assert.equal(library.rejected, 3);
  assert.ok(progress.some(text => text.includes("CLL")));
  assert.ok([...library.index.values()].flat().some(entry => entry.name === record.name && entry.group === record.group && entry.sourceApi === "CLL"));
});

test("default EG methods are CLL/EG1/EG2/LEG1 and all public methods have a zero-base inverse solve", async t => {
  assert.deepEqual(engine.DEFAULT_METHODS, ["CLL", "EG1", "EG2", "LEG1"]);
  assert.equal(engine.METHODS.length, 21);
  for (const { id, api } of engine.METHODS) {
    await t.test(`${id}: ${data(id).records[0].name}`, async () => {
      const library = await engine.buildLibrary(model, [representative(id)]);
      assert.equal(library.loaded, 1, id);
      assert.equal(library.rejected, 0, id);
      assert.ok(library.index.size > 0 && library.masks.size > 0, id);
      const requested = options({ methods: [id] });
      const scramble = inverseFormula(id);
      const result = await engine.search(model, library, scramble, requested);
      verifySolutions(scramble, result.solutions, requested);
      const named = result.solutions.filter(solution => solution.caseName === data(id).records[0].name);
      assert.ok(named.length > 0, `${id} must retain source case name`);
      assert.ok(named.every(solution => solution.group === data(id).records[0].group && solution.sourceApi === api && solution.baseMoves === 0));
    });
  }
});

test("all four AUFs in each of 24 initial grips retain the real formula name and independently solve", async () => {
  const source = data("CLL").records[0];
  const library = await engine.buildLibrary(model, [representative("CLL")]);
  for (let i = 0; i < oracleRotations.length; i++) {
    const rotation = oracleRotations[i];
    for (const auf of ["", "U", "U2", "U'"]) {
      const scramble = `${auf} ${inverseFormula("CLL")} ${rotation.tokens.join(" ")}`;
      const requested = options({ methods: ["CLL"] });
      const result = await engine.search(model, library, scramble, requested);
      verifySolutions(scramble, result.solutions, requested);
      assert.ok(result.solutions.some(solution => solution.caseName === source.name && solution.baseMoves === 0), `Lost formula for grip ${i}, AUF ${auf}`);
    }
  }
});

test("parenthesized prefix AUF and x/y source frames survive library construction", async () => {
  for (const method of ["CBL", "TCLL-", "EGLS2", "TEG2"] as const) {
    const source = data(method).records[0];
    const requested = options({ methods: [method] });
    const library = await engine.buildLibrary(model, [representative(method)]);
    const scramble = inverseFormula(method);
    const result = await engine.search(model, library, scramble, requested);
    verifySolutions(scramble, result.solutions, requested);
    assert.ok(result.solutions.some(solution => solution.caseName === source.name));
  }
});

test("CLL identity and all AUF skips solve at zero base depth, without invented algorithms", async () => {
  const library = await engine.buildLibrary(model, [{ method: "CLL", records: [] }]);
  assert.equal(library.loaded, 0);
  assert.equal(library.rejected, 0);
  for (const scramble of ["R R'", "U", "U2", "U'", "x U y'", "z2 U2 x"]) {
    const requested = options({ methods: ["CLL"] });
    const result = await engine.search(model, library, scramble, requested);
    verifySolutions(scramble, result.solutions, requested);
    assert.ok(result.solutions.every(solution => solution.caseName === "CLL Skip" && solution.algorithm === "" && solution.baseMoves === 0));
  }
});

test("search respects requested methods when a library contains overlapping method cases", async t => {
  const source = data("CLL").records[0];
  // CBL legitimately includes a complete lower layer, so this is a real
  // overlapping target rather than an unreachable foreign-method sentinel.
  const library = await engine.buildLibrary(model, [representative("CLL"), { method: "CBL", records: [{ ...source, name: "CBL complete-layer overlap" }] }]);
  const scramble = inverseFormula("CLL");
  const leaks: string[] = [];
  for (const method of ["CLL", "CBL"] as const) {
    const requested = options({ methods: [method] });
    const result = await engine.search(model, library, scramble, requested);
    const foreign = result.solutions.filter(solution => solution.method !== method);
    if (foreign.length) leaks.push(`${method}-only request returned ${foreign.length} ${foreign[0].method} solutions`);
    verifySolutions(scramble, result.solutions, { ...requested, methods: ["CLL", "CBL"] });
  }
  t.diagnostic(leaks.join("; ") || "No unrequested methods returned");
  assert.deepEqual(leaks, [], "search must filter the indexed formulas by options.methods");
});

test("six-face base search finds a D-layer insertion excluded by RUF in the same fixed grip", async () => {
  // A deliberately sparse, valid skip library isolates the base-move contract;
  // unconstrained all-grip libraries can hide D/L/B by rotating the entire cube.
  const algorithm = data("CLL").records[0].algs[0];
  const target = kp.defaultPattern().applyAlg(inverseFormula("CLL"));
  const targetState = Uint8Array.from(codes(target));
  const library: Library = {
    loaded: 0, rejected: 0, masks: new Set([model.mask(targetState, "D")]),
    index: new Map([[model.key(targetState), [{
      method: "CLL", name: "CLL Skip", group: "Skip", sourceApi: "CLL",
      color: model.colorNormalizers[targetState[7]][engine.FACE_NAMES.indexOf("D")],
      algorithm: algorithm.split(" "), preAuf: "", postAuf: "",
    }]]]),
  };
  const scramble = `${inverseFormula("CLL")} D'`;
  const originalRotations = model.rotations;
  const fixedGrip = Object.create(model) as CubeModel;
  fixedGrip.rotations = [originalRotations.find(rotation => rotation.tokens.length === 0)!];
  const restricted = options({ methods: ["CLL"], colors: ["D"], maxDepth: 1, moveSet: "ruf" });
  const ruf = await engine.search(fixedGrip, library, scramble, restricted);
  assert.equal(ruf.solutions.length, 0);
  const requested = { ...restricted, moveSet: "all" as const };
  const result = await engine.search(fixedGrip, library, scramble, requested);
  verifySolutions(scramble, result.solutions, requested);
  assert.ok(result.solutions.some(solution => solution.base === "D" && solution.baseMoves === 1));
  assert.equal(model.rotations, originalRotations);
});

test("search limits, completion metadata, and color filters describe the returned search", async () => {
  const library = await engine.buildLibrary(model, [representative("CLL")]);
  const scramble = inverseFormula("CLL");
  const requested = options({ methods: ["CLL"], colors: ["D"], maxSolutions: 1 });
  const limited = await engine.search(model, library, scramble, requested);
  verifySolutions(scramble, limited.solutions, requested);
  assert.equal(limited.solutions.length, 1);
  assert.equal(limited.reason, "limit");
  assert.equal(limited.complete, false);
  assert.deepEqual(limited.data, { loaded: 1, rejected: 0 });
  const completed = await engine.search(model, library, scramble, options({ methods: ["CLL"], colors: ["D"] }));
  assert.equal(completed.reason, "complete");
  assert.equal(completed.complete, true);
  assert.equal(completed.depthReached, 0);
  assert.ok(completed.nodes > 0 && completed.elapsedMs >= 0);
});

test("search rejects invalid options and empty/rotation-only input", async () => {
  const library = await engine.buildLibrary(model, [{ method: "CLL", records: [] }]);
  const invalid: Partial<SearchOptions>[] = [
    { methods: [] }, { methods: ["invalid" as MethodId] }, { colors: [] }, { colors: ["UR"] },
    { maxDepth: -1 }, { maxDepth: 7 }, { maxDepth: 0.5 },
    { moveSet: "invalid" as SearchOptions["moveSet"] },
    { timeLimitMs: NaN }, { timeLimitMs: 99 }, { timeLimitMs: 60001 },
    { maxSolutions: 0 }, { maxSolutions: 2001 }, { maxSolutions: 1.5 },
  ];
  for (const value of invalid) await assert.rejects(() => engine.search(model, library, "R U F R", options(value)), JSON.stringify(value));
  for (const scramble of ["", "x y2 z'", "Rw Uw'"]) await assert.rejects(() => engine.search(model, library, scramble, options()));
});

test("full public EG library solves seeded random scrambles; every orientation/execution independently replays", async t => {
  const library = await engine.buildLibrary(model, engine.DEFAULT_METHODS.map(data));
  assert.ok(library.loaded > 700, `Unexpectedly incomplete EG library: ${library.loaded}`);
  t.diagnostic(`Full EG library: ${library.loaded} accepted, ${library.rejected} rejected`);
  const next = random(0xe612345);
  for (const moveSet of ["ruf", "all"] as const) {
    for (let trial = 0; trial < 3; trial++) {
      // Avoid adjacent equal/opposite faces so long notation cannot trivially
      // collapse to a <=3 state. Still reject rare short random draws.
      let scramble = "";
      for (let attempt = 0; attempt < 20; attempt++) {
        const sequence: string[] = [];
        for (let i = 0; i < 11; i++) {
          const candidates = faceMoves.filter(move => !sequence.length || ![sequence.at(-1)![0], ({ U: "D", D: "U", R: "L", L: "R", F: "B", B: "F" } as Record<string, string>)[sequence.at(-1)![0]]].includes(move[0]));
          sequence.push(candidates[next(candidates.length)]);
        }
        scramble = sequence.join(" ");
        if (engine.isCompetitionDistance(model, scramble)) break;
      }
      await t.test(`${moveSet} random ${trial + 1}: ${scramble}`, async () => {
        assert.equal(engine.isCompetitionDistance(model, scramble), true);
        const requested = options({ maxDepth: 4, moveSet });
        const result = await engine.search(model, library, scramble, requested);
        assert.notEqual(result.reason, "time", `Search timed out for ${scramble}`);
        verifySolutions(scramble, result.solutions, requested);
        t.diagnostic(`${moveSet}/${trial + 1}: ${result.solutions.length} solutions, ${result.nodes} nodes, ${Math.round(result.elapsedMs)}ms`);
      });
    }
  }
});
