import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const artifacts = await mkdtemp(join(tmpdir(), 'team-match-colors-'));
const bundle = await build({
  stdin: { resolveDir: root, contents: `
    import html2canvas from 'html2canvas';
    import {html2canvasWithColors, createCanvasColorNormalizer} from './src/lib/html2canvasColors';
    import {exportBracketElementToPng} from './src/views/TeamMatch/bracketExportPng';
    import './src/styles/tokens.css';
    Object.assign(window, {html2canvas, html2canvasWithColors, createCanvasColorNormalizer, exportBracketElementToPng});
  ` },
  bundle: true, write: false, outdir: '/fixture', format: 'iife',
});
const js = bundle.outputFiles.find(file => file.path.endsWith('.js')).text;
const css = bundle.outputFiles.find(file => file.path.endsWith('.css')).text;
const server = createServer((request, response) => {
  response.setHeader('Content-Type', request.url === '/bundle.js' ? 'text/javascript' : 'text/html');
  response.end(request.url === '/bundle.js' ? js : `<!doctype html><html class="light"><head><style>
    ${css}
    html {background:color(srgb .1 .2 .3); color:oklch(.6 .1 240)}
    body {margin:0; background:oklch(.9 .02 200); color:color(srgb .2 .3 .4)}
    #capture {position:relative; width:320px; height:240px; background:var(--background); color:color(srgb .2 .3 .4);}
    .swatch {position:absolute; width:60px; height:40px; top:20px; background:color-mix(in srgb,var(--accent) 75%,transparent)}
    #one {left:20px; border:3px solid oklch(.65 .15 240); text-decoration:underline color(srgb .9 .2 .3); box-shadow:4px 4px 3px color(srgb .2 .4 .6 / .4), -3px -3px 2px oklch(.6 .1 20 / .5)}
    #gradient {left:120px; width:160px; background:linear-gradient(90deg,color-mix(in srgb,color(srgb 1 0 0) 80%,oklch(.6 .1 30)),color(srgb 0 0 1 / .8));}
    #radial {position:absolute;left:120px;top:85px;width:160px;height:40px;background:radial-gradient(circle,color(srgb 0 1 0),oklch(.5 .2 270))}
    #pseudo {position:absolute;left:20px;top:90px;width:60px;height:30px;text-shadow:1px 2px 2px oklch(.7 .1 40 / .5);}
    #pseudo::before {content:"";position:absolute;inset:0;background:color(srgb .8 .15 .4 / .7);border:2px solid color-mix(in srgb,red,blue);box-shadow:1px 2px 2px color(srgb .1 .2 .3 / .4)}
    #pseudo::after {content:"A";color:oklch(.7 .15 220);text-shadow:1px 1px 1px color(srgb 0 0 0 / .4)}
    .tmBracketScaleWrap {position:absolute;top:160px;width:320px;height:40px;transform:scale(.5);transform-origin:top center}
    #edge {position:absolute;right:0;top:0;width:30px;height:30px;background:color(srgb 0 1 0)}
  </style></head><body><div id="capture" class="tmBracketExportBlock"><div id="one" class="swatch"></div><div id="gradient" class="swatch"></div><div id="radial"></div><div id="pseudo"></div><div class="tmBracketScaleWrap"><div id="edge"></div></div></div><script src="/bundle.js"></script></body></html>`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const baseline = await page.evaluate(async () => {
    try {
      await window.html2canvas(document.querySelector('#capture'), { logging: false });
      return 'unexpected success';
    } catch (error) {
      return String(error);
    } finally {
      document.querySelectorAll('iframe.html2canvas-container').forEach(frame => frame.remove());
    }
  });
  assert.match(baseline, /unsupported color function/i);

  const transparent = await page.evaluate(async () => {
    const source = document.documentElement.outerHTML;
    const canvas = await window.html2canvasWithColors(document.querySelector('#capture'), {
      logging: false, scale: 1, backgroundColor: 'color(srgb .2 .4 .6 / .4)',
      onclone: (_doc, clone) => { clone.style.backgroundColor = 'transparent'; },
    });
    return {
      pixel: [...canvas.getContext('2d').getImageData(5, 5, 1, 1).data],
      unchanged: source === document.documentElement.outerHTML,
    };
  });
  assert.equal(transparent.unchanged, true);
  transparent.pixel.forEach((value, index) => assert.ok(Math.abs(value - [51, 102, 153, 102][index]) <= 1));

  for (const theme of ['light', 'dark']) for (const palette of ['haitian', 'qingdai', 'zheshi']) {
    const result = await page.evaluate(async ({ theme, palette }) => {
      document.documentElement.className = theme;
      document.documentElement.dataset.palette = palette;
      const source = document.documentElement.outerHTML;
      const root = document.querySelector('#capture');
      const normalize = window.createCanvasColorNormalizer(document);
      const alpha = normalize('color(srgb .2 .4 .6 / .4)');
      const compound = normalize('linear-gradient(90deg, color-mix(in srgb, color(srgb 1 0 0) 40%, oklch(.7 .1 30)), color(srgb 0 0 1 / .5)), url("data:test(color(srgb)")');
      let pseudoCount = 0;
      const canvas = await window.html2canvasWithColors(root, {
        scale: 1, logging: false, backgroundColor: 'color(srgb .12 .23 .34 / .8)',
        onclone: (_doc, cloned) => { pseudoCount = cloned.querySelectorAll('html2canvaspseudoelement').length; },
      });
      const pixel = (x, y) => [...canvas.getContext('2d').getImageData(x, y, 1, 1).data];
      const native = document.createElement('canvas').getContext('2d');
      native.fillStyle = getComputedStyle(root).backgroundColor;
      native.fillRect(0, 0, 1, 1);
      const expectedBackground = [...native.getImageData(0, 0, 1, 1).data];
      native.clearRect(0, 0, 1, 1);
      native.fillStyle = getComputedStyle(root).backgroundColor;
      native.fillRect(0, 0, 1, 1);
      native.fillStyle = getComputedStyle(document.querySelector('#one')).backgroundColor;
      native.fillRect(0, 0, 1, 1);
      return {
        unchanged: source === document.documentElement.outerHTML,
        alpha, compound, pseudoCount, width: canvas.width, height: canvas.height,
        background: pixel(5, 5), expectedBackground,
        swatch: pixel(40, 40), expectedSwatch: [...native.getImageData(0, 0, 1, 1).data],
        gradientLeft: pixel(125, 40), gradientRight: pixel(270, 40),
        radialCenter: pixel(200, 105), radialEdge: pixel(125, 90),
        pseudo: pixel(40, 105), shadow: pixel(85, 45),
        png: canvas.toDataURL(), frames: document.querySelectorAll('iframe.html2canvas-container').length,
      };
    }, { theme, palette });
    assert.equal(result.unchanged, true, 'source DOM is unchanged');
    assert.equal(result.frames, 0);
    assert.equal(result.pseudoCount, 2);
    assert.equal(result.width, 320);
    assert.equal(result.height, 240);
    const alphaChannels = result.alpha.match(/[\d.]+/g).map(Number);
    assert.equal(alphaChannels[3], 0.4);
    alphaChannels.slice(0, 3).forEach((value, index) => assert.ok(Math.abs(value - [51, 102, 153][index]) <= 1));
    assert.match(result.compound, /^linear-gradient\(90deg, rgba\([^)]*\), rgba\([^)]*\)\), url\("data:test\(color\(srgb\)"\)$/);
    const close = (actual, expected) => actual.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) <= 2, `${actual} ~ ${expected}`));
    close(result.background, result.expectedBackground);
    close(result.swatch, result.expectedSwatch);
    assert.ok(result.gradientLeft[0] > result.gradientRight[0] + 80);
    assert.ok(result.gradientRight[2] > result.gradientLeft[2] + 80);
    assert.notDeepEqual(result.radialCenter, result.radialEdge);
    assert.notDeepEqual(result.pseudo, result.background);
    assert.notDeepEqual(result.shadow, result.background);
    assert.ok(Buffer.from(result.png.split(',')[1], 'base64').byteLength > 1000);

    const before = await page.evaluate(() => document.documentElement.outerHTML);
    const downloadPromise = page.waitForEvent('download');
    await page.evaluate(() => window.exportBracketElementToPng(document.querySelector('#capture'), 'bracket.png'));
    const download = await downloadPromise;
    const path = join(artifacts, `${theme}-${palette}.png`);
    await download.saveAs(path);
    const png = await readFile(path);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 640);
    assert.equal(png.readUInt32BE(20), 480);
    const edge = await page.evaluate(async data => {
      const image = new Image(); image.src = data; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      return [...context.getImageData(620, 340, 1, 1).data];
    }, `data:image/png;base64,${png.toString('base64')}`);
    assert.deepEqual(edge, [0, 255, 0, 255], 'export removes scale through the screenshot root');
    assert.equal(await page.evaluate(() => document.documentElement.outerHTML), before);
    console.log(`PASS ${theme}/${palette}: RGBA pixels, gradients, shadows, pseudo-elements, PNG download, source DOM`);
  }

  const cleanup = await page.evaluate(async () => {
    const root = document.querySelector('#capture');
    const source = document.documentElement.outerHTML;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let entered;
    const started = new Promise(resolve => { entered = resolve; });
    const other = window.html2canvasWithColors(root, {
      logging: false, onclone: async () => { entered(); await gate; },
    });
    await started;
    const otherFrame = document.querySelector('iframe.html2canvas-container');
    let failure;
    try {
      const canvas = document.createElement('canvas');
      canvas.getContext = () => { throw new Error('forced render failure'); };
      await window.html2canvasWithColors(root, {
        // Force the real renderer to reject after clone normalization completes.
        logging: false, canvas,
      });
    } catch (error) { failure = String(error); }
    const otherStillAttached = otherFrame.isConnected;
    release();
    await other;
    // Also cover a rejection inside the consumer's clone callback.
    try {
      await window.html2canvasWithColors(root, { logging: false, onclone: () => { throw new Error('clone failure'); } });
    } catch (error) { if (!String(error).includes('clone failure')) throw error; }
    return { failure, otherStillAttached, frames: document.querySelectorAll('iframe.html2canvas-container').length,
      unchanged: source === document.documentElement.outerHTML };
  });
  assert.match(cleanup.failure, /forced render failure/i);
  assert.equal(cleanup.otherStillAttached, true, 'concurrent export retains its own iframe');
  assert.equal(cleanup.frames, 0, 'failure paths clean up owned iframes');
  assert.equal(cleanup.unchanged, true, 'source DOM survives failure and concurrency');
  assert.deepEqual(errors, []);
  console.log(`PASS rejection cleanup and concurrent exports. PNG artifacts: ${artifacts}`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
