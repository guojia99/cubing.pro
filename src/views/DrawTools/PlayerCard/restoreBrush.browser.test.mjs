import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { servePlayerCard } from './browserTestServer.mjs';

const launch = () => chromium.launch({ executablePath: process.env.SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE || undefined });

test('restore pixels: open eyeglass gap, capsule bounds, source scaling and crop', async () => {
  const bundle = await build({ stdin: { contents: `export * from './repairBrush';`, resolveDir: new URL('.', import.meta.url).pathname }, bundle: true, write: false, format: 'iife', globalName: 'repair' });
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const results = await page.evaluate(() => {
      const make = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
      const source = make(480, 320), ctx = source.getContext('2d');
      ctx.fillStyle = '#d8e8f0'; ctx.fillRect(0, 0, 480, 320);
      ctx.fillStyle = '#bc7850'; ctx.beginPath(); ctx.ellipse(260, 160, 65, 100, 0, 0, Math.PI * 2); ctx.fill();
      // Far lens extends beyond the face; the removed C-shaped arc opens onto background.
      ctx.strokeStyle = '#183c64'; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.ellipse(170, 125, 35, 30, 0, 0, Math.PI * 2); ctx.stroke();
      const results = [];
      for (const factor of [1, 0.5]) {
        const edited = make(480 * factor, 320 * factor), e = edited.getContext('2d');
        e.drawImage(source, 0, 0, edited.width, edited.height);
        e.clearRect(0, 0, 170 * factor, edited.height);
        const before = e.getImageData(0, 0, edited.width, edited.height);
        const snapshot = () => Array.from(e.getImageData(0, 0, edited.width, edited.height).data);
        const original = snapshot();
        const crop = { zoom: 1.8, x: 37, y: -21 }, rect = { left: 50, top: 30, width: 360, height: 300 };
        const point = (x, y) => {
          const scale = 1080 / 320 * crop.zoom;
          return repair.repairPoint(480, 320, edited.width, edited.height, crop, rect,
            rect.left + ((x - 240) * scale + 540 + crop.x) * rect.width / 1080,
            rect.top + ((y - 160) * scale + 540 + crop.y) * rect.height / 1080);
        };
        const start = point(135, 115), end = point(135, 135);
        const hoverUnchanged = JSON.stringify(snapshot()) === JSON.stringify(original);
        repair.restoreSegment(edited, source, end, start);
        const expected = make(edited.width, edited.height); expected.getContext('2d').drawImage(source, 0, 0, edited.width, edited.height);
        const pixel = (c, x, y) => Array.from(c.getContext('2d').getImageData(Math.floor(x * factor), Math.floor(y * factor), 1, 1).data);
        const center = pixel(edited, 135, 125), sourceCenter = pixel(expected, 135, 125);
        const after = snapshot();
        let outsideUnchanged = true;
        for (let y = 0; y < edited.height; y++) for (let x = 0; x < edited.width; x++) {
          if (x >= start.x - start.rx - 1 && x <= end.x + end.rx + 1 && y >= start.y - start.ry - 1 && y <= end.y + end.ry + 1) continue;
          const i = (y * edited.width + x) * 4;
          for (let c = 0; c < 4; c++) if (after[i + c] !== original[i + c]) outsideUnchanged = false;
        }
        const background = pixel(edited, 80, 125);
        e.putImageData(before, 0, 0);
        const restoreUndo = JSON.stringify(snapshot()) === JSON.stringify(original);
        repair.restoreSegment(edited, source, point(135, 125));
        const tap = pixel(edited, 135, 125);
        const restored = e.getImageData(0, 0, edited.width, edited.height);
        repair.eraseSegment(edited, point(135, 125));
        const erased = pixel(edited, 135, 125);
        e.putImageData(restored, 0, 0);
        const eraseUndo = pixel(edited, 135, 125);
        // Existing foreground must not be overwritten by the source.
        e.fillStyle = '#ff00ff'; e.fillRect(130 * factor, 120 * factor, 10 * factor, 10 * factor);
        repair.restoreSegment(edited, source, point(135, 125));
        results.push({ center, sourceCenter, outsideUnchanged, background, hoverUnchanged, restoreUndo, tap, erased, eraseUndo, present: pixel(edited, 135, 125) });
      }
      return results;
    });
    for (const r of results) {
      assert.deepEqual(r.center, r.sourceCenter, 'restore exact raw source at stroke center');
      assert.deepEqual(r.tap, r.sourceCenter, 'zero-length tap restores');
      assert.ok(r.outsideUnchanged && r.hoverUnchanged && r.restoreUndo);
      assert.deepEqual(r.background, [0, 0, 0, 0], 'untouched removed background stays removed');
      assert.equal(r.erased[3], 0);
      assert.deepEqual(r.eraseUndo, r.sourceCenter);
      assert.deepEqual(r.present, [255, 0, 255, 255]);
    }
  } finally { await browser.close(); }
});

// Coordinator runs this against its final build; this test never builds or starts Next.
test('restore UI: separate modes, hover, touch ring, latest undo and reset', { timeout: 90000 }, async () => {
  const server = await servePlayerCard(process.env.SITE_PLAYER_CARD_STATIC_DIR || 'dist');
  const browser = await launch();
  try {
    for (const mobile of [false, true]) {
      const context = await browser.newContext({ viewport: { width: mobile ? 390 : 1200, height: 1000 }, isMobile: mobile, hasTouch: mobile });
      await context.addInitScript(() => localStorage.setItem('cubing_pro_locale', 'en-US'));
      await context.route('**/*', r => r.request().url().startsWith(server.origin + '/') ? r.continue() : r.abort());
      const page = await context.newPage();
      await page.goto(server.origin + '/draw-tools/player-card/');
      const fixture = await page.evaluate(() => {
        const c = document.createElement('canvas'); c.width = 480; c.height = 320;
        const x = c.getContext('2d'); x.fillStyle = '#d8e8f0'; x.fillRect(0, 0, 480, 320);
        x.fillStyle = '#bc7850'; x.fillRect(195, 30, 130, 280);
        x.strokeStyle = '#183c64'; x.lineWidth = 10; x.beginPath(); x.ellipse(170, 125, 35, 30, 0, 0, Math.PI * 2); x.stroke();
        return c.toDataURL().split(',')[1];
      });
      await page.locator('#player-card-photo').setInputFiles({ name: 'synthetic-glasses.png', mimeType: 'image/png', buffer: Buffer.from(fixture, 'base64') });
      const canvas = page.getByRole('img', { name: 'Card preview' });
      const state = () => canvas.evaluate(c => c.toDataURL());
      await page.getByRole('button', { name: 'Replace solid background', exact: true }).click();
      await canvas.scrollIntoViewIfNeeded();
      let rect = await canvas.boundingBox();
      await page.mouse.click(rect.x + rect.width * .1, rect.y + rect.height * .1);
      const eraser = page.getByRole('button', { name: 'Repair eraser', exact: true });
      const restore = page.getByRole('button', { name: 'Restore brush', exact: true });
      const undo = page.getByRole('button', { name: 'Undo latest stroke', exact: true });
      await eraser.click();
      await canvas.scrollIntoViewIfNeeded(); rect = await canvas.boundingBox();
      const x = rect.x + rect.width * (135 - 80) / 320, y = rect.y + rect.height * 125 / 320;
      const before = await state();
      await page.mouse.click(x, y);
      const erased = await state(); assert.notEqual(erased, before);
      await undo.click(); assert.equal(await state(), before, 'undo erase');
      await canvas.scrollIntoViewIfNeeded(); await page.mouse.click(x, y);
      await restore.click(); assert.equal(await eraser.getAttribute('aria-pressed'), 'false');
      await canvas.scrollIntoViewIfNeeded();
      const preRestore = await state();
      await page.mouse.move(x, y);
      const ring = page.getByTestId('repair-ring');
      assert.equal(await ring.isVisible(), true);
      const ringRect = await ring.boundingBox();
      assert.ok(Math.abs(ringRect.x + 13 - x) < 1 && Math.abs(ringRect.y + 13 - y) < 1);
      assert.equal(await state(), preRestore, 'hover changes no pixels');
      if (mobile) {
        const session = await context.newCDPSession(page);
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        assert.equal(await ring.isVisible(), true);
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + 4 }] });
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        assert.equal(await ring.isVisible(), false); await session.detach();
      } else { await page.mouse.click(x, y); }
      assert.notEqual(await state(), preRestore);
      await undo.click(); assert.equal(await state(), preRestore, 'undo restore retains earlier erasure');
      assert.equal(await undo.isDisabled(), true);
      await page.getByRole('button', { name: 'Restore original background', exact: true }).click();
      assert.equal(await restore.count(), 0); assert.equal(await eraser.count(), 0);
      await context.close();
    }
  } finally { await browser.close(); await server.close(); }
});
