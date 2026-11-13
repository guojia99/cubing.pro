import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { Alg } from 'cubing/alg';

const bundle = await build({
  entryPoints: [new URL('./model.ts', import.meta.url).pathname],
  bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'external-cubing', setup(builder) {
    builder.onResolve({ filter: /^cubing\// }, ({ path }) => ({ path: import.meta.resolve(path), external: true }));
  } }],
});
const { resolvePuzzle, parsePuzzleAlg, preparePuzzle, inversePuzzleAlg, applyPuzzleAlg } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

test('bigCube catalog orders are explicit, legacy aliases survive and concrete puzzles take precedence', () => {
  for (const [category, expected] of [
    ['4x4 OLLP', '4x4x4'], ['4x4 PLLP', '4x4x4'],
    ['5x5 L2E', '5x5x5'], ['5x5 L2C', '5x5x5'],
    ['6x6 L2E', '6x6x6'], ['6x6 L2C', '6x6x6'], ['LCE', '5x5x5'],
    ['PLLP', '4x4x4'], ['L2E', '5x5x5'], [' 6 × 6 L2C ', '6x6x6'],
  ]) {
    assert.equal(resolvePuzzle('bigCube', category), expected, category);
    for (const cube of ['333', '333oh', '3x3x3']) {
      assert.equal(resolvePuzzle(cube, category), '3x3x3', `${cube}/${category}`);
    }
    assert.equal(resolvePuzzle('unknown', category), null, category);
  }
  for (const category of ['OLLP', 'L2C', '8x8 L2E', '3x3 PLLP', '4x5 PLLP',
    '4x4x5 PLLP', '4x4 UNKNOWN', '4x4 PLLP extra', '6x6 Rw', 'Rw U2 Rw\'']) {
    assert.equal(resolvePuzzle('bigCube', category), null, category);
  }
});

test('AST budget rejects expanded non-moves, repeats and nesting before leaf traversal', () => {
  const original = Alg.prototype.experimentalLeafMoves;
  Alg.prototype.experimentalLeafMoves = function* () { assert.fail('must check AST before expanding leaves'); };
  try {
    for (const formula of [
      '(.)5000000', '(// comment\n)5000000', '(\n)5000000', '()5000000',
      '((()4000)4000)4000', '((.)2000)3', '(R)4001', '(R)4001\'',
      '[(.)1001, (.)1000]', '[(.)1500: (.)1001]',
      `${'('.repeat(33)}R${')'.repeat(33)}`,
      `${'[R:'.repeat(33)}U${']'.repeat(33)}`,
      `${'[R,'.repeat(33)}U${']'.repeat(33)}`,
    ]) assert.throws(() => parsePuzzleAlg(formula, '3x3x3'), /4000|32 nesting/, formula);
    for (const formula of ['(R)9007199254740993', 'R9007199254740993', '(.)999999999999999999999']) {
      assert.throws(() => parsePuzzleAlg(formula, '3x3x3'), /integer|amount/i, formula);
    }
  } finally {
    Alg.prototype.experimentalLeafMoves = original;
  }
});

test('standard legal notation and exact AST budget boundaries remain supported', () => {
  for (const formula of [
    '(R U)2000', '(.)4000', '(// note\n)2000', '[(.)1000, (.)1000]',
    '[(.)1000: (.)2000]', '(R U)0', '(R U)3\'', "U2' Rw 2-3Rw x y' z2",
    '[R, U]2 [F: [R, U]]', `${'('.repeat(32)}R${')'.repeat(32)}`,
    `${'[R:'.repeat(32)}U${']'.repeat(32)}`,
  ]) {
    assert.equal(parsePuzzleAlg(formula, '3x3x3').toString(), new Alg(formula).toString(), formula);
  }
  assert.equal([...parsePuzzleAlg('(R U)2000', '3x3x3').experimentalLeafMoves()].length, 4000);
  assert.throws(() => parsePuzzleAlg('[(.)1000, (.)1000] .', '3x3x3'), /4000/);
});

test('empty selected scramble falls back to inverse formula except explicit identity', async () => {
  for (const scramble of ['', ' \n ']) {
    const state = await preparePuzzle('3x3x3', 'R', scramble, 'scramble');
    assert.equal(state.setup, "R'");
    assert.ok(!state.pattern.isIdentical(state.kpuzzle.defaultPattern()));
    assert.equal(state.warning, undefined);
  }
  const identity = await preparePuzzle('3x3x3', 'R', '', 'scramble', true);
  assert.equal(identity.setup, '');
  assert.ok(identity.pattern.isIdentical(identity.kpuzzle.defaultPattern()));
  await assert.rejects(preparePuzzle('3x3x3', '', '', 'scramble'), /No formula/);
  const empty = await preparePuzzle('3x3x3', '', '', 'scramble', true);
  assert.ok(empty.pattern.isIdentical(empty.kpuzzle.defaultPattern()));
  const backend = await preparePuzzle('3x3x3', 'R', 'U', 'scramble');
  assert.equal(backend.setup, 'U');
});

test('native setup marker is scoped to FTO setup and cannot bypass the AST budget', () => {
  const prefix = '// cubing-pro:native\n';
  assert.equal(parsePuzzleAlg(prefix + "2R' Rv'", 'fto', 'setup').toString(), "2R' Rv'");
  assert.equal(parsePuzzleAlg(" \n// cubing-pro:native\r\n2R'", 'fto', 'setup').toString(), "2R'");
  assert.throws(() => parsePuzzleAlg(prefix + '(.)5000000', 'fto', 'setup'), /4000/);
  assert.throws(() => parsePuzzleAlg(prefix + "2R'", 'fto', 'formula'), /Unsupported/);
  assert.throws(() => parsePuzzleAlg(prefix + 'R', 'skewb', 'formula'), /Unsupported/);
});

test('SQ1 annotation is preserved for formula, derived setup and fallback playback', async () => {
  const formula = "[B B] /U'eD'";
  const scramble = await inversePuzzleAlg(formula, 'square1');
  for (const source of ['formula', 'scramble']) {
    const state = await preparePuzzle('square1', formula, scramble, source);
    assert.equal(state.annotation, '[B B]');
    assert.equal(state.warning, undefined);
    assert.ok(applyPuzzleAlg(state.pattern, parsePuzzleAlg(formula, 'square1'), 'square1')
      .isIdentical(state.kpuzzle.defaultPattern()));
  }
  const fallback = await preparePuzzle('square1', formula, '', 'scramble');
  assert.equal(fallback.annotation, '[B B]');
  assert.equal(fallback.setup, scramble);
});
