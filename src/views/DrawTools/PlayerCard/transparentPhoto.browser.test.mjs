// Run after the parent's offline static build:
// node --test src/views/DrawTools/PlayerCard/transparentPhoto.browser.test.mjs
// Optional: SITE_PLAYER_CARD_STATIC_DIR (default dist), SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE.
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";

test('opaque and transparent paths, optional mobile solid replacement, undo and exact PNG', { timeout: 90000 }, async () => {
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
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
    const unexpected = [], errors = [];
    await context.route('**/*', route => {
      const req = route.request();
      if (!req.url().startsWith(origin + '/') || !['GET', 'HEAD'].includes(req.method())) {
        unexpected.push(`${req.method()} ${req.url()}`);
        return route.abort();
      }
      if (req.url().includes('/v3/cube-api/')) return route.fulfill({ json: { data: [] } });
      return route.continue();
    });
    await context.addInitScript(() => {
      localStorage.setItem('cubing_pro_locale', 'en-US');
      window.samples = [];
      const read = CanvasRenderingContext2D.prototype.getImageData;
      CanvasRenderingContext2D.prototype.getImageData = function (...args) {
        if (!this.canvas.isConnected && this.canvas.width <= 256 && this.canvas.height <= 256) window.samples.push([this.canvas.width, this.canvas.height]);
        return read.apply(this, args);
      };
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    assert.equal((await page.goto(`${origin}/draw-tools/player-card/`)).status(), 200);
    const photo = page.locator('#player-card-photo');
    const canvas = page.getByRole('img', { name: 'Card preview', exact: true });
    const download = page.getByRole('button', { name: 'Download PNG · 1080 × 1080', exact: true });
    await page.getByRole('heading', { name: 'Player card maker', exact: true }).waitFor();
    const fixtures = await page.evaluate(() => {
      const result = {};
      for (const kind of ['transparent', 'opaque', 'jpeg', 'empty', 'tiny']) {
        const c = document.createElement('canvas'); c.width = 1200; c.height = 800;
        const ctx = c.getContext('2d');
        if (kind !== 'empty') {
          ctx.fillStyle = '#ec4020';
          if (kind === 'transparent') ctx.fillRect(450, 0, 300, 800);
          else ctx.fillRect(0, 0, 1200, 800);
          if (kind === 'tiny') ctx.clearRect(500, 100, 1, 1);
        }
        result[kind] = c.toDataURL(kind === 'jpeg' ? 'image/jpeg' : 'image/png').split(',')[1];
      }
      return result;
    });
    let count = 0;
    for (const kind of ['transparent', 'opaque', 'jpeg', 'empty', 'tiny']) {
      await photo.setInputFiles({ name: kind === 'transparent' ? 'misleading.jpg' : `${kind}.png`, mimeType: kind === 'jpeg' ? 'image/jpeg' : 'image/png', buffer: Buffer.from(fixtures[kind], 'base64') });
      await page.waitForFunction(n => window.samples.length === n && !document.querySelector('#player-card-zoom').disabled, ++count);
      assert.deepEqual(await page.evaluate(() => window.samples.at(-1)), [256, 171]);
      const pixel = await canvas.evaluate(c => [...c.getContext('2d').getImageData(100, 100, 1, 1).data]);
      if (kind === 'transparent') assert.ok(pixel[2] > pixel[0] && pixel[2] < 90 && pixel[3] === 255, 'The transparent margin gets the dark stage');
      else if (kind === 'empty') assert.deepEqual(pixel, [234, 240, 245, 255]);
      else assert.ok(Math.abs(pixel[0] - 236) <= 2 && Math.abs(pixel[1] - 64) <= 2 && Math.abs(pixel[2] - 32) <= 2 && pixel[3] === 255);
      if (kind === 'transparent' || kind === 'empty') assert.equal(await page.getByRole('button', { name: 'Replace solid background', exact: true }).count(), 0);
      if (kind === 'opaque' || kind === 'jpeg') await page.getByRole('button', { name: 'Replace solid background', exact: true }).waitFor();
      if (kind === 'transparent') {
        assert.deepEqual(await canvas.evaluate(c => [...c.getContext('2d').getImageData(540, 100, 1, 1).data]), [236, 64, 32, 255]);
        const [beam, unlit] = await canvas.evaluate(c => {
          const ctx = c.getContext('2d');
          return [ctx.getImageData(227, 123, 1, 1).data[2], ctx.getImageData(950, 123, 1, 1).data[2]];
        });
        assert.ok(beam > 130 && beam > unlit + 50, 'Only the upper left has the blue stage light');
        assert.ok(await canvas.evaluate(c => c.getContext('2d').getImageData(100, 1070, 1, 1).data[2] < 64), 'Existing bottom gradient overlays backdrop');
      }
      const original = await canvas.evaluate(c => c.toDataURL());
      await page.locator('#player-card-zoom').fill('2');
      await canvas.scrollIntoViewIfNeeded();
      const rect = await canvas.boundingBox();
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.mouse.down(); await page.mouse.move(rect.x + rect.width / 2 + 50, rect.y + rect.height / 2 + 30); await page.mouse.up();
      await page.locator('#player-card-name').fill('小明 Blue');
      await page.waitForFunction(() => [...document.fonts].some(f => f.family.includes('The Peak Font Plus') && f.status === 'loaded'));
      await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(b => b.textContent === 'Download PNG · 1080 × 1080').disabled);
      const preview = await canvas.evaluate(c => c.toDataURL());
      const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
      const bytes = await readFile(await file.path());
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(bytes.readUInt32BE(16), 1080); assert.equal(bytes.readUInt32BE(20), 1080);
      assert.deepEqual(bytes, Buffer.from(preview.split(',')[1], 'base64'));
      await page.getByRole('button', { name: 'Reset position and zoom', exact: true }).click();
      await page.locator('#player-card-name').fill('');
      assert.equal(await canvas.evaluate(c => c.toDataURL()), original, 'Original crop restored');
      assert.equal(await page.evaluate(() => window.samples.length), count, 'No resampling on crop, nickname, reset or download');
      assert.equal(await page.getByRole('button', { name: /Change background|Use selection|Erase/i }).count(), 0);
    }
    const solidPhoto = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 1200; c.height = 800;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#f2d3dd'; ctx.fillRect(0, 0, 1200, 800);
      ctx.fillStyle = '#dcadc1'; ctx.fillRect(450, 0, 300, 800);
      ctx.fillStyle = '#f2d3dd'; ctx.fillRect(580, 160, 40, 80);
      return c.toDataURL().split(',')[1];
    });
    await photo.setInputFiles({ name: 'pink.png', mimeType: 'image/png', buffer: Buffer.from(solidPhoto, 'base64') });
    const replace = page.getByRole('button', { name: 'Replace solid background', exact: true });
    await replace.waitFor();
    await page.locator('#player-card-zoom').fill('1.5');
    await canvas.scrollIntoViewIfNeeded();
    let rect = await canvas.boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down(); await page.mouse.move(rect.x + rect.width / 2 + 25, rect.y + rect.height / 2); await page.mouse.up();
    await page.locator('#player-card-name').fill('Pink');
    await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(b => b.textContent === 'Download PNG · 1080 × 1080').disabled);
    const beforeReplacement = await canvas.evaluate(c => c.toDataURL());
    const samplesBefore = await page.evaluate(() => window.samples.length);
    await replace.click();
    await canvas.scrollIntoViewIfNeeded(); rect = await canvas.boundingBox();
    await page.mouse.move(rect.x + 20, rect.y + 30);
    await page.mouse.down(); await page.mouse.move(rect.x + 50, rect.y + 30); await page.mouse.up();
    assert.equal(await canvas.evaluate(c => c.toDataURL()), beforeReplacement, 'Dragging in pick mode neither crops nor replaces');
    // This enclosed wall-colored patch touches the crop interior, not the source boundary.
    const patchX = (-675 + 25 * 1080 / rect.width + 600 * 2.025) / 1080 * rect.width;
    const patchY = (-270 + 200 * 2.025) / 1080 * rect.height;
    await page.touchscreen.tap(rect.x + patchX, rect.y + patchY);
    await page.getByText('No clear background found. Try another spot.', { exact: true }).waitFor();
    assert.equal(await canvas.evaluate(c => c.toDataURL()), beforeReplacement);
    await page.touchscreen.tap(rect.x + rect.width * .1, rect.y + rect.height * .2);
    const restore = page.getByRole('button', { name: 'Restore original background', exact: true });
    await restore.waitFor();
    const pixels = await canvas.evaluate(c => {
      const ctx = c.getContext('2d');
      return [Array.from(ctx.getImageData(100, 100, 1, 1).data), Array.from(ctx.getImageData(540, 300, 1, 1).data)];
    });
    assert.ok(pixels[0][0] < 60 && pixels[0][2] > pixels[0][0], 'Selected wall becomes dark blue stage');
    assert.deepEqual(pixels[1], [220, 173, 193, 255], 'Deeper pink shirt stays exact');
    const replacedPreview = await canvas.evaluate(c => c.toDataURL());
    const [png] = await Promise.all([page.waitForEvent('download'), download.click()]);
    const pngBytes = await readFile(await png.path());
    assert.equal(pngBytes.readUInt32BE(16), 1080); assert.equal(pngBytes.readUInt32BE(20), 1080);
    assert.deepEqual(pngBytes, Buffer.from(replacedPreview.split(',')[1], 'base64'));
    await restore.click();
    assert.equal(await canvas.evaluate(c => c.toDataURL()), beforeReplacement, 'Undo restores original pixels, crop and nickname');
    assert.equal(await page.locator('#player-card-zoom').inputValue(), '1.5');
    assert.equal(await page.locator('#player-card-name').inputValue(), 'Pink');
    assert.equal(await page.evaluate(() => window.samples.length), samplesBefore, 'No repeated eligibility sampling');
    await replace.click();
    await page.getByRole('button', { name: 'Cancel replacement', exact: true }).click();
    assert.equal(await canvas.evaluate(c => c.toDataURL()), beforeReplacement);
    await photo.setInputFiles({ name: 'uniform.png', mimeType: 'image/png', buffer: Buffer.from(fixtures.opaque, 'base64') });
    await replace.waitFor(); await replace.click();
    await canvas.scrollIntoViewIfNeeded(); rect = await canvas.boundingBox();
    const uniformPreview = await canvas.evaluate(c => c.toDataURL());
    await page.touchscreen.tap(rect.x + rect.width * .1, rect.y + rect.height * .2);
    await page.getByText('No clear background found. Try another spot.', { exact: true }).waitFor();
    assert.equal(await canvas.evaluate(c => c.toDataURL()), uniformPreview, 'Ambiguous entire image is unchanged');
    assert.deepEqual(unexpected, [], 'All requests fulfilled locally; no uploads or external requests');
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
