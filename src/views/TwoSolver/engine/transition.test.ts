import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { before, test } from "node:test";
import { build } from "esbuild";
import type { KPattern, KPuzzle } from "cubing/kpuzzle";
import type { CubeModel } from "./state";
import type { Library } from "./library";
import type { MethodData, SearchOptions, Solution } from "./types";

type Engine = typeof import("./state") & typeof import("./library") &
  typeof import("./search") & typeof import("./transition") &
  typeof import("./cancellation") & typeof import("./types");

let engine: Engine;
let model: CubeModel;
let kp: KPuzzle;
let Alg: typeof import("cubing/alg").Alg;
let fullEG: Library;
const solvedOrientations = new Set<string>();

function key(pattern: KPattern): string {
  const { pieces, orientation } = pattern.patternData.CORNERS;
  return pieces.map((piece, i) => `${piece}:${orientation[i]}`).join(",");
}

// Deliberately omit the flag: the legacy engine.test.ts helper opts out.
function options(overrides: Partial<SearchOptions> = {}): SearchOptions {
  return {
    methods: [...engine.DEFAULT_METHODS], colors: [..."URFDLB"],
    maxDepth: 0, moveSet: "ruf", maxSolutions: 100, timeLimitMs: 10000,
    ...overrides,
  };
}

function replay(scramble: string, solutions: Solution[]): void {
  assert.ok(solutions.length > 0, `No solutions for ${scramble}`);
  const initial = kp.defaultPattern().applyAlg(scramble);
  for (const solution of solutions) {
    const context = `${solution.caseName}: ${solution.original}`;
    const original = initial.applyAlg(solution.original);
    const execution = initial.applyAlg(`${solution.orientation} ${solution.execution}`);
    assert.ok(solvedOrientations.has(key(original)), `Original replay: ${context}`);
    assert.ok(solvedOrientations.has(key(execution)), `Execution replay: ${context}`);
    assert.equal(key(execution), key(original), `Exact final frame: ${context}`);
  }
}

before(async () => {
  // cubing is import-only; match engine.test.ts's in-memory ESM bundle.
  const bundle = await build({
    stdin: {
      contents: ["state", "library", "search", "transition", "cancellation", "types"]
        .map(name => `export * from "./${name}";`).join("\n") +
        '\nexport { cube2x2x2 } from "cubing/puzzles";\nexport { Alg } from "cubing/alg";',
      resolveDir: __dirname,
    },
    bundle: true, write: false, platform: "node", format: "esm",
  });
  const runtime = await import(`data:text/javascript;base64,${Buffer.from(
    bundle.outputFiles[0].text + "\n//# sourceURL=two-solver-transition-test-runtime.mjs",
  ).toString("base64")}`);
  engine = runtime;
  Alg = runtime.Alg;
  model = await engine.CubeModel.create();
  kp = await runtime.cube2x2x2.kpuzzle();
  const rotations = [kp.defaultPattern()];
  solvedOrientations.add(key(rotations[0]));
  for (const pattern of rotations) for (const axis of ["x", "y", "z"]) {
    const next = pattern.applyMove(axis);
    if (solvedOrientations.has(key(next))) continue;
    solvedOrientations.add(key(next));
    rotations.push(next);
  }
  assert.equal(solvedOrientations.size, 24);
});

for (const axis of ["x", "y", "z"]) for (const power of ["", "2", "'"]) {
  const rotation = axis + power;
  test(`rotationFreeTransition rejects ${rotation} before the first non-U turn`, () => {
    for (const prefix of ["", "U ", "U2 ", "U' "]) {
      for (const suffix of ["R U F", "U R U F", "U2 R U F", "U' R U F"]) {
        const algorithm = Object.freeze(`${prefix}${rotation} ${suffix}`.split(" "));
        assert.equal(engine.rotationFreeTransition(model, algorithm), null, algorithm.join(" "));
      }
    }
  });
}

test("rotationFreeTransition scans compact AUF notation and rejects rotation-only finishes", () => {
  for (const text of ["U'yU2 R", "y U R", "U y U2 R", "U U' y R", "x", "y2", "z'", "U y"]) {
    assert.equal(engine.rotationFreeTransition(model, engine.parseMoves(text)), null, text);
  }
});

test("rotationFreeTransition compacts before scanning and preserves internal rotations", () => {
  for (const [text, expected] of [
    ["y y' R", "R"], ["x x' U R", "U R"], ["z2 z2 U2 R", "U2 R"],
    ["U U' R R", "R2"], ["R U y F", "R U y F"],
    ["U2 R U x' F", "U2 R U x' F"], ["F z R", "F z R"],
    ["", ""], ["U", "U"], ["U2", "U2"], ["U'", "U'"], ["U U'", ""],
  ]) {
    const input = Object.freeze(engine.parseMoves(text));
    const before = [...input];
    const output = engine.rotationFreeTransition(model, input);
    assert.deepEqual(output, engine.parseMoves(expected), text);
    assert.deepEqual(output, engine.compactNotation(model, [...input]), text);
    assert.deepEqual(input, before, "The source formula must not mutate");
    assert.notEqual(output, input, "Return a fresh formula");
    assert.equal(key(kp.defaultPattern().applyAlg(output!.join(" "))), key(kp.defaultPattern().applyAlg(text)), text);
  }
});

test("rotationFreeTransition stops at every non-U face, regardless of later rotations", () => {
  for (const face of "RFDLB") for (const power of ["", "2", "'"]) {
    const input = Object.freeze(["U'", face + power, "y", "F"]);
    assert.deepEqual(engine.rotationFreeTransition(model, input), [...input]);
  }
});

test("disabled search retains a rotation-prefixed source; omitted equals true before exact replay", async () => {
  const source = "y R U R' U R U2 R'";
  const name = "Rotation-prefixed Sune regression";
  const built = await engine.buildLibrary(model, [{
    method: "CLL", records: [{ name, group: "Transition fixture", algs: [source] }],
  }]);
  assert.equal(built.loaded, 1);
  assert.equal(built.rejected, 0);
  // Keep just the source-frame entry, excluding library-generated alternative
  // alignments that legitimately cancel the source's opening y.
  const index: Library["index"] = new Map();
  for (const [state, entries] of built.index) {
    const selected = entries.filter(entry => entry.algorithm.join(" ") === source && !entry.preAuf && !entry.postAuf);
    if (selected.length) index.set(state, selected);
  }
  assert.equal([...index.values()].flat().length, 1);
  const library = { ...built, index };
  const snapshot = JSON.stringify([...index]);
  // The extra x requires separate initial inspection to recover the fixture.
  const scramble = `${new Alg(source).invert().toString()} x`;
  const requested = options({ methods: ["CLL"] });
  const observed = Object.create(model) as CubeModel;
  let exactChecks = 0;
  observed.solved = state => { exactChecks++; return model.solved(state); };
  const disabled = await engine.search(observed, library, scramble, { ...requested, forbidTransitionRotations: false });
  replay(scramble, disabled.solutions);
  assert.ok(exactChecks > 0);
  assert.ok(disabled.solutions.some(solution => solution.caseName === name && solution.algorithm === source));
  assert.ok(disabled.solutions.some(solution => solution.orientation.length > 0), "Inspection remains separate");
  exactChecks = 0;
  const omitted = await engine.search(observed, library, scramble, requested);
  assert.equal(exactChecks, 0, "Reject the candidate before exact replay and cancellation");
  const enabled = await engine.search(observed, library, scramble, { ...requested, forbidTransitionRotations: true });
  assert.equal(exactChecks, 0);
  assert.deepEqual(omitted.solutions, []);
  assert.deepEqual(omitted.solutions, enabled.solutions);
  assert.equal(omitted.nodes, enabled.nodes);
  assert.equal(omitted.reason, "complete");
  assert.equal(enabled.reason, "complete");
  assert.equal(JSON.stringify([...index]), snapshot, "Search must not rewrite indexed source entries");
  const disabledAgain = await engine.search(model, library, scramble, { ...requested, forbidTransitionRotations: false });
  assert.deepEqual(disabledAgain.solutions, disabled.solutions, "Opting out preserves legacy entries after filtered searches");
});

for (const maxDepth of [3, 4]) {
  test(`full EG default search at depth ${maxDepth} returns rotation-free transitions and independently replays`, async t => {
    if (!fullEG) {
      const datasets = engine.DEFAULT_METHODS.map(method => JSON.parse(readFileSync(
        path.resolve(__dirname, `../../../../public/two-solver/data/${method}.json`), "utf8",
      )) as MethodData);
      fullEG = await engine.buildLibrary(model, datasets);
      assert.ok(fullEG.loaded > 700, `Incomplete EG library: ${fullEG.loaded}`);
    }
    const scramble = maxDepth === 3
      ? new Alg("R U F R U R' U R U2 R'").invert().toString()
      : "R U F R' U2 F' R2 U' F";
    const requested = options({ maxDepth });
    assert.equal(Object.hasOwn(requested, "forbidTransitionRotations"), false);
    const result = await engine.search(model, fullEG, scramble, requested);
    assert.notEqual(result.reason, "time");
    assert.equal(result.depthReached, maxDepth);
    assert.ok(result.solutions.length <= 100);
    replay(scramble, result.solutions);
    for (const solution of result.solutions) {
      assert.ok(engine.DEFAULT_METHODS.includes(solution.method));
      assert.ok(solution.baseMoves <= maxDepth);
      const base = solution.base.split(/\s+/).filter(Boolean);
      assert.equal(base.length, solution.baseMoves);
      assert.ok(base.every(move => /^[RUF](?:2|')?$/.test(move)), solution.base);
      // Check the formula itself and the AUF/formula join independently of the
      // helper under test; initial inspection and internal rotations are valid.
      for (const text of [solution.algorithm, `${solution.preAuf} ${solution.algorithm}`]) {
        for (const move of text.trim().split(/\s+/).filter(Boolean)) {
          assert.doesNotMatch(move, /^[xyz]/, text);
          if (!/^U(?:2|')?$/.test(move)) break;
        }
      }
    }
    const enabled = await engine.search(model, fullEG, scramble, { ...requested, forbidTransitionRotations: true });
    assert.notEqual(enabled.reason, "time");
    assert.deepEqual(enabled.solutions, result.solutions, "Omitted and explicit true return identical solutions");
    t.diagnostic(`${result.solutions.length} solutions at depth ${maxDepth}; ${fullEG.loaded} EG formulas`);
  });
}

test("default filter permits identity and AUF-only CLL skips with separate inspection", async () => {
  const library = await engine.buildLibrary(model, [{ method: "CLL", records: [] }]);
  for (const scramble of ["R R'", "U", "U2", "U'", "x U y'", "z2 U2 x"]) {
    const requested = options({ methods: ["CLL"] });
    const result = await engine.search(model, library, scramble, requested);
    replay(scramble, result.solutions);
    assert.equal(result.reason, "complete");
    for (const solution of result.solutions) {
      assert.equal(solution.caseName, "CLL Skip");
      assert.equal(solution.algorithm, "");
      assert.equal(solution.baseMoves, 0);
      assert.match(solution.execution, /^(?:U(?:2|')?)?$/);
    }
  }
});

test("search rejects a string transition-rotation flag rather than treating it as boolean", async () => {
  const library = await engine.buildLibrary(model, [{ method: "CLL", records: [] }]);
  for (const value of ["false", "true"]) {
    const requested = options({ forbidTransitionRotations: value as unknown as boolean });
    assert.throws(() => engine.validateOptions(requested), /transition rotation/i);
    await assert.rejects(() => engine.search(model, library, "U", requested), /transition rotation/i);
  }
});
