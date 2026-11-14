import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { evaluateErgonomics, SCORE_VERSION } from "./ergonomics";
import { DATA } from "./twoToolData";

const evaluate = (algorithm: string) => evaluateErgonomics(algorithm ? algorithm.split(" ") : []);
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test("leading inspection rotations are entirely free and input is unchanged", () => {
  const tokens = ["x", "y2", "z'", "R", "U", "R'"];
  const copy = [...tokens];
  assert.deepEqual(evaluateErgonomics(tokens), evaluate("R U R'"));
  assert.deepEqual(tokens, copy);
  assert.equal(evaluate("x y2 z'").cost, 0);
  assert.equal(evaluate("x y2 z'").rotations, 0);
});

test("interior and trailing rotations are counted, charged, and estimated", () => {
  const plain = evaluate("R U R'");
  const rotated = evaluate("R U R' x");
  assert.ok(rotated.cost > plain.cost);
  assert.ok(rotated.score < plain.score);
  assert.equal(rotated.rotations, 1);
  assert.equal(rotated.regrips, 1);
  assert.equal(rotated.confidence, "estimated");
  assert.equal(evaluate("R x' U y2 R'").rotations, 2);
  assert.ok(evaluate("R U R' x2").cost > rotated.cost);
  assert.ok(rotated.notes.some((note) => note.includes("内部转体")));
});

test("zero, one, and two turns have finite sensible estimated results", () => {
  for (const algorithm of ["", "R", "R2", "B", "R U", "R2 B", "F2 R'"]) {
    const result = evaluate(algorithm);
    assert.ok(Number.isFinite(result.cost) && result.cost >= 0);
    assert.ok(Number.isFinite(result.score) && result.score >= 0 && result.score <= 100);
    assert.equal(result.confidence, "estimated");
    assert.ok(result.notes.length > 0 && result.notes.length <= 4);
  }
  assert.equal(evaluate("").score, 100);
  assert.ok(evaluate("R U").cost > evaluate("R").cost);
  assert.ok(evaluate("R").cost > 0);
});

test("a suitable U x' entry can slightly beat an F startup without global rewriting", () => {
  // x U x' = F: the initial inspection x is free, so this is a
  // rotated entry to F R U, retaining the remainder's execution frame.
  const front = evaluate("F R U");
  const entry = evaluate("U x' R U");
  assert.ok(entry.cost < front.cost);
  assert.ok(front.cost - entry.cost < 0.1);
  assert.ok(entry.score > front.score);
  assert.equal(front.confidence, "estimated");
  assert.equal(entry.rotations, 1);
  assert.notEqual(evaluate("U x'").cost, evaluate("F").cost);
  assert.notEqual(evaluate("U x' F2 R'").cost, evaluate("F F2 R'").cost);
  assert.equal(evaluate("R U F").confidence, "reference");
});

test("F2 R' uses a documented estimated regrip and bounded Chinese notes", () => {
  const result = evaluate("F2 R' x U F2 R'");
  assert.equal(result.regrips, 3);
  assert.equal(result.confidence, "estimated");
  assert.ok(result.notes.some((note) => note.includes("F2 R'") && note.includes("启发式")));
  assert.equal(result.notes.length, 4);
  assert.equal(evaluate("F2 x R'").regrips, 1);
  assert.equal(evaluate("R U R'").regrips, 0);
});

test("B/D/L identities have no blanket surcharge", () => {
  for (const face of ["B", "D", "L", "U"]) {
    close(evaluate(`R2 ${face}`).cost, evaluate("R2 U").cost);
  }
  close(evaluate("R B L").cost, evaluate("R D B").cost);
  assert.equal(evaluate("R B L").confidence, "estimated");
  assert.ok(evaluate("R B2 L").cost > evaluate("R B L").cost);
  assert.ok(evaluate("R B B").cost > evaluate("R B L").cost);
});

test("covered triples retain exact reference costs and asymmetric endpoint weighting", () => {
  close(evaluate("R U R'").cost, 0.21);
  // Four tokens: (a + (a+b)/2 + (a+b)/2 + b) / 3.
  close(evaluate("R U R' F").cost, (DATA["R U R'"] + DATA["U R' F"]) * 2 / 3);
  // Five tokens: endpoints do not all receive equal triplet weights.
  const a = DATA["R U R'"];
  const b = DATA["U R' F"];
  const c = DATA["R' F U"];
  close(evaluate("R U R' F U").cost, (a + (a+b)/2 + (a+b+c)/3 + (b+c)/2 + c) / 3);
  assert.equal(evaluate("R U R' F U").confidence, "reference");
});

test("smoothness normalizes cost per layer turn rather than total length", () => {
  const short = evaluate("B D B");
  const long = evaluate("B D B D B");
  assert.ok(long.cost > short.cost);
  close(short.score, long.score);
  assert.ok(SCORE_VERSION.includes("0e5dd1b"));
});

test("all pinned reference records are finite, exact and immutable", () => {
  assert.equal(Object.keys(DATA).length, 324);
  assert.ok(Object.isFrozen(DATA));
  for (const [key, value] of Object.entries(DATA)) {
    assert.match(key, /^[RUF](?:2|')? [RUF](?:2|')? [RUF](?:2|')?$/);
    assert.ok(Number.isFinite(value) && value > 0);
  }
  assert.equal(DATA["F R F"], 0.265);
  // Digest of JSON.stringify(DATA) from the pinned upstream file, not a subset.
  assert.equal(createHash("sha256").update(JSON.stringify(DATA)).digest("hex"), "aa2cd3363c9c5bfa35295dad8e702c5347f448d44435021a24fb00a481c74724");
});

test("invalid notation fails explicitly", () => {
  for (const token of ["r", "R2'", "Rw", "M", "", "R U", "X"]) {
    assert.throws(() => evaluateErgonomics([token]), RangeError);
  }
});
