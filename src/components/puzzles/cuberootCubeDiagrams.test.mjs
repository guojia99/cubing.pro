import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const bundle = await build({
  stdin: { resolveDir: root, contents: `
    export * from './src/components/puzzles/cuberootCubeDiagrams';
    export * from './src/components/puzzles/model';
    export * from '@cuberoot/visualcube';
    export * from '@cuberoot/visualcube/svg';
    export {makeStickerColors} from './src/vendor/cuberoot/visualcube/src/cube/stickers';
  ` },
  bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'diagram-proof-counts', setup(builder) {
    builder.onLoad({ filter: /\/cuberootCubeDiagrams\.ts$/ }, async ({ path }) => ({
      loader: 'ts',
      contents: (await readFile(path, 'utf8'))
        .replace('const proof = new CubeData', 'diagramChecks.proofs++; const proof = new CubeData')
        .replace('const native = solved.applyAlg(alg);', 'diagramChecks.setups++; const native = solved.applyAlg(alg);')
        + `\nexport const diagramChecks = { proofs: 0, setups: 0,
          cacheSizes: () => [...provenActions.values()].map(cache => cache.size),
        };`,
    }));
  } }, { name: 'native-cubing', setup(builder) {
    builder.onResolve({ filter: /^cubing\// }, ({ path }) => ({ path: import.meta.resolve(path), external: true }));
  } }],
});
const loaded = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);
const api = { ...loaded, async renderCubeDiagram(...args) {
  try { return await loaded.renderCubeDiagram(...args); }
  catch (error) { error.stack = error.message; throw error; }
}, async preparePuzzle(...args) {
  try { return await loaded.preparePuzzle(...args); }
  catch (error) { error.stack = error.message; throw error; }
} };
const colors = { U: '#ffdd00', R: '#00a651', F: '#e53935', D: '#ffffff', L: '#2266ff', B: '#ff8800' };
const sch = [...'URFDLB'].map(face => colors[face]).join(',');
const render = (puzzle, state, category) => api.renderCubeDiagram(puzzle, state, category, '', '', colors);
const expected = (size, setup, view, mask, ngs = false) => api.renderFromSimpleQuery({ cubeSize: size, size: 240, setup, view, mask, ngs, sch });

// First catalog algorithms from the local backend, kept offline for normal CI.
const bigCubeCatalog = [
  ['4x4 OLLP', 4, "Rw' U2' Rw U2 Rw U2' Rw2' F2 Rw' U2 Rw' U2' F2 Rw2 F2", 'oll', undefined, true],
  ['4x4 PLLP', 4, '2R2 U2 2R2 Uw2 2R2 Uw2', 'pll'],
  ['5x5 L2E', 5, "Rw' U' R' U R' F R F' Rw", 'iso'],
  ['5x5 L2C', 5, "U2 Rw U Rw' U Rw U2 Rw'", 'pll', 'center', true],
  ['6x6 L2E', 6, "2R' U2 2L F2 2L' F2 2R2 U2 2R U2 2R' U2 F2 2R2 F2", 'iso'],
  ['6x6 L2C', 6, "3L' U 3R U' 3L U 3R'", 'pll', 'center', true],
  ['LCE', 5, "M' U2 M", 'iso'],
];

for (const [category, n, formula, view, mask, ngs] of bigCubeCatalog) {
  test(`bigCube/${category}: first catalog algorithm resolves, prepares and renders finite SVG`, async () => {
    const puzzle = api.resolvePuzzle('bigCube', category);
    assert.equal(puzzle, `${n}x${n}x${n}`);
    const state = await api.preparePuzzle(puzzle, formula, '', 'formula');
    assert.equal(state.warning, undefined);
    const svg = await render(puzzle, state, category);
    assert.ok(/^<svg\b/.test(svg) && !/NaN|Infinity|unsupported/i.test(svg), 'finite supported SVG');
    const setup = [...api.parsePuzzleAlg(state.setup, puzzle, 'setup').experimentalLeafMoves()]
      .map(move => n === 5 && move.quantum.family === 'M' ? `3L${move.amount < 0 ? "'" : ''}` : move.toString()).join(' ');
    assert.ok(svg === expected(n, setup, view, mask, ngs), `${category}: independent vendor preset and mask`);
  });
}

test('PLL catalog grip arrows produce the same finite SVG as explicit separated moves', async () => {
  const formula = "U↑ l2 B2 l' U' l B2 l' U l' U'";
  const state = await api.preparePuzzle('3x3x3', formula, '', 'formula');
  const clean = await api.preparePuzzle('3x3x3', "U l2 B2 l' U' l B2 l' U l' U'", '', 'formula');
  const svg = await render('3x3x3', state, 'PLL');
  assert.equal(state.warning, undefined);
  assert.deepEqual(state.pattern.patternData, clean.pattern.patternData);
  assert.ok(svg === await render('3x3x3', clean, 'PLL'), 'grip marks cannot alter diagram state');
  assert.ok(/^<svg\b/.test(svg) && !/NaN|Infinity|unsupported/i.test(svg));
});

// PUZZLE_BACKEND_URL=http://127.0.0.1:20000/v3/cube-api node --test --test-name-pattern='local backend' src/components/puzzles/cuberootCubeDiagrams.test.mjs
test('local backend catalog, first cases and all case formulas render without fallback', {
  skip: !process.env.PUZZLE_BACKEND_URL,
}, async t => {
  const base = process.env.PUZZLE_BACKEND_URL.replace(/\/$/, '');
  const get = async path => {
    const response = await fetch(base + path, {signal: AbortSignal.timeout(15000)});
    assert.equal(response.status, 200, path);
    return response.json();
  };
  const catalog = await get('/public/algorithm/');
  const errors = [];
  let failures = 0, checked = 0;
  for (const [cube, category, n] of [
    ...bigCubeCatalog.map(([category, n]) => ['bigCube', category, n]), ['333', 'PLL', 3],
  ]) {
    const failuresBefore = failures;
    const item = catalog.ClassMap[cube].find(item => item.name === category);
    assert.ok(item?.alg, `${cube}/${category}: catalog algorithm`);
    const detail = await get(`/public/algorithm/${cube}/${encodeURIComponent(category)}`);
    const entries = detail.sets.flatMap(set => set.groups.flatMap(group => group.algs.map(alg => ({set, group, alg}))));
    assert.ok(entries.length > 0 && entries[0].alg.algs.length > 0, `${category}: first case exists`);
    const formulas = [{formula:item.alg, label:'catalog', setName:'', groupName:''},
      ...entries.flatMap(({set, group, alg}) => alg.algs.map((formula, index) => ({
        formula, label:`${set.name}/${group.name}/${alg.name}/${index}`, setName:set.name, groupName:group.name,
      })))];
    for (const {formula, label, setName, groupName} of formulas) {
      checked++;
      try {
        const puzzle = api.resolvePuzzle(cube, category);
        assert.equal(puzzle, `${n}x${n}x${n}`);
        const state = await api.preparePuzzle(puzzle, formula, '', 'formula');
        assert.equal(state.warning, undefined);
        const svg = await api.renderCubeDiagram(puzzle, state, category, setName, groupName, colors);
        assert.ok(/^<svg\b/.test(svg) && !/NaN|Infinity|unsupported/i.test(svg), 'finite supported SVG');
      } catch (error) {
        failures++;
        if (errors.length < 10) errors.push(`${cube}/${category}/${label}: ${formula}: ${error.message}`);
      }
    }
    t.diagnostic(`${cube}/${category}: ${entries.length} cases, ${formulas.length} formulas scanned, ${failures - failuresBefore} errors`);
  }
  t.diagnostic(`${checked} formulas scanned; ${failures} errors (report capped at 10)`);
  assert.equal(failures, 0, errors.join('\n'));
});

for (let n = 2; n <= 7; n++) test(`${n}x${n}: all faces, wide, depth/range layers and rotations match native facelets`, async () => {
  const puzzle = `${n}x${n}x${n}`;
  const moves = ['U', 'R', 'F', 'D', 'L', 'B', 'x', 'y', 'z', 'Rw', 'u', 'f'];
  if (n > 2) moves.push('2R', '2U', '2F', '2-3Rw', '3Rw');
  if (n > 3) moves.push('3R', '3-4Uw', `${n - 1}Fw`);
  if (n > 3) for (const face of 'URFDLB') for (let depth = 2; depth < n; depth++) {
    moves.push(`${depth}${face}`, `${depth}${face}w`);
    for (let lower = 2; lower < depth; lower++) moves.push(`${lower}-${depth}${face}w`);
  }
  for (const family of ['U', 'R', 'F', 'D', 'L', 'B']) {
    moves.push(`${n}${family}w`, `${n}${family}`);
    if (n > 2) moves.push(`2-${n}${family}w`);
  }
  for (const move of moves) for (const suffix of ['', "'", '2', "2'", '0', '5']) {
    const kpuzzle = await api.puzzleLoader(puzzle).kpuzzle();
    try { kpuzzle.moveToTransformation(`${move}${suffix}`); }
    catch {
      await assert.rejects(api.preparePuzzle(puzzle, '', `${move}${suffix}`, 'scramble'));
      continue;
    }
    const state = await api.preparePuzzle(puzzle, '', `${move}${suffix}`, 'scramble');
    if (n > 3 && /^[xyz]$/.test(move) && suffix === '0') {
      // PG's rotation lookup treats zero as one; reject that native/vendor
      // disagreement rather than quietly drawing a different state.
      await assert.rejects(render(puzzle, state, ''), /action mismatch/);
      continue;
    }
    const svg = await render(puzzle, state, '');
    assert.match(svg, /^<svg\b/);
    assert.doesNotMatch(svg, /NaN|Infinity/);
  }
  const kpuzzle = await api.puzzleLoader(puzzle).kpuzzle();
  const sequence = moves.filter(move => { try { kpuzzle.moveToTransformation(move); return true; } catch { return false; } }).join(' ');
  const state = await api.preparePuzzle(puzzle, '', sequence, 'scramble');
  await render(puzzle, state, '');
  // Mixed positions expose permutations invisible when turning a solved face
  // of identical colors. Deterministic walks verify every prefix as a state.
  const supported = moves.filter(move => { try { kpuzzle.moveToTransformation(move); return true; } catch { return false; } });
  let seed = n;
  let walk = '';
  for (let i = 0; i < 32; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    walk += ` ${supported[seed % supported.length]}${i % 3 === 0 ? "'" : i % 3 === 1 ? '2' : ''}`;
    await render(puzzle, await api.preparePuzzle(puzzle, '', walk, 'scramble'), i % 2 ? 'OLL' : 'L2E');
  }
});

test('3x3 slices and bounded compound/comment setup, source precedence and mismatch rejection', async () => {
  const state = await api.preparePuzzle('3x3x3', 'F', "[R,U] [F: M E S] (Rw U2')2 // R F ignored\ny' .", 'scramble');
  assert.equal(await render('3x3x3', state, 'PLL'), expected(3, [...(api.parsePuzzleAlg(state.setup, '3x3x3', 'setup')).experimentalLeafMoves()].map(m => m.modified({ amount: ((m.amount % 4) + 4) % 4 }).toString()).join(' '), 'pll'));
  const inverse = await api.preparePuzzle('3x3x3', 'R U', 'F', 'formula');
  assert.equal(await render('3x3x3', inverse, 'PLL'), expected(3, "U' R'", 'pll'));
  await assert.rejects(render('3x3x3', { ...inverse, setup: 'F' }, 'PLL'), /setup\/pattern mismatch/);
  await assert.rejects(render('3x3x3', { ...inverse, setup: '(R)4001' }, 'PLL'), /4000 leaves/);
  await assert.rejects(render('3x3x3', { ...inverse, setup: 'Q' }, 'PLL'));
});

test('odd-order M/E/S prove central-layer translations; even-order native slices still reject', async () => {
  for (const n of [4, 5, 6, 7]) for (const move of ['M', 'E', 'S']) {
    const puzzle = `${n}x${n}x${n}`;
    if (n % 2 === 0) await assert.rejects(api.preparePuzzle(puzzle, '', move, 'scramble'), /Bad grip/);
    else {
      const face = { M: 'L', E: 'D', S: 'F' }[move];
      const layer = (n + 1) / 2;
      for (const suffix of ['', "'", '2', "2'", '0', '5']) {
        const setup = `R U ${move}${suffix} F 2R'`;
        const state = await api.preparePuzzle(puzzle, '', setup, 'scramble');
        // Independent vendor reference uses explicit central-layer notation.
        const amount = { '': '', "'": "'", '2': '2', "2'": '2', '5': '' }[suffix];
        const central = suffix === '0' ? '' : `${layer}${face}${amount}`;
        assert.equal(await render(puzzle, state, ''), expected(n, `R U ${central} F 2R'`, 'pll'), `${puzzle} ${move}${suffix}`);
      }
      const setup = `${move} ${move}'`;
      await render(puzzle, await api.preparePuzzle(puzzle, '', setup, 'scramble'), '');
      const broad = new api.CubeData(n);
      const central = new api.CubeData(n);
      api.parseAlgorithm(move).forEach(turn => broad.turn(turn));
      api.parseAlgorithm(`${layer}${face}`).forEach(turn => central.turn(turn));
      assert.notDeepEqual(broad.faces, central.faces, 'raw vendor slice turns additional inner layers');
    }
  }
});

test('view decisions match vendor presets and never mutate prepared state', async () => {
  assert.equal(api.resolvePuzzle('333oh'), '3x3x3');
  const setup = "R U R' U' F2";
  const cases = [
    [2, 'EG', 'plan'], [2, 'PBL', 'plan'],
    [3, 'F2L', 'f2l'], [3, 'OLL', 'oll', undefined, true], [3, 'PLL', 'pll'],
    [3, 'COLL', 'pll', 'coll', true], [3, 'OH-CMLL', 'pll', 'cmll', true],
    [3, 'ZBLL', 'pll', 'coll'], [3, 'ZBLS', 'iso', 'vh'],
    [3, 'WV', 'pll', 'wv', true], [3, 'VLS', 'pll', 'wv', true],
    [4, 'PLLP', 'pll'], [4, '4x4 OLLP', 'oll', undefined, true],
    [5, '5x5 L2C', 'pll', 'center', true], [6, '6x6 L2C', 'pll', 'center', true],
    [5, 'LCE', 'iso'], [5, 'L2E', 'iso'], [6, 'L2E', 'iso'], [7, 'L2E', 'iso'],
    [5, 'L2CX', 'pll'], [6, 'OLLPX', 'pll'], [5, 'LCEX', 'pll'],
    [7, 'unknown', 'pll'], [3, 'F2LL PLLP', 'pll'],
  ];
  for (const [n, category, view, mask, ngs] of cases) {
    const puzzle = `${n}x${n}x${n}`;
    const state = await api.preparePuzzle(puzzle, '', setup, 'scramble');
    const before = JSON.stringify(state.pattern.patternData);
    assert.equal(await render(puzzle, state, category), expected(n, setup, view, mask, ngs), `${puzzle}/${category}`);
    assert.equal(JSON.stringify(state.pattern.patternData), before);
    assert.equal(state.setup, setup);
    assert.equal(await api.renderCubeDiagram(puzzle, state, '', category, '', colors), expected(n, setup, view, mask, ngs));
    assert.equal(await api.renderCubeDiagram(puzzle, state, '', '', category, colors), expected(n, setup, view, mask, ngs));
  }
});

test('piece-following COLL mask moves with corners rather than staying at fixed slots', () => {
  const options = api.buildSimpleOptions({ cubeSize: 3, setup: 'R', view: 'pll', mask: 'coll', sch });
  const after = api.makeStickerColors(options);
  const solved = api.makeStickerColors({ ...options, algorithm: '' });
  const moved = new api.CubeData(3, Object.fromEntries(api.AllFaces.map((face, i) => [face, solved.slice(i * 9, (i + 1) * 9)])));
  api.parseAlgorithm('R').forEach(turn => moved.turn(turn));
  assert.deepEqual(after, api.AllFaces.flatMap(face => moved.faces[face]));
  assert.notDeepEqual(after, solved);
});

test('empty identity has no upstream default Sune and palette is explicitly local', async () => {
  const state = await api.preparePuzzle('3x3x3', '', '', 'scramble', true);
  assert.equal(await render('3x3x3', state, 'OLL'), expected(3, '', 'oll', undefined, true));
  assert.match(await render('3x3x3', state, 'PLL'), /#ffdd00/i);
  await assert.rejects(api.renderCubeDiagram('skewb', state, '', '', '', colors), /Unsupported cube/);
});

test('7x7 repeated 4000-move benchmark matches direct vendor reference with bounded proofs', async t => {
  // Local before/after warm medians for 4000 alternating R/U actions:
  // original 138.50 ms; cached implementation ~11.4 ms. No timing threshold.
  // Unseen canonical amounts normalize to R/U in the vendor; no prior test
  // should warm these proof entries. Timing is diagnostic, never an assertion.
  const setup = 'R37 U41 '.repeat(2000).trim();
  const state = await api.preparePuzzle('7x7x7', '', setup, 'scramble');
  const reference = expected(7, 'R U '.repeat(2000).trim(), 'pll');
  const { proofs, setups } = api.diagramChecks;
  const samples = [];
  for (let i = 0; i < 8; i++) {
    const start = performance.now();
    const svg = await render('7x7x7', state, 'PLL');
    const elapsed = performance.now() - start;
    assert.equal(svg, reference);
    if (i) samples.push(elapsed);
  }
  samples.sort((a, b) => a - b);
  assert.equal(api.diagramChecks.proofs - proofs, 2, '4000 repeated moves prove only two new actions, reused across renders');
  assert.equal(api.diagramChecks.setups - setups, 8, 'each render evaluates the complete native setup');
  const solved = state.kpuzzle.defaultPattern();
  // R^4000 is solved. A skipped setup could wrongly accept the mixed pattern.
  const different = await api.preparePuzzle('7x7x7', '', 'F', 'scramble');
  await assert.rejects(render('7x7x7', { ...different, setup: '(R37)4000' }, 'PLL'), /setup\/pattern mismatch/);
  await assert.rejects(render('7x7x7', { ...state, setup: 'R37', pattern: solved }, 'PLL'), /setup\/pattern mismatch/);
  await assert.rejects(render('7x7x7', { ...state, setup: '(R37)4001' }, 'PLL'), /4000 leaves/);
  await assert.rejects(render('7x7x7', { ...state, setup: 'Q Q\'' }, 'PLL'));
  await assert.rejects(render('7x7x7', { ...state, setup: 'x0' }, 'PLL'), /action mismatch/);
  await assert.rejects(render('7x7x7', { ...state, setup: 'x0' }, 'PLL'), /action mismatch/);
  t.diagnostic(`7x7 4000 moves, warm median of ${samples.length}: ${samples[Math.floor(samples.length / 2)].toFixed(2)} ms (informational only)`);
});

test('cached actions still require final full vendor/native facelet agreement', async () => {
  const state = await api.preparePuzzle('7x7x7', '', 'R U', 'scramble');
  await render('7x7x7', state, 'PLL');
  const turn = api.CubeData.prototype.turn;
  const before = api.diagramChecks.proofs;
  try {
    api.CubeData.prototype.turn = () => {};
    await assert.rejects(render('7x7x7', state, 'PLL'), /Native\/vendor cube state mismatch/);
    assert.equal(api.diagramChecks.proofs, before, 'final state check runs even with warm proofs');
  } finally {
    api.CubeData.prototype.turn = turn;
  }
});

test('proof cache stays bounded and evicted actions are proved again', async () => {
  const setup = Array.from({ length: 300 }, (_, i) => `R${4 * i + 101}`).join(' ');
  const state = await api.preparePuzzle('7x7x7', '', setup, 'scramble');
  const before = api.diagramChecks.proofs;
  assert.equal(await render('7x7x7', state, 'PLL'), expected(7, 'R '.repeat(300).trim(), 'pll'));
  assert.equal(api.diagramChecks.proofs - before, 300);
  assert.ok(api.diagramChecks.cacheSizes().every(size => size <= 256));
  const first = await api.preparePuzzle('7x7x7', '', 'R101', 'scramble');
  const evicted = api.diagramChecks.proofs;
  await render('7x7x7', first, 'PLL');
  assert.equal(api.diagramChecks.proofs - evicted, 1);
});
