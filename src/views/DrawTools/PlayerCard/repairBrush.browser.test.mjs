// Run after the parent's offline static build:
// node --test src/views/DrawTools/PlayerCard/repairBrush.browser.test.mjs
// Optional: SITE_PLAYER_CARD_STATIC_DIR (default dist), SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE.
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";

test('real hover, desktop/touch repair, bounded undo, restore and exact PNG', { timeout: 90000 }, async () => {
  const root = path.resolve(process.env.SITE_PLAYER_CARD_STATIC_DIR || "dist");
  await stat(path.join(root, "draw-tools/player-card/index.html"));
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      let file = path.resolve(root, `.${pathname}`);
      if (!file.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
      res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
      res.end(await readFile(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ executablePath: process.env.SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE || undefined });
    for (const mobile of [false, true]) {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1200, height: 1000 }, isMobile: mobile, hasTouch: mobile, acceptDownloads: true });
      await context.addInitScript(() => localStorage.setItem("cubing_pro_locale", "en-US"));
      const page = await context.newPage();
      page.setDefaultTimeout(8000);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await context.route('**/*', r => {
        if (!r.request().url().startsWith(origin + '/')) return r.abort();
        if (r.request().url().includes('/v3/cube-api/')) return r.fulfill({ json: { data: [] } });
        return r.continue();
      });
      assert.equal((await page.goto(`${origin}/draw-tools/player-card/`)).status(), 200);
      const canvas = page.getByRole('img', { name: 'Card preview' });
      const photo = page.locator('#player-card-photo');
      const fixture = await page.evaluate(() => {
        const c = document.createElement('canvas'); c.width = 3000; c.height = 2401;
        const x = c.getContext('2d'); x.fillStyle = '#f2d3dd'; x.fillRect(0, 0, c.width, c.height);
        x.fillStyle = '#dcadc1'; x.fillRect(900, 0, 1200, c.height);
        return c.toDataURL().split(',')[1];
      });
      await photo.setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(fixture, 'base64') });
      const replace = page.getByRole('button', { name: 'Replace solid background', exact: true });
      await replace.waitFor();
      assert.equal(await page.getByRole('button', { name: 'Repair eraser' }).count(), 0);
      const original = await canvas.evaluate(c => c.toDataURL());
      const border = await canvas.evaluate(c => {
        const ctx = c.getContext('2d');
        return [0, 12, 23, 24, 30, 31, 32].map(x => [...ctx.getImageData(x, 100, 1, 1).data]);
      });
      for (const pixel of border.slice(0, 3)) assert.deepEqual(pixel, [16, 59, 112, 255], '24px dark blue outer frame');
      assert.deepEqual(border[4], [188, 230, 255, 255], 'light blue inset');
      assert.deepEqual(border[4], border[5]);
      assert.deepEqual(border[3], border[6], 'image between and inside frame is sharp');
      await replace.click(); await canvas.scrollIntoViewIfNeeded();
      let rect = await canvas.boundingBox();
      await page.mouse.click(rect.x + rect.width * .1, rect.y + rect.height * .2);
      const repair = page.getByRole('button', { name: 'Repair eraser', exact: true });
      await repair.click();
      const undo = page.getByRole('button', { name: 'Undo latest stroke' });
      assert.equal(await undo.isDisabled(), true);
      await canvas.scrollIntoViewIfNeeded(); rect = await canvas.boundingBox();
      const firstState = await canvas.evaluate(c => c.toDataURL());
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height * .3);
      assert.equal(await canvas.evaluate(c => c.toDataURL()), firstState, 'first hover does not mutate pixels');
      await page.mouse.down(); await page.mouse.up();
      assert.notEqual(await canvas.evaluate(c => c.toDataURL()), firstState, 'single tap erases');
      await undo.click();
      assert.equal(await canvas.evaluate(c => c.toDataURL()), firstState, 'first stroke restores exact replacement');
      for (const zoom of ['1', '2.5']) {
        await page.locator('#player-card-zoom').fill(zoom);
        await canvas.scrollIntoViewIfNeeded(); rect = await canvas.boundingBox();
        const x = rect.x + rect.width / 2, y = rect.y + rect.height * .3;
        const before = await canvas.evaluate(c => c.toDataURL());
        // Actual hover before any drawing, never a synthetic pointermove.
        await page.mouse.move(x, y);
        const ring = page.getByTestId('repair-ring');
        assert.equal(await ring.isVisible(), true);
        const ringRect = await ring.boundingBox();
        assert.ok(Math.abs(ringRect.x + 13 - x) < 1);
        assert.equal(await canvas.evaluate(c => c.toDataURL()), before);
        const scroll = await page.evaluate(() => scrollY);
        if (mobile) {
          const session = await context.newCDPSession(page);
          await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
          assert.equal(await ring.isVisible(), true);
          await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 20, y }] });
          await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          assert.equal(await ring.isVisible(), false);
          await session.detach();
        } else {
          await page.mouse.down();
          assert.equal(await canvas.evaluate(c => c.hasPointerCapture(1)), true);
          await page.mouse.move(x + 20, y, { steps: 4 }); await page.mouse.up();
        }
        assert.equal(await page.evaluate(() => scrollY), scroll);
        const changed = await canvas.evaluate(c => c.toDataURL());
        assert.notEqual(changed, before);
        const pixels = await canvas.evaluate((c, zoom) => {
          const ctx = c.getContext('2d');
          const r = c.getBoundingClientRect();
          const outsideFringe = 14 + 5 * zoom * r.width / 1080;
          return [0, 10, outsideFringe].map(d => [...ctx.getImageData(540, Math.floor(1080 * .3 + d * 1080 / r.width), 1, 1).data]);
        }, Number(zoom));
        assert.ok(pixels[0][0] < 60 && pixels[1][0] < 60, 'inside ring reveals stage');
        assert.deepEqual(pixels[2], [220, 173, 193, 255], 'outside ring stays intact');
        await page.mouse.click(x, y + 40);
        assert.notEqual(await canvas.evaluate(c => c.toDataURL()), changed);
        await undo.click();
        assert.equal(await canvas.evaluate(c => c.toDataURL()), changed, 'second stroke undo retains the entire first stroke');
        assert.equal(await undo.isDisabled(), true, 'only the latest stroke is retained');
        // Make a new stroke to verify exact undo once more after consuming history.
        await canvas.scrollIntoViewIfNeeded();
        rect = await canvas.boundingBox();
        await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height * .3 + 40);
        await undo.click();
        assert.equal(await canvas.evaluate(c => c.toDataURL()), changed);
        const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PNG · 1080 × 1080' }).click()]);
        assert.deepEqual(await readFile(await download.path()), Buffer.from(changed.split(',')[1], 'base64'));
        // Start the next zoom case from a fresh replacement.
        await page.getByRole('button', { name: 'Restore original background' }).click();
        await page.locator('#player-card-zoom').fill('1');
        await replace.click(); await canvas.scrollIntoViewIfNeeded(); rect = await canvas.boundingBox();
        await page.mouse.click(rect.x + rect.width * .1, rect.y + rect.height * .2);
        await repair.click();
      }
      await page.locator('#player-card-zoom').fill('1');
      await page.getByRole('button', { name: 'Restore original background' }).click();
      assert.equal(await canvas.evaluate(c => c.toDataURL()), original);
      assert.equal(await repair.count(), 0);
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
