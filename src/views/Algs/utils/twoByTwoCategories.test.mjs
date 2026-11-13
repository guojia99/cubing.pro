import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundle = await build({
  stdin: { contents: `
    export * from './twoByTwoCategories';
    export { isTwoLayerPBL, prefersLastLayer, resolvePuzzle, preparePuzzle } from '../../../components/puzzles/model';
  `, resolveDir: new URL('.', import.meta.url).pathname },
  bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'external-cubing', setup(builder) {
    builder.onResolve({ filter: /^cubing\// }, ({ path }) => ({ path: import.meta.resolve(path), external: true }));
  } }],
});
const { groupTwoByTwoCategories, usesTwoByTwo3D, isTwoLayerPBL, prefersLastLayer, resolvePuzzle, preparePuzzle } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

// Names and order returned by the local backend /public/algorithm/ (24 records).
const backendNames = ['CLL', 'EG1', 'EG2', 'LEG', 'TCLL+', 'TCLL-',
  'LS1', 'LS2', 'LS3', 'LS4', 'LS5', 'LS6', 'LS7', 'LS8', 'LS9',
  'TEG1', 'FH', 'TEG2', 'CBL', 'EGLS1', 'EGLS2', 'FakeBar', 'OLL', 'PBL'];
const lastSlot = ['LS1', 'LS2', 'LS3', 'LS4', 'LS5', 'LS6', 'LS7', 'LS8', 'LS9', 'EGLS1', 'EGLS2'];
const nativeNames = ['PBL', 'LS', ...lastSlot, 'FakeBar'];

test('all 24 backend categories occur exactly once, preserving API records and routes', () => {
  const items = Object.freeze(backendNames.map((name, index) => Object.freeze({ name, image: `image-${index}`, alg: 'R U', caseCount: index + 1 })));
  const groups = groupTwoByTwoCategories(items);
  assert.deepEqual(groups.map(group => group.id), ['last-slot', 'eg', 'cbl', 'other']);
  assert.deepEqual(groups.slice(0, 3).map(group => group.label), ['LS / EGLS', 'CLL / EG', 'CBL']);
  const output = groups.flatMap(group => group.items);
  assert.equal(output.length, 24);
  for (const item of items) {
    assert.equal(output.filter(candidate => candidate === item).length, 1, item.name);
    assert.equal(`/algs/222/${encodeURIComponent(output.find(candidate => candidate === item).name)}`, `/algs/222/${encodeURIComponent(item.name)}`);
  }
  assert.deepEqual(items.map(item => item.name), backendNames, 'input remains unchanged');
  assert.deepEqual(groups[3].items.map(item => item.name), ['TCLL+', 'TCLL-', 'TEG1', 'FH', 'TEG2', 'FakeBar', 'OLL', 'PBL']);
});

test('last-slot and EG groups use numeric/explicit order independent of input order', () => {
  const groups = groupTwoByTwoCategories([...backendNames].reverse().map(name => ({ name })));
  assert.deepEqual(groups[0].items.map(item => item.name), lastSlot);
  assert.deepEqual(groups[1].items.map(item => item.name), ['CLL', 'EG1', 'EG2', 'LEG']);
  assert.deepEqual(groups[2].items.map(item => item.name), ['CBL']);
  assert.deepEqual(groups[3].items.map(item => item.name), ['PBL', 'OLL', 'FakeBar', 'TEG2', 'FH', 'TEG1', 'TCLL-', 'TCLL+']);
});

test('legacy LS and normalized category names retain original spelling and identity', () => {
  const items = [' eg2 ', ' ls9 ', 'LS', 'eg1', 'egls2', 'cll', 'leg', 'egls1', 'LS1', ' cbl '].map(name => ({ name }));
  const groups = groupTwoByTwoCategories(items);
  assert.deepEqual(groups.map(group => group.items.map(item => item.name)), [
    ['LS', 'LS1', ' ls9 ', 'egls1', 'egls2'], ['cll', 'eg1', ' eg2 ', 'leg'], [' cbl '],
  ]);
  assert.ok(groups.flatMap(group => group.items).every(item => items.includes(item)));
  assert.deepEqual(groupTwoByTwoCategories([]), []);
});

test('unknown names and lookalikes stay in other in original order', () => {
  const names = ['Unknown category', 'TCLL+', 'TCLL-', 'TEG1', 'TEG2', 'FakeBarfoo', 'LS10', 'EGLS3', 'LS1foo'];
  const groups = groupTwoByTwoCategories(names.map(name => ({ name })));
  assert.deepEqual(groups.map(group => group.id), ['other']);
  assert.deepEqual(groups[0].items.map(item => item.name), names);
  for (const name of names) assert.equal(usesTwoByTwo3D(name), false, name);
});

test('native matching shares class/set/group boundaries and never affects 3x3', () => {
  for (const name of [...nativeNames, 'fake bar', 'fake_bar', 'fake-bar', ' ls9 ', 'egls2']) {
    for (let position = 0; position < 3; position++) {
      const labels = ['', '', ''];
      labels[position] = name;
      assert.equal(usesTwoByTwo3D(...labels), true, JSON.stringify(labels));
      assert.equal(isTwoLayerPBL('2x2x2', ...labels), true);
      assert.equal(prefersLastLayer('2x2x2', ...labels), false);
      assert.equal(isTwoLayerPBL('3x3x3', ...labels), false);
      assert.equal(resolvePuzzle('333', name), '3x3x3');
    }
  }
  for (const name of ['CLL', 'EG1', 'EG2', 'LEG', 'CBL', 'TCLL+', 'TEG1', 'FakeBarfoo', 'LS10', 'EGLS12', 'XLS1', 'PBLfoo']) {
    assert.equal(usesTwoByTwo3D(name), false, name);
    assert.equal(isTwoLayerPBL('2x2x2', name, '', ''), false, name);
  }
});

test('native LS formula and equivalent scramble use the same prepared state path', async () => {
  for (const classId of ['LS', 'LS1', 'LS9', 'EGLS1', 'EGLS2', 'FakeBar']) {
    const puzzle = resolvePuzzle('222', classId);
    assert.equal(puzzle, '2x2x2');
    assert.equal(isTwoLayerPBL(puzzle, classId, '', ''), true);
    const formula = await preparePuzzle(puzzle, "R U R' U'", "U R U' R'", 'formula');
    const scramble = await preparePuzzle(puzzle, "R U R' U'", "U R U' R'", 'scramble');
    assert.equal(formula.setup, scramble.setup);
    assert.ok(formula.pattern.isIdentical(scramble.pattern), classId);
    assert.equal(formula.alg, scramble.alg);
    assert.ok(formula.pattern.applyAlg(formula.alg).isIdentical(formula.kpuzzle.defaultPattern()));
  }
});
