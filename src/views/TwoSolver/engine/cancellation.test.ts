import assert from "node:assert/strict";
import { before, test } from "node:test";
import { build } from "esbuild";
import type { KPuzzle } from "cubing/kpuzzle";
import type { CubeModel } from "./state";

type Engine = typeof import("./state") & typeof import("./cancellation");
let engine: Engine;
let model: CubeModel;
let kp: KPuzzle;
const moves = (text: string) => text.trim() ? text.trim().split(/\s+/) : [];

before(async () => {
  // cubing has import-only entrypoints; bundle an ESM runtime in memory.
  const result = await build({
    stdin: {
      contents: 'export * from "./state"; export * from "./cancellation"; export { cube2x2x2 } from "cubing/puzzles";',
      resolveDir: __dirname,
    },
    bundle: true, write: false, platform: "node", format: "esm",
  });
  const runtime = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
  engine = runtime;
  model = await engine.CubeModel.create();
  kp = await runtime.cube2x2x2.kpuzzle();
});

function exact(original: string[], actual: string[], setup: string[] = []) {
  const start = kp.algToTransformation(setup.join(" "));
  assert.ok(start.applyTransformation(kp.algToTransformation(original.join(" ")))
    .isIdentical(start.applyTransformation(kp.algToTransformation(actual.join(" ")))),
  `${original.join(" ")} != ${actual.join(" ")}`);
}

test("max0 preserves every original token and disables even rotation cancellation", () => {
  for (const [left, right] of [["R U", "U' R'"], ["R R y", "y' U U'"], ["", "R R'"]]) {
    const l = moves(left), r = moves(right);
    assert.deepEqual(engine.cancelBoundary(model, l, r, 0), {
      execution: [...l, ...r], leftMarked: l.map(() => false), rightMarked: r.map(() => false), overlap: 0, saved: 0,
    });
  }
});

test("default1 and max2 bound paired interactions rather than saved moves", () => {
  const left = moves("R U"), right = moves("U' R'");
  assert.deepEqual(engine.cancelBoundary(model, left, right), {
    execution: moves("R R'"), leftMarked: [false, true], rightMarked: [true, false], overlap: 1, saved: 2,
  });
  assert.deepEqual(engine.cancelBoundary(model, left, right, 2), {
    execution: [], leftMarked: [true, true], rightMarked: [true, true], overlap: 2, saved: 4,
  });
  assert.deepEqual(engine.cancelBoundary(model, ["U"], ["U"]), {
    execution: ["U2"], leftMarked: [true], rightMarked: [true], overlap: 1, saved: 1,
  });
  const chain = engine.cancelBoundary(model, ["U"], ["U", "U"], 2);
  assert.deepEqual(chain.execution, ["U'"]);
  assert.equal(chain.overlap, 2);
  assert.deepEqual(chain.rightMarked, [true, true]);
  assert.deepEqual(engine.cancelBoundary(model, ["U"], ["U", "U"]), {
    execution: ["U2", "U"], leftMarked: [true], rightMarked: [true, false], overlap: 1, saved: 1,
  });
});

test("unrelated internal turns, empty stages and blocked joins remain untouched", () => {
  for (const [left, right] of [["R R' F", "U U'"], ["", "R R' x x'"], ["U U'", ""], ["R", "L R'"]]) {
    const l = moves(left), r = moves(right);
    const result = engine.cancelBoundary(model, l, r, 6);
    assert.deepEqual(result.execution, [...l, ...r]);
    assert.ok([...result.leftMarked, ...result.rightMarked].every(mark => !mark));
  }
});

test("rotation and AUF reductions retain exact frames and original provenance", () => {
  for (const [left, right, expected, leftMarked, rightMarked, overlap] of [
    ["R U", "x' F' R'", "R x' R'", [false, true], [true, true, false], 1],
    ["R y", "F'", "y", [true, true], [true], 1],
    ["U", "y U'", "y", [true], [true, true], 1],
    ["R y", "U y' R'", "R U R'", [false, true], [false, true, false], 0],
    ["x", "U x'", "F", [true], [true, true], 0],
    ["R y", "y' R'", "", [true, true], [true, true], 1],
    ["y", "y'", "", [true], [true], 0],
    ["R y", "U", "R y U", [false, false], [false], 0],
    ["F x U", "U' x' R", "F R", [false, true, true], [true, true, false], 1],
  ] as const) {
    const l = moves(left), r = moves(right);
    const result = engine.cancelBoundary(model, l, r);
    assert.deepEqual(result.execution, moves(expected), `${left} // ${right}`);
    assert.deepEqual(result.leftMarked, leftMarked);
    assert.deepEqual(result.rightMarked, rightMarked);
    assert.equal(result.overlap, overlap);
    exact([...l, ...r], result.execution);
  }
  const twice = engine.cancelBoundary(model, moves("R U"), moves("x' F' R'"), 2);
  assert.deepEqual(twice.execution, ["x'"]);
  assert.equal(twice.overlap, 2);
});

test("all rotation frames and face amounts support exact bounded conjugate pairs", () => {
  for (const rotation of model.rotations) for (const face of "URFDLB") for (const power of [1, 2, 3]) {
    const left = engine.token(face, power);
    const mapped = model.conjugate([left], engine.invert(rotation.tokens))[0];
    const right = [...rotation.tokens, ...engine.invert([mapped])];
    const result = engine.cancelBoundary(model, [left], right);
    assert.equal(result.overlap, 1);
    assert.equal(result.saved, 2);
    assert.ok([...result.leftMarked, ...result.rightMarked].every(Boolean));
    exact([left, ...right], result.execution);
  }
});

test("compactNotation combines local turns and opposite faces without invented conjugacy", () => {
  for (const [input, expected] of [
    ["R R U U'", "R2"], ["R L R'", "L"], ["D U D' U'", ""],
    ["R U U' R'", ""], ["R x x' R'", ""], ["R U F", "R U F"],
    ["D B L", "D B L"], ["x R x'", "x R x'"], ["R y", "R y"],
    ["y U y'", "y U y'"], ["R L F F' R' L'", ""],
  ]) {
    const result = engine.compactNotation(model, moves(input));
    assert.deepEqual(result, moves(expected));
    exact(moves(input), result);
  }
});

test("contiguous rotations use shortest notation from an independent 24-orientation BFS", () => {
  const generators = [..."xyz"].flatMap(f => [f, `${f}2`, `${f}'`]);
  const queue = [{ transformation: kp.identityTransformation(), tokens: [] as string[] }];
  for (let i = 0; i < queue.length; i++) for (const move of generators) {
    const transformation = queue[i].transformation.applyTransformation(kp.moveToTransformation(move));
    if (!queue.some(entry => entry.transformation.isIdentical(transformation))) {
      queue.push({ transformation, tokens: [...queue[i].tokens, move] });
    }
  }
  assert.equal(queue.length, 24);
  for (const a of generators) for (const b of generators) for (const c of generators) {
    const input = [a, b, c];
    const transformation = kp.algToTransformation(input.join(" "));
    const shortest = queue.find(entry => entry.transformation.isIdentical(transformation))!;
    const result = engine.compactNotation(model, input);
    assert.equal(result.length, shortest.tokens.length, input.join(" "));
    exact(input, result);
  }
  assert.equal(engine.compactNotation(model, moves("x y x")).length, 2);
  for (const entry of queue) {
    const result = engine.compactNotation(model, ["R", ...entry.tokens, "x", "x'"]);
    exact(["R", ...entry.tokens], result);
    assert.equal(result.length, 1 + entry.tokens.length);
  }
});

test("300 seeded sequences, random split points and all limits replay as exact KPuzzle transformations", () => {
  let seed = 0xca11ce1;
  const next = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const vocabulary = [..."URFDLBxyz"].flatMap(f => [f, `${f}2`, `${f}'`]);
  const random = (length: number) => Array.from({ length }, () => vocabulary[next(vocabulary.length)]);
  for (let trial = 0; trial < 300; trial++) {
    // Include guaranteed reducible joins as well as arbitrary blocked joins.
    const prefix = random(next(18)), suffix = random(next(18)), bridge = random(next(7));
    const sequence = trial % 2 ? [...prefix, ...bridge, ...engine.invert(bridge), ...suffix] : random(next(45));
    const split = trial % 2 ? prefix.length + bridge.length : next(sequence.length + 1);
    const left = sequence.slice(0, split), right = sequence.slice(split);
    const leftBefore = [...left], rightBefore = [...right], setup = random(20);
    for (let limit = 0; limit <= 6; limit++) {
      const result = engine.cancelBoundary(model, left, right, limit);
      exact(sequence, result.execution, setup);
      assert.ok(result.overlap >= 0 && result.overlap <= limit);
      assert.equal(result.leftMarked.length, left.length);
      assert.equal(result.rightMarked.length, right.length);
      assert.equal(result.saved, engine.moveCount(sequence) - engine.moveCount(result.execution));
      assert.ok(result.execution.length <= sequence.length);
      if (result.overlap === 0) assert.equal(result.saved, 0);
    }
    const compact = engine.compactNotation(model, sequence);
    exact(sequence, compact, setup);
    assert.deepEqual(engine.compactNotation(model, compact), compact);
    assert.deepEqual(left, leftBefore);
    assert.deepEqual(right, rightBefore);
    assert.deepEqual(sequence, [...left, ...right]);
  }
});

test("standalone simplify keeps its existing unlimited algebra behavior", () => {
  for (const [input, expected] of [
    ["R U U' R'", ""], ["R U x' F' R'", "x'"],
    ["U U2 U'", "U2"], ["F x U'", "x"],
  ]) assert.deepEqual(engine.simplify(model, moves(input)), moves(expected));
});

test("stage cleanup fixes rotation-separated turns at the preferred left position", () => {
  for (const [input, expected] of [
    ["U' y U2", "U y"], ["R' x R2", "R x"], ["D y D'", "y"],
    ["F' z F2", "F z"], ["B z' B'", "z'"], ["L' x2 L2", "L x2"],
    ["U U2 U'", "U2"], ["R U U' R'", ""],
    ["U D y U' D'", "y"], ["U' x2 z2 U2", "U y2"],
    ["U' x z x' U2", "U y'"],
  ]) {
    for (const [left, right] of [[moves(input), []], [[], moves(input)]]) {
      const result = engine.cancelStages(model, left, right, 0);
      assert.deepEqual(result.execution, moves(expected), input);
      assert.equal(result.overlap, 0);
      assert.equal(result.saved, engine.moveCount(moves(input)) - engine.moveCount(moves(expected)));
      assert.equal(result.leftMarked.length, left.length);
      assert.equal(result.rightMarked.length, right.length);
      assert.ok([...result.leftMarked, ...result.rightMarked].every(Boolean));
      assert.deepEqual(engine.compactNotation(model, moves(input)), moves(expected));
      exact(moves(input), result.execution);
    }
  }
});

test("stage cleanup handles signs and rotation powers on all axes and opposite faces", () => {
  for (const [faces, axis] of [["UD", "y"], ["RL", "x"], ["FB", "z"]]) {
    for (const face of faces) for (const a of [1, 2, 3]) for (const b of [1, 2, 3]) {
      for (const power of [1, 2, 3]) {
        const rotation = engine.token(axis, power), combined = engine.token(face, a + b);
        const input = [engine.token(face, a), rotation, engine.token(face, b)];
        const expected = [...(combined ? [combined] : []), rotation];
        const result = engine.cancelStages(model, [], input, 0);
        assert.deepEqual(result.execution, expected, input.join(" "));
        assert.deepEqual(result.rightMarked, [true, true, true]);
        assert.deepEqual(engine.compactNotation(model, input), expected);
        exact(input, result.execution);
        const opposite = [...faces].find(f => f !== face)!;
        const interleaved = [input[0], opposite, rotation, input[2]];
        const interleavedResult = engine.cancelStages(model, interleaved, [], 0);
        assert.deepEqual(interleavedResult.execution, [...(combined ? [combined] : []), opposite, rotation]);
        exact(interleaved, interleavedResult.execution);
      }
    }
  }
});

test("stage cleanup uses actual rotation frames and blocks noncommuting turns", () => {
  for (const input of ["F y F'", "U x2 y U'", "R y R'", "U R U'", "F x2 F'", "R y L R'"]) {
    const original = moves(input);
    assert.deepEqual(engine.cancelStages(model, original, [], 0).execution, original);
    assert.deepEqual(engine.compactNotation(model, original), original);
  }
  for (const rotation of model.rotations) for (const face of "URFDLB") {
    const frame = kp.algToTransformation(rotation.tokens.join(" "));
    const turn = kp.moveToTransformation(face);
    const commutes = turn.applyTransformation(frame).isIdentical(frame.applyTransformation(turn));
    const input = [face, ...rotation.tokens, `${face}'`];
    const result = engine.cancelStages(model, input, [], 0);
    assert.deepEqual(result.execution, commutes ? rotation.tokens : input, input.join(" "));
    assert.equal(result.saved, commutes ? 2 : 0);
    exact(input, result.execution);
  }
});

test("stage cleanup is unbounded internally but keeps cross-stage overlap capped", () => {
  const nested = Array.from({ length: 20 }, (_, i) => "URF"[i % 3]);
  assert.deepEqual(engine.cancelStages(model, [...nested, ...engine.invert(nested)], [], 0), {
    execution: [], leftMarked: Array(40).fill(true), rightMarked: [], overlap: 0, saved: 40,
  });
  const left = moves("R R U U' F U"), right = moves("U' F' L L'");
  for (const [limit, expected, overlap, saved, leftMarked, rightMarked] of [
    [0, "R2 F U U' F'", 0, 5, [true, true, true, true, false, false], [false, false, true, true]],
    [1, "R2 F F'", 1, 7, [true, true, true, true, false, true], [true, false, true, true]],
    [2, "R2", 2, 9, [true, true, true, true, true, true], [true, true, true, true]],
  ] as const) {
    const result = engine.cancelStages(model, left, right, limit);
    assert.deepEqual(result, { execution: moves(expected), overlap, saved, leftMarked, rightMarked });
    exact([...left, ...right], result.execution);
  }
  assert.deepEqual(engine.cancelStages(model, ["U"], ["U", "U"]), {
    execution: ["U'"], overlap: 1, saved: 2, leftMarked: [true], rightMarked: [true, true],
  });
});

test("stage annotations retain every original source through internal and boundary reductions", () => {
  for (const [left, right, expected, overlap, leftMarked, rightMarked] of [
    ["F U' y U2", "U' R", "F y R", 1, [false, true, true, true], [true, false]],
    ["R x x x", "x", "R", 0, [false, true, true, true], [true]],
    ["R R'", "U U'", "", 0, [true, true], [true, true]],
    ["", "U' y U2 F", "U y F", 0, [], [true, true, true, false]],
    ["R U", "F L", "R U F L", 0, [false, false], [false, false]],
    ["", "", "", 0, [], []],
  ] as const) {
    const l = moves(left), r = moves(right);
    const result = engine.cancelStages(model, l, r);
    assert.deepEqual(result.execution, moves(expected), `${left} // ${right}`);
    assert.deepEqual(result.leftMarked, leftMarked);
    assert.deepEqual(result.rightMarked, rightMarked);
    assert.equal(result.overlap, overlap);
    assert.equal(result.saved, engine.moveCount([...l, ...r]) - engine.moveCount(result.execution));
    exact([...l, ...r], result.execution);
  }
});

test("400 seeded stage normalizations preserve exact independent KPuzzle transformations", () => {
  let seed = 0x57a6e;
  const next = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const vocabulary = [..."URFDLBxyz"].flatMap(f => [f, `${f}2`, `${f}'`]);
  const axes: Record<string, string> = { U: "y", D: "y", R: "x", L: "x", F: "z", B: "z" };
  const random = (length: number) => Array.from({ length }, () => vocabulary[next(vocabulary.length)]);
  for (let trial = 0; trial < 400; trial++) {
    const prefix = random(next(18)), suffix = random(next(18)), bridge = random(next(7));
    const face = "URFDLB"[next(6)], rotation = axes[face];
    const sequence = trial % 2 ? [...prefix, face, rotation, `${face}'`, ...bridge, ...engine.invert(bridge), ...suffix]
      : random(next(50));
    const split = next(sequence.length + 1), setup = random(20);
    const left = sequence.slice(0, split), right = sequence.slice(split);
    const leftBefore = [...left], rightBefore = [...right];
    for (const limit of [0, 1, 2, 6]) {
      const result = engine.cancelStages(model, left, right, limit);
      exact(sequence, result.execution, setup);
      assert.ok(result.overlap >= 0 && result.overlap <= limit);
      assert.equal(result.leftMarked.length, left.length);
      assert.equal(result.rightMarked.length, right.length);
      assert.equal(result.saved, engine.moveCount(sequence) - engine.moveCount(result.execution));
      assert.ok(result.saved >= 0);
      assert.ok(result.execution.length <= sequence.length);
      if (limit === 0) assert.deepEqual(result.execution,
        [...engine.compactNotation(model, left), ...engine.compactNotation(model, right)]);
    }
    const compact = engine.compactNotation(model, sequence);
    exact(sequence, compact, setup);
    assert.deepEqual(engine.compactNotation(model, compact), compact);
    assert.deepEqual(left, leftBefore);
    assert.deepEqual(right, rightBefore);
  }
});
