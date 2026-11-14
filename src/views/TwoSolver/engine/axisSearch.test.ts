import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { before, test } from "node:test";
import { build } from "esbuild";
import type { KPuzzle, KTransformation } from "cubing/kpuzzle";
import type { CubeModel } from "./state";
import type { Library } from "./library";
import type { MethodData, SearchOptions, Solution } from "./types";

type Engine = typeof import("./state") & typeof import("./search") &
  typeof import("./library") & typeof import("./ergonomics") & typeof import("./types");
type Format = typeof import("../solutionFormat");
let engine: Engine;
let format: Format;
let model: CubeModel;
let kp: KPuzzle;
let Alg: typeof import("cubing/alg").Alg;
let rotations: KTransformation[];
let cll: string[];
const tokens = (text: string) => text.trim().split(/\s+/).filter(Boolean);
const count = (moves: string[]) => moves.filter(move => /^[URFDLB]/.test(move)).length;
const turn = (face: string, power: number) => ["", face, `${face}2`, `${face}'`][power % 4];

before(async () => {
  // Match the other engine tests: cubing exposes ESM-only entrypoints.
  const bundle = await build({
    stdin: {
      contents: ["state", "search", "library", "ergonomics", "types"]
        .map(name => `export * from "./${name}";`).join("\n") +
        '\nexport * as format from "../solutionFormat"; export { cube2x2x2 } from "cubing/puzzles"; export { Alg } from "cubing/alg";',
      resolveDir: __dirname,
    },
    bundle: true, write: false, platform: "node", format: "esm",
  });
  const runtime = await import(`data:text/javascript;base64,${Buffer.from(
    bundle.outputFiles[0].text + "\n//# sourceURL=two-solver-axis-search-runtime.mjs",
  ).toString("base64")}`);
  engine = runtime;
  format = runtime.format;
  Alg = runtime.Alg;
  model = await engine.CubeModel.create();
  kp = await runtime.cube2x2x2.kpuzzle();
  rotations = [kp.identityTransformation()];
  for (let i = 0; i < rotations.length; i++) for (const axis of "xyz") {
    const next = rotations[i].applyTransformation(kp.moveToTransformation(axis));
    if (!rotations.some(rotation => rotation.isIdentical(next))) rotations.push(next);
  }
  assert.equal(rotations.length, 24);
  const data = JSON.parse(readFileSync(path.resolve(__dirname, "../../../../public/two-solver/data/CLL.json"), "utf8")) as MethodData;
  cll = tokens(data.records[0].algs[0]);
  assert.deepEqual(cll, tokens("R U R' U R U2 R'"));
});

function options(patch: Partial<SearchOptions> = {}): SearchOptions {
  return { methods: ["CLL"], colors: [..."URFDLB"], maxDepth: 0, moveSet: "all",
    maxSolutions: 2000, timeLimitMs: 10000, ...patch };
}

function exact(original: string, actual: string): void {
  assert.ok(kp.algToTransformation(original).isIdentical(kp.algToTransformation(actual)),
    `${original} != ${actual}`);
}

function verify(scramble: string, solutions: Solution[], budget: number): void {
  assert.ok(solutions.length > 0, scramble);
  for (const solution of solutions) {
    const execution = tokens(solution.execution);
    const left = tokens(solution.base);
    const right = tokens([solution.preAuf, solution.algorithm, solution.postAuf].join(" "));
    const boundary = solution.boundary!;
    assert.ok(boundary);
    assert.equal(boundary.left, solution.base);
    assert.deepEqual(tokens(boundary.right), right);
    assert.equal(boundary.leftMarked.length, left.length);
    assert.equal(boundary.rightMarked.length, right.length);
    assert.ok([...boundary.leftMarked, ...boundary.rightMarked].every(mark => typeof mark === "boolean"));
    assert.ok(boundary.overlap >= 0 && boundary.overlap <= budget);
    assert.equal(solution.baseMoves, left.length);
    assert.equal(solution.moves, count(execution));
    assert.equal(solution.originalMoves, count([...left, ...right]));
    assert.equal(solution.cancelled, solution.originalMoves - solution.moves);
    assert.deepEqual(solution.ergonomics, engine.evaluateErgonomics(execution));
    assert.deepEqual(tokens(solution.original), [...tokens(solution.orientation), ...left, ...right]);
    exact(solution.original, [solution.orientation, solution.execution].join(" "));
    const solved = kp.algToTransformation(`${scramble} ${solution.orientation} ${solution.execution}`);
    assert.ok(rotations.some(rotation => rotation.isIdentical(solved)), solution.execution);
    const full = format.formatFullSolution(solution);
    assert.equal(full, [solution.orientation, solution.execution].filter(Boolean).join(" "));
    exact(solution.original, full);
    exact(solution.original, format.formatAnnotatedSolution(solution));
    const stages = format.formatSolutionStages(solution);
    let offset = 0;
    for (const stage of stages.slice(1)) {
      const source = tokens(stage.value);
      const flags = stage.id === "base" ? boundary.leftMarked : boundary.rightMarked.slice(offset, offset + source.length);
      assert.deepEqual(stage.parts.filter(part => part.cancelled).flatMap(part => tokens(part.text)),
        source.filter((_, i) => flags[i]));
      if (stage.id !== "base") offset += source.length;
    }
  }
}

async function fixture(algorithm: string[], patch: {
  preAuf?: string; postAuf?: string; base?: string; orientation?: string; budget?: number;
} = {}) {
  const { preAuf = "", postAuf = "", base = "", orientation = "", budget = 0 } = patch;
  const right = tokens([preAuf, algorithm.join(" "), postAuf].join(" "));
  const inverse = new Alg(right.join(" ")).invert().toString();
  const { pieces, orientation: twists } = kp.defaultPattern().applyAlg(inverse).patternData.CORNERS;
  const target = Uint8Array.from(pieces, (piece, i) => piece * 3 + twists[i]);
  // A sparse exact index isolates search emission without a method classifier.
  const library: Library = {
    loaded: 1, rejected: 0, masks: new Set([model.mask(target, "D")]),
    index: new Map([[model.key(target), [{ method: "CLL", name: "axis fixture", group: "axis regression", sourceApi: "CLL",
      color: model.colorNormalizers[target[7]][engine.FACE_NAMES.indexOf("D")], algorithm, preAuf, postAuf }]]]),
  };
  const scramble = new Alg([orientation, base, right.join(" ")].join(" ")).invert().toString();
  const result = await engine.search(model, library, scramble,
    options({ colors: ["D"], maxDepth: tokens(base).length, maxOverlap: budget }));
  assert.equal(result.reason, "complete");
  verify(scramble, result.solutions, budget);
  for (const solution of result.solutions) {
    assert.equal(solution.caseName, "axis fixture");
    assert.equal(solution.group, "axis regression");
    assert.equal(solution.sourceApi, "CLL");
    assert.equal(solution.color, "D");
  }
  const selected = result.solutions.filter(solution => solution.base === base && solution.orientation === orientation);
  assert.ok(selected.length > 0, `${base} // ${right.join(" ")}`);
  return selected;
}

test("actual search normalizes axis runs inside finishes, pre-AUF/prefix and post-AUF even at maxOverlap 0", async () => {
  for (const [faces, axis] of [["UD", "y"], ["RL", "x"], ["FB", "z"]]) {
    for (const face of faces) for (const power of [1, 2, 3]) {
      const rotation = turn(axis, power);
      const tail = [...("RL".includes(face) ? ["U"] : []), ...cll];
      const algorithm = [`${face}'`, rotation, `${face}2`, ...tail];
      for (const budget of [0, 1]) {
        const solutions = await fixture(algorithm, { budget, orientation: power === 1 ? "" : power === 2 ? "x" : "z'" });
        assert.equal(solutions.length, 1);
        assert.equal(solutions[0].execution, [face, rotation, ...tail].join(" "));
        assert.deepEqual(solutions[0].boundary!.rightMarked, [true, true, true, ...tail.map(() => false)]);
        assert.equal(solutions[0].boundary!.overlap, 0);
      }
    }
  }
  for (const budget of [0, 1]) {
    const [prefix] = await fixture(["y", "U2", ...cll], { preAuf: "U'", budget, orientation: "x" });
    assert.equal(prefix.execution, ["U", "y", ...cll].join(" "));
    assert.deepEqual(prefix.boundary!.rightMarked, [true, true, true, ...cll.map(() => false)]);
    const [post] = await fixture([...cll, "U'", "y"], { postAuf: "U2", budget, orientation: "z'" });
    assert.equal(post.execution, [...cll, "U", "y"].join(" "));
    assert.deepEqual(post.boundary!.rightMarked, [...cll.map(() => false), true, true, true]);
  }
});

test("search retains normalized grip alternatives and leaves the next cross-stage pair after the budget is spent", async () => {
  const tail = ["F'", "z", "F2", ...cll];
  for (const [budget, expected, overlap, leftMarked, firstMarked] of [
    [0, ["R", "U", "U'", "R'", "F", "z", ...cll], 0, [false, false], [false, false]],
    [1, ["R", "R'", "F", "z", ...cll], 1, [false, true], [true, false]],
    [2, ["F", "z", ...cll], 2, [true, true], [true, true]],
  ] as const) {
    const solutions = await fixture(["U'", "R'", ...tail], { base: "R U", budget, orientation: "y'" });
    const solution = solutions.find(candidate => candidate.execution === expected.join(" "));
    assert.ok(solution, `Missing bounded execution at ${budget}`);
    assert.equal(solution.boundary!.overlap, overlap);
    assert.deepEqual(solution.boundary!.leftMarked, leftMarked);
    assert.deepEqual(solution.boundary!.rightMarked, [...firstMarked, true, true, true, ...cll.map(() => false)]);
    if (budget === 1) {
      assert.equal(format.formatFullSolution(solution), ["y'", ...expected].join(" "));
      assert.match(solution.execution, /^R R' /);
    }
  }
  // This reference-table context deliberately makes the unmerged grip cheaper.
  const alternatives = await fixture(["F", "R'", "U'", "y", "U2", ...cll], { base: "F", budget: 1 });
  const internal = ["F", "F", "R'", "U", "y", ...cll].join(" ");
  const compact = ["F2", "R'", "U", "y", ...cll].join(" ");
  assert.deepEqual(new Set(alternatives.map(solution => solution.execution)), new Set([internal, compact]));
  const grip = alternatives.find(solution => solution.execution === internal)!;
  const merged = alternatives.find(solution => solution.execution === compact)!;
  assert.ok(grip.ergonomics.cost + 0.015 < merged.ergonomics.cost);
  assert.equal(grip.boundary!.overlap, 0);
  assert.equal(merged.boundary!.overlap, 1);
  assert.deepEqual(grip.boundary!.leftMarked, [false]);
  assert.deepEqual(merged.boundary!.leftMarked, [true]);
  assert.deepEqual(grip.boundary!.rightMarked, [false, false, true, true, true, ...cll.map(() => false)]);
  assert.deepEqual(merged.boundary!.rightMarked, [true, false, true, true, true, ...cll.map(() => false)]);
});

// Check only one stage projection at a time. A residual R R' at an exhausted
// search boundary is intentional and must not be treated as a local defect.
function locallyMinimal(moves: string[]): void {
  const opposite: Record<string, string> = { U: "D", D: "U", R: "L", L: "R", F: "B", B: "F" };
  for (let i = 0; i < moves.length; i++) {
    if (/^[xyz]/.test(moves[i])) {
      let end = i + 1;
      while (end < moves.length && /^[xyz]/.test(moves[end])) end++;
      const run = kp.algToTransformation(moves.slice(i, end).join(" "));
      if (end - i > 1) {
        assert.ok(!run.isIdentityTransformation(), moves.join(" "));
        assert.ok(![..."xyz"].flatMap(axis => [1, 2, 3].map(n => turn(axis, n)))
          .some(move => run.isIdentical(kp.moveToTransformation(move))), moves.join(" "));
      }
      assert.ok(end - i <= 2, moves.join(" "));
      i = end - 1;
      continue;
    }
    const first = kp.moveToTransformation(moves[i]);
    let end = i + 1;
    while (end < moves.length) {
      if (/^[xyz]/.test(moves[end])) {
        let stop = end + 1;
        while (stop < moves.length && /^[xyz]/.test(moves[stop])) stop++;
        const frame = kp.algToTransformation(moves.slice(end, stop).join(" "));
        if (!first.applyTransformation(frame).isIdentical(frame.applyTransformation(first))) break;
        end = stop;
      } else if (moves[end][0] === opposite[moves[i][0]]) end++;
      else break;
    }
    assert.notEqual(moves[end]?.[0], moves[i][0], `Reducible stage: ${moves.join(" ")}`);
  }
}

test("seeded default EG searches emit exact, scored and locally minimal stage projections at budgets 0 and 1", async t => {
  const datasets = engine.DEFAULT_METHODS.map(method => JSON.parse(readFileSync(
    path.resolve(__dirname, `../../../../public/two-solver/data/${method}.json`), "utf8")) as MethodData);
  const library = await engine.buildLibrary(model, datasets);
  assert.ok(library.loaded > 700);
  let seed = 0xe612345;
  const next = (n: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  const vocabulary = [..."RUF"].flatMap(face => [1, 2, 3].map(power => turn(face, power)));
  let checked = 0, marked = 0, rotated = 0, withBase = 0;
  for (let sample = 0; sample < 2; sample++) {
    const sequence: string[] = [];
    for (let i = 0; i < 11; i++) {
      const allowed = vocabulary.filter(move => move[0] !== sequence.at(-1)?.[0]);
      sequence.push(allowed[next(allowed.length)]);
    }
    const scramble = sequence.join(" ");
    assert.equal(engine.isCompetitionDistance(model, scramble), true);
    for (const budget of [0, 1]) {
      const result = await engine.search(model, library, scramble,
        options({ methods: [...engine.DEFAULT_METHODS], moveSet: "ruf", maxDepth: 3, maxOverlap: budget }));
      assert.equal(result.reason, "complete", scramble);
      verify(scramble, result.solutions, budget);
      for (const solution of result.solutions) {
        const left = tokens(solution.base), execution = tokens(solution.execution);
        // DFS bases contain only face turns. Their untouched prefix stays on
        // the left; a merged turn belongs to the right projection. Do not test
        // the pair straddling this split after overlap has been exhausted.
        const firstMarked = solution.boundary!.leftMarked.indexOf(true);
        const split = firstMarked < 0 ? left.length : firstMarked;
        assert.deepEqual(execution.slice(0, split), left.slice(0, split));
        locallyMinimal(execution.slice(0, split));
        locallyMinimal(execution.slice(split));
        checked++;
        marked += Number(solution.boundary!.rightMarked.some(Boolean));
        rotated += Number(/[xyz]/.test(solution.execution));
        withBase += Number(solution.baseMoves > 0);
      }
    }
  }
  assert.ok(checked > 20 && marked > 0 && rotated > 0 && withBase > 0);
  t.diagnostic(`${checked} outputs independently replayed; ${marked} with marked sources, ${rotated} with rotations`);
});
