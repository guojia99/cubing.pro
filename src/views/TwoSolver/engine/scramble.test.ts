import assert from "node:assert/strict";
import path from "node:path";
import { before, test } from "node:test";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import type { KPuzzle, KTransformation } from "cubing/kpuzzle";
import type { CubeModel } from "./state";

type Engine = typeof import("./state") & typeof import("./scramble") & typeof import("./search");
let engine: Engine;
let model: CubeModel;
let kp: KPuzzle;
let rotations: { tokens: string[]; transform: KTransformation }[];

before(async () => {
  // Match engine.test.ts: tsx runs CommonJS, but cubing has import-only exports.
  const bundle = await build({
    stdin: {
      contents: 'export * from "./state"; export * from "./scramble"; export * from "./search"; export { cube2x2x2 } from "cubing/puzzles";',
      resolveDir: __dirname,
    },
    bundle: true, write: false, platform: "node", format: "esm",
  });
  const runtime = await import(`data:text/javascript;base64,${Buffer.from(
    bundle.outputFiles[0].text + "\n//# sourceURL=two-solver-scramble-test-runtime.mjs",
  ).toString("base64")}`);
  engine = runtime;
  model = await engine.CubeModel.create();
  kp = await runtime.cube2x2x2.kpuzzle();
  // Enumerate spatial rotations independently of CubeModel and its color keys.
  rotations = [{ tokens: [], transform: kp.identityTransformation() }];
  for (let i = 0; i < rotations.length; i++) for (const axis of "xyz") {
    const transform = rotations[i].transform.applyTransformation(kp.moveToTransformation(axis));
    if (!rotations.some(rotation => rotation.transform.isIdentical(transform))) {
      rotations.push({ tokens: [...rotations[i].tokens, axis], transform });
    }
  }
  assert.equal(rotations.length, 24);
});

function verify(scramble: string, oracle = scramble): string {
  const output = engine.toRufScramble(model, scramble);
  assert.match(output, /^(?:[RUF](?:2|')?(?: [RUF](?:2|')?)*)?$/, scramble);
  const tokens = output ? output.split(" ") : [];
  assert.ok(tokens.every((move, i) => !i || move[0] !== tokens[i - 1][0]), output);
  const original = kp.algToTransformation(oracle);
  const converted = kp.algToTransformation(output);
  const finalRotation = rotations.find(rotation =>
    original.isIdentical(converted.applyTransformation(rotation.transform)));
  assert.ok(finalRotation, `No physical final rotation: ${scramble} -> ${output}`);
  // Compare exact transformations, not color-canonical keys or solvedness.
  assert.ok(original.isIdentical(kp.algToTransformation(`${output} ${finalRotation.tokens.join(" ")}`)));
  assert.equal(engine.isCompetitionDistance(model, scramble), engine.isCompetitionDistance(model, output), scramble);
  return output;
}

test("opposite faces equal the positive face followed by the inverse axis power exactly", () => {
  for (const [negative, positive, axis] of [["D", "U", "y"], ["L", "R", "x"], ["B", "F", "z"]]) {
    for (const power of [1, 2, 3]) {
      const move = engine.token(negative, power);
      const rewritten = [engine.token(positive, power), engine.token(axis, -power)];
      assert.ok(model.equal(model.apply(engine.SOLVED, move), model.applySequence(engine.SOLVED, rewritten)), move);
      assert.ok(kp.moveToTransformation(move).isIdentical(kp.algToTransformation(rewritten.join(" "))), move);
      assert.equal(verify(move), engine.token(positive, power));
    }
  }
});

test("all six faces and powers in every pair of the 24 input rotation frames", () => {
  for (const face of "URFDLB") for (const power of [1, 2, 3]) {
    const move = engine.token(face, power);
    verify(move);
    for (const prefix of rotations) for (const suffix of rotations) {
      verify([...prefix.tokens, move, ...suffix.tokens].join(" "));
    }
  }
});

test("500 seeded sequences preserve exact transformations modulo physical rotations", () => {
  let seed = 0x222c0ffe;
  const next = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const moves = [..."URFDLBxyz"].flatMap(face => [1, 2, 3].map(power => engine.token(face, power)));
  for (let trial = 0; trial < 500; trial++) {
    const sequence = Array.from({ length: 1 + next(100) }, () => moves[next(moves.length)]);
    verify(sequence.join(" "));
  }
});

test("wide turns, bounded notation, identity, and adjacent cancellation", () => {
  for (const [face, axis, sign] of [
    ["R", "x", 1], ["L", "x", -1], ["U", "y", 1],
    ["D", "y", -1], ["F", "z", 1], ["B", "z", -1],
  ] as const) for (const power of [1, 2, 3]) {
    const suffix = engine.token(face, power).slice(1);
    for (const wide of [`${face}w${suffix}`, `${face.toLowerCase()}${suffix}`]) {
      assert.equal(verify(wide, engine.token(axis, sign * power)), "");
      verify(`D ${wide} L U B`, `D ${engine.token(axis, sign * power)} L U B`);
    }
  }
  for (const identity of ["", " ", "R R'", "D D'", "L L L L", "x y2 z'", "R U U' R'", "(R U)0"]) {
    assert.equal(verify(identity), "", identity);
  }
  assert.equal(verify("R R2"), "R'");
  assert.equal(verify("D U'"), "");
  verify("RUR'U'", "R U R' U'");
  for (const sequence of ["[D,L]", "[B:U2]", "(D L B)3", "(R U)'", "R2' U2'"]) verify(sequence);
  verify("R’ U′ F‘", "R' U' F'");
  assert.equal(engine.toRufScramble(model, "(x)200"), "");
  assert.equal(engine.toRufScramble(model, "R ".repeat(100)), "");
  for (const invalid of ["M", "R @ U", "R (U", "R0", "3Rw", " ".repeat(4001), "R ".repeat(101), "(x)201", "(R U)2147483647", "((R U)20)20"]) {
    assert.throws(() => engine.toRufScramble(model, invalid), invalid);
  }
});

test("the final exact-state verification rejects a broken conjugation", () => {
  const broken = Object.create(model) as CubeModel;
  broken.conjugate = moves => [...moves];
  assert.throws(() => engine.toRufScramble(broken, "x U"), /changed the physical state/);
});

test("20 native 222 random states retain distance >=4 through conversion and worker validation", { timeout: 120000 }, async t => {
  if (typeof process.getBuiltinModule !== "function" || !process.getBuiltinModule("node:worker_threads").Worker) {
    t.skip("Native cubing scramble workers are unavailable in this Node runtime");
    return;
  }
  // Keep cubing's native module-worker URLs intact instead of bundling them
  // into a data URL. This uses the installed package and needs no network.
  const scrambleUrl = pathToFileURL(path.resolve(__dirname, "../../../../node_modules/cubing/dist/lib/cubing/scramble/index.js")).href;
  const bundle = await build({
    stdin: { contents: `export { randomScrambleForEvent } from ${JSON.stringify(scrambleUrl)};`, resolveDir: __dirname },
    external: ["file:*"], bundle: true, write: false, platform: "node", format: "esm",
  });
  const { randomScrambleForEvent } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`) as typeof import("cubing/scramble");
  const workerBundle = await build({
    entryPoints: [path.resolve(__dirname, "../solver.worker.ts")],
    bundle: true, write: false, platform: "node", format: "esm",
  });
  const messages: { id: number; type: string; result?: boolean; error?: string }[] = [];
  const worker = {
    postMessage: (message: typeof messages[number]) => messages.push(message),
    onmessage: undefined as undefined | ((event: { data: { id: number; type: string; scramble: string; baseUrl: string } }) => Promise<void>),
  };
  const previousSelf = Object.getOwnPropertyDescriptor(globalThis, "self");
  Object.defineProperty(globalThis, "self", { configurable: true, value: worker });
  try {
    await import(`data:text/javascript;base64,${Buffer.from(workerBundle.outputFiles[0].text).toString("base64")}`);
  } finally {
    if (previousSelf) Object.defineProperty(globalThis, "self", previousSelf);
    else Reflect.deleteProperty(globalThis, "self");
  }
  assert.ok(worker.onmessage);
  for (let i = 0; i < 20; i++) {
    const original = (await randomScrambleForEvent("222")).toString();
    assert.equal(engine.isCompetitionDistance(model, original), true, `Original random state: ${original}`);
    const output = verify(original);
    assert.equal(engine.isCompetitionDistance(model, output), true, output);
    assert.ok(output.split(" ").length >= 4, output);
    for (const scramble of [original, output]) {
      const id = messages.length;
      await worker.onmessage({ data: { id, type: "validate", scramble, baseUrl: "http://localhost/" } });
      assert.deepEqual(messages.at(-1), { id, type: "result", result: true }, scramble);
    }
  }
});
