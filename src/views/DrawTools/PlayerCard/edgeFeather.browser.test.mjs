import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { servePlayerCard } from './browserTestServer.mjs';

for (const mobile of [false, true]) test(`output mask pixels: ${mobile ? 'mobile' : 'desktop'}`, { timeout: 120000 }, async () => {
  const bundle = process.env.SITE_PLAYER_CARD_FIXTURE_BUNDLE
    ? { outputFiles: [{ text: await readFile(process.env.SITE_PLAYER_CARD_FIXTURE_BUNDLE, 'utf8') }] }
    : await build({ stdin: { contents: `import * as composition from './composition'; import * as solid from './solidBackground'; import * as grab from './grabCut'; import * as repair from './repairBrush'; window.fixture = {...composition, ...solid, ...grab, ...repair};`, resolveDir: new URL('.', import.meta.url).pathname }, bundle: true, write: false, format: 'iife' });
  const server = await servePlayerCard('public');
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE || undefined });
    const page = await browser.newPage({ viewport: { width: mobile ? 390 : 1280, height: 900 }, isMobile: mobile, hasTouch: mobile });
    const requests = [];
    await page.route('**/*', route => {
      requests.push({ url: route.request().url(), method: route.request().method() });
      return route.request().url().startsWith(server.origin + '/') && route.request().method() === 'GET' ? route.continue() : route.abort();
    });
    await page.goto(server.origin + '/worker-test');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const result = await page.evaluate(async () => {
      const f = window.fixture;
      // Exclude nearly transparent/opaque resampling tails from the visible ramp.
      const inTransition = a => a >= 24 && a <= 250;
      const canvas = (size = 1080) => { const c = document.createElement('canvas'); c.width = c.height = size; return c; };
      const decode = async c => { const im = new Image(); im.src = c.toDataURL(); await im.decode(); return im; };
      const render = (im, replacement, zoom = 1, x = 0) => {
        const card = canvas(), layer = canvas();
        const ctx = card.getContext('2d'), draw = ctx.drawImage.bind(ctx);
        ctx.drawImage = (...args) => { layer.getContext('2d').drawImage(...args); draw(...args); };
        f.paintCard(card, im, { zoom, x, y: 0 }, 'Pixel', 'sans-serif', !replacement, replacement);
        return { card, layer };
      };
      const widths = [], checks = [];
      const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
      for (const size of [720, 1080, 2160]) {
        const source = canvas(size), sc = source.getContext('2d');
        sc.fillStyle = '#c82838'; sc.fillRect(size / 3, 0, size / 3, size);
        const native = await decode(source);
        sc.globalCompositeOperation = 'destination-over'; sc.fillStyle = '#10ed20'; sc.fillRect(0, 0, size, size);
        const opaque = await decode(source);
        const solid = f.replaceSolidBackground(opaque, { x: 0, y: 0 });
        // Real local WASM worker, with a straight-sided foreground for pixel measurement.
        const grab = await f.startGrabCut(opaque, f.INITIAL_CROP, { x: .2, y: .01, width: .6, height: .98 }).result;
        for (const [mode, im, replacement] of [['native', native, null], ['solid', opaque, solid], ['grab', opaque, grab]]) {
          for (const zoom of [1, 1.5]) {
            const { card, layer } = render(im, replacement, zoom, 17);
            const row = layer.getContext('2d').getImageData(0, 400, 1080, 1).data;
            const edge = Math.round((1080 - 1080 * zoom) / 2 + 360 * zoom + 17);
            const alpha = Array.from({ length: 50 }, (_, i) => row[(edge - 25 + i) * 4 + 3]);
            widths.push({ size, mode, zoom, width: alpha.filter(inTransition).length });
            checks.push(row[540 * 4] === 200 && row[540 * 4 + 1] === 40 && row[540 * 4 + 3] === 255);
            // Removed green background must not be brought back into the transition.
            checks.push(Array.from({ length: 50 }, (_, i) => edge - 25 + i).every(x => row[x * 4 + 3] < 16 || row[x * 4 + 1] < 70));
            const reference = render(opaque, null, zoom, 17).card;
            checks.push(same(card.getContext('2d').getImageData(440, 780, 200, 250).data,
              reference.getContext('2d').getImageData(440, 780, 200, 250).data));
            checks.push(same(card.getContext('2d').getImageData(0, 44, 18, 992).data,
              reference.getContext('2d').getImageData(0, 44, 18, 992).data));
            const decoded = await decode(card), roundtrip = canvas(); roundtrip.getContext('2d').drawImage(decoded, 0, 0);
            checks.push(card.toDataURL() === roundtrip.toDataURL());
          }
        }
        const repaired = canvas(size); repaired.getContext('2d').drawImage(opaque, 0, 0);
        const point = f.repairPoint(size, size, size, size, f.INITIAL_CROP, { left: 0, top: 0, width: 360, height: 360 }, 180, 180);
        f.eraseSegment(repaired, point);
        for (const zoom of [1, 1.5]) {
          const { layer } = render(opaque, repaired, zoom, 17);
          const row = layer.getContext('2d').getImageData(557, 540, 100, 1).data;
          widths.push({ size, mode: 'repair', zoom, width: Array.from({ length: 100 }, (_, i) => row[i * 4 + 3]).filter(inTransition).length });
        }
      }
      const soft = canvas(), sx = soft.getContext('2d');
      const data = sx.createImageData(1080, 1080);
      for (let y = 0; y < 1080; y++) for (let x = 0; x < 1080; x++) data.data.set([200, 40, 56, Math.max(0, Math.min(255, (x - 350) * 32))], (y * 1080 + x) * 4);
      sx.putImageData(data, 0, 0);
      const softImage = await decode(soft);
      for (const zoom of [1, 1.5]) {
        const { layer } = render(softImage, null, zoom, 17);
        const expected = canvas();
        expected.getContext('2d').drawImage(softImage, (1080 - 1080 * zoom) / 2 + 17, (1080 - 1080 * zoom) / 2, 1080 * zoom, 1080 * zoom);
        checks.push(layer.toDataURL() === expected.toDataURL());
      }
      return { widths, checks };
    });
    console.log(JSON.stringify({ mobile, widths: result.widths }));
    assert.ok(result.checks.every(Boolean), 'Exact interior, low green halo, PNG roundtrip and native soft alpha');
    for (const row of result.widths) {
      assert.ok(row.width >= 4 * row.zoom && row.width <= 6 * row.zoom + 1, JSON.stringify(row));
    }
    assert.ok(requests.every(({ url, method }) => url.startsWith(server.origin + '/') && method === 'GET'));
  } finally { await browser?.close(); await server.close(); }
});
