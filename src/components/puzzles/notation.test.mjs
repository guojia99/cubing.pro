import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { Alg } from 'cubing/alg';
import { cube2x2x2 as libraryCube2x2x2, puzzles } from 'cubing/puzzles';

// Notation/action regression tests, NOT proof of case names, diagrams or solving
// correctness. Inverse-then-forward recovery alone cannot establish those claims.
const bundle = await build({
  stdin: {
    contents: `export * from './model';
      export * from './libraryNotation';
      export * from './square1Notation';
      export * from './preferences';
      export {stripGripMarks} from '@cuberoot/shared/alg-notation';`,
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
  },
  bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'external-runtime', setup(builder) {
    builder.onResolve({ filter: /^(?:cubing\/|react$)/ }, ({ path }) => ({
      path: import.meta.resolve(path), external: true,
    }));
  } }],
});
const {
  resolvePuzzle, puzzleLoader, prefersLastLayer, isTwoLayerPBL, resolveStickering,
  parsePuzzleAlg, applyPuzzleAlg, preparePuzzle, inversePuzzleAlg,
  normalizeLibraryNotation, normalizeLibrarySetup, stripGripMarks,
  normalizeSquare1Notation, splitSquare1Annotation,
  CUBE_COLORS, CUBE_COLOR_HEX, DEFAULT_PUZZLE_PREFERENCES,
  normalizePuzzlePreferences, cubeFaceColors, puzzleFaceColors, readPuzzlePreferences,
} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);

async function assertAction(puzzle, formula, expected, domain = 'formula') {
  const kpuzzle = await puzzles[puzzle].kpuzzle();
  const actual = kpuzzle.algToTransformation(parsePuzzleAlg(formula, puzzle, domain));
  // Expected moves are native cubing notation, never passed through the adapter.
  const reference = kpuzzle.algToTransformation(new Alg(expected));
  assert.ok(actual.isIdentical(reference), `${puzzle}: ${formula} != ${expected}`);
  return actual;
}

test('cube grip marks separate moves in formulas and setups without accepting unknown arrows', async () => {
  const pll = "U↑ l2 B2 l' U' l B2 l' U l' U'";
  const cleanPLL = "U l2 B2 l' U' l B2 l' U l' U'";
  assert.equal(stripGripMarks('U↑R↓F·L'), 'U R F L');
  assert.equal(stripGripMarks('U→R'), 'U→R');
  for (let n = 2; n <= 7; n++) {
    const puzzle = `${n}x${n}x${n}`;
    for (const domain of ['formula', 'setup']) {
      for (const [raw, expected] of [...(n > 2 ? [[pll, cleanPLL]] : []), ['U↑R', 'U R'], ['U↓R·F', 'U R F']]) {
        await assertAction(puzzle, raw, expected, domain);
        assert.equal(parsePuzzleAlg(raw, puzzle, domain).toString(), expected);
      }
      assert.throws(() => parsePuzzleAlg('U→R', puzzle, domain), /./);
    }
  }
  const state = await preparePuzzle('3x3x3', pll, '', 'formula');
  const clean = await preparePuzzle('3x3x3', cleanPLL, '', 'formula');
  assert.equal(state.warning, undefined);
  assert.deepEqual(state.pattern.patternData, clean.pattern.patternData);
  assert.equal(state.setup, clean.setup);
  assert.notEqual(parsePuzzleAlg('U↑R', '3x3x3').toString(), 'UR');
});

test('cube lexical spacing preserves each standard move and its action in both parser domains', async () => {
  const cases = [
    ["U'D'", "U' D'"], ['UD', 'U D'], ['(U2)F', '(U2) F'], ['R2F', 'R2 F'],
    ['URFDLB', 'U R F D L B'], ['urfdlb', 'u r f d l b'],
    ['MESmesxyz', 'M E S m e s x y z'],
    ['2RU', '2R U'], ['3RwF', '3Rw F'], ["2-3Rw2'U", "2-3Rw2' U"],
    ["2R2'3Rw2'2-3Rw2'", "2R2' 3Rw2' 2-3Rw2'"],
    ["R'2F2'", "R2' F2'"], ["3Rw'2U'", "3Rw2' U'"],
  ];
  for (let n = 2; n <= 7; n++) {
    const puzzle = `${n}x${n}x${n}`;
    const kpuzzle = await puzzles[puzzle].kpuzzle();
    for (const domain of ['formula', 'setup']) {
      const normalize = domain === 'formula' ? normalizeLibraryNotation : normalizeLibrarySetup;
      for (const [raw, expected] of cases) {
        assert.equal(normalize(raw, puzzle), expected, `${puzzle}/${domain}: ${raw}`);
        assert.equal(parsePuzzleAlg(raw, puzzle, domain).toString(), new Alg(expected).toString());
        let referenceError;
        try { kpuzzle.algToTransformation(new Alg(expected)); } catch (error) { referenceError = error; }
        if (referenceError) {
          assert.throws(() => kpuzzle.algToTransformation(parsePuzzleAlg(raw, puzzle, domain)),
            { name: referenceError.name, message: referenceError.message }, raw);
        } else {
          await assertAction(puzzle, raw, expected, domain);
        }
      }
    }
  }
});

test('cube lexical spacing keeps groups, commutators, conjugates, repeats and comments intact', async () => {
  const cases = [
    ['(UD)2', '(U D)2'], ["(UD)2'F", "(U D)2' F"],
    ["(UD)'F", "(U D)' F"], ['(UD)0F', '(U D)0 F'],
    ['R(U2)F', 'R (U2) F'], ['(UD)(RF)', '(U D) (R F)'],
    ['[RU,FD]2L', '[R U,F D]2 L'], ['[RU:FD]L', '[R U:F D] L'],
    ["([RU:FD]UB)2'F", "([R U:F D] U B)2' F"],
    ['[R,[UD:RF]]', '[R,[U D:R F]]'], ['R..U', 'R . . U'],
    ['UD// NOT_A_MOVE → ↑↓· (UD)999999 [R:U]\nR2F',
      'U D // NOT_A_MOVE → ↑↓· (UD)999999 [R:U]\nR2 F'],
    ['// UD → (\n(UD)2// keep U\'D\'\nF', "// UD → (\n(U D)2 // keep U'D'\nF"],
  ];
  for (const domain of ['formula', 'setup']) {
    const normalize = domain === 'formula' ? normalizeLibraryNotation : normalizeLibrarySetup;
    for (const [raw, expected] of cases) {
      assert.equal(normalize(raw, '3x3x3'), expected, raw);
      assert.equal(normalize(expected, '3x3x3'), expected, 'normalization is idempotent');
      assert.equal(parsePuzzleAlg(raw, '3x3x3', domain).toString(), new Alg(expected).toString());
      await assertAction('3x3x3', raw, expected, domain);
    }
  }
});

test('cube lexical spacing leaves unknown text for the original parser or engine error', async () => {
  const kpuzzle = await puzzles['3x3x3'].kpuzzle();
  for (const domain of ['formula', 'setup']) {
    const normalize = domain === 'formula' ? normalizeLibraryNotation : normalizeLibrarySetup;
    for (const raw of ['NOT_A_MOVE', 'R NOT_A_MOVE U', 'Rgarbage', 'U→R', 'U*R',
      'R=U', 'R@U', 'R/p U', '[R2:@C>Q]', 'R{U}', 'R U+']) {
      assert.equal(normalize(raw, '3x3x3'), raw, raw);
      let original;
      try { kpuzzle.algToTransformation(new Alg(raw)); } catch (error) { original = error; }
      assert.ok(original instanceof Error, `native parser/engine must reject ${raw}`);
      assert.throws(() => kpuzzle.algToTransformation(parsePuzzleAlg(raw, '3x3x3', domain)),
        { name: original.name, message: original.message }, raw);
    }
    for (const raw of ['(UD', 'UD)', '[RU,FD', '[RU:FD', "R2''", '(UD)2-3', '(UD)2\'2']) {
      assert.throws(() => parsePuzzleAlg(raw, '3x3x3', domain), /./, raw);
    }
  }
  await assert.rejects(preparePuzzle('3x3x3', 'NOT_A_MOVE', '', 'formula'), /NOT_A_MOVE/);
  const fallback = await preparePuzzle('3x3x3', 'NOT_A_MOVE', 'U', 'formula');
  assert.match(fallback.warning, /NOT_A_MOVE/);
  assert.equal(fallback.alg, '');
  assert.equal(fallback.setup, 'U');
});

test('cube lexical spacing preserves the shared compact AST budget without expansion', () => {
  const original = Alg.prototype.experimentalLeafMoves;
  Alg.prototype.experimentalLeafMoves = function* () { assert.fail('budget must precede expansion'); };
  try {
    for (const domain of ['formula', 'setup']) {
      for (const raw of ['(UD)2000', '[UD,RF]500', '[UD:RF]666', '(.)4000', '(// UD\n)2000',
        '()4000', '(UD)0', `${'('.repeat(32)}UD${')'.repeat(32)}`]) {
        assert.doesNotThrow(() => parsePuzzleAlg(raw, '3x3x3', domain), raw);
      }
      for (const raw of ['(UD)2001', '[UD,RF]501', '[UD:RF]667', '(UD)4001\'',
        '(.)4001', '(// UD\n)4001', '(()4000)2', 'UD'.repeat(2001)]) {
        assert.throws(() => parsePuzzleAlg(raw, '3x3x3', domain), /4000 leaves/, raw);
      }
      assert.throws(() => parsePuzzleAlg(`${'('.repeat(33)}UD${')'.repeat(33)}`, '3x3x3', domain), /32 nesting/);
      for (const raw of ['(UD)9007199254740993', 'U9007199254740993D']) {
        assert.throws(() => parsePuzzleAlg(raw, '3x3x3', domain), /integer|amount/i, raw);
      }
      assert.doesNotThrow(() => parsePuzzleAlg(' '.repeat(23998) + 'UD', '3x3x3', domain));
      assert.throws(() => parsePuzzleAlg(' '.repeat(23999) + 'UD', '3x3x3', domain), /too long/);
    }
  } finally {
    Alg.prototype.experimentalLeafMoves = original;
  }
});

test('cube spacing normalizes parser state while leaving caller display records unchanged', async () => {
  const entry = Object.freeze({ formula: "U'D'(U2)FR2F", setup: '(UD)2R2F' });
  const expected = { formula: "U' D' (U2) F R2 F", setup: '(U D)2 R2 F' };
  for (const source of ['formula', 'scramble']) {
    const state = await preparePuzzle('3x3x3', entry.formula, entry.setup, source);
    const reference = await preparePuzzle('3x3x3', expected.formula, expected.setup, source);
    assert.equal(state.warning, undefined);
    assert.equal(state.alg, reference.alg);
    assert.equal(state.setup, reference.setup);
    assert.deepEqual(state.pattern.patternData, reference.pattern.patternData);
  }
  assert.deepEqual(entry, { formula: "U'D'(U2)FR2F", setup: '(UD)2R2F' });
});

test('cube lexical spacing never applies to other puzzle notation domains', () => {
  for (const normalize of [normalizeLibraryNotation, normalizeLibrarySetup]) {
    for (const puzzle of ['square1', 'sq1', 'megaminx', 'minx', '333', '2x3x4']) {
      for (const raw of ['UD', "U'D'", '(U2)F', 'R2F', 'U→R', 'U↑R']) {
        assert.equal(normalize(raw, puzzle), raw, `${puzzle}: ${raw}`);
      }
    }
    for (const puzzle of ['skewb', 'pyraminx', 'fto']) {
      for (const raw of ['UD', "U'D'", 'R2F', 'U→R', 'U↑R']) {
        assert.throws(() => normalize(raw, puzzle), /Unsupported/, `${puzzle}: ${raw}`);
      }
    }
  }
});

test('resolvePuzzle explicitly maps all nine library categories and category-specific orders', () => {
  const categories = [
    ['222', 'EG', '2x2x2'], ['333', 'PLL', '3x3x3'],
    ['333oh', 'OLL', '3x3x3'], ['megaminx', 'Megaminx PLL', 'megaminx'],
    ['skewb', 'Skewb NS', 'skewb'], ['sq1', 'CS', 'square1'],
    ['special', 'Pyraminx L4E', 'pyraminx'], ['special', 'FTO L3T', 'fto'],
    ['bigCube', 'PLLP', '4x4x4'], ['bigCube', 'L2E', '5x5x5'],
  ];
  // The special category has two explicitly supported puzzles, not a default.
  for (const [cube, classId, expected] of categories) {
    assert.equal(resolvePuzzle(cube, classId), expected, `${cube}/${classId}`);
  }
  for (const [cube, expected] of [
    ['2 x 2', '2x2x2'], ['3_3_3-OH', '3x3x3'], ['444', '4x4x4'],
    ['5x5', '5x5x5'], ['666', '6x6x6'], ['7x7x7', '7x7x7'],
    ['minx', 'megaminx'], ['square-1', 'square1'], ['pyram', 'pyraminx'], ['FTO', 'fto'],
  ]) assert.equal(resolvePuzzle(cube), expected, cube);
  assert.equal(resolvePuzzle('special', '金字塔 L4E'), 'pyraminx');
  assert.equal(resolvePuzzle('bigCube', ' pllp '), '4x4x4');
  for (const [cube, classId] of [
    ['unknown', 'PLL'], ['', 'FTO'], ['special', 'R U'], ['special', ''],
    ['bigCube', ''], ['bigCube', 'PLL'], ['bigCube', 'PLLP extra'], ['bigCube', '6x6 Rw'],
  ]) assert.equal(resolvePuzzle(cube, classId), null, `${cube}/${classId}`);
});

test('Skewb corner mapping and all four macros have the expanded single-move action', async () => {
  for (const [raw, native] of [
    ['F', 'F'], ['L', 'UL'], ['R', 'UR'], ['B', 'U'],
    ['r', 'R'], ['l', 'L'], ['b', 'B'], ['f', 'D'], ['d', 'D'],
  ]) await assertAction('skewb', raw, native);
  for (const [macro, expanded] of [
    ['S', "UR' F UR F'"], ['H', "F UR' F' UR"],
    ['s', "R' UR R UR'"], ['h', "UR R' UR' R"],
  ]) {
    const action = await assertAction('skewb', macro, expanded);
    assert.equal(action.isIdentityTransformation(), false, macro);
    await assertAction('skewb', `${macro}'`, new Alg(expanded).invert().toString());
    await assertAction('skewb', `${macro}2`, `${expanded} ${expanded}`);
    await assertAction('skewb', `${macro}2'`, new Alg(`${expanded} ${expanded}`).invert().toString());
    await assertAction('skewb', `${macro}''`, expanded);
  }
  await assertAction('skewb', "(S H') r", "UR' F UR F' UR' F UR F' R");
  const kpuzzle = await puzzles.skewb.kpuzzle();
  assert.equal(kpuzzle.algToTransformation(parsePuzzleAlg('R', 'skewb'))
    .isIdentical(kpuzzle.algToTransformation('R')), false, 'formula R is not standard setup R');
  await assertAction('skewb', 'U R L B', 'U R L B', 'setup');
  assert.throws(() => normalizeLibrarySetup('S', 'skewb'), /Unsupported/);
});

test('2x2 uses the native corner-only loader, single-top LL and PBL projection', async () => {
  assert.strictEqual(puzzleLoader('2x2x2'), libraryCube2x2x2);
  for (const puzzle of ['3x3x3', 'skewb', 'pyraminx', 'square1']) {
    assert.strictEqual(puzzleLoader(puzzle), puzzles[puzzle]);
  }
  const kpuzzle = await puzzleLoader('2x2x2').kpuzzle();
  assert.deepEqual(kpuzzle.definition.orbits, [{orbitName: 'CORNERS', numPieces: 8, numOrientations: 3}]);
  const svg = await puzzleLoader('2x2x2').svg();
  assert.equal(svg, await libraryCube2x2x2.svg());
  assert.doesNotMatch(svg, /(?:EDGES|CENTERS)-l/);
  assert.equal([...svg.matchAll(/id="CORNERS-l\d+-o\d+"/g)].length, 24);
  const ll = await puzzleLoader('2x2x2').llSVG();
  assert.equal(ll, await libraryCube2x2x2.llSVG());
  assert.doesNotMatch(ll, /(?:EDGES|CENTERS)-l/);
  assert.equal([...ll.matchAll(/<rect\s+id="CORNERS-l[0-3]-o0"/g)].length, 4, '2x2 top, not a 3x3 grid');
  assert.equal([...ll.matchAll(/<polygon\s+id="CORNERS-l[0-3]-o[12]"/g)].length, 8);
  assert.equal([...ll.matchAll(/<use id="CORNERS-l[4-7]-o[0-2]"/g)].length, 12);
  assert.match(ll, /<g style="opacity: 0">\s*<use id="CORNERS-l4-o0"/);
  const projection = (await puzzleLoader('2x2x2').pg()).generatesvg(800, 500, 10, true);
  assert.equal(projection, (await libraryCube2x2x2.pg()).generatesvg(800, 500, 10, true));
  assert.match(projection, /viewBox="0 0 800 500"/);
  assert.equal([...projection.matchAll(/<polygon id="CORNERS-l\d+-o\d+"/g)].length, 24);
  assert.notEqual(projection, svg, 'PBL projection is not the unfolded net');
  for (const [classId, expected] of [['EG', undefined], ['CLL', 'CLL'], ['PBL', 'PBL'], ['OBL', 'OBL']]) {
    assert.equal(resolvePuzzle('222', classId), '2x2x2');
    assert.equal(prefersLastLayer('2x2x2', classId, '', ''), classId !== 'PBL', classId);
    assert.equal(isTwoLayerPBL('2x2x2', classId, '', ''), classId === 'PBL', classId);
    assert.equal(resolveStickering(classId, '', ''), expected);
    if (expected) {
      assert.ok((await puzzleLoader('2x2x2').stickerings()).includes(expected));
      assert.deepEqual(await puzzleLoader('2x2x2').stickeringMask(expected),
        await libraryCube2x2x2.stickeringMask(expected));
    }
  }
  for (const labels of [['', '', ''], ['EG-1', '', ''], ['unknown', '', ''], ['', 'CLL', ''], ['PBLX', '', '']]) {
    assert.equal(prefersLastLayer('2x2x2', ...labels), true, JSON.stringify(labels));
    assert.equal(isTwoLayerPBL('2x2x2', ...labels), false, JSON.stringify(labels));
  }
  for (const labels of [[' pbl ', '', ''], ['', 'PBL', ''], ['', '', 'PBL'], ['EG', 'PBL case', '']]) {
    assert.equal(prefersLastLayer('2x2x2', ...labels), false, JSON.stringify(labels));
    assert.equal(isTwoLayerPBL('2x2x2', ...labels), true, JSON.stringify(labels));
    assert.equal(isTwoLayerPBL('3x3x3', ...labels), false, 'PBL projection applies only to 2x2');
  }
});

test('2x2 U/R/F inverse states match native corner indices, not just inverse recovery', async () => {
  const native = await libraryCube2x2x2.kpuzzle();
  for (const formula of ['U', 'R', 'F', 'R U F', "R U R' U'"]) {
    const expected = native.defaultPattern().applyAlg(new Alg(formula).invert());
    const state = await preparePuzzle('2x2x2', formula, 'U2', 'formula');
    assert.strictEqual(state.kpuzzle, native);
    assert.deepEqual(state.pattern.patternData, expected.patternData, formula);
    assert.equal(state.warning, undefined);
    assert.deepEqual(Object.keys(state.pattern.patternData), ['CORNERS']);
    const inverse = await inversePuzzleAlg(formula, '2x2x2');
    assert.deepEqual(native.defaultPattern().applyAlg(inverse).patternData, expected.patternData);
    const setup = await preparePuzzle('2x2x2', formula, 'U2', 'scramble');
    assert.deepEqual(setup.pattern.patternData, native.defaultPattern().applyAlg('U2').patternData);
    assert.notDeepEqual(state.pattern.patternData, setup.pattern.patternData);
  }
});

test('Pyraminx H/S macros preserve inverse, repeat, tips and visual grouping actions', async () => {
  for (const [macro, expanded] of [['S', "R' L R L'"], ['H', "L R' L' R"]]) {
    const action = await assertAction('pyraminx', macro, expanded);
    assert.equal(action.isIdentityTransformation(), false, macro);
    await assertAction('pyraminx', `${macro}'`, new Alg(expanded).invert().toString());
    await assertAction('pyraminx', `${macro}2'`, new Alg(`${expanded} ${expanded}`).invert().toString());
  }
  await assertAction('pyraminx', "(S) u l' H", "R' L R L' u l' L R' L' R");
  assert.equal(normalizeLibraryNotation('S', 'pyram'), "R' L R L'");
  assert.throws(() => normalizeLibrarySetup('H', 'pyraminx'), /Unsupported/);
});

test('FTO CIF/EIF brace samples retain independently checked native actions', async () => {
  // Short action fixtures from the local fto-proof.mjs oracle: ALLG-ImageGen
  // dbd5a7fd and cuberoot.me 68c0592c, checked against cubing 0.63.3.
  // Keep expectations literal; do not import its network/API audit at test time.
  const samples = [
    ['{U,F} H S', "R B' R' B R' L R L'"],
    ['{U,L} R L B F Bl Br D U', 'F BL BR L B R D U'],
    ['{U,L} H S', "F U' F' U Fv F' U F U' Fv'"],
    ['{U,L} Rs Ls Us Fs', '2F 2BL 2U 2L'],
    ['{U,L} Rw', 'F 2F'],
    ['{U,L} R {U,R} R', 'F R'],
    ['{R,U} R', "T' F"],
    ['{F,U} S', "Rv Uv R' L R L'"],
    ['[U] {U, Br} (R U)', 'U Uv R U'],
  ];
  for (const [raw, expected] of samples) await assertAction('fto', raw, expected);
});

test('FTO single, wide, slice, rotation and macro actions remain distinct', async () => {
  for (const [raw, expected] of [
    ['Bl Br', 'BL BR'], ['bl br', 'BL 2BL BR 2BR'],
    ['Rw', 'R 2R'], ['Rs', '2R'], ['xr xl y z t', 'Rv Lv Uv Fv T'],
    ['H', "R B' R' B"], ['Z', "R B' R' B"], ['S', "R' L R L'"],
    ["H2'", "B' R B R' B' R B R'"],
  ]) await assertAction('fto', raw, expected);
  const single = await assertAction('fto', 'Bl', 'BL');
  const wide = await assertAction('fto', 'bl', 'BL 2BL');
  assert.equal(single.isIdentical(wide), false, 'Bl must not become BLw');
  await assertAction('fto', 'Bl Br', 'BL BR', 'setup');
  for (const raw of ['{U,L} R', 'H', 'S', 'Rw', 'Rs', 'xr']) {
    assert.throws(() => normalizeLibrarySetup(raw, 'fto'), /Unsupported/, raw);
  }
});

test('special-puzzle parsers consume the entire input and reject unknown or malformed notation', () => {
  for (const puzzle of ['skewb', 'pyraminx', 'fto']) {
    for (const raw of [
      'R unknown U', 'R /foo U', 'R . U', 'R // comment\nU',
      'R (cancel)', 'R (U', 'R U)', 'R0', 'R4001', 'R9007199254740993',
      'R2garbage', '[R,U]', 'R: U', 'toString', 'constructor',
    ]) assert.throws(() => parsePuzzleAlg(raw, puzzle), /Unsupported|4000|integer/i, `${puzzle}: ${raw}`);
  }
  for (const raw of ['{U,D}', '{U,U}', '{U,unknown}', '{U,F', '(U]', '[U', 'U]']) {
    assert.throws(() => parsePuzzleAlg(raw, 'fto'), /Unsupported/, raw);
  }
  assert.equal(normalizeLibraryNotation(' ( R\u2019\u00a0U ) ', 'pyraminx'), "R' U");
  // Ordinary cube notation remains for cubing's parser, not silently cleaned.
  assert.equal(normalizeLibraryNotation('R unknown U', '333'), 'R unknown U');
});

test('notation limits accept boundary inputs and reject excess input or macro expansion', () => {
  for (const puzzle of ['skewb', 'pyraminx', 'fto']) {
    assert.equal([...parsePuzzleAlg('R '.repeat(4000), puzzle).experimentalLeafMoves()].length, 4000);
    assert.equal([...parsePuzzleAlg('S1000', puzzle).experimentalLeafMoves()].length, 4000);
    assert.throws(() => parsePuzzleAlg('R '.repeat(4001), puzzle), /4000/);
    assert.throws(() => parsePuzzleAlg('S1001', puzzle), /4000/);
    assert.equal(normalizeLibraryNotation(' '.repeat(23999) + 'R', puzzle).length > 0, true);
    assert.throws(() => normalizeLibraryNotation(' '.repeat(24000) + 'R', puzzle), /24000/);
    assert.throws(() => parsePuzzleAlg(' '.repeat(24000) + 'R', puzzle), /too long/);
  }
  assert.equal([...parsePuzzleAlg('(0,0)2000', 'square1').experimentalLeafMoves()].length, 4000);
  for (const raw of ['(0,0)2001', '(U)4001', `${'('.repeat(33)}U${')'.repeat(33)}`, '(1,9007199254740993)']) {
    assert.throws(() => normalizeSquare1Notation(raw), /4000|32|integer/, raw);
  }
  assert.throws(() => normalizeSquare1Notation(' '.repeat(24001)), /24000/);
});

test('SQ1 direction labels retain exact display text while only the body supplies moves', async () => {
  for (const annotation of ['[B B]', '[ F   BR ]', '[]']) {
    const body = "/U'eD'";
    const raw = `  ${annotation}  ${body}`;
    assert.deepEqual(splitSquare1Annotation(raw), { annotation, formula: body });
    assert.equal(normalizeSquare1Notation(raw), normalizeSquare1Notation(body));
    const state = await preparePuzzle('square1', raw, '', 'formula');
    assert.equal(state.annotation, annotation);
    assert.equal(state.warning, undefined);
  }
  for (const raw of ['[x2] U', '[E2] U', '[U] U', '[unknown] U', 'U [B]', '[B] [B] U', 'U ?']) {
    assert.throws(() => parsePuzzleAlg(raw, 'square1'), /annotation|unknown|bracket/i, raw);
  }
});

test('SQ1 inverse setups are independently expected and physically cuttable', async () => {
  const formula = "[B B] /U'eD'";
  const expectedBody = '/ (-3,0) / (3,3) / (0,-3) /';
  const kpuzzle = await puzzles.square1.kpuzzle();
  const solution = parsePuzzleAlg(formula, 'square1');
  assert.ok(kpuzzle.algToTransformation(solution).isIdentical(kpuzzle.algToTransformation(expectedBody)));
  const expectedSetup = new Alg(expectedBody).invert();
  const setup = await inversePuzzleAlg(formula, 'square1');
  assert.ok(kpuzzle.algToTransformation(parsePuzzleAlg(setup, 'square1', 'setup'))
    .isIdentical(kpuzzle.algToTransformation(expectedSetup)));
  const pattern = applyPuzzleAlg(kpuzzle.defaultPattern(), expectedSetup, 'square1');
  assert.equal(pattern.isIdentical(kpuzzle.defaultPattern()), false);
  assert.ok(applyPuzzleAlg(pattern, solution, 'square1').isIdentical(kpuzzle.defaultPattern()));
  const prepared = await preparePuzzle('square1', formula, setup, 'scramble');
  assert.equal(prepared.annotation, '[B B]');
  assert.equal(prepared.warning, undefined);
  assert.ok(prepared.pattern.isIdentical(pattern));
  // KPuzzle permits this algebraic permutation, but its cut splits a corner.
  const illegal = parsePuzzleAlg('(-1,0) /', 'square1');
  assert.doesNotThrow(() => kpuzzle.defaultPattern().applyAlg(illegal));
  assert.throws(() => applyPuzzleAlg(kpuzzle.defaultPattern(), illegal, 'square1'), /Illegal Square-1 slice/);
  await assert.rejects(inversePuzzleAlg('/ (1,0)', 'square1'), /Illegal Square-1 slice/);
});

test('preferences enumerate exactly 24 distinct right-handed color orientations', () => {
  const opposites = { white: 'yellow', yellow: 'white', red: 'orange', orange: 'red', green: 'blue', blue: 'green' };
  // Looking at each chosen bottom: front colors cycle toward the right face.
  // This independent color-ring fixture detects mirrored schemes.
  const rightRings = {
    white: ['red', 'green', 'orange', 'blue'],
    yellow: ['red', 'blue', 'orange', 'green'],
    red: ['white', 'blue', 'yellow', 'green'],
    orange: ['white', 'green', 'yellow', 'blue'],
    green: ['white', 'red', 'yellow', 'orange'],
    blue: ['white', 'orange', 'yellow', 'red'],
  };
  const orientations = new Set();
  let count = 0;
  for (const bottom of CUBE_COLORS) for (const front of CUBE_COLORS) {
    const input = { bottom, front, view: 'auto' };
    if (bottom === front || opposites[bottom] === front) {
      assert.strictEqual(normalizePuzzlePreferences(input), DEFAULT_PUZZLE_PREFERENCES);
      continue;
    }
    const preferences = normalizePuzzlePreferences(input);
    assert.deepEqual(preferences, input);
    assert.ok(Object.isFrozen(preferences));
    const ring = rightRings[bottom];
    const right = ring[(ring.indexOf(front) + 1) % 4];
    const colors = cubeFaceColors(preferences);
    assert.deepEqual(colors, {
      D: CUBE_COLOR_HEX[bottom], U: CUBE_COLOR_HEX[opposites[bottom]],
      F: CUBE_COLOR_HEX[front], B: CUBE_COLOR_HEX[opposites[front]],
      R: CUBE_COLOR_HEX[right], L: CUBE_COLOR_HEX[opposites[right]],
    }, `${bottom}/${front}`);
    assert.equal(new Set(Object.values(colors)).size, 6);
    orientations.add(JSON.stringify(['U', 'D', 'F', 'B', 'R', 'L'].map(face => colors[face])));
    count++;
  }
  assert.equal(count, 24);
  assert.equal(orientations.size, 24);
});

test('invalid preferences return the same immutable default and valid view modes retain colors', () => {
  assert.deepEqual(DEFAULT_PUZZLE_PREFERENCES, { bottom: 'white', front: 'red', view: 'auto' });
  assert.ok(Object.isFrozen(DEFAULT_PUZZLE_PREFERENCES));
  for (const value of [
    undefined, null, false, 1, 'white', [], {},
    { bottom: 'white', front: 'red' },
    { bottom: 'WHITE', front: 'red', view: 'auto' },
    { bottom: 'white', front: 'pink', view: 'auto' },
    { bottom: 'white', front: 'white', view: 'auto' },
    { bottom: 'white', front: 'yellow', view: 'auto' },
    { bottom: 'white', front: 'red', view: '2d' },
    { bottom: 'white', front: 'red', view: 'auto', extra: true },
    Object.create({ bottom: 'white', front: 'red', view: 'auto' }),
  ]) {
    assert.strictEqual(normalizePuzzlePreferences(value), DEFAULT_PUZZLE_PREFERENCES);
    assert.deepEqual(cubeFaceColors(value), cubeFaceColors(DEFAULT_PUZZLE_PREFERENCES));
  }
  for (const view of ['auto', '2D', '3D']) {
    const input = { bottom: 'blue', front: 'orange', view };
    assert.deepEqual(normalizePuzzlePreferences(input), input);
    assert.deepEqual(cubeFaceColors(input), cubeFaceColors({ ...input, view: 'auto' }));
  }
  assert.strictEqual(readPuzzlePreferences(), DEFAULT_PUZZLE_PREFERENCES, 'server snapshot is stable');
  assert.strictEqual(readPuzzlePreferences(), DEFAULT_PUZZLE_PREFERENCES);
});

test('Skewb has an independent softer palette in every orientation without changing cube colors', () => {
  const standard = {white: '#ffffff', yellow: '#ffdd00', red: '#e53935', orange: '#ff8800', green: '#00a651', blue: '#2266ff'};
  const soft = {white: '#f2f0e8', yellow: '#d6b83f', red: '#c64d48', orange: '#d17c3a', green: '#388a61', blue: '#426fa6'};
  assert.deepEqual(CUBE_COLOR_HEX, standard, 'existing 3x3 palette remains exact');
  const rgb = hex => hex.slice(1).match(/../g).map(value => parseInt(value, 16));
  for (const color of CUBE_COLORS.filter(color => color !== 'white')) {
    const vivid = rgb(standard[color]), muted = rgb(soft[color]);
    assert.ok(Math.max(...muted) - Math.min(...muted) < Math.max(...vivid) - Math.min(...vivid), color);
    assert.ok(Math.max(...muted) < Math.max(...vivid), `${color} is less bright`);
  }
  let count = 0;
  for (const bottom of CUBE_COLORS) for (const front of CUBE_COLORS) {
    const input = {bottom, front, view: 'auto'};
    if (normalizePuzzlePreferences(input) === DEFAULT_PUZZLE_PREFERENCES) continue;
    const original = cubeFaceColors(input);
    const expected = Object.fromEntries(Object.entries(original).map(([face, hex]) => [
      face, soft[CUBE_COLORS.find(color => standard[color] === hex)],
    ]));
    for (const view of ['auto', '2D', '3D']) {
      const preferences = {...input, view};
      assert.deepEqual(puzzleFaceColors(preferences, 'skewb'), expected);
      for (const puzzle of [undefined, '2x2x2', '3x3x3', 'square1']) {
        assert.deepEqual(puzzleFaceColors(preferences, puzzle), original);
      }
    }
    assert.deepEqual(cubeFaceColors(input), original, 'Skewb lookup cannot mutate cube palette');
    count++;
  }
  assert.equal(count, 24);
});
