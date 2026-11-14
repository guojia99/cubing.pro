import assert from "node:assert/strict";
import { before, test } from "node:test";
import { build } from "esbuild";
import type { KPuzzle } from "cubing/kpuzzle";
import { METHODS, type Solution } from "./engine/types";
import { compactNotation, formatAnnotatedSolution, formatFullSolution, formatSolutionStages } from "./solutionFormat";
import { tDetail, twoSolverDetailEnUS, twoSolverDetailZhCN } from "../../i18n/messages/two-solver-detail";

let kp: KPuzzle;
before(async () => {
  const result = await build({
    stdin: { contents: 'export { cube2x2x2 } from "cubing/puzzles";', resolveDir: __dirname },
    bundle: true, write: false, platform: "node", format: "esm",
  });
  const runtime = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
  kp = await runtime.cube2x2x2.kpuzzle();
});

const fixture = (patch: Partial<Solution> = {}): Solution => ({
  id: "format-test", method: "CLL", caseName: "test", group: "test", color: "D",
  orientation: "x y", base: "F R U", preAuf: "U'", algorithm: "R' B2", postAuf: "U2",
  original: "x y F R U U' R' B2 U2", execution: "F B2 U2",
  baseMoves: 3, moves: 3, originalMoves: 7, cancelled: 4,
  boundary: { left: "F R U", right: "U' R' B2 U2", leftMarked: [false, true, true], rightMarked: [true, true, false, false], overlap: 2 },
  ergonomics: { score: 80, cost: 3, regrips: 0, rotations: 0, confidence: "estimated", notes: [] },
  sourceApi: "CLL", ...patch,
});

function exact(original: string, actual: string) {
  const setup = kp.algToTransformation("R U F2 L D' B x");
  assert.ok(setup.applyTransformation(kp.algToTransformation(original))
    .isIdentical(setup.applyTransformation(kp.algToTransformation(actual))), `${original} != ${actual}`);
}

test("full copy includes orientation and only compact execution", () => {
  const solution = fixture();
  assert.equal(formatFullSolution(solution), "x y F B2 U2");
  exact(solution.original, formatFullSolution(solution));
  assert.doesNotMatch(formatFullSolution(solution), /[()\n]|\/\//);
  assert.equal(formatFullSolution(fixture({ orientation: "x x'", execution: "R R R U U'", boundary: undefined })), "R'");
});

test("copy does not perform extra boundary cancellation beyond the engine budget", () => {
  const solution = fixture({ orientation: "x x'", execution: "R R'",
    boundary: { left: "R U", right: "U' R'", leftMarked: [false, true], rightMarked: [true, false], overlap: 1 } });
  assert.equal(formatFullSolution(solution), "R R'");
  exact("", formatFullSolution(solution));
});

test("annotated original keeps all stages executable exactly once and counts raw turns", () => {
  const solution = fixture();
  const annotated = formatAnnotatedSolution(solution);
  assert.match(annotated, /原始分段 · 未消步 7 步 → 消步后 3 步/);
  assert.match(annotated, /x y \/\/朝向 0\/0/);
  assert.match(annotated, /F \(R U\) \/\/做底 3\/3/);
  assert.match(annotated, /\(U'\) \/\/AUF 1\/4/);
  assert.match(annotated, /\(R'\) B2 \/\/CLL 2\/6/);
  assert.match(annotated, /U2 \/\/AUF 1\/7/);
  assert.match(annotated, /\/\/ 消步后完整解法 · 含朝向：x y F B2 U2$/);
  // KPuzzle parses real // comments and grouping; compare exact frames, not solvedness.
  exact(solution.original, annotated);
  exact(formatFullSolution(solution), annotated);
});

test("right boundary indices span pre-AUF, algorithm and post-AUF including rotations", () => {
  const solution = fixture({
    orientation: "z'", base: "R y", preAuf: "U x", algorithm: "F R'", postAuf: "y' U2",
    original: "z' R y U x F R' y' U2",
    boundary: { left: "R y", right: "U x F R' y' U2", leftMarked: [false, true], rightMarked: [true, false, false, true, true, false], overlap: 2 },
  });
  const stages = formatSolutionStages(solution);
  assert.deepEqual(stages.map(stage => stage.text), ["z'", "R (y)", "(U) x", "F (R')", "(y') U2"]);
  assert.deepEqual(stages.map(stage => [stage.count, stage.cumulative]), [[0, 0], [1, 1], [1, 2], [2, 4], [1, 5]]);
  exact(solution.original, formatAnnotatedSolution(solution));
  assert.deepEqual(formatSolutionStages(fixture({ boundary: undefined })).map(stage => stage.text), ["x y", "F R U", "U'", "R' B2", "U2"]);
});

test("empty stages still annotate counts and never insert executable placeholders", () => {
  const solution = fixture({ orientation: "", base: "", preAuf: "", algorithm: "", postAuf: "", original: "", execution: "", moves: 0, originalMoves: 0, boundary: undefined });
  assert.equal(formatFullSolution(solution), "");
  const annotated = formatAnnotatedSolution(solution);
  assert.match(annotated, /\n\/\/朝向 0\/0\n\/\/做底 0\/0\n\/\/AUF 0\/0\n\/\/CLL 0\/0\n\/\/AUF 0\/0\n/);
  exact("", annotated);
});

test("localized annotations preserve executable moves, stage IDs, counts and method names", () => {
  for (const { id } of METHODS) {
    const solution = fixture({ method: id });
    const original = JSON.stringify(solution);
    const zh = formatAnnotatedSolution(solution);
    const en = formatAnnotatedSolution(solution, "en-US");
    assert.equal(zh, formatAnnotatedSolution(solution, "zh-CN"));
    assert.match(en, /Original stages · Before cancellation 7 moves → After cancellation 3 moves/);
    assert.match(en, /x y \/\/Orientation 0\/0/);
    assert.match(en, /F \(R U\) \/\/Base 3\/3/);
    assert.ok(en.includes(`//${id} 2/6`));
    assert.doesNotMatch(en, /[\u3400-\u9fff]/);
    const moves = (text: string) => text.split("\n").map(line => line.split("//")[0]).join("\n");
    assert.equal(moves(en), moves(zh));
    exact(solution.original, en);
    const stages = formatSolutionStages(solution, "en-US");
    assert.deepEqual(stages.map(stage => stage.label), ["Orientation", "Base", "Pre-AUF", "Algorithm", "Post-AUF"]);
    const invariantFields = (stage: (typeof stages)[number]) => [stage.id, stage.value, stage.parts, stage.text, stage.count, stage.cumulative];
    assert.deepEqual(stages.map(invariantFields), formatSolutionStages(solution).map(invariantFields));
    assert.equal(JSON.stringify(solution), original);
  }
  const empty = fixture({ orientation: "", base: "", preAuf: "", algorithm: "", postAuf: "", execution: "", boundary: undefined });
  assert.match(formatAnnotatedSolution(empty, "en-US"), /Includes orientation: No moves needed$/);
  exact("", formatAnnotatedSolution(empty, "en-US"));
});

test("detail catalogs have matching keys and interpolation placeholders", () => {
  assert.deepEqual(Object.keys(twoSolverDetailEnUS).sort(), Object.keys(twoSolverDetailZhCN).sort());
  for (const key of Object.keys(twoSolverDetailZhCN) as (keyof typeof twoSolverDetailZhCN)[]) {
    const placeholders = (text: string) => [...text.matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();
    assert.deepEqual(placeholders(twoSolverDetailEnUS[key]), placeholders(twoSolverDetailZhCN[key]), key);
    assert.ok(twoSolverDetailEnUS[key].length);
  }
  assert.equal(tDetail("en-US", "two.detail.copiedFull", { method: "CLL", caseName: "{method} 源名称" }),
    "Copied the full solution for CLL {method} 源名称.");
});

test("normalization in every stage retains rotation frames, AUF and original marker ranges", () => {
  const solution = fixture({
    orientation: "x x x", base: "R R R", preAuf: "U U U", algorithm: "y y' F F", postAuf: "U2 U2 z'",
    original: "x x x R R R U U U y y' F F U2 U2 z'", boundary: undefined,
  });
  assert.deepEqual(formatSolutionStages(solution).map(stage => stage.text), ["x'", "R'", "U'", "F2", "z'"]);
  assert.deepEqual(formatSolutionStages(solution).map(stage => stage.count), [0, 3, 3, 2, 2]);
  exact(solution.original, formatAnnotatedSolution(solution));
  const marked = fixture({ base: "R R R", boundary: { left: "R R R", right: "U' R' B2 U2", leftMarked: [true, true, false], rightMarked: [false, true, false, false], overlap: 1 } });
  assert.equal(formatSolutionStages(marked)[1].text, "(R R) R");
});

test("all method labels are preserved in executable annotations without mutating engine output", () => {
  for (const { id } of METHODS) {
    const solution = fixture({ method: id });
    const before = JSON.stringify(solution);
    assert.ok(formatAnnotatedSolution(solution).includes(`//${id} 2/6`));
    exact(solution.original, formatAnnotatedSolution(solution));
    assert.equal(JSON.stringify(solution), before);
  }
});

test("rotation runs use shortest conventional notation and preserve exact transformations", () => {
  const generators = [..."xyz"].flatMap(face => [face, `${face}2`, `${face}'`]);
  const queue = [{ transformation: kp.identityTransformation(), moves: [] as string[] }];
  for (let i = 0; i < queue.length; i++) for (const move of generators) {
    const transformation = queue[i].transformation.applyTransformation(kp.moveToTransformation(move));
    if (!queue.some(entry => entry.transformation.isIdentical(transformation))) queue.push({ transformation, moves: [...queue[i].moves, move] });
  }
  assert.equal(queue.length, 24);
  for (const a of generators) for (const b of generators) for (const c of generators) {
    const original = `${a} ${b} ${c}`;
    const compact = compactNotation(original);
    const transformation = kp.algToTransformation(original);
    const shortest = queue.find(entry => entry.transformation.isIdentical(transformation))!;
    assert.equal(compact ? compact.split(" ").length : 0, shortest.moves.length, original);
    exact(original, compact);
    exact(`R ${original} U' z'`, compactNotation(`R ${original} U' z'`));
  }
});

test("seeded stage splits replay original comments and compact copies without discarded AUF or rotations", () => {
  let seed = 0xccaaff;
  const next = (n: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  const vocabulary = [..."URFDLBxyz"].flatMap(face => [face, `${face}2`, `${face}'`]);
  const random = () => Array.from({ length: next(10) }, () => vocabulary[next(vocabulary.length)]).join(" ");
  for (let i = 0; i < 150; i++) {
    const [orientation, base, preAuf, algorithm, postAuf] = Array.from({ length: 5 }, random);
    const execution = [base, preAuf, algorithm, postAuf].filter(Boolean).join(" ");
    const original = [orientation, execution].filter(Boolean).join(" ");
    const solution = fixture({ orientation, base, preAuf, algorithm, postAuf, execution, original, boundary: undefined });
    exact(original, formatAnnotatedSolution(solution));
    exact(original, formatFullSolution(solution));
    assert.equal(compactNotation(formatFullSolution(solution)), formatFullSolution(solution));
  }
});
