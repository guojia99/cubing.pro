import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';
import http from 'node:http';
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const bundle = await build({
  stdin: { resolveDir: root, contents: `
    export * from './src/components/puzzles/specialDiagrams';
    export * from './src/components/puzzles/model';
    export * from './src/components/puzzles/ftoNotation';
    export * from '@/vendor/puzzle-drawing/shared/src/skewb_pyramid_svg';
    export * from '@/vendor/puzzle-drawing/shared/src/fto_notation';
    export * from '@/vendor/puzzle-drawing/shared/src/sq1_notation';
    export * from '@/vendor/puzzle-drawing/puzzle-render-core/src/fto-eif-image';
    export * from '@/vendor/puzzle-drawing/puzzle-render-core/src/sq1-svg';
    export * from '@/vendor/puzzle-drawing/puzzle-render-core/src/support/sq1-stage-mask';
    export * from '@/vendor/puzzle-drawing/puzzle-render-core/src/iso-svg';
    export {MegaminxSimulator} from './src/vendor/puzzle-drawing/vendor-sr-puzzlegen/src/simulator/megaminx/megaminxSimulator';
    export {parseMegaminxAlgorithm} from './src/vendor/puzzle-drawing/vendor-sr-puzzlegen/src/algorithms/megaminx';
    export {default as PyraCube} from './src/vendor/puzzle-drawing/puzzle-render-core/src/engine/pyra/PyraCube';
    export * from './src/vendor/puzzle-drawing/puzzle-render-core/src/engine/pyra/pyraState';
    export {Vector3, Quaternion} from 'three';
  ` },
  bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'test-action-candidates', setup(builder) {
    builder.onLoad({filter:/specialDiagrams\.ts$/}, async ({path}) => ({
      contents: await readFile(path, 'utf8') + '\nexport {megaminxActions};', loader:'ts',
    }));
  } }, { name: 'external-runtime', setup(builder) {
    builder.onResolve({ filter: /^(cubing\/|three(?:\/|$))/ }, ({ path }) => ({ path: import.meta.resolve(path), external: true }));
  } }],
});
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);

async function nativeFaces(puzzle, slots) {
  const svg = await puzzles[puzzle].svg();
  const faces = new Map();
  let face;
  for (const match of svg.matchAll(/<g[^>]*>\s*<title>([^<]+)<\/title>|<g id="(U|D|F|B|R|L|BL|BR)"[^>]*>|<[^>]*id="([^" ]+-l\d+-o\d+)"[^>]*>/g)) {
    if (match[1] || match[2]) face = match[1] || match[2];
    else {
      const fill = /fill:\s*([^";]+)/.exec(match[0])?.[1];
      faces.set(match[3], puzzle === 'pyraminx' ? {limegreen:'F',red:'L','#26f':'R',yellow:'D'}[fill] : face);
    }
  }
  return slots.map(slot => faces.get(slot));
}

async function assertHomeFaces(puzzle, proof, upstreamFaces) {
  const native = await nativeFaces(puzzle, proof.slots);
  assert.ok(native.every(Boolean), 'every native oriented sticker has a home face');
  native.forEach((face, index) => assert.equal(face, upstreamFaces[proof.mapping[index]], `${puzzle} home palette ${proof.slots[index]}`));
}

// Build an equivariant bijection of ALL oriented stickers, not just a parsed
// string or alg+inverse recovery. Every generator must commute with the map.
async function proveActions(puzzle, pairs, vendorPermutation, upstreamHome) {
  const kpuzzle = await puzzles[puzzle].kpuzzle();
  const slots = [];
  const offsets = {};
  for (const orbit of kpuzzle.definition.orbits) {
    const n = orbit.orbitName === 'CENTERS' && puzzle !== 'fto' ? 1 : orbit.numOrientations;
    offsets[orbit.orbitName] = { offset: slots.length, n };
    for (let p = 0; p < orbit.numPieces; p++) for (let o = 0; o < n; o++) slots.push(`${orbit.orbitName}-l${p}-o${o}`);
  }
  const native = pairs.map(([move]) => {
    const data = kpuzzle.defaultPattern().applyAlg(move).patternData;
    return slots.map(id => {
      const [, orbit, p, o] = /^(.*)-l(\d+)-o(\d+)$/.exec(id);
      const { offset, n } = offsets[orbit];
      return offset + data[orbit].pieces[+p] * n + ((+o - data[orbit].orientation[+p]) % n + n) % n;
    });
  });
  const upstream = pairs.map(([, move]) => vendorPermutation(move));
  const home = upstreamHome ? await nativeFaces(puzzle, slots) : null;
  assert.equal(slots.length, upstream[0].length);
  const mapping = Array(slots.length).fill(-1);
  const used = new Set();
  for (let seed = 0; seed < slots.length; seed++) {
    if (mapping[seed] !== -1) continue;
    let found;
    for (let target = 0; target < slots.length && !found; target++) {
      if (used.has(target)) continue;
      if (home && home[seed] !== upstreamHome[target]) continue;
      const trial = new Map([[seed, target]]), reverse = new Map([[target, seed]]);
      const queue = [seed];
      let valid = true;
      for (let q = 0; q < queue.length && valid; q++) for (let g = 0; g < pairs.length; g++) {
        const a = native[g][queue[q]], b = upstream[g][trial.get(queue[q])];
        if (home && home[a] !== upstreamHome[b]) { valid = false; break; }
        if (mapping[a] !== -1 ? mapping[a] !== b : used.has(b)) { valid = false; break; }
        if (trial.has(a)) { if (trial.get(a) !== b) { valid = false; break; } }
        else if (reverse.has(b)) { valid = false; break; }
        else { trial.set(a, b); reverse.set(b, a); queue.push(a); }
      }
      if (valid) found = trial;
    }
    assert.ok(found, `${puzzle}: no sticker-action bijection at ${slots[seed]} (${pairs.map(p => p.join('=>')).join(', ')})`);
    for (const [a, b] of found) { mapping[a] = b; used.add(b); }
  }
  for (let g = 0; g < pairs.length; g++) {
    for (let s = 0; s < slots.length; s++) assert.equal(mapping[native[g][s]], upstream[g][mapping[s]], `${puzzle} ${pairs[g]}`);
  }
  return { slots, mapping, offsets, kpuzzle };
}

function skewbPermutation(alg) {
  const state = new api.SkewbStateWCA();
  state.image = state.image.map((row, f) => row.map((_, s) => 5 * f + s));
  state.applyAlgorithm(alg);
  return state.image.flat();
}

function ftoPermutation(alg) {
  let index = 0;
  const values = Object.fromEntries(api.FTO_EIF_FACE_KEYS.map(face => [face, null]));
  for (const face of api.FTO_EIF_FACE_KEYS) Object.defineProperty(values, face, { get: () => String(index++) });
  return Object.values(api.ftoEifStickerState(alg, values)).map(Number);
}

function megaPermutation(alg) {
  const simulator = new api.MegaminxSimulator();
  let index = 0;
  for (const [face, values] of Object.entries(simulator.getValues())) values.forEach((_, s) => simulator.setValue(face, s, String(index++)));
  simulator.alg(alg);
  return Object.values(simulator.getValues()).flat().map(Number);
}

test('Skewb native four WCA grips, Sarah grips, F/D and rotations act identically on 30 stickers', async () => {
  const proof = await proveActions('skewb', ['R','U','L','B','UL','UR','F','D','x','y','z'].map(m => [m,m]), skewbPermutation);
  await assertHomeFaces('skewb', proof, ['U','R','F','D','L','B'].flatMap(f => Array(5).fill(f)));
});

test('FTO EIF forward map is equivariant on all 72 stickers including slices and rotations', async () => {
  const pairs = ['U','D','F','B','R','L','Bl','Br','Us','Fs','Rs','Ls'].map(m => [api.normalizeFtoNotation(`{U,L} ${m}`), m]);
  pairs.push(['U 2U D\'', 'Uo'], ['L 2L BR\'', 'Fo'], ['F 2F B\'', 'Ro'], ['BL 2BL R\'', 'Lo'], ['T', 'Rt']);
  const faces = ['U','L','F','BL','D','B','R','BR'].flatMap(f => Array(9).fill(f));
  const proof = await proveActions('fto', pairs, ftoPermutation, faces);
  await assertHomeFaces('fto', proof, faces);
});

test('Megaminx expanded native faces, wide turns, slices and rotations match all 132 vendor stickers', async () => {
  const k = await puzzles.megaminx.kpuzzle();
  const actions = api.megaminxActions(k);
  assert.equal(api.megaminxActions(k), actions, 'candidate expansion is cached per native puzzle');
  const pairs = [...['U','F','R','L','BR','BL'].map(m => [m,m]), ['R++','R++ R++'], ['D++','D++ D++']];
  assert.deepEqual(api.parseMegaminxAlgorithm("y y' Br Bl"), [], 'vendor cannot consume these native grips directly');
  for (const family of [...Object.keys(k.definition.moves), 'Br','Bl','y','r','d']) for (const suffix of ['', "'", '2', "2'"]) {
    const native = family + suffix;
    const candidate = actions.find(c => c.action.isIdentical(k.moveToTransformation(native)));
    assert.ok(candidate, `fully consumed native action ${native}`);
    assert.match(candidate.token, /^(?:(?:U|F|R|L|BR|BL|R\+\+|D\+\+)(?: |$))*$/, 'only tokens supported by vendor parser');
    pairs.push([native, candidate.token]);
  }
  assert.ok(!k.moveToTransformation('Br').isIdentical(k.moveToTransformation('BR')));
  assert.ok(!k.moveToTransformation('Bl').isIdentical(k.moveToTransformation('BL')));
  const proof = await proveActions('megaminx', pairs, megaPermutation);
  const simulator = new api.MegaminxSimulator();
  const faces = Object.keys(simulator.getValues());
  const home = await nativeFaces('megaminx', proof.slots);
  for (const face of ['U','F','R','L','BR','BL']) {
    home.forEach((f, i) => { if (f === face) assert.equal(faces[Math.floor(proof.mapping[i] / 11)], face); });
  }
});

test('Pyraminx real engine geometry matches native actions on all 36 oriented stickers', async () => {
  const cube = new api.PyraCube();
  const baseRotation = cube.quaternion.clone();
  const meshes = [];
  cube.traverse(object => { if (object.userData.simRole === 'sticker') meshes.push(object); });
  function locations() {
    cube.updateMatrixWorld(true);
    return meshes.map(mesh => {
      const p = mesh.userData.schematicPoly;
      const center = new api.Vector3();
      for (let i = 0; i < p.length; i += 3) center.add(new api.Vector3(p[i],p[i+1],p[i+2]));
      center.multiplyScalar(3 / p.length).applyMatrix4(mesh.matrixWorld).applyQuaternion(baseRotation.clone().invert());
      const normal = mesh.userData.simStickerNormal.clone().transformDirection(mesh.matrixWorld).applyQuaternion(baseRotation.clone().invert());
      return [...center.toArray(), ...normal.toArray()];
    });
  }
  const home = locations();
  const permutation = alg => {
    cube.applyMovesInstant(api.parsePyraMoves(alg));
    const result = Array(36);
    for (const [source, location] of locations().entries()) {
      const target = home.findIndex(h => h.every((v,i) => Math.abs(v-location[i]) < 1e-4));
      assert.notEqual(target, -1, `engine sticker left the native slot lattice: ${alg}`);
      result[target] = source;
    }
    return result;
  };
  try {
    const faces = meshes.map(mesh => ['D','R','L','F'][mesh.userData.pyraFace]);
    const proof = await proveActions('pyraminx', ['U','L','R','B','u','l','r','b','D','y','Uv','Lv','Rv','Bv'].map(m => [m,m]), permutation, faces);
    await assertHomeFaces('pyraminx', proof, faces);
  } finally { cube.dispose(); }
});

test('SQ1 native slots map to upstream physical pieces after true single turns and slice', async () => {
  const k = await puzzles.square1.kpuzzle();
  const home = api.applySq1Scramble('').pieces;
  for (const setup of ['(1,0)','(0,1)','/','(1,0) /','/ (3,0) /','(3,-3) / (0,3) /']) {
    const native = k.defaultPattern().applyAlg(setup).patternData;
    assert.deepEqual(native.WEDGES.pieces.map(p => home[p]), api.applySq1Scramble(setup).pieces, setup);
    assert.equal(native.EQUATOR.orientation[1] === 0, api.applySq1Scramble(setup).sliceSolved, setup);
  }
});

test('render uses native prepared states, upstream stage masks/default palettes and strict failures', async () => {
  for (const [puzzle, formula] of [['skewb','H'], ['fto','Rw H'], ['pyraminx','S u2'], ['square1','/ (3,0) /']]) {
    const state = await api.preparePuzzle(puzzle, formula, '', 'formula');
    const svg = await api.renderSpecialDiagram(puzzle, state, '', {});
    assert.match(svg, /^<svg/);
    await assert.rejects(api.renderSpecialDiagram(puzzle, {...state, setup: ''}, '', {}), /mismatch/);
  }
  const state = await api.preparePuzzle('square1', '', '', 'scramble', true);
  const plain = await api.renderSpecialDiagram('square1', state, '', {});
  assert.match(plain, /fill="#FFFF00"/);
  assert.match(plain, /fill="#FFFFFF"/);
  for (const [stage, visible] of [['CO',8], ['EO',16], ['CP',32], ['EP',40], ['OBL',16]]) {
    const svg = await api.renderSpecialDiagram('square1', state, stage, {});
    assert.equal([...svg.matchAll(/data-sid=/g)].length, visible, stage);
  }
  const cs = await api.renderSpecialDiagram('square1', state, 'CS', {});
  assert.deepEqual([...new Set([...cs.matchAll(/fill="([^"]+)"/g)].map(m => m[1]))], ['#dddddd']);
  for (const [classId, setName, stage] of [['CPEP','CP','CP'], ['CPEP','EP','EP'], ['CO','EP','EP'], ['CPEP','','CPEP'], ['CP','','CP'], ['CO','','CO'], ['EO','','EO'], ['OBL','','OBL'], ['CS','','CS'], ['CSP','','CSP'], ['PARITY','','PARITY'], ['PBL','','PBL'], ['','','']]) {
    const ids = api.sq1StageHiddenStickerIds(stage);
    const colors = {U:'#123abc'};
    const palette = stage === 'CS' ? Object.fromEntries(['U','D','L','B','R','F'].map(f=>[f,'#dddddd'])) : colors;
    const svg = await api.renderSpecialDiagram('square1',state,classId,colors,setName);
    assert.equal(svg, api.renderSq1ScrambleSvg('',palette,{
      stickerIds:true,compactFaces:!['CS','CSP'].includes(stage),
      ...(ids ? {mask:{ids,color:'transparent'}} : {}),
    },!['CS','CSP','PARITY'].includes(stage) && !ids), `${classId}/${setName}: upstream plan`);
  }
  const co = await api.renderSpecialDiagram('square1', state, 'CO', {U:'#123abc',D:'#fedcba'});
  assert.match(co, /fill="#123abc"/);
  assert.match(co, /fill="#fedcba"/);
  assert.notEqual(co, await api.renderSpecialDiagram('square1', state, 'CO', {U:'#abcdef',D:'#654321'}));
  await assert.rejects(api.renderSpecialDiagram('3x3x3', state, '', {}), /Unsupported/);
  const skewb = await api.preparePuzzle('skewb', '', '', 'scramble', true);
  assert.match(await api.renderSpecialDiagram('skewb', skewb, '', {U:'#123abc'}), /fill="#123abc"/);
});

test('native single steps reach the matching upstream render, including inverse and repeated actions', async () => {
  const palette = {U:'#d6b83f',R:'#388a61',F:'#c64d48',D:'#f2f0e8',L:'#426fa6',B:'#d17c3a'};
  const polygonSlots = [[0,0],[2,0],[1,0],[5,0],[4,0],[1,1],[1,2],[1,4],[1,3],
    [0,3],[0,4],[0,2],[0,1],[2,1],[2,2],[2,4],[2,3],[5,1],[5,2],[5,4],[5,3],[4,1],[4,2],[4,4],[4,3]];
  for (const puzzle of ['skewb','pyraminx']) {
    const k = await puzzles[puzzle].kpuzzle();
    const families = puzzle === 'skewb' ? ['U','R','L','B','UL','UR','F','D','x','y','z'] : ['U','R','L','B','u','r','l','b','D','y','Lv','Rv','Bv'];
    for (const family of families) for (const suffix of ['', "'", '2', "2'"]) {
      const setup = family + suffix;
      const state = {kpuzzle:k,pattern:k.defaultPattern().applyAlg(setup),setup,alg:''};
      const svg = await api.renderSpecialDiagram(puzzle,state,'',{});
      if (puzzle === 'pyraminx') {
        const amount = [...new Alg(setup).experimentalLeafMoves()][0].amount;
        const turns = ((amount % 3) + 3) % 3;
        assert.ok(svg === api.renderPuzzleIsoSvg('pyraminx', turns ? family + (turns === 2 ? "'" : '') : '', undefined, 240), setup);
      } else {
        const upstream = new api.SkewbStateWCA();
        upstream.applyAlgorithm(setup);
        assert.ok(!svg.includes('<style>'));
        assert.equal([...svg.matchAll(/stroke="#000" stroke-width="0.5" stroke-linejoin="round"/g)].length, 25);
        assert.deepEqual([...svg.matchAll(/<polygon fill="([^"]+)"/g)].map(m=>m[1]),
          polygonSlots.map(([f,s])=>palette[['U','R','F','D','L','B'][upstream.image[f][s]]]), setup);
      }
    }
  }
  for (const [native, eif] of [['R','Br'], ['F','R'], ['2R',"Ls'"], ['2D',"Us'"], ['Rv',"Lo'"], ['Lv','Fo'], ['Uv','Uo'], ['Fv','Ro'], ['T','Rt']]) {
    const k = await puzzles.fto.kpuzzle();
    for (const amount of [1,-1,2,-2]) {
      const setup = native;
      const repeated = new Alg(`(${setup})${Math.abs(amount)}${amount < 0 ? "'" : ''}`);
      const state = {kpuzzle:k, pattern:k.defaultPattern().applyAlg(repeated), setup:`// cubing-pro:native\n${repeated}`, alg:''};
      const expected = Array(Math.abs(amount)).fill(amount < 0 ? new Alg(eif).invert().toString() : eif).join(' ');
      assert.ok(await api.renderSpecialDiagram('fto', state, '', {}) === api.renderFtoEifSvg(expected), `${native} * ${amount}`);
    }
  }
  for (const puzzle of ['skewb','pyraminx']) {
    const k = await puzzles[puzzle].kpuzzle();
    const bad = puzzle === 'skewb' ? 'Rv' : '2r';
    const state = {kpuzzle:k, pattern:k.defaultPattern().applyAlg(bad), setup:bad, alg:''};
    await assert.rejects(api.renderSpecialDiagram(puzzle, state, '', {}), /Unsupported/);
  }
  const state = await api.preparePuzzle('skewb','','','scramble',true);
  for (const setup of ['R unknown', '(.)5000000', 'R ?']) {
    await assert.rejects(api.renderSpecialDiagram('skewb',{...state,setup},'',{}));
  }
});

test('browser SVGs isolate Skewb strokes, apply SQ1 palettes/stages and preserve Mega Br/Bl/y actions', async () => {
  const browserBundle = await build({
    stdin: {resolveDir:root, contents:`
      import {preparePuzzle} from './src/components/puzzles/model';
      import {renderSpecialDiagram} from './src/components/puzzles/specialDiagrams';
      import {SVG, VisualizerType} from '@/vendor/puzzle-drawing/vendor-sr-puzzlegen/src/index';
      import {puzzles} from 'cubing/puzzles';
      import {renderSq1ScrambleSvg} from '@/vendor/puzzle-drawing/puzzle-render-core/src/sq1-svg';
      import {sq1StageHiddenStickerIds} from '@/vendor/puzzle-drawing/puzzle-render-core/src/support/sq1-stage-mask';
      window.api = {preparePuzzle, renderSpecialDiagram, SVG, VisualizerType, puzzles, renderSq1ScrambleSvg, sq1StageHiddenStickerIds};
    `}, bundle:true, write:false, format:'iife', platform:'browser',
  });
  const server = http.createServer((request,response) => {
    if (request.url === '/bundle.js') { response.setHeader('Content-Type','text/javascript'); response.end(browserBundle.outputFiles[0].contents); }
    else { response.setHeader('Content-Type','text/html'); response.end('<!doctype html><script src="/bundle.js"></script>'); }
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({headless:true});
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const result = await page.evaluate(async () => {
      const {preparePuzzle,renderSpecialDiagram,SVG,VisualizerType,puzzles,renderSq1ScrambleSvg,sq1StageHiddenStickerIds} = window.api;
      const failures = [];
      const mega = document.createElement('div');
      SVG(mega,VisualizerType.MEGAMINX_TOP,{width:240,height:240,puzzle:{alg:'R U'}});
      document.body.append(mega);
      const strokes = host => [...host.querySelectorAll('polygon')].map(p => {
        const css = getComputedStyle(p);
        return [css.stroke,css.strokeWidth,css.strokeLinejoin];
      });
      const before = strokes(mega);
      for (const puzzle of ['skewb','square1','fto','pyraminx','megaminx']) {
        const state = await preparePuzzle(puzzle,'','','scramble',true);
        const markup = await renderSpecialDiagram(puzzle,state,'',{});
        const host = document.createElement('div');
        host.innerHTML = markup;
        document.body.append(host);
        if (!host.querySelector('svg') || host.querySelector('parsererror')) failures.push(puzzle);
      }
      if (JSON.stringify(strokes(mega)) !== JSON.stringify(before)) failures.push('Skewb polluted Mega computed strokes');
      const skewb = [...document.querySelectorAll('svg')].find(svg=>svg.querySelectorAll('polygon').length===25);
      if (!skewb || skewb.querySelector('style') || strokes(skewb).some(s=>s[0]!=='rgb(0, 0, 0)' || s[1]!=='0.5px' || s[2]!=='round')) failures.push('Skewb local strokes');
      const sq1 = await preparePuzzle('square1','','','scramble',true);
      const mountSq1 = async (stage,colors,setName='') => {
        const host=document.createElement('div');
        host.innerHTML=await renderSpecialDiagram('square1',sq1,stage,colors,setName);
        document.body.append(host);
        return host;
      };
      const co1=await mountSq1('CO',{U:'#123abc',D:'#fedcba'});
      const co2=await mountSq1('CO',{U:'#abcdef',D:'#654321'});
      const faceColors=host=>[...host.querySelectorAll('[data-sid]')].map(p=>getComputedStyle(p).fill);
      if (!faceColors(co1).includes('rgb(18, 58, 188)') || !faceColors(co1).includes('rgb(254, 220, 186)') || JSON.stringify(faceColors(co1))===JSON.stringify(faceColors(co2))) failures.push('CO palette updates');
      const cp=await mountSq1('CPEP',{U:'#123abc'},'CP');
      const referenceCp=renderSq1ScrambleSvg('',{U:'#123abc'},{stickerIds:true,compactFaces:true,mask:{ids:sq1StageHiddenStickerIds('CP'),color:'transparent'}},false);
      const referenceCpHost=document.createElement('div');
      referenceCpHost.innerHTML=referenceCp;
      if(cp.innerHTML!==referenceCpHost.innerHTML || cp.querySelectorAll('[data-sid]').length!==32 || cp.querySelector('rect')) failures.push('CP mask/compactFaces/middle');
      const cpep=await mountSq1('CPEP',{});
      if(cpep.querySelectorAll('[data-sid]').length!==40 || !cpep.querySelector('rect')) failures.push('CPEP must remain whole');
      const k = await puzzles.megaminx.kpuzzle();
      const fills = svg => [...svg.querySelectorAll('polygon')].map(p => [p.getAttribute('fill'),p.getAttribute('points')]);
      const uAxis='U D++ D++ D++ D++', lAxis='L R++ R++ R++ R++';
      const inverse=alg=>alg.split(' ').reverse().flatMap(t=>Array(4).fill(t)).join(' ');
      const wide=rotation=>`${rotation} D++ ${inverse(rotation)}`;
      for (const [native,converted] of [
        ['R++','R++ R++'], ['D++','D++ D++'], ['R--','R++ R++ R++'],
        ['D--','D++ D++ D++'], ["R++ U2' D-- R'",'R++ R++ U U U D++ D++ D++ R R R R'],
        ['y','U D++ D++ D++ D++'], ["y'",'D++ U U U U'],
        ['Br',wide(`${uAxis} ${lAxis} ${lAxis}`)],
        ['Bl',wide(`${uAxis} ${uAxis} ${lAxis} ${lAxis}`)],
        ["Br' U Bl2 y' R",`${inverse(wide(`${uAxis} ${lAxis} ${lAxis}`))} U ${wide(`${uAxis} ${uAxis} ${lAxis} ${lAxis}`)} ${wide(`${uAxis} ${uAxis} ${lAxis} ${lAxis}`)} D++ U U U U R`],
      ]) {
        const state = {kpuzzle:k,pattern:k.defaultPattern().applyAlg(native),setup:native,alg:''};
        const actual = document.createElement('div');
        actual.innerHTML = await renderSpecialDiagram('megaminx',state,'',{});
        const reference = document.createElement('div');
        SVG(reference,VisualizerType.MEGAMINX_TOP,{width:240,height:240,puzzle:{alg:converted}});
        if (!actual.querySelector('polygon')) failures.push('empty mega');
        if (JSON.stringify(fills(actual)) !== JSON.stringify(fills(reference))) failures.push(native);
      }
      for(const bad of ['y garbage','Br ?','R (.)5000000']) {
        let rejected=false;
        try { await renderSpecialDiagram('megaminx',{kpuzzle:k,pattern:k.defaultPattern(),setup:bad,alg:''},'',{}); } catch {rejected=true;}
        if(!rejected) failures.push('partially consumed '+bad);
      }
      for (const [formula,converted] of [['Br',wide(`${uAxis} ${lAxis} ${lAxis}`)], ['Bl',wide(`${uAxis} ${uAxis} ${lAxis} ${lAxis}`)], ['y',uAxis]]) {
        const prepared=await preparePuzzle('megaminx',formula,'','formula');
        const actual=document.createElement('div');
        actual.innerHTML=await renderSpecialDiagram('megaminx',prepared,'',{});
        const reference=document.createElement('div');
        SVG(reference,VisualizerType.MEGAMINX_TOP,{width:240,height:240,puzzle:{alg:inverse(converted)}});
        if(JSON.stringify(fills(actual))!==JSON.stringify(fills(reference))) failures.push('prepared '+formula);
      }
      return failures;
    });
    assert.deepEqual(result, []);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
