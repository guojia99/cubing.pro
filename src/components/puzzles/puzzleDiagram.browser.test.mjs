import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

// node src/components/puzzles/puzzleDiagram.browser.test.mjs
// PUZZLE_BROWSER_TOOLS optionally points to an external Playwright/esbuild install.
const require = createRequire(process.env.PUZZLE_BROWSER_TOOLS
  ? `${process.env.PUZZLE_BROWSER_TOOLS}/package.json` : import.meta.url);
const { chromium } = require('playwright');
const { build } = require('esbuild');
const root = fileURLToPath(new URL('../../../', import.meta.url));
const screenshotDir = process.env.PUZZLE_SCREENSHOT_DIR
  || '/var/folders/p8/b3ryxj6s1bd4wgsspxzhfnw40000gn/T/opencode/puzzle-diagram-browser';
// These fixtures exercise actual library notation, including wide turns and macros.
const cases = [
  { name: '222', cube: '222', classId: 'CLL', puzzle: '2x2x2', formula: "R U R' U'", scramble: "R U' R'", normalized: "R U R' U'" },
  { name: '333', cube: '333', classId: 'PLL', puzzle: '3x3x3', formula: "R U R' U' R' F R2 U' R' U' R U R' F'", scramble: "R U2 R' U'", normalized: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { name: 'bigCube-PLLP', cube: 'bigCube', classId: 'PLLP', puzzle: '4x4x4', formula: 'Rw2 R2 U2 Rw2 R2 Uw2 Rw2 R2 Uw2', scramble: 'Rw U2 Rw\' U2', normalized: 'Rw2 R2 U2 Rw2 R2 Uw2 Rw2 R2 Uw2' },
  { name: 'bigCube-L2E', cube: 'bigCube', classId: 'L2E', puzzle: '5x5x5', formula: "Uw' R U R' F R' F' R Uw", scramble: "Uw R U' R' Uw'", normalized: "Uw' R U R' F R' F' R Uw" },
  { name: 'megaminx', cube: 'megaminx', classId: 'PLL', puzzle: 'megaminx', formula: "R U R' U R U2' R'", scramble: "R U' R' U2", normalized: "R U R' U R U2' R'" },
  { name: 'skewb', cube: 'skewb', classId: 'Sarah', puzzle: 'skewb', formula: 'H', scramble: "R U R' U'", normalized: "F UR' F' UR" },
  { name: 'sq1', cube: 'sq1', classId: 'CS', puzzle: 'square1', formula: '/ (-3,0) /', scramble: '/ (3,0) /', normalized: '/ (-3,0) /' },
  { name: 'Pyraminx-L4E', cube: 'special', classId: 'Pyraminx L4E', puzzle: 'pyraminx', formula: 'S', scramble: "R U R' U'", normalized: "R' L R L'" },
  { name: 'FTO-L3T', cube: 'special', classId: 'FTO L3T', puzzle: 'fto', formula: 'H', scramble: "R U R' U'", normalized: "R B' R' B" },
  { name: '222-PBL', cube: '222', classId: 'PBL', puzzle: '2x2x2', formula: "R U R' U'", scramble: "R U' R'", normalized: "R U R' U'" },
  ...['LS', 'LS1', 'LS9', 'EGLS1', 'EGLS2', 'FakeBar'].map(classId => ({
    name: `222-${classId}`, cube: '222', classId, puzzle: '2x2x2',
    formula: "R U R' U'", scramble: "U R U' R'", normalized: "R U R' U'",
  })),
];
const catalogCases = [
  ...[
    ['4x4 OLLP', 4, "Rw' U2' Rw U2 Rw U2' Rw2' F2 Rw' U2 Rw' U2' F2 Rw2 F2"],
    ['4x4 PLLP', 4, '2R2 U2 2R2 Uw2 2R2 Uw2'],
    ['5x5 L2E', 5, "Rw' U' R' U R' F R F' Rw"],
    ['5x5 L2C', 5, "U2 Rw U Rw' U Rw U2 Rw'"],
    ['6x6 L2E', 6, "2R' U2 2L F2 2L' F2 2R2 U2 2R U2 2R' U2 F2 2R2 F2"],
    ['6x6 L2C', 6, "3L' U 3R U' 3L U 3R'"],
    ['LCE', 5, "M' U2 M"],
  ].map(([classId, n, formula]) => ({
    name:`bigCube-${classId}`, cube:'bigCube', classId, puzzle:`${n}x${n}x${n}`,
    formula, scramble:'', normalized:formula,
  })),
  {name:'PLL-grip-arrow', cube:'333', classId:'PLL', puzzle:'3x3x3',
    formula:"U↑ l2 B2 l' U' l B2 l' U l' U'", scramble:'', normalized:"U l2 B2 l' U' l B2 l' U l' U'"},
];
const nativeTwoLayer = fixture => fixture.cube === '222' && ['PBL', 'LS', 'LS1', 'LS9', 'EGLS1', 'EGLS2', 'FakeBar'].includes(fixture.classId);

const bundle = await build({
  stdin: { contents: `
    import React, {useEffect, useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {ChakraProvider} from '@chakra-ui/react';
    import {system} from './src/theme';
    import {I18nProvider} from './src/contexts/I18nProvider';
    import PuzzleDiagram from './src/components/puzzles/PuzzleDiagram';
    import Preferences from './src/components/puzzles/PuzzlePreferencesPanel';
    import AlgsCubeDiagram from './src/views/Algs/components/AlgsCubeDiagram';
    import AlgsModal from './src/views/Algs/components/AlgsModal';
    import {Alg} from 'cubing/alg';
    import {cube2x2x2 as libraryCube2x2x2, puzzles} from 'cubing/puzzles';
    import {TwistyPlayer} from 'cubing/twisty';
    import {renderFromSimpleQuery} from '@/vendor/puzzle-drawing/visualcube/src/preset';
    import {renderSkewbPyramidSvgParametric} from '@/vendor/puzzle-drawing/shared/src/skewb_pyramid_svg';
    import {SVG, VisualizerType} from '@/vendor/puzzle-drawing/vendor-sr-puzzlegen/src/index';
    import {renderPuzzleIsoSvg} from '@/vendor/puzzle-drawing/puzzle-render-core/src/iso-svg';
    import {renderSq1ScrambleSvg} from '@/vendor/puzzle-drawing/puzzle-render-core/src/sq1-svg';
    import {sq1StageHiddenStickerIds} from '@/vendor/puzzle-drawing/puzzle-render-core/src/support/sq1-stage-mask';
    import {renderFtoEifSvg} from '@/vendor/puzzle-drawing/puzzle-render-core/src/fto-eif-image';
    import {cubeFaceColors, puzzleFaceColors, readPuzzlePreferences} from './src/components/puzzles/preferences';
    import {preparePuzzle, puzzleLoader, resolveStickering, prefersLastLayer} from './src/components/puzzles/model';
    import './src/styles/tokens.css';
    import './src/views/Algs/styles/algsDetail.css';
    window.puzzleFixtures = ${JSON.stringify(cases)};
    window.puzzleAPI = {Alg, puzzles, libraryCube2x2x2, TwistyPlayer, cubeFaceColors, puzzleFaceColors, readPuzzlePreferences, preparePuzzle, puzzleLoader, resolveStickering, prefersLastLayer};
    // References call upstream renderers directly with fixture-owned setup/view/mask.
    // No production diagram adapter or prepared setup participates in this path.
    window.mountVendorReference = ({kind, setup, size, view, mask, ngs = false, stage = '', palette, bounds}) => {
      const host = document.createElement('div');
      host.dataset.testid = 'vendor-reference';
      host.style.cssText = 'position:fixed;left:' + bounds.x + 'px;top:' + bounds.y + 'px;width:' + bounds.width + 'px;height:' + bounds.height + 'px;z-index:2147483647;background:white';
      if (kind === 'cube') host.innerHTML = renderFromSimpleQuery({cubeSize:size, size:240, setup, view, mask, ngs,
        sch:[...'URFDLB'].map(face => palette[face]).join(',')});
      else if (kind === 'skewb') {
        host.innerHTML = renderSkewbPyramidSvgParametric(setup);
        // Recolor upstream's own sticker output, independently of adapter slot maps.
        const colors = Object.fromEntries(['#FFFFFF','#EE0000','#00D800','#FEFE00','#FFA100','#0000F2'].map((color,i) => [color, palette['URFDLB'[i]]]));
        for (const polygon of host.querySelectorAll('polygon')) {
          const color = colors[polygon.getAttribute('fill').toUpperCase()];
          if (!color) throw new Error('Unknown upstream Skewb face color');
          polygon.setAttribute('fill', color);
          polygon.setAttribute('stroke','#000');
          polygon.setAttribute('stroke-width','0.5');
          polygon.setAttribute('stroke-linejoin','round');
        }
        // Upstream's generic style must not alter unrelated reference diagrams.
        host.querySelector('style').remove();
      } else if (kind === 'megaminx') SVG(host, VisualizerType.MEGAMINX_TOP, {width:240,height:240,puzzle:{alg:setup}});
      else if (kind === 'pyraminx') host.innerHTML = renderPuzzleIsoSvg('pyraminx', setup, undefined, 240);
      else if (kind === 'square1') {
        const ids = sq1StageHiddenStickerIds(stage);
        const colors = stage === 'CS' ? Object.fromEntries([...'UDLBRF'].map(face => [face,'#dddddd'])) : palette;
        host.innerHTML = renderSq1ScrambleSvg(setup, colors, {stickerIds:true,compactFaces:!['CS','CSP'].includes(stage),
          ...(ids ? {mask:{ids,color:'transparent'}} : {})}, !['CS','CSP','PARITY'].includes(stage) && !ids);
      } else if (kind === 'fto') host.innerHTML = renderFtoEifSvg(setup);
      else throw new Error('Unknown reference kind: ' + kind);
      const source = host.querySelector('svg');
      if (!source) throw new Error('Upstream returned no SVG');
      source.setAttribute('xmlns','http://www.w3.org/2000/svg');
      const svg = new DOMParser().parseFromString(source.outerHTML,'image/svg+xml').documentElement;
      if (!(svg instanceof SVGSVGElement)) throw new Error('Upstream reference lost its SVG namespace');
      host.replaceChildren(svg);
      svg.setAttribute('width','100%'); svg.setAttribute('height','100%');
      document.body.append(host);
    };
    window.strictMounts = 0;
    function Host() {
      const [props, setProps] = useState({...window.puzzleFixtures[0], setName: '', groupName: '', interactive: true, maxWidth: 420, maxHeight: 260});
      const [open, setOpen] = useState(false);
      const [mounted, setMounted] = useState(true);
      const [svgRegression, setSVGRegression] = useState(false);
      const [modalFixture, setModalFixture] = useState(window.puzzleFixtures[1]);
      window.setModalFixture = setModalFixture;
      window.patchPuzzle = patch => setProps(previous => ({...previous, ...patch}));
      window.mountPuzzle = setMounted;
      window.showSVGRegression = setSVGRegression;
      useEffect(() => { window.strictMounts++; }, []);
      return <main style={{padding: 12, maxWidth: 760, margin: '0 auto'}}>
        <h1>PuzzleDiagram browser regression</h1>
        <section data-testid="preferences"><Preferences/></section>
        <section data-testid="active">{mounted && <PuzzleDiagram {...props}/>}</section>
        <section data-testid="native"><AlgsCubeDiagram {...props} interactive={false} imageSvg="" useVisualCube={false}/></section>
        {svgRegression && <section data-testid="svg-regression">{['PLL', 'F2L'].flatMap(classId => ['R', 'F'].map(formula =>
          <section key={classId + formula} data-testid={classId + formula}><PuzzleDiagram cube="333" classId={classId} formula={formula} setName="" groupName="" maxWidth={200} maxHeight={180}/></section>
        ))}{['R','F'].map(formula => <section key={'mega'+formula} data-testid={'mega'+formula}><PuzzleDiagram cube="megaminx" classId="PLL" formula={formula} setName="" groupName="" maxWidth={200} maxHeight={180}/></section>)}</section>}
        <button onClick={() => setOpen(true)}>Open native modal</button>
        <AlgsModal open={open} onClose={() => setOpen(false)} cube={modalFixture.cube} classId={modalFixture.classId}
          items={[{setName: '', groupName: '', alg: {name: 'Browser case', image: '', algs: [modalFixture.formula], scrambles: [modalFixture.scramble]}}]} currentIndex={0}/>
      </main>;
    }
    window.puzzleRoot = createRoot(document.getElementById('root'));
    window.puzzleRoot.render(<React.StrictMode><ChakraProvider value={system}><I18nProvider><Host/></I18nProvider></ChakraProvider></React.StrictMode>);
  `, loader: 'tsx', resolveDir: root },
  bundle: true, write: false, outdir: '/puzzle-browser', format: 'esm', splitting: true,
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"', 'process.env': '{}' },
   plugins: [{ name: 'next-dynamic-browser', setup(builder) {
     // Corrupt only the prepared setup at the component boundary, exercising the
     // real adapters' mismatch rejection and the real UI error path.
     builder.onResolve({filter: /^\.\/model$/}, args => args.importer.endsWith('/PuzzleDiagram.tsx')
       ? {path:'model-fixture',namespace:'model-fixture'} : undefined);
     builder.onLoad({filter: /.*/,namespace:'model-fixture'}, () => ({contents: `
       export * from './src/components/puzzles/model';
        import {preparePuzzle as prepare} from './src/components/puzzles/model';
        export async function preparePuzzle(puzzle, formula, ...args) {
          // A single independently validated native state bypasses only the
          // library notation parser; the real SVG adapter and 3D player run.
          if (formula === '// browser-native-pyra-2r') return window.nativePyraFixture;
          const state = await prepare(puzzle, formula.replace('// browser-source-mismatch',''), ...args);
          return formula.includes('// browser-source-mismatch') ? {...state, pattern:state.kpuzzle.defaultPattern()} : state;
       }`, resolveDir:root}));
    builder.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: 'dynamic', namespace: 'browser-adapter' }));
     builder.onLoad({ filter: /^dynamic$/, namespace: 'browser-adapter' }, () => ({
      contents: `import React, {lazy, Suspense} from 'react';
        export default function dynamic(load, options = {}) {
          const Component = lazy(() => load().then(module => ({default: module.default || module})));
          return function Dynamic(props) {
            const Loading = options.loading;
            return React.createElement(Suspense, {fallback: Loading ? React.createElement(Loading) : null}, React.createElement(Component, props));
          };
        }`, resolveDir: root,
    }));
  } }],
});
const files = new Map(bundle.outputFiles.map(file => [file.path.replace('/puzzle-browser', ''), file.contents]));
const entry = bundle.outputFiles.find(file => /\/stdin\.js$/.test(file.path)).path.replace('/puzzle-browser', '');
const styles = [...files.keys()].filter(path => path.endsWith('.css'));
const server = http.createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/') {
    response.setHeader('Content-Type', 'text/html');
    response.end(`<!doctype html><html data-palette="haitian"><head><meta name="viewport" content="width=device-width,initial-scale=1">${styles.map(path => `<link rel="stylesheet" href="${path}">`).join('')}<style>body{margin:0}section{min-width:0;margin:16px 0}h1{font-size:18px}</style></head><body><div id="root"></div><script type="module" src="${entry}"></script></body></html>`);
    return;
  }
  const content = files.get(path);
  response.statusCode = content ? 200 : 404;
  response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : 'text/javascript');
  response.end(content || 'Not found');
});
await mkdir(screenshotDir, { recursive: true });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const errors = [];
const consoleErrors = [];
const foreign = [];
const backendRequests = [];
const failedRequests = [];
const failures = [];
let browser;
let page;
let passed = 0;
async function check(name, run) {
  try {
    await run();
    const resources = await page.evaluate(() => window.puzzleResources());
    assert.ok(resources.nativePlayers <= 2 && resources.nativeObservers <= 2 && resources.nativeContexts <= 2,
      `native pool remains bounded: ${JSON.stringify(resources)}`);
    passed++; console.log(`PASS ${name}`);
  }
  catch (error) {
    failures.push({ name, error: error.stack || String(error) });
    console.error(`FAIL ${name}: ${error.message}`);
    if (page && !page.isClosed()) {
      console.error('UI', (await page.locator('[data-testid="active"]').textContent().catch(() => '')).slice(0, 1500));
      await page.screenshot({path: `${screenshotDir}/failure-${failures.length}.png`, fullPage: true}).catch(() => {});
    }
  }
}
const active = () => page.getByTestId('active');
const playerSelector = 'cubing-pro-managed-twisty-player';
// Native 2x2 controls live in a body-level region owned through aria-controls.
async function playerIn(scope = active()) {
  const owner = scope.locator('[data-native-two-by-two-host="interactive"][aria-expanded="true"]');
  if (await owner.count()) {
    const id = await owner.getAttribute('aria-controls');
    assert.ok(id, 'native player has an explicit controlled region');
    return page.locator(`[id="${id}"] > twisty-player`);
  }
  return scope.locator(playerSelector);
}

async function readyThumbnail(scope = active()) {
  await scope.scrollIntoViewIfNeeded();
  await poll('native 2x2 PNG thumbnail', () => scope.evaluate(host => {
    const img = host.querySelector('[data-native-two-by-two-host="thumbnail"] img');
    return !!host.querySelector('[role="alert"]') || !!img && img.complete && img.naturalWidth === 180 && img.naturalHeight === 180;
  }), {timeout: 30000});
  assert.deepEqual(await scope.getByRole('alert').allTextContents(), []);
  assert.equal(await scope.locator('svg[role="img"], twisty-player, cubing-pro-managed-twisty-player').count(), 0, 'PBL thumbnail is a native PNG, never an SVG/net/player');
  const img = scope.locator('[data-native-two-by-two-host="thumbnail"] img');
  assert.equal(await img.count(), 1);
  assert.equal(await img.isVisible(), true);
  assert.match(await img.getAttribute('src'), /^data:image\/png;base64,/);
}

async function ready2D(scope = active()) {
  await poll('prepared 2D diagram', () => scope.evaluate(host => !!host.querySelector('svg[role="img"], [data-native-two-by-two-host="thumbnail"], [role="alert"]')), {timeout: 30000});
  if (await scope.locator('[data-native-two-by-two-host="thumbnail"]').count()) await readyThumbnail(scope);
  else await readySVG(scope);
}
// Await the evaluated value in Node: async waitForFunction predicates can be
// treated as truthy Promises before their boolean result in Playwright 1.65.
async function poll(description, predicate, {timeout = 10000, interval = 50} = {}) {
  const deadline = performance.now() + timeout;
  const timeoutError = () => Object.assign(new Error(`Timed out waiting for ${description}`), {name: 'TimeoutError'});
  while (performance.now() < deadline) {
    let timer;
    let result;
    try {
      result = await Promise.race([
        predicate(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(timeoutError()), Math.max(1, Math.ceil(deadline - performance.now()))); }),
      ]);
    } finally {
      clearTimeout(timer);
    }
    if (result === true) return;
    await delay(Math.min(interval, Math.max(0, deadline - performance.now())));
  }
  throw timeoutError();
}
async function select(fixture, extra = {}) {
   await page.evaluate(({fixture, extra}) => window.patchPuzzle({setName:'',groupName:'',...fixture, stateSource: 'formula', ...extra}), {fixture, extra});
  await active().getByRole('button', {name: '2D', exact: true}).click();
}
async function readySVG(scope = active()) {
  await scope.scrollIntoViewIfNeeded();
   await scope.locator('svg[role="img"], [role="alert"]').first().waitFor({state:'attached',timeout: 30000});
  assert.deepEqual(await scope.getByRole('alert').allTextContents(), [], 'valid fixture must render without alerts');
   const svg = scope.locator('svg[role="img"]');
   assert.equal(await svg.count(), 1, 'one real SVG, including StrictMode');
   assert.deepEqual(await svg.evaluate(svg => ({namespace:svg.namespaceURI, native:svg instanceof SVGSVGElement})),
     {namespace:'http://www.w3.org/2000/svg',native:true},'diagram must retain the SVG namespace when serialized and reparsed');
  assert.equal(await svg.isVisible(), true);
  assert.equal(await svg.evaluate(svg => /NaN|Infinity|unsupported/i.test(svg.outerHTML)), false, 'SVG geometry is finite and supported');
  const box = await svg.boundingBox();
  assert.ok(box.width > 30 && box.height > 30, 'SVG has visible dimensions');
  assert.ok(await svg.locator('path, polygon, rect, use').count() > 5, 'SVG contains puzzle stickers');
  assert.equal(await svg.locator('stop[stop-color="undefined"]').count(), 0, 'all puzzle palettes have valid mask colors');
  const ids = await svg.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
  assert.equal(new Set(ids).size, ids.length, 'IDs are unique even within bundled SQ1 templates');
}
// Compare rendered sticker colors, not unstable generated SVG IDs.
const fills = scope => scope.locator('svg[role="img"]').evaluate(svg => {
  const paint = value => {
    const reference = /^url\(["']?#([^"')]+)["']?\)$/.exec(value);
    if (!reference) return value;
    const gradient = svg.getElementById(reference[1]);
    if (!gradient) throw new Error(`Missing SVG paint: ${value}`);
    return [gradient.tagName, [...gradient.querySelectorAll('stop')].map(stop => [
      stop.getAttribute('offset'), getComputedStyle(stop).stopColor, getComputedStyle(stop).stopOpacity,
    ])];
  };
  return [...svg.querySelectorAll('path, polygon, rect, use, circle, ellipse')]
    .map(node => [node.tagName, paint(getComputedStyle(node).fill), paint(getComputedStyle(node).stroke)]);
});
async function ready3D(scope = active(), {selectMode = true} = {}) {
  await scope.scrollIntoViewIfNeeded();
  if (selectMode) await scope.getByRole('button', {name: '3D', exact: true}).click();
  assert.equal(await scope.getByRole('button', {name: '3D', exact: true}).getAttribute('aria-pressed'), 'true');
  await poll('real 3D player readiness', () => scope.evaluate(host => {
    const owner = host.querySelector('[data-native-two-by-two-host="interactive"][aria-expanded="true"]');
    const native = owner && document.getElementById(owner.getAttribute('aria-controls'));
    return !!host.querySelector('[role="alert"]') || !!native?.querySelector('twisty-player') && !native.inert
      || [...host.querySelectorAll('select')].some(select => !select.disabled)
      && (!!host.querySelector('canvas') || host.querySelector('cubing-pro-managed-twisty-player')?.style.visibility === 'visible');
  }), {timeout: 40000});
  assert.deepEqual(await scope.getByRole('alert').allTextContents(), []);
}

async function assertCanvasPixels(scope = active()) {
  const player = await playerIn(scope);
  const handle = await player.count()
    ? await player.evaluateHandle(async element => (await element.experimentalCurrentCanvases())[0])
    : await scope.locator('canvas').elementHandle();
  try {
    // Capture the composited canvas as PNG. Reading a WebGL drawing buffer in a
    // later evaluate can see transparent pixels after preserveDrawingBuffer=false.
    let pixels;
    try {
      await poll('composited 3D canvas paints opaque colored stickers', async () => {
        const canvasPNG = await handle.asElement().screenshot({omitBackground: true});
        pixels = await page.evaluate(async base64 => {
          const image = await createImageBitmap(await (await fetch('data:image/png;base64,' + base64)).blob());
          const canvas = document.createElement('canvas');
          canvas.width = image.width; canvas.height = image.height;
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0); image.close();
          const {data} = context.getImageData(0, 0, canvas.width, canvas.height);
          let opaque = 0, colored = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 128) {
              opaque++;
              if (Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) > 30) colored++;
            }
          }
          return {width: canvas.width, height: canvas.height, opaque, colored};
        }, canvasPNG.toString('base64'));
        return pixels.width > 30 && pixels.height > 30 && pixels.opaque > 1000 && pixels.colored > 1000;
      });
    } catch (error) {
      error.message += `; last screenshot pixels: ${JSON.stringify(pixels)}`;
      throw error;
    }
    assert.ok(pixels.width > 30 && pixels.height > 30, JSON.stringify(pixels));
    assert.ok(pixels.opaque > 1000, `3D canvas has nontransparent pixels: ${JSON.stringify(pixels)}`);
    assert.ok(pixels.colored > 1000, `3D canvas has colored stickers: ${JSON.stringify(pixels)}`);
  } finally { await handle.dispose(); }
}

async function playSquare1() {
  const slider = active().getByRole('slider');
  assert.equal(await slider.inputValue(), '0');
  const end = Number(await slider.getAttribute('max'));
  assert.ok(end > 0, 'nonempty real Square-1 timeline');
  await active().getByLabel('播放速度', {exact: true}).selectOption('3');
  await active().getByRole('button', {name: '播放', exact: true}).click();
  await poll('Square-1 playback advances', async () => Number(await slider.inputValue()) > 0.1);
  await poll('Square-1 playback reaches the actual end', async () => Number(await slider.inputValue()) === end, {timeout: 15000});
  await active().getByText('完成', {exact: true}).waitFor();
  assert.equal(await active().getByRole('button', {name: '播放', exact: true}).getAttribute('aria-pressed'), 'false');
  assert.equal(await active().getByRole('button', {name: '下一步', exact: true}).isDisabled(), true);
}

// Inspect composited screenshots, never a possibly discarded WebGL buffer.
const cubePalette = {U: '#ffdd00', D: '#ffffff', F: '#e53935', B: '#ff8800', R: '#00a651', L: '#2266ff'};
const skewbPalette = {U: '#d6b83f', D: '#f2f0e8', F: '#c64d48', B: '#d17c3a', R: '#388a61', L: '#426fa6'};
async function screenshotPixels(png, palette) {
  return page.evaluate(async ({base64, palette}) => {
    const image = await createImageBitmap(await (await fetch('data:image/png;base64,' + base64)).blob());
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0); image.close();
    const {data} = context.getImageData(0, 0, canvas.width, canvas.height);
    const colors = Object.fromEntries(Object.entries(palette).map(([face, hex]) => [face, {
      rgb: hex.slice(1).match(/../g).map(value => parseInt(value, 16)), count: 0, x: 0, y: 0,
    }]));
    let black = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 250) continue;
      if (Math.max(data[i], data[i + 1], data[i + 2]) < 50) black++;
      for (const color of Object.values(colors)) {
        if (color.rgb.every((channel, index) => Math.abs(channel - data[i + index]) <= 3)) {
          color.count++;
          color.x += (i / 4) % canvas.width;
          color.y += Math.floor(i / 4 / canvas.width);
        }
      }
    }
    return {width: canvas.width, height: canvas.height, black, colors: Object.fromEntries(
      Object.entries(colors).map(([face, color]) => [face, color.count])),
      centroids: Object.fromEntries(Object.entries(colors).filter(([, color]) => color.count).map(([face, color]) => [
        face, {x: color.x / color.count, y: color.y / color.count},
      ])),
    };
  }, {base64: png.toString('base64'), palette});
}

async function compareScreenshots(actual, reference) {
  return page.evaluate(async images => {
    const pixels = await Promise.all(images.map(async base64 => {
      const image = await createImageBitmap(await (await fetch('data:image/png;base64,' + base64)).blob());
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0); image.close();
      return {width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data};
    }));
    if (pixels[0].width !== pixels[1].width || pixels[0].height !== pixels[1].height) throw new Error('Screenshot sizes differ');
    let changed = 0;
    for (let i = 0; i < pixels[0].data.length; i += 4) {
      if ([0, 1, 2, 3].some(channel => Math.abs(pixels[0].data[i + channel] - pixels[1].data[i + channel]) > 12)) changed++;
    }
    return {changed, total: pixels[0].width * pixels[0].height};
  }, [actual, reference].map(png => png.toString('base64')));
}

async function assertVendorReference(name, reference, {native = false} = {}) {
  const svg = active().locator('svg[role="img"]');
  const actual = await svg.screenshot({path: `${screenshotDir}/${name}.png`});
  const bounds = await svg.boundingBox();
  await page.evaluate(options => window.mountVendorReference(options), {...reference, bounds});
  const expected = page.getByTestId('vendor-reference').locator('svg');
  try {
    const describe = svg => ({
      viewBox: svg.getAttribute('viewBox'),
      nodes: [...svg.querySelectorAll('path, polygon, rect, circle, ellipse, use')].map(node => {
        const box = node.getBBox();
        const matrix = node.getCTM();
        const style = getComputedStyle(node);
        return {tag:node.localName, geometry:['d','points','x','y','width','height','cx','cy','r','data-sid'].map(key => node.getAttribute(key)),
          box:[box.x,box.y,box.width,box.height], matrix:matrix && [matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f],
          fill:style.fill, stroke:style.stroke, strokeWidth:style.strokeWidth, vectorEffect:style.vectorEffect};
      }),
    });
    const geometry = await svg.evaluate(describe);
    assert.ok(geometry.nodes.length > 5, `${name}: geometry comparison is nonempty`);
    assert.deepEqual(geometry, await expected.evaluate(describe), `${name}: independent upstream geometry, transforms, mask and paint`);
    const referencePNG = await expected.screenshot({path:`${screenshotDir}/${name}-reference.png`});
    const diff = await compareScreenshots(actual, referencePNG);
    assert.ok(diff.changed / diff.total < 0.005, `${name}: actual/reference pixels ${JSON.stringify(diff)}`);
    if (native) {
      const entry = page.getByTestId('native').locator('svg[role="img"]');
      assert.deepEqual(await entry.evaluate(describe), geometry, `${name}: noninteractive entry geometry`);
      const nativeDiff = await compareScreenshots(await entry.screenshot(), referencePNG);
      assert.ok(nativeDiff.changed / nativeDiff.total < 0.005, `${name}: noninteractive entry pixels ${JSON.stringify(nativeDiff)}`);
    }
    // A solved reference must not accidentally validate a nonidentity fixture.
    await page.getByTestId('vendor-reference').evaluate(host => host.remove());
    await page.evaluate(options => window.mountVendorReference(options), {...reference, setup:'', bounds});
    const solved = await compareScreenshots(actual, await page.getByTestId('vendor-reference').locator('svg').screenshot());
    if (!reference.identity) assert.ok(solved.changed / solved.total > 0.01, `${name}: negative control rejects solved pixels ${JSON.stringify(solved)}`);
    return geometry;
  } finally {
    await page.getByTestId('vendor-reference').evaluateAll(nodes => nodes.forEach(node => node.remove()));
  }
}

async function canvasScreenshot(name) {
  const handle = await (await playerIn()).evaluateHandle(async player => (await player.experimentalCurrentCanvases())[0]);
  try { return await handle.asElement().screenshot({path: `${screenshotDir}/${name}.png`, omitBackground: true}); }
  finally { await handle.dispose(); }
}

async function playTwisty(player) {
  // cubing exposes its closed shadow roots as .shadow. Click the real control.
  const handle = await player.evaluateHandle(element => {
    const find = root => {
      for (const node of root.querySelectorAll('*')) {
        if (node.tagName === 'BUTTON' && node.title === 'Play') return node;
        if (node.shadow) { const button = find(node.shadow); if (button) return button; }
      }
      return null;
    };
    const button = find(element.shadow);
    if (!button || button.disabled) throw new Error('Native cubing Play control is unavailable');
    return button;
  });
  try { await handle.asElement().click(); }
  finally { await handle.dispose(); }
}

try {
  browser = await chromium.launch({headless: true, args: ['--enable-unsafe-swiftshader']});
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
  await context.route('**/*', route => {
    const url = route.request().url();
    if (/\/cube-api(?:\/|$)|\/visualcube(?:\.|\/|\?)/i.test(url)) backendRequests.push(url);
    if (/^https?:/.test(url) && new URL(url).origin !== origin) {
      foreign.push(url);
      return route.abort();
    }
    return route.continue();
  });
  page = await context.newPage();
  await page.addInitScript(() => {
    // Test-only instrumentation delegates to native APIs; no production hooks.
    const observers = new Map();
    const contexts = new Map();
    const nativeOwner = node => {
      while (node) {
        if (node.dataset?.nativeTwoByTwo) return true;
        node = node.parentNode || node.host;
      }
      return false;
    };
    let createdObservers = 0, createdContexts = 0;
    const NativeObserver = window.ResizeObserver;
    window.ResizeObserver = class extends NativeObserver {
      constructor(callback) { super(callback); createdObservers++; }
      observe(target, options) {
        super.observe(target, options);
        if (!observers.has(this)) observers.set(this, new Set());
        observers.get(this).add(target);
      }
      unobserve(target) {
        super.unobserve(target);
        const targets = observers.get(this);
        targets?.delete(target);
        if (!targets?.size) observers.delete(this);
      }
      disconnect() { super.disconnect(); observers.delete(this); }
    };
    const getContext = HTMLCanvasElement.prototype.getContext;
    const seen = new WeakSet();
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      const context = getContext.call(this, type, ...args);
      if (/^(webgl2?|experimental-webgl)$/.test(type) && context && !seen.has(context)) {
        seen.add(context); contexts.set(context, this); createdContexts++;
        this.addEventListener('webglcontextlost', () => contexts.delete(context));
        this.addEventListener('webglcontextrestored', () => contexts.set(context, this));
      }
      return context;
    };
    window.puzzleResources = () => {
      const nativeObservers = [...observers.values()].filter(targets => [...targets].every(nativeOwner)).length;
      const nativeContexts = [...contexts.values()].filter(nativeOwner).length;
      return {observers: observers.size - nativeObservers, contexts: contexts.size - nativeContexts,
        nativeObservers, nativeContexts, nativePlayers: document.querySelectorAll('[data-native-two-by-two] > twisty-player').length,
        createdObservers, createdContexts};
    };
  });
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', request => failedRequests.push(`${request.url()} ${request.failure()?.errorText}`));
  await page.goto(origin);
  await poll('React browser test host starts', () => page.evaluate(() => typeof window.patchPuzzle === 'function'), {timeout: 10000});
  await check('StrictMode mounts twice with 2x2 non-PBL auto 2D, then real 3D', async () => {
    assert.equal(await page.evaluate(() => window.puzzleAPI.readPuzzlePreferences().view), 'auto');
    await readySVG();
    assert.equal(await active().getByRole('button', {name: '2D', exact: true}).getAttribute('aria-pressed'), 'true');
    assert.equal(await active().locator(playerSelector).count(), 0);
    assert.equal(await page.evaluate(() => window.strictMounts), 2);
    await ready3D();
    assert.equal(await (await playerIn()).count(), 1);
    assert.equal(await (await playerIn()).evaluate(element => element.localName), 'twisty-player');
    await assertCanvasPixels();
  });
  await check('seven bigCube catalog cards and PLL grip-arrow render actual SVG at 320/768', async () => {
    try {
      for (const width of [320, 768]) {
        await page.setViewportSize({width, height:1000});
        for (const fixture of catalogCases) {
          await select(fixture, {maxWidth:240, maxHeight:240});
          await readySVG(); await readySVG(page.getByTestId('native'));
          assert.equal(await active().locator('.puzzle-diagram').getAttribute('data-puzzle'), fixture.puzzle);
          assert.equal(await active().getByRole('status').count(), 0, 'no parser fallback warning');
          assert.equal(await active().evaluate(host => host.scrollWidth <= host.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1), true);
          if (fixture.name === 'PLL-grip-arrow') {
            const marked = await fills(active());
            await select(fixture, {formula:fixture.normalized, maxWidth:240, maxHeight:240});
            await readySVG();
            assert.deepEqual(await fills(active()), marked, 'PLL arrow and separated moves paint the same state');
          }
        }
      }
    } finally {
      await page.setViewportSize({width:1440,height:1000});
      await select(cases[0]); await readySVG();
    }
  });
  await check('Node polling awaits false results and really times out', async () => {
    let attempts = 0;
    const start = performance.now();
    await assert.rejects(poll('negative control: async false', async () => {
      attempts++;
      return await page.evaluate(async () => { await new Promise(resolve => setTimeout(resolve, 10)); return false; });
    }, {timeout: 250, interval: 20}), {name: 'TimeoutError', message: 'Timed out waiting for negative control: async false'});
    assert.ok(attempts >= 2, 'false values must be retried');
    assert.ok(performance.now() - start >= 250, 'false condition must consume its timeout');
  });

  for (const stateSource of ['formula', 'scramble']) for (const classId of ['EG', 'CLL', 'OBL']) await check(`2x2 ${classId}/${stateSource}: direct visualcube plan geometry and screenshot pixels`, async () => {
    for (const [index, formula] of ['U', 'R', 'F', '(R U R\u2019 U\u2019)2', '[R, U]'].entries()) {
      const scramble = '[F: (R U)2]';
      const name = `222-${stateSource}-${classId}-${index}`;
      await select(cases[0], {classId, formula, scramble, stateSource, maxWidth: 420, maxHeight: 260});
      await readySVG();
      await readySVG(page.getByTestId('native'));
      const state = await page.evaluate(async ({formula, scramble, stateSource}) => {
        const {libraryCube2x2x2:loader, puzzleLoader, Alg, preparePuzzle} = window.puzzleAPI;
        const kpuzzle = await loader.kpuzzle();
        const solution = new Alg(formula.replace(/[\u2019\u2018\u2032]/g, "'"));
        const setup = stateSource === 'scramble' ? new Alg(scramble) : solution.invert();
        const expected = kpuzzle.defaultPattern().applyAlg(setup);
        const prepared = await preparePuzzle('2x2x2', formula, scramble, stateSource);
        return {loader:puzzleLoader('2x2x2') === loader,
          solved:stateSource !== 'formula' || expected.applyAlg(solution).isIdentical(kpuzzle.defaultPattern()),
          actual:prepared.pattern.patternData, expected:expected.patternData,
          setup:[...setup.experimentalLeafMoves()].map(move => move.toString()).join(' ')};
      }, {formula, scramble, stateSource});
      assert.equal(state.loader, true);
      assert.equal(state.solved, true);
      assert.deepEqual(state.actual, state.expected, `${classId}/${formula}: native corner ordering`);
      await assertVendorReference(name, {kind:'cube',size:2,setup:state.setup,view:'plan',palette:cubePalette}, {native:true});
    }
  });

  const cubeViews = [
    [3,'PLL','pll'], [3,'F2L','f2l'], [3,'OLL','oll',undefined,true],
    [3,'COLL','pll','coll',true], [3,'CMLL','pll','cmll',true],
    [3,'ZBLL','pll','coll'], [3,'ZBLS','iso','vh'],
    [3,'WV','pll','wv',true], [3,'VLS','pll','wv',true], [3,'SV','pll','wv',true],
    ...[4,5,6,7].flatMap(size => [[size,'PLLP','pll'],[size,'L2E','iso']]),
  ];
  for (const [size,classId,view,mask,ngs] of cubeViews) await check(`${size}x${size} ${classId}: upstream view/mask geometry and pixels`, async () => {
    const formula = size > 3 ? "Rw U2 Rw' F" : "R U R' F";
    const scramble = size > 3 ? "Uw F2 Rw U'" : "F U2 R'";
    for (const stateSource of ['formula','scramble']) {
      await select({cube:String(size).repeat(3), classId, formula, scramble}, {stateSource, maxWidth:300,maxHeight:240});
      await readySVG(); await readySVG(page.getByTestId('native'));
      const state = await page.evaluate(async ({size,formula,scramble,stateSource}) => {
        const {Alg,puzzleLoader,preparePuzzle} = window.puzzleAPI;
        const puzzle = [size,size,size].join('x');
        const kpuzzle = await puzzleLoader(puzzle).kpuzzle();
        const solution = new Alg(formula);
        const setup = stateSource === 'formula' ? solution.invert() : new Alg(scramble);
        const prepared = await preparePuzzle(puzzle,formula,scramble,stateSource);
        return {setup:[...setup.experimentalLeafMoves()].map(move => move.toString()).join(' '),
          actual:prepared.pattern.patternData, expected:kpuzzle.defaultPattern().applyAlg(setup).patternData};
      }, {size,formula,scramble,stateSource});
      assert.deepEqual(state.actual,state.expected,'view and mask preserve the independent native state');
      await assertVendorReference(`cube-${size}-${classId}-${stateSource}`, {kind:'cube',size,view,mask,ngs,setup:state.setup,palette:cubePalette}, {native:true});
    }
  });

  // Independent vendor spellings: Uv = U plus four sr D++ steps; Lv likewise.
  // Native D is BR conjugated by Lv². Mixed-case Br/Bl are wide grips.
  const megaUAxis = 'U D++ D++ D++ D++';
  const megaLAxis = 'L R++ R++ R++ R++';
  const inverseMega = text => text.split(' ').filter(Boolean).reverse().flatMap(token => Array(4).fill(token)).join(' ');
  const megaWide = rotation => `${rotation} D++ ${inverseMega(rotation)}`;
  const megaBr = megaWide(`${megaUAxis} ${megaLAxis} ${megaLAxis}`);
  const megaBl = megaWide(`${megaUAxis} ${megaUAxis} ${megaLAxis} ${megaLAxis}`);
  const megaD = `${megaLAxis} ${megaLAxis} BR ${inverseMega(`${megaLAxis} ${megaLAxis}`)}`;
  for (const fixture of [
    {name:'skewb-sarah-inverse', base:5, formula:'H', scramble:'', stateSource:'formula', kind:'skewb', setup:"UR' F UR F'", polygons:25},
    {name:'skewb-wca-rotation', base:5, formula:'', scramble:"R U' L B x", stateSource:'scramble', kind:'skewb', setup:"R U' L B x", polygons:25},
    {name:'mega-inverse', base:4, formula:"R U R' U R U2' R'", scramble:'', stateSource:'formula', kind:'megaminx', setup:"R U U R R R R U U U U R U U U U R R R R", polygons:27},
    {name:'mega-pochmann', base:4, formula:'', scramble:"R++ U2' D-- R'", stateSource:'scramble', kind:'megaminx', setup:'R++ R++ U U U D++ D++ D++ R R R R', polygons:27},
    {name:'mega-down-face',base:4,formula:'',scramble:'R U D F',stateSource:'scramble',kind:'megaminx',setup:`R U ${megaD} F`,polygons:27},
    {name:'mega-Br-Bl-y',base:4,formula:'',scramble:"Br' U Bl2 y' R",stateSource:'scramble',kind:'megaminx',setup:`${inverseMega(megaBr)} U ${megaBl} ${megaBl} D++ U U U U R`,polygons:27},
    {name:'mega-Br-inverse',base:4,formula:'Br',scramble:'',stateSource:'formula',kind:'megaminx',setup:inverseMega(megaBr),polygons:27},
    {name:'mega-Bl-inverse',base:4,formula:'Bl',scramble:'',stateSource:'formula',kind:'megaminx',setup:inverseMega(megaBl),polygons:27},
    {name:'mega-y-inverse',base:4,formula:'y',scramble:'',stateSource:'formula',kind:'megaminx',setup:'D++ U U U U',polygons:27},
    {name:'pyra-engine-inverse', base:7, formula:'S', scramble:'', stateSource:'formula', kind:'pyraminx', setup:"L R' L' R"},
    {name:'pyra-engine-tips', base:7, formula:'', scramble:"R U' l r2 B", stateSource:'scramble', kind:'pyraminx', setup:"R U' l r' B"},
    {name:'fto-all-faces', base:8, formula:'', scramble:'// cubing-pro:native\nU L F BL D B R BR', stateSource:'scramble', kind:'fto', setup:'U F R L D Bl Br B'},
    {name:'fto-slices-rotations', base:8, formula:'', scramble:"// cubing-pro:native\n2R 2D Rv Lv Uv Fv T", stateSource:'scramble', kind:'fto', setup:"Ls' Us' Lo' Fo Uo Ro Rt"},
  ]) await check(`${fixture.name}: direct upstream geometry, state and pixels`, async () => {
    await select(cases[fixture.base], {...fixture,maxWidth:300,maxHeight:260});
    await readySVG(); await readySVG(page.getByTestId('native'));
    await assertVendorReference(fixture.name, {...fixture,palette:skewbPalette}, {native:true});
    if (fixture.polygons) assert.equal(await active().locator('svg[role="img"] polygon').count(),fixture.polygons);
    if (fixture.kind === 'megaminx') {
      const top = await active().locator('svg[role="img"]').evaluate(svg => {
        const polygons = [...svg.querySelectorAll('polygon')];
        const stickers = polygons.filter(polygon => !polygon.closest('defs'));
        return {markers:polygons.length-stickers.length,stickers:stickers.map(polygon => {
          const points = [...polygon.points].map(point => [point.x,point.y]);
          const box = polygon.getBoundingClientRect(), style = getComputedStyle(polygon);
          const area = Math.abs(points.reduce((sum,[x,y],i) => {
            const next = points[(i+1)%points.length];
            return sum+x*next[1]-y*next[0];
          },0))/2;
          return {points,area,visible:box.width>0 && box.height>0 && style.display!=='none' && style.visibility==='visible' && Number(style.opacity)>0};
        })};
      });
      assert.equal(top.markers,1,'the extra upstream polygon belongs to the arrow marker, not a hidden sticker');
      assert.equal(top.stickers.length,26,'complete top layer: one center, ten U stickers and fifteen side-rim stickers');
      assert.equal(top.stickers.filter(sticker => sticker.points.length===5).length,1,'one pentagonal U center');
      assert.equal(top.stickers.filter(sticker => sticker.points.length===4).length,25,'ten top and fifteen side-rim quadrilaterals, without lower-face polygons');
      assert.equal(new Set(top.stickers.map(sticker => JSON.stringify(sticker.points))).size,26,'no duplicate hidden polygons');
      assert.ok(top.stickers.every(sticker => sticker.visible && sticker.area>1e-6 && sticker.points.flat().every(Number.isFinite)),'every top-layer sticker has real visible, nondegenerate geometry');
    }
    if (fixture.kind === 'fto') assert.equal(await active().locator('svg[role="img"] path').count(),73,'body and all 72 face stickers remain visible');
  });

  await check('SQ1 stacked layers deform and stage masks follow physical pieces in geometry and pixels', async () => {
    const shapes = [];
    for (const setup of ['(0,0)','/ (3,0) /','(1,0) /']) {
      for (const [stage,visible] of [['',40],['CS',40],['CO',8],['EO',16],['CP',32],['EP',40],['OBL',16]]) {
        await select(cases[6], {classId:stage,formula:'',scramble:setup,stateSource:'scramble',maxWidth:300,maxHeight:300});
        await readySVG(); await readySVG(page.getByTestId('native'));
        const geometry = await active().locator('svg[role="img"]').evaluate(svg => {
          const paths = [...svg.querySelectorAll('path[data-sid]')];
          const translations = paths.map(path => path.transform.baseVal.getItem(0).matrix).map(m => [m.e,m.f]);
          return {viewBox:[svg.viewBox.baseVal.width,svg.viewBox.baseVal.height],
            x:[...new Set(translations.map(p => p[0]))],y:[...new Set(translations.map(p => p[1]))],
            stickers:paths.map(path => path.getAttribute('data-sid')).sort(),
            shape:paths.map(path => [path.getAttribute('d'),path.getAttribute('transform')]),
            fills:[...new Set(paths.map(path => path.getAttribute('fill')))], middle:svg.querySelectorAll('rect').length};
        });
        assert.equal(geometry.stickers.length,visible,`${stage}: omitted stickers leave no closed fake outline`);
        assert.equal(geometry.x.length,1,'layers are vertically stacked');
        assert.equal(geometry.y.length,2,'top and bottom are distinct');
        assert.ok(geometry.viewBox[1] > geometry.viewBox[0],'portrait stacked layout');
        assert.equal(geometry.middle,stage ? 0 : 4,'equator appears only without stage masking');
        if (stage === 'CS') assert.deepEqual(geometry.fills,['#dddddd']);
        if (!stage) shapes.push(geometry.shape);
        await assertVendorReference(`sq1-${shapes.length}-${stage || 'full'}`, {kind:'square1',setup,stage,palette:cubePalette,identity:setup === '(0,0)'}, {native:true});
      }
    }
    assert.notDeepEqual(shapes[0],shapes[1],'slash changes actual wedge geometry');
    assert.notDeepEqual(shapes[1],shapes[2],'a different legal cut changes physical silhouette again');
  });

  await check('SQ1 CP set overrides CPEP class and non-CS masks respect the selected palette', async () => {
    const setup = '/ (3,0) /';
    for (const [classId,setName,stage,visible,middle] of [
      ['CPEP','CP','CP',32,0],['CPEP','EP','EP',40,0],['CO','CP','CP',32,0],['CPEP','','CPEP',40,4],
    ]) {
      await select(cases[6],{classId,setName,formula:'',scramble:setup,stateSource:'scramble',maxWidth:300,maxHeight:300});
      await readySVG(); await readySVG(page.getByTestId('native'));
      assert.equal(await active().locator('svg [data-sid]').count(),visible,`${classId}/${setName}: stage recognition`);
      assert.equal(await active().locator('svg rect').count(),middle,`${classId}/${setName}: stage equator`);
      await assertVendorReference(`sq1-set-${classId}-${setName || 'none'}`,{kind:'square1',setup,stage,palette:cubePalette},{native:true});
    }
    try {
      for (const stage of ['CO','CP','CS']) {
        await select(cases[6],{classId:'CPEP',setName:stage,formula:'',scramble:setup,stateSource:'scramble',maxWidth:300,maxHeight:300});
        await readySVG();
        const before = await fills(active());
        await page.getByTestId('preferences').getByLabel('底色',{exact:true}).selectOption('yellow');
        await readySVG(); await readySVG(page.getByTestId('native'));
        const palette = {...cubePalette,U:cubePalette.D,D:cubePalette.U,R:cubePalette.L,L:cubePalette.R};
        if (stage === 'CS') assert.deepEqual(await fills(active()),before,'CS remains shape-only grey');
        else assert.notDeepEqual(await fills(active()),before,`${stage}: configured U/D colors actually change`);
        await assertVendorReference(`sq1-palette-${stage}`,{kind:'square1',setup,stage,palette},{native:true});
        const png = await active().locator('svg[role="img"]').screenshot();
        const pixels = await screenshotPixels(png,stage === 'CS' ? {grey:'#dddddd'} : palette);
        if (stage === 'CS') assert.ok(pixels.colors.grey>1000,'CS paints only the shape palette');
        else assert.ok(pixels.colors.U>100 && pixels.colors.D>100,`${stage}: actual pixels use both configured face colors`);
        await page.getByTestId('preferences').getByLabel('底色',{exact:true}).selectOption('white');
      }
    } finally {
      await page.getByTestId('preferences').getByLabel('底色',{exact:true}).selectOption('white');
    }
  });

  for (const classId of ['PBL', 'LS', 'LS1', 'LS9', 'EGLS1', 'EGLS2', 'FakeBar'])
  for (const stateSource of ['formula', 'scramble']) await check(`2x2 ${classId}/${stateSource}: PNG pixels match the original native 3D player screenshot`, async () => {
    let previous;
    // A cached PNG does not reconfigure the shared hidden player. Keep this
    // reference path fresh so its model/canvas actually belongs to this request.
    for (const move of ['U', 'R', 'F', '[R, U]']) {
      const formula = `${move}\n// native-reference-${classId}-${stateSource}`;
      const scramble = `${move} U2`;
      await select(cases[9], {classId, formula, scramble, stateSource, maxWidth: 240, maxHeight: 240});
      await readyThumbnail();
      await readyThumbnail(page.getByTestId('native'));
      const img = active().locator('img');
      const actual = await img.screenshot();
      try {
        const state = await img.evaluate(async (img, {formula, scramble, stateSource}) => {
          const {Alg, puzzles} = window.puzzleAPI;
          const player = document.querySelector('[data-native-two-by-two="thumbnail"] > twisty-player');
          if (!player || player.constructor !== window.puzzleAPI.TwistyPlayer) throw new Error('Thumbnail must use the original TwistyPlayer constructor');
          const setup = stateSource === 'formula' ? new Alg(formula).invert() : new Alg(scramble);
          const kpuzzle = await puzzles['2x2x2'].kpuzzle();
          const expected = kpuzzle.defaultPattern().applyAlg(setup);
          const current = await player.experimentalModel.currentPattern.get();
          const [vantage] = await player.experimentalCurrentVantages();
          const {canvas} = await vantage.canvasInfo();
          const capture = () => new Promise((resolve, reject) => {
            vantage.experimentalNextRenderFinishedCallback(() => {
              try {
                const copy = document.createElement('canvas');
                copy.width = 180; copy.height = 180;
                copy.getContext('2d').drawImage(canvas, 0, 0, 180, 180);
                resolve(copy.toDataURL('image/png'));
              } catch (error) { reject(error); }
            });
            void vantage.render().catch(reject);
          });
          const src = await capture();
          const bounds = img.getBoundingClientRect();
          const reference = document.createElement('img');
          reference.dataset.testid = 'native-pbl-reference';
          reference.src = src;
          reference.style.cssText = `position:fixed;left:${bounds.left}px;top:${bounds.top}px;width:${bounds.width}px;height:${bounds.height}px;object-fit:contain;z-index:2147483647;background:white`;
          document.body.append(reference);
          await reference.decode();
          return {tag: player.localName, puzzle: await player.experimentalGet.puzzleID(),
            visualization: await player.experimentalModel.visualizationFormat.get(), matches: current.isIdentical(expected),
            setupMatches: kpuzzle.defaultPattern().applyAlg(await player.experimentalGet.setupAlg()).isIdentical(expected),
            solved: stateSource !== 'formula' || current.applyAlg(new Alg(formula)).isIdentical(kpuzzle.defaultPattern()),
            canvas: [canvas.width, canvas.height]};
        }, {formula, scramble, stateSource});
        assert.equal(state.tag, 'twisty-player');
        assert.equal(state.puzzle, '2x2x2');
        assert.equal(state.visualization, '3D');
        assert.equal(state.matches, true, 'native screenshot state equals independently computed setup');
        assert.equal(state.setupMatches, true);
        assert.equal(state.solved, true);
        assert.ok(state.canvas.every(size => size > 30));
        const reference = await page.getByTestId('native-pbl-reference').screenshot();
        const diff = await compareScreenshots(actual, reference);
        assert.ok(diff.changed / diff.total < 0.005, `PBL ${stateSource}/${formula}: original native screenshot ${JSON.stringify(diff)}`);
        const nativeDiff = await compareScreenshots(await page.getByTestId('native').locator('img').screenshot(), reference);
        assert.ok(nativeDiff.changed / nativeDiff.total < 0.005, `noninteractive PBL screenshot ${JSON.stringify(nativeDiff)}`);
        const pixels = await screenshotPixels(actual, cubePalette);
        assert.ok(Object.values(pixels.colors).filter(count => count > 100).length >= 3, `PBL has real colored sticker pixels: ${JSON.stringify(pixels)}`);
        if (previous) {
          const negative = await compareScreenshots(actual, previous);
          assert.ok(negative.changed / negative.total > 0.01, 'negative control: a previous formula screenshot cannot pass');
        }
        previous = actual;
      } finally { await page.getByTestId('native-pbl-reference').evaluateAll(nodes => nodes.forEach(node => node.remove())); }
    }
  });

  for (const fixture of cases) {
    await check(`${fixture.name}: fresh interactive auto selects ${fixture.puzzle === '2x2x2' && !nativeTwoLayer(fixture) ? '2D' : '3D'}`, async () => {
      await page.evaluate(() => window.mountPuzzle(false));
      await active().locator('.puzzle-diagram').waitFor({state: 'detached'});
      await page.evaluate(fixture => window.patchPuzzle({...fixture, stateSource: 'formula'}), fixture);
      await page.evaluate(() => window.mountPuzzle(true));
      if (fixture.puzzle === '2x2x2' && !nativeTwoLayer(fixture)) {
        await readySVG();
        assert.equal(await active().getByRole('button', {name: '2D', exact: true}).getAttribute('aria-pressed'), 'true');
        assert.equal(await active().locator(playerSelector).count(), 0);
      } else {
        await ready3D(active(), {selectMode: false});
        await assertCanvasPixels();
      }
    });
    await check(`${fixture.name}: local 2D diagram, native entry, no backend image`, async () => {
      await select(fixture);
      await ready2D();
      assert.equal(await active().locator('.puzzle-diagram').getAttribute('data-puzzle'), fixture.puzzle);
      const native = page.getByTestId('native');
      await ready2D(native);
      if (nativeTwoLayer(fixture)) {
        const actual = await active().locator('img').screenshot();
        const diff = await compareScreenshots(actual, await native.locator('img').screenshot());
        assert.ok(diff.changed / diff.total < 0.005, `PBL entries share native screenshot pixels: ${JSON.stringify(diff)}`);
        const pixels = await screenshotPixels(actual, cubePalette);
        assert.ok(Object.values(pixels.colors).reduce((a, b) => a + b, 0) > 1000, 'PBL PNG contains colored stickers');
      } else {
        const stickers = await fills(active());
        assert.ok(stickers.length > 5, 'color assertions must not compare empty arrays');
        assert.deepEqual(await fills(native), stickers, 'native entry renders same local state without image');
      }
    });
    await check(`${fixture.name}: 3D renders and formula playback advances`, async () => {
      await ready3D();
      await assertCanvasPixels();
      if (fixture.puzzle === 'square1') {
        const canvas = active().locator('canvas');
        assert.equal(await canvas.count(), 1);
        assert.equal(await canvas.isVisible(), true);
        await playSquare1();
      } else {
        const player = await playerIn();
        assert.equal(await player.count(), 1, 'no duplicated StrictMode player');
        assert.equal(await player.isVisible(), true);
        assert.equal(await player.evaluate(element => element.localName), fixture.puzzle === '2x2x2' ? 'twisty-player' : playerSelector);
        const actual = await player.evaluate(async element => ({
          alg: (await element.experimentalGet.alg()).toString(),
          setup: (await element.experimentalGet.setupAlg()).toString(),
          canvases: (await element.experimentalCurrentCanvases()).map(canvas => [canvas.width, canvas.height]),
        }));
        const expected = await page.evaluate(text => new window.puzzleAPI.Alg(text).toString(), fixture.normalized);
        assert.equal(actual.alg, expected, 'real normalized library formula reaches player');
        assert.ok(actual.canvases.length > 0 && actual.canvases.every(([w,h]) => w > 0 && h > 0));
        const start = await player.evaluate(async element => await element.experimentalGet.timestamp());
        assert.equal(start, 0);
        if (fixture === cases[0]) {
          await assert.rejects(poll('paused player progress', () => player.evaluate(async element => await element.experimentalGet.timestamp() > 0), {timeout: 250}), {name: 'TimeoutError'});
          await assert.rejects(poll('unsolved initial pattern', () => player.evaluate(async element => {
            const kpuzzle = await window.puzzleAPI.puzzles['2x2x2'].kpuzzle();
            return (await element.experimentalModel.currentPattern.get()).isIdentical(kpuzzle.defaultPattern());
          }), {timeout: 250}), {name: 'TimeoutError'});
        }
        await playTwisty(player);
        await poll(`${fixture.name} playback timestamp advances`, () => player.evaluate(async (element, start) => await element.experimentalGet.timestamp() > start, start));
        assert.ok(await player.evaluate(async element => await element.experimentalGet.timestamp()) > start);
        if (fixture.puzzle !== '2x2x2') await player.evaluate(element => { element.pause(); element.jumpToEnd(); });
        await poll(`${fixture.name} end timestamp and solved pattern`, () => player.evaluate(async element => {
          const end = (await element.experimentalModel.timeRange.get()).end;
          const timestamp = await element.experimentalGet.timestamp();
          const kpuzzle = await window.puzzleAPI.puzzles[await element.experimentalGet.puzzleID()].kpuzzle();
          return end > 0 && timestamp === end && (await element.experimentalModel.currentPattern.get()).isIdentical(kpuzzle.defaultPattern());
        }));
      }
      await active().getByRole('button', {name: '2D', exact: true}).dblclick();
      await ready2D();
      if (nativeTwoLayer(fixture)) await readyThumbnail();
    });
    await check(`${fixture.name}: standard scramble source reaches real 2D/3D`, async () => {
      await select(fixture, {stateSource: 'scramble'});
      await ready2D();
      assert.equal(await active().locator('.puzzle-diagram').getAttribute('data-state-source'), 'scramble');
      await ready3D();
      if (fixture.puzzle === 'square1') {
        assert.equal(await active().locator('canvas').count(), 1);
        assert.equal(await active().getByRole('button', {name: '播放', exact: true}).isEnabled(), true);
      } else {
        const setup = await (await playerIn()).evaluate(async element => (await element.experimentalGet.setupAlg()).toString());
        const moves = await page.evaluate(text => new window.puzzleAPI.Alg(text).toString(), fixture.scramble);
        // FTO setups persist their native domain to avoid reparsing generated
        // moves as library notation when reused by history/practice.
        const expected = fixture.puzzle === 'fto' ? '// cubing-pro:native\n' + moves : moves;
        assert.equal(setup, expected, 'standard setup is not interpreted as raw formula notation');
      }
      await active().getByRole('button', {name: '2D', exact: true}).click();
      await ready2D();
    });
  }

  await check('native LS formula and equivalent scramble preserve PNG pixels and native routing', async () => {
    for (const classId of ['LS', 'LS1', 'LS9', 'EGLS1', 'EGLS2', 'FakeBar']) {
      await select(cases[10], {classId, stateSource: 'formula'});
      await readyThumbnail();
      const formula = await active().locator('img').screenshot({path: `${screenshotDir}/222-${classId}-formula.png`});
      await select(cases[10], {classId, stateSource: 'scramble'});
      await readyThumbnail();
      const scramble = await active().locator('img').screenshot({path: `${screenshotDir}/222-${classId}-scramble.png`});
      const diff = await compareScreenshots(formula, scramble);
      assert.ok(diff.changed / diff.total < 0.005, `${classId}: equivalent sources share native pixels ${JSON.stringify(diff)}`);
    }
  });

  await check('lookalike 2x2 names and 3x3 LS/FakeBar keep their SVG route', async () => {
    for (const classId of ['TCLL+', 'TCLL-', 'TEG1', 'FakeBarfoo', 'LS10']) {
      await select(cases[0], {classId});
      await readySVG();
      assert.equal(await active().locator('[data-native-two-by-two-host]').count(), 0, classId);
    }
    for (const classId of ['LS1', 'LS9', 'EGLS1', 'EGLS2', 'FakeBar']) {
      await select(cases[1], {classId});
      await readySVG();
      assert.equal(await active().locator('.puzzle-diagram').getAttribute('data-puzzle'), '3x3x3');
      assert.equal(await active().locator('[data-native-two-by-two-host]').count(), 0, classId);
    }
  });

    await check('Skewb fan has 25 upstream polygons, visible scaling edges and softer sticker pixels', async () => {
     await select(cases[5], {formula: 'R R R', scramble: '', maxWidth: 180, maxHeight: 180});
     await readySVG();
     const svg = active().locator('svg[role=img]');
      const geometry = await svg.locator('polygon').evaluateAll(nodes => nodes.map(node => {
        const style = getComputedStyle(node);
        return {vertices:node.points.numberOfItems, fill:style.fill, stroke:style.stroke, width:style.strokeWidth, effect:style.vectorEffect};
      }));
      assert.equal(geometry.length,25,'five centers and twenty corners, no rectangular six-face net');
      assert.equal(geometry.filter(node => node.vertices === 4).length,5);
      assert.equal(geometry.filter(node => node.vertices === 3).length,20);
      assert.ok(geometry.every(node => node.width === '0.5px' && node.stroke === 'rgb(0, 0, 0)' && node.effect === 'none'),'upstream black edges scale with the fan');
     const rgbCSS = hex => `rgb(${hex.slice(1).match(/../g).map(part => parseInt(part, 16)).join(', ')})`;
      assert.deepEqual(geometry.slice(0,5).map(node => node.fill), ['U','F','R','B','L'].map(face => rgbCSS(skewbPalette[face])), 'fan centers keep the solved native orientation; D is hidden');
     const measures = [];
     for (const size of [180, 360]) {
       await page.evaluate(size => window.patchPuzzle({maxWidth: size, maxHeight: size}), size);
       const box = await svg.boundingBox();
       assert.ok(Math.abs(box.width - size) < 1, `actual SVG is ${size}px wide`);
        const actual = await svg.screenshot({path: `${screenshotDir}/skewb-2d-${size}.png`});
        await assertVendorReference(`skewb-fan-${size}`,{kind:'skewb',setup:'',palette:skewbPalette,identity:true});
       let baseline;
       try {
          await svg.locator('polygon').evaluateAll(nodes => nodes.forEach(node => { node.style.stroke = 'none'; }));
         baseline = await svg.screenshot();
       } finally {
          await svg.locator('polygon').evaluateAll(nodes => nodes.forEach(node => { node.style.removeProperty('stroke'); }));
       }
        const edges = await compareScreenshots(actual,baseline);
        assert.ok(edges.changed > 400,`${size}px: upstream edges actually paint pixels ${JSON.stringify(edges)}`);
        measures.push({size,changed:edges.changed});
       const pixels = await screenshotPixels(actual, skewbPalette);
        for (const face of ['U','F','R','B','L']) assert.ok(pixels.colors[face] > 60, `${size}px: softer ${face} is actually painted: ${JSON.stringify(pixels)}`);
        assert.equal(pixels.colors.D,0,'solved fan omits the D face');
       const vivid = await screenshotPixels(actual, cubePalette);
       assert.equal(Object.values(vivid.colors).reduce((a, b) => a + b, 0), 0, 'no old saturated cube sticker colors');
     }
      assert.ok(measures[1].changed > measures[0].changed * 2,'larger fan has more painted edge coverage');
      console.log('Skewb measured fan edge pixels', JSON.stringify(measures));
     await page.evaluate(() => window.patchPuzzle({maxWidth: 420, maxHeight: 260}));
   });

   await check('Skewb 3D scale 0.8 paints softer colors and wider real black borders without changing 3x3', async () => {
     await select(cases[5], {formula: 'R R R', scramble: '', maxWidth: 420, maxHeight: 320});
     await readySVG(); await ready3D();
     const player = active().locator(playerSelector);
     assert.equal(await player.evaluate(element => element.experimentalModel.twistySceneModel.faceletScale.get()), 0.8);
     const actual = await canvasScreenshot('skewb-3d-scale-08');
     const pixels = await screenshotPixels(actual, skewbPalette);
     const visible = Object.entries(pixels.colors).filter(([, count]) => count > 100);
     assert.ok(visible.length >= 3, `three visible softer faces: ${JSON.stringify(pixels)}`);
     assert.deepEqual(visible.map(([face]) => face), ['U', 'F', 'R'], 'solved native orientation shows the same U/F/R palette as 2D');
     assert.ok(pixels.centroids.U.y < pixels.centroids.F.y && pixels.centroids.U.y < pixels.centroids.R.y, 'yellow U pixels are on the top face');
     assert.ok(pixels.centroids.F.x < pixels.centroids.R.x, 'red F and green R pixels keep their 2D orientation in the 3D camera');
     assert.ok(pixels.black > 1000, `visible black plastic: ${JSON.stringify(pixels)}`);
     const vivid = await screenshotPixels(actual, cubePalette);
     assert.equal(Object.values(vivid.colors).reduce((a, b) => a + b, 0), 0, 'Skewb shader paints the soft palette, not the cube palette');
     // PG3D cannot resize existing facelets (cubing 0.63.3). Recreate the actual
     // component with only its native scale setter overridden for the control.
     await page.evaluate(() => {
       let prototype = window.puzzleAPI.TwistyPlayer.prototype;
       while (prototype && !Object.getOwnPropertyDescriptor(prototype, 'experimentalFaceletScale')) prototype = Object.getPrototypeOf(prototype);
       const descriptor = Object.getOwnPropertyDescriptor(prototype, 'experimentalFaceletScale');
       window.restoreFaceletScale = () => Object.defineProperty(prototype, 'experimentalFaceletScale', descriptor);
       window.requestedFaceletScales = [];
       Object.defineProperty(prototype, 'experimentalFaceletScale', {...descriptor, set(value) {
         window.requestedFaceletScales.push(value);
         descriptor.set.call(this, 1);
       }});
       window.patchPuzzle({formula: 'R R R '});
     });
     let full;
     try {
       await poll('remounted negative control uses full-size facelets', () => player.evaluate(element => element.experimentalModel.twistySceneModel.faceletScale.get()).then(scale => scale === 1));
       await ready3D(active(), {selectMode: false});
       assert.equal(await player.evaluate(element => element.experimentalModel.twistySceneModel.faceletScale.get()), 1);
       assert.deepEqual(await page.evaluate(() => [...new Set(window.requestedFaceletScales)]), [0.8], 'real component requests 0.8 during construction');
       full = await screenshotPixels(await canvasScreenshot('skewb-3d-scale-1'), skewbPalette);
     } finally {
       await page.evaluate(() => { window.restoreFaceletScale(); window.patchPuzzle({formula: 'R R R'}); });
     }
     assert.ok(full.black < pixels.black * 0.7, `full-size facelets remove the wide black borders: ${JSON.stringify({inset: pixels, full})}`);
     assert.ok(Object.values(full.colors).reduce((a, b) => a + b, 0) > Object.values(pixels.colors).reduce((a, b) => a + b, 0), 'full-size stickers occupy the former black border');
     await ready3D(active(), {selectMode: false});
     let restored;
     await poll('scale 0.8 restores the black borders and palette pixels', async () => {
       restored = await canvasScreenshot('skewb-3d-scale-08-restored');
       const diff = await compareScreenshots(actual, restored);
       return diff.changed / diff.total < 0.005;
     });
     console.log('Skewb 3D raster counts', JSON.stringify({scale08: pixels, scale1: full}));
     await select(cases[1], {classId: '', formula: 'R4', scramble: 'R4', stateSource: 'scramble'});
     await readySVG();
     const svg = await screenshotPixels(await active().locator('svg[role=img]').screenshot({path: `${screenshotDir}/333-palette-2d.png`}), cubePalette);
      assert.ok(['U','F','R','B','L'].every(face => svg.colors[face] > 50), `3x3 plan keeps original top/rim colors: ${JSON.stringify(svg)}`);
      assert.equal(svg.colors.D,0,'new plan layout hides the solved bottom face');
     await ready3D();
     assert.notEqual(await active().locator(playerSelector).evaluate(element => element.experimentalModel.twistySceneModel.faceletScale.get()), 0.8, 'Skewb inset is not applied to 3x3');
     const cube = await screenshotPixels(await canvasScreenshot('333-palette-3d'), cubePalette);
     assert.ok(Object.values(cube.colors).filter(count => count > 100).length >= 3, `3x3 shader keeps original palette: ${JSON.stringify(cube)}`);
     const soft = await screenshotPixels(await canvasScreenshot('333-no-skewb-palette'), skewbPalette);
     assert.equal(Object.values(soft.colors).reduce((a, b) => a + b, 0), 0, '3x3 has no Skewb palette pixels');
   });

  await check('same-page Skewb fan never overrides Megaminx upstream strokes or pixels', async () => {
    await select(cases[1]); await readySVG();
    await page.evaluate(() => window.showSVGRegression(true));
    try {
      const mega = page.getByTestId('megaR');
      await readySVG(mega);
      const svg = mega.locator('svg[role="img"]');
      const strokes = svg => [...svg.querySelectorAll('polygon')].map(polygon => {
        const css = getComputedStyle(polygon);
        return [css.stroke,css.strokeWidth,css.strokeLinejoin];
      });
      const before = await svg.evaluate(strokes);
      const beforePNG = await svg.screenshot({path:`${screenshotDir}/mega-before-skewb.png`});
      await page.evaluate(options => window.mountVendorReference(options),{kind:'megaminx',setup:'R R R R',bounds:await svg.boundingBox()});
      try {
        const reference = page.getByTestId('vendor-reference').locator('svg');
        assert.deepEqual(before,await reference.evaluate(strokes),'baseline stroke is independently rendered upstream');
        const diff = await compareScreenshots(beforePNG,await reference.screenshot());
        assert.ok(diff.changed/diff.total<0.005,`baseline upstream pixels ${JSON.stringify(diff)}`);
      } finally { await page.getByTestId('vendor-reference').evaluateAll(nodes => nodes.forEach(node => node.remove())); }
      await select(cases[5],{formula:'H',scramble:''}); await readySVG();
      assert.equal(await active().locator('svg style').count(),0,'Skewb has no global polygon style');
      const fan = await active().locator('svg[role="img"]').evaluate(strokes);
      assert.equal(fan.length,25);
      assert.ok(fan.every(([stroke,width,join]) => stroke==='rgb(0, 0, 0)' && width==='0.5px' && join==='round'));
      await readySVG(mega);
      assert.deepEqual(await svg.evaluate(strokes),before,'same-page Skewb leaves Mega computed strokes unchanged');
      const diff = await compareScreenshots(beforePNG,await svg.screenshot({path:`${screenshotDir}/mega-with-skewb.png`}));
      assert.ok(diff.changed/diff.total<0.005,`same-page Skewb leaves actual Mega pixels unchanged ${JSON.stringify(diff)}`);
    } finally { await page.evaluate(() => window.showSVGRegression(false)); }
  });

   await check('same-page vendor plan/iso IDs and any href/url references are isolated', async () => {
    await page.evaluate(() => window.showSVGRegression(true));
    try {
      for (const classId of ['PLL', 'F2L']) {
        for (const formula of ['R', 'F']) await readySVG(page.getByTestId(classId + formula));
        assert.notDeepEqual(await fills(page.getByTestId(classId + 'R')), await fills(page.getByTestId(classId + 'F')), 'fixtures have different sticker positions');
      }
      for (const formula of ['R','F']) {
        const scope = page.getByTestId('mega'+formula);
        await scope.scrollIntoViewIfNeeded();
        await scope.locator('svg[role="img"], [role="alert"]').first().waitFor({state:'attached'});
        assert.deepEqual(await scope.getByRole('alert').allTextContents(),[]);
      }
      const report = await page.getByTestId('svg-regression').evaluate(host => {
        const ids = [...document.querySelectorAll('[id]')].filter(node => !node.closest('[data-native-two-by-two]')).map(node => node.id);
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        const svgs = [...host.querySelectorAll('svg[role="img"]')].map(svg => {
          const invalid = [], undefinedStops = [];
          let references = 0;
          const verify = id => {
            references++;
            const target = [...svg.querySelectorAll('[id]')].find(node => node.id === id);
            if (!target || target.closest('svg') !== svg || document.getElementById(id) !== target) invalid.push(id);
          };
          for (const node of [svg, ...svg.querySelectorAll('*')]) {
            if (node.localName === 'stop' && /undefined/i.test(node.outerHTML)) undefinedStops.push(node.outerHTML);
            for (const attr of node.attributes) {
              if (attr.localName === 'href') {
                if (attr.value.startsWith('#')) verify(attr.value.slice(1));
                else invalid.push(attr.value);
              }
            }
            const values = [...node.attributes].map(attr => attr.value);
            if (node.localName === 'style') values.push(node.textContent);
            for (const value of values) for (const match of value.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
              if (match[1].startsWith('#')) verify(match[1].slice(1));
              else invalid.push(match[1]);
            }
          }
          return {references, invalid, undefinedStops, ids:[svg,...svg.querySelectorAll('[id]')].map(node => node.id).filter(Boolean)};
        });
        return {duplicates, svgs};
      });
      assert.deepEqual(report.duplicates, [], 'all document IDs are unique across LL and net instances');
      assert.equal(report.svgs.length, 6);
      assert.ok(report.svgs.slice(4).every(svg => svg.ids.length >= 2),'real upstream SVG root and marker IDs make isolation assertions nonempty');
      for (const svg of report.svgs) {
        assert.deepEqual(svg.invalid, [], 'href and url resolve only inside the owning SVG');
        assert.deepEqual(svg.undefinedStops, [], 'PLL and net gradient stop colors never contain undefined');
      }
    } finally { await page.evaluate(() => window.showSVGRegression(false)); }
  });

  await check('formula/scramble source switches actual state and restores formula state', async () => {
    await select(cases[1], {classId: 'F2L', formula: 'R', scramble: 'U'});
    await readySVG();
    const formula = await fills(active());
    await page.evaluate(() => window.patchPuzzle({stateSource: 'scramble'}));
    await readySVG();
    const scramble = await fills(active());
    assert.notDeepEqual(scramble, formula, 'R inverse and U setup are distinct states');
    await ready3D();
    assert.equal(await active().locator(playerSelector).evaluate(async element => (await element.experimentalGet.setupAlg()).toString()), 'U');
    await active().getByRole('button', {name: '2D', exact: true}).click();
    await page.evaluate(() => window.patchPuzzle({stateSource: 'formula'}));
    await readySVG();
    assert.deepEqual(await fills(active()), formula);
  });

  await check('SQ1 shape changes during real 3D stepping and resets', async () => {
    await select(cases[6]); await readySVG(); await ready3D();
    const canvas = active().locator('canvas');
    const start = await canvas.screenshot();
    await active().getByRole('button', {name: '下一步', exact: true}).click();
    await poll('Square-1 step reaches one', () => page.evaluate(() => document.querySelector('[data-testid="active"] input[type="range"]').value === '1'));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const changed = await canvas.screenshot();
    assert.notDeepEqual(changed, start, 'slash changes physical piece geometry');
    await active().getByRole('button', {name: '回到公式初态', exact: true}).click();
    assert.equal(await active().getByRole('slider').inputValue(), '0');
    await page.screenshot({path: `${screenshotDir}/square1-3d.png`, fullPage: true});
  });

  await check('SQ1 real [B B] /U\'eD\' preserves source starting view and plays in 3D', async () => {
    const formula = "[B B] /U'eD'";
    const prepared = await page.evaluate(async formula => {
      const state = await window.puzzleAPI.preparePuzzle('square1', formula, '', 'formula');
      return {annotation: state.annotation, warning: state.warning, alg: state.alg};
    }, formula);
    assert.equal(prepared.annotation, '[B B]');
    assert.equal(prepared.warning, undefined);
    assert.ok(prepared.alg.length > 0);
    await select(cases[6], {formula, scramble: ''});
    await readySVG();
    const annotation = active().getByText(/原始起手提示 \[B B\]/);
    assert.equal(await annotation.isVisible(), true);
    assert.match(await annotation.textContent(), /图示与动画采用正文标准握法/);
    const annotated = await fills(active());
    await select(cases[6], {formula: "/U'eD'", scramble: ''});
    await readySVG();
    assert.deepEqual(await fills(active()), annotated, 'source label does not change the standard body state');
    assert.equal(await active().getByText(/原始起手提示/).count(), 0);
    await select(cases[6], {formula, scramble: ''});
    await readySVG(); await ready3D();
    assert.equal(await annotation.isVisible(), true);
    await playSquare1();
    assert.deepEqual(await active().getByRole('alert').allTextContents(), []);
  });

  await check('SQ1 illegal slice falls back to the real setup with warning and disabled playback', async () => {
    await select(cases[6], {formula: '/ (1,0)'});
    await readySVG();
    const warning = active().getByRole('status');
    assert.match(await warning.textContent(), /图示由标准 setup 生成/);
    assert.match(await warning.textContent(), /Illegal Square-1 slice/);
    const fallback = await fills(active());
    await ready3D();
    assert.equal(await active().locator('canvas').isVisible(), true);
    assert.equal(await active().getByRole('button', {name: '播放', exact: true}).isDisabled(), true);
    assert.equal(await active().getByRole('slider').isDisabled(), true);
    assert.match(await warning.textContent(), /Illegal Square-1 slice/);
    await select(cases[6], {formula: ''});
    await readySVG();
    assert.deepEqual(await fills(active()), fallback, 'fallback diagram is the standard scramble state');
    assert.equal(await active().getByRole('status').count(), 0);
  });

  await check('preferences UI updates two mounted diagrams on the same page and persists', async () => {
    await select(cases[1], {classId: 'F2L'}); await readySVG();
    const before = await fills(active());
    await page.getByTestId('preferences').getByLabel('底色', {exact: true}).selectOption('yellow');
    await readySVG(); await readySVG(page.getByTestId('native'));
    assert.notDeepEqual(await fills(active()), before);
    assert.deepEqual(await fills(active()), await fills(page.getByTestId('native')));
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('algs_puzzle_preferences_v1')));
    assert.equal(stored.bottom, 'yellow');
    await page.getByTestId('preferences').getByLabel('前色', {exact: true}).selectOption('blue');
    await readySVG();
    assert.deepEqual(await fills(active()), await fills(page.getByTestId('native')));
  });

  await check('invalid notation has explicit alert and valid next question recovers', async () => {
    await select(cases[1], {formula: 'NOT_A_MOVE!', scramble: ''});
    await active().getByRole('alert').waitFor();
    assert.match(await active().getByRole('alert').textContent(), /无法生成图示|Cannot render/);
    assert.equal(await active().locator('svg[role="img"]').count(), 0);
    await select(cases[1]); await readySVG();
    await select(cases[6], {formula: '/ (1,0)', scramble: ''});
    await active().getByRole('alert').waitFor();
    assert.match(await active().getByRole('alert').textContent(), /Illegal Square-1 slice/i);
  });

  await check('source mismatch and unsupported actions alert instead of painting a false solved state', async () => {
    for (const [base,patch,message] of [
      [1,{formula:'R // browser-source-mismatch',scramble:''},/setup\/pattern mismatch/],
      [5,{formula:'R // browser-source-mismatch',scramble:''},/setup\/pattern mismatch/],
      [1,{cube:'555',formula:'',scramble:'UNKNOWN',stateSource:'scramble'},/Bad grip|Invalid|Unknown|Unsupported/i],
      [5,{formula:'',scramble:'Rv',stateSource:'scramble'},/Unsupported skewb/],
      [7,{formula:'',scramble:'2r',stateSource:'scramble'},/Unsupported pyraminx/],
      [4,{formula:'',scramble:'UNKNOWN',stateSource:'scramble'},/Bad grip|Invalid|Unknown|Unsupported/i],
      [1,{cube:'unsupported-puzzle',formula:'R',scramble:''},/暂不支持|Unsupported puzzle/],
    ]) {
      await select(cases[base],patch);
      await active().getByRole('alert').waitFor();
      assert.match(await active().getByRole('alert').textContent(),message);
      assert.equal(await active().locator('svg[role="img"], img, canvas, twisty-player, cubing-pro-managed-twisty-player').count(),0,'error never leaves a stale or solved diagram/player');
      assert.doesNotMatch(await active().locator('details').textContent().catch(() => ''),/已复原|Solved/,'error never claims a solved setup');
    }
    await select(cases[1]); await readySVG();
  });

  await check('valid native Pyraminx state with unsupported SVG action alerts in 2D but renders and plays in 3D', async () => {
    const prepared = await page.evaluate(async () => {
      const {puzzles,Alg} = window.puzzleAPI;
      const kpuzzle = await puzzles.pyraminx.kpuzzle();
      const setup = '2r';
      const pattern = kpuzzle.defaultPattern().applyAlg(new Alg(setup));
      const alg = "2r'";
      window.nativePyraFixture = {kpuzzle,pattern,setup,alg};
      return {nonidentity:!pattern.isIdentical(kpuzzle.defaultPattern()),solved:pattern.applyAlg(new Alg(alg)).isIdentical(kpuzzle.defaultPattern())};
    });
    assert.deepEqual(prepared,{nonidentity:true,solved:true},'fixture is a valid, independently verified native state and solution');
    await select(cases[7],{cube:'pyraminx',classId:'',formula:'// browser-native-pyra-2r',scramble:''});
    const alert = active().getByRole('alert');
    await alert.waitFor();
    assert.match(await alert.textContent(),/无法生成平面图|Cannot render 2D/);
    assert.match(await alert.textContent(),/Unsupported pyraminx diagram action: 2r/);
    assert.equal(await active().locator('svg[role="img"], canvas').count(),0);
    assert.equal(await active().locator('.puzzle-diagram').getAttribute('data-puzzle'),'pyraminx');
    assert.equal(await active().locator('details code').textContent(),'2r','2D failure retains the validated native setup');
    await ready3D(); await assertCanvasPixels();
    const player = await playerIn();
    const state = await player.evaluate(async element => {
      const k = await window.puzzleAPI.puzzles.pyraminx.kpuzzle();
      return {setup:(await element.experimentalGet.setupAlg()).toString(),alg:(await element.experimentalGet.alg()).toString(),
        matches:(await element.experimentalModel.currentPattern.get()).isIdentical(k.defaultPattern().applyAlg('2r'))};
    });
    assert.deepEqual(state,{setup:'2r',alg:"2r'",matches:true});
    await playTwisty(player);
    await poll('unsupported-SVG native state still plays in 3D',() => player.evaluate(async element => await element.experimentalGet.timestamp()>0));
    await player.evaluate(element => {element.pause();element.jumpToEnd();});
    await poll('native Pyra solution reaches solved state',() => player.evaluate(async element => {
      const k = await window.puzzleAPI.puzzles.pyraminx.kpuzzle();
      return (await element.experimentalModel.currentPattern.get()).isIdentical(k.defaultPattern());
    }));
    await active().getByRole('button',{name:'2D',exact:true}).click();
    await alert.waitFor();
    assert.match(await alert.textContent(),/Unsupported pyraminx diagram action: 2r/);
    assert.equal(await active().locator('svg[role="img"], canvas, cubing-pro-managed-twisty-player').count(),0,'returning to 2D restores the explicit error, never a solved SVG');
    await select(cases[1]); await readySVG();
  });

  await check('rapid question changes retain latest asynchronous SVG/player only', async () => {
    await select(cases[0]);
    await page.evaluate(async () => {
      for (const fixture of window.puzzleFixtures) {
        window.patchPuzzle({...fixture, scramble: fixture.scramble + ' ', stateSource: 'formula'});
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      window.patchPuzzle({...window.puzzleFixtures[1], classId: 'F2L', formula: 'F', scramble: 'U'});
    });
    await readySVG();
    assert.equal(await active().locator('.puzzle-diagram').getAttribute('data-puzzle'), '3x3x3');
    await ready3D();
    const latest = await active().locator(playerSelector).evaluate(async element => ({alg: (await element.experimentalGet.alg()).toString(), setup: (await element.experimentalGet.setupAlg()).toString()}));
    assert.deepEqual(latest, {alg: 'F', setup: "F'"});
    assert.equal(await active().locator(playerSelector).count(), 1);
  });

  await check('320/768/1440 layouts in both modes have no horizontal overflow', async () => {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({width, height: 1000});
      for (const mode of ['2D', '3D']) {
        await active().getByRole('button', {name: mode, exact: true}).click();
        if (mode === '2D') await readySVG(); else await ready3D();
        const metrics = await active().evaluate(element => ({
          document: document.documentElement.scrollWidth <= innerWidth + 1,
          local: element.scrollWidth <= element.clientWidth + 1,
          right: element.getBoundingClientRect().right <= innerWidth + 1,
        }));
        assert.deepEqual(metrics, {document: true, local: true, right: true}, `${width}px ${mode}`);
        await page.screenshot({path: `${screenshotDir}/puzzle-${width}-${mode}.png`, fullPage: true});
      }
    }
  });

  await check('actual AlgsModal entry renders local SVG and playable 3D', async () => {
    await page.getByRole('button', {name: 'Open native modal'}).click();
    const dialog = page.getByRole('dialog');
    await ready3D(dialog, {selectMode: false});
    await dialog.getByRole('button', {name: '2D', exact: true}).click();
    await readySVG(dialog);
    await ready3D(dialog);
    await playTwisty(dialog.locator(playerSelector));
    await poll('native modal playback advances', () => dialog.locator(playerSelector).evaluate(async element => await element.experimentalGet.timestamp() > 0));
    assert.ok(await dialog.locator(playerSelector).evaluate(async element => await element.experimentalGet.timestamp()) > 0);
    await page.keyboard.press('Escape');
    await dialog.waitFor({state: 'hidden'});
  });

  await check('PBL AlgsModal auto uses original native player, trapped controls play to solved, double 2D click keeps 3D PNG', async () => {
    await page.evaluate(() => { window.mountPuzzle(false); window.setModalFixture(window.puzzleFixtures[9]); });
    await active().locator('.puzzle-diagram').waitFor({state: 'detached'});
    await page.getByRole('button', {name: 'Open native modal'}).click();
    const dialog = page.getByRole('dialog');
    try {
      await ready3D(dialog, {selectMode: false});
      const player = await playerIn(dialog);
      assert.equal(await player.evaluate(element => element.localName), 'twisty-player');
      assert.equal(await player.evaluate(element => element.constructor === window.puzzleAPI.TwistyPlayer), true);
      assert.equal(await dialog.locator(playerSelector).count(), 0);
      try { await assertCanvasPixels(dialog); }
      catch (error) {
        const diagnostic = await player.evaluate(async element => {
          const root = element.parentElement;
          const [canvas] = await element.experimentalCurrentCanvases();
          const rect = canvas.getBoundingClientRect();
          const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          const dialog = document.querySelector('[role="dialog"]');
          return {playerZ: getComputedStyle(root).zIndex, dialogZ: getComputedStyle(dialog).zIndex,
            hit: hit?.localName, controlledRegionReceivesPointer: !!hit && root.contains(hit),
            canvasSize: [rect.width, rect.height]};
        });
        console.error('PBL modal capture diagnostic', JSON.stringify(diagnostic));
        await page.screenshot({path: `${screenshotDir}/pbl-modal-occluded.png`, fullPage: true});
        throw error;
      }
      await playTwisty(player);
      await poll('PBL modal click plays all the way to the solved state', () => player.evaluate(async element => {
        const end = (await element.experimentalModel.timeRange.get()).end;
        const kpuzzle = await window.puzzleAPI.puzzles['2x2x2'].kpuzzle();
        return end > 0 && await element.experimentalGet.timestamp() === end
          && (await element.experimentalModel.currentPattern.get()).isIdentical(kpuzzle.defaultPattern());
      }), {timeout: 15000});
      await dialog.getByRole('button', {name: '2D', exact: true}).dblclick();
      await readyThumbnail(dialog);
      const pixels = await screenshotPixels(await dialog.locator('img').screenshot(), cubePalette);
      assert.ok(Object.values(pixels.colors).reduce((a, b) => a + b, 0) > 1000, 'double-click still displays nonempty native 3D PNG pixels');
    } finally {
      await page.keyboard.press('Escape');
      await dialog.waitFor({state: 'hidden'});
      await page.evaluate(() => { window.setModalFixture(window.puzzleFixtures[1]); window.mountPuzzle(true); });
    }
  });

  await check('unmount/remount removes real players and recreates one clean instance', async () => {
    await page.evaluate(() => window.mountPuzzle(false));
    await active().locator('.puzzle-diagram').waitFor({state: 'detached'});
    assert.equal(await active().locator(`${playerSelector}, canvas`).count(), 0);
    await page.evaluate(() => window.mountPuzzle(true));
    await ready3D(active(), {selectMode: false});
    await active().getByRole('button', {name: '2D', exact: true}).click();
    await readySVG(); await ready3D();
    assert.equal(await active().locator(playerSelector).count(), 1);
    await page.evaluate(() => window.mountPuzzle(false));
    await active().locator('.puzzle-diagram').waitFor({state: 'detached'});
    await poll('disposed WebGL contexts', () => page.evaluate(() => window.puzzleResources().contexts === 0));
    const baseline = await page.evaluate(() => window.puzzleResources());
    for (let cycle = 0; cycle < 6; cycle++) {
      await page.evaluate(() => window.mountPuzzle(true));
      await ready3D(active(), {selectMode: false});
      assert.equal(await active().locator(playerSelector).count(), 1);
      const mounted = await page.evaluate(() => window.puzzleResources());
      assert.equal(mounted.observers, baseline.observers + 1, `cycle ${cycle}: exactly one viewer observer`);
      assert.equal(mounted.contexts, baseline.contexts + 1, `cycle ${cycle}: exactly one viewer context`);
      await assertCanvasPixels();
      await page.evaluate(() => window.mountPuzzle(false));
      await active().locator('.puzzle-diagram').waitFor({state: 'detached'});
      await poll(`cycle ${cycle} observer/context disposal`, () => page.evaluate(baseline => {
        const now = window.puzzleResources();
        return now.observers === baseline.observers && now.contexts === baseline.contexts
          && now.nativePlayers === baseline.nativePlayers && now.nativeObservers === baseline.nativeObservers
          && now.nativeContexts === baseline.nativeContexts;
      }, baseline));
    }
    const disposed = await page.evaluate(() => window.puzzleResources());
    assert.ok(disposed.createdObservers >= baseline.createdObservers + 6, 'monitor observed real allocations');
    assert.ok(disposed.createdContexts >= baseline.createdContexts + 6, 'monitor observed real WebGL contexts');
    await page.evaluate(() => window.puzzleRoot.unmount());
    assert.equal(await page.locator(playerSelector).count(), 0, 'no managed player survives anywhere in the document');
    assert.equal(await page.locator('canvas').evaluateAll(nodes => nodes.filter(node => {
      for (let current = node; current; current = current.parentNode || current.host) {
        if (current.dataset?.nativeTwoByTwo) return false;
      }
      return true;
    }).length), 0, 'no non-pool canvas survives anywhere in the document');
    const native = await page.locator('[data-native-two-by-two]').evaluateAll(roots => roots.map(root => ({
      kind: root.dataset.nativeTwoByTwo, connected: root.isConnected, parked: root.inert && root.getAttribute('aria-hidden') === 'true',
      outside: root.getBoundingClientRect().right < 0, players: root.querySelectorAll('twisty-player').length,
    })));
    assert.equal(native.length, 2, 'only the thumbnail and interactive native pool slots survive');
    assert.deepEqual(native.map(slot => slot.kind).sort(), ['interactive', 'thumbnail']);
    assert.ok(native.every(slot => slot.connected && slot.parked && slot.outside && slot.players === 1), 'native slots stay connected and parked outside the viewport');
    await poll('root releases all observers and contexts', () => page.evaluate(() => {
      const now = window.puzzleResources();
      return now.observers === 0 && now.contexts === 0;
    }));
  });
  await check('no external resources, backend requests, runtime or console errors', async () => {
    assert.deepEqual(foreign, []);
    assert.deepEqual(backendRequests, []);
    assert.deepEqual(failedRequests, []);
    assert.deepEqual(errors, []);
    assert.deepEqual(consoleErrors, []);
  });
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
console.log(`\n${passed} passed, ${failures.length} failed; screenshots: ${screenshotDir}`);
if (failures.length) {
  for (const failure of failures) console.error(`\n${failure.name}\n${failure.error}`);
  process.exitCode = 1;
}
