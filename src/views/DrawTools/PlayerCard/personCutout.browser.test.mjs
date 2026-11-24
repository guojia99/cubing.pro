import assert from 'node:assert/strict';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { chromium } from 'playwright';
import { servePlayerCard } from './browserTestServer.mjs';

for (const mobile of [false, true]) test(`real GrabCut editor: ${mobile ? 'touch' : 'desktop'}, modes, cancel, restore, repair and export`, { timeout: 120000 }, async () => {
  const root = process.env.SITE_PLAYER_CARD_STATIC_DIR || 'dist';
  await stat(path.join(root, 'draw-tools/player-card/index.html'));
  await stat(path.join(root, 'vendor/opencv/4.11.0/opencv.js'));
  const server = await servePlayerCard(root);
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE || undefined });
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1200, height: 1000 }, isMobile: mobile, hasTouch: mobile, acceptDownloads: true });
    await context.addInitScript(() => localStorage.setItem('cubing_pro_locale', 'en-US'));
    const requests = [];
    await context.route('**/*', route => {
      const request = route.request();
      requests.push({ url: request.url(), method: request.method() });
      if (!request.url().startsWith(server.origin + '/')) return route.abort();
      if (request.url().includes('/v3/cube-api/')) return route.fulfill({ json: { data: [] } });
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(server.origin + '/draw-tools/player-card/');
    const photo = page.locator('#player-card-photo');
    const canvas = page.getByRole('img', { name: 'Card preview' });
    const fixture = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 800; c.height = 600;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#317ba0'; ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#245571'; ctx.fillRect(0, 0, 150, 600);
      ctx.fillStyle = '#bd293c'; ctx.fillRect(300, 180, 200, 370);
      ctx.beginPath(); ctx.arc(400, 130, 65, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#edb428'; ctx.fillRect(480, 280, 150, 100);
      return c.toDataURL().split(',')[1];
    });
    const upload = () => photo.setInputFiles({ name: 'synthetic-person-accessory.png', mimeType: 'image/png', buffer: Buffer.from(fixture, 'base64') });
    await upload();
    const select = page.getByRole('button', { name: 'Select person and accessories', exact: true });
    await select.waitFor();
    await page.locator('#player-card-name').fill('Player');
    const downloadButton = page.getByRole('button', { name: 'Download PNG · 1080 × 1080' });
    await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(b => b.textContent.includes('Download PNG')).disabled);
    const original = await canvas.evaluate(c => c.toDataURL());
    const cvRequests = () => requests.filter(r => /opencv|player-card-grabcut/.test(r.url));
    assert.equal(cvRequests().length, 0, 'ordinary preview and nickname load no CV');
    await select.click();
    const box = page.getByTestId('person-box');
    const rect = box.locator('rect').first();
    const firstX = Number(await rect.getAttribute('x'));
    await canvas.scrollIntoViewIfNeeded();
    let bounds = await canvas.boundingBox();
    const x = bounds.x + bounds.width * .5, y = bounds.y + bounds.height * .3;
    const scroll = await page.evaluate(() => scrollY);
    if (mobile) {
      const session = await context.newCDPSession(page);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 12, y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await session.detach();
    } else {
      await page.mouse.move(x, y); await page.mouse.down();
      assert.equal(await canvas.evaluate(c => c.hasPointerCapture(1)), true);
      await page.mouse.move(x + 12, y); await page.mouse.up();
    }
    assert.ok(Number(await rect.getAttribute('x')) > firstX);
    assert.equal(await page.evaluate(() => scrollY), scroll, 'box gesture does not scroll');
    assert.equal(await canvas.evaluate(c => c.toDataURL()), original, 'selection cannot change crop/output');
    assert.equal(cvRequests().length, 0, 'box mode itself loads no CV');
    await canvas.focus(); await canvas.press('Shift+ArrowLeft');
    assert.ok(Number(await rect.getAttribute('width')) < 864, 'keyboard resizing');
    await canvas.press('ArrowLeft');

    // Hold the actual script request, cancel and change the source before it
    // arrives. No fake successful segmentation is used in this suite.
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const delayedWorker = async route => { await gate; await route.continue(); };
    await context.route('**/workers/player-card-grabcut.js', delayedWorker);
    const cut = page.getByRole('button', { name: 'Cut out person (experimental)', exact: true });
    await cut.click();
    await page.getByRole('button', { name: 'Cancel cutout', exact: true }).click();
    await upload(); await select.waitFor();
    release(); await context.unroute('**/workers/player-card-grabcut.js', delayedWorker);
    assert.equal(await page.getByRole('button', { name: 'Repair eraser', exact: true }).count(), 0);
    assert.equal(await page.locator('#player-card-name').inputValue(), 'Player');

    // A missing runtime must show an error and preserve every output pixel.
    await select.click();
    let releaseCrop;
    const cropGate = new Promise(resolve => { releaseCrop = resolve; });
    const delayedCrop = async route => { await cropGate; await route.continue(); };
    await context.route('**/workers/player-card-grabcut.js', delayedCrop);
    await cut.click();
    await page.getByRole('button', { name: 'Cancel cutout', exact: true }).waitFor();
    await page.locator('#player-card-zoom').fill('1.4');
    assert.equal(await page.getByRole('button', { name: 'Cancel cutout', exact: true }).count(), 0, 'crop changes terminate the in-flight job');
    releaseCrop(); await context.unroute('**/workers/player-card-grabcut.js', delayedCrop);
    await page.locator('#player-card-zoom').fill('1');
    const beforeFailure = await canvas.evaluate(c => c.toDataURL());
    const unavailable = route => route.abort();
    await context.route('**/vendor/opencv/**', unavailable);
    await cut.click(); await page.getByRole('alert').filter({ hasText: 'Experimental cutout' }).waitFor();
    assert.equal(await canvas.evaluate(c => c.toDataURL()), beforeFailure);
    await context.unroute('**/vendor/opencv/**', unavailable);

    // Draw a tighter prior around this smaller synthetic subject and its cube.
    await canvas.scrollIntoViewIfNeeded();
    const prior = await canvas.boundingBox();
    await page.mouse.move(prior.x + prior.width * .29, prior.y + prior.height * .04);
    await page.mouse.down();
    await page.mouse.move(prior.x + prior.width * .91, prior.y + prior.height * .94, { steps: 6 });
    await page.mouse.up();

    await cut.click();
    const repair = page.getByRole('button', { name: 'Repair eraser', exact: true });
    await repair.waitFor({ timeout: 15000 });
    assert.equal(await box.count(), 0);
    const segmented = await canvas.evaluate(c => c.toDataURL());
    assert.notEqual(segmented, beforeFailure);
    await repair.click(); await canvas.scrollIntoViewIfNeeded(); bounds = await canvas.boundingBox();
    await page.mouse.click(bounds.x + bounds.width * .5, bounds.y + bounds.height * .4);
    assert.notEqual(await canvas.evaluate(c => c.toDataURL()), segmented);
    await page.getByRole('button', { name: 'Undo latest stroke' }).click();
    assert.equal(await canvas.evaluate(c => c.toDataURL()), segmented);
    const [download] = await Promise.all([page.waitForEvent('download'), downloadButton.click()]);
    assert.deepEqual(await readFile(await download.path()), Buffer.from(segmented.split(',')[1], 'base64'));
    assert.equal(download.suggestedFilename(), 'Player-card.png');
    const frame = await canvas.evaluate(c => [0, 12, 30, 31].map(x => [...c.getContext('2d').getImageData(x, 100, 1, 1).data]));
    assert.deepEqual(frame, [[16, 59, 112, 255], [16, 59, 112, 255], [188, 230, 255, 255], [188, 230, 255, 255]]);
    await mkdir('output/playwright', { recursive: true });
    await page.screenshot({ path: `output/playwright/person-cutout-${mobile ? 'touch' : 'desktop'}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Restore original background', exact: true }).click();
    assert.equal(await canvas.evaluate(c => c.toDataURL()), original);
    assert.equal(await page.getByRole('button', { name: 'Replace solid background', exact: true }).count(), 1);
    assert.ok(requests.every(r => r.method === 'GET'), 'no photo upload');
    assert.deepEqual(errors, []);
    await context.close();
  } finally { await browser?.close(); await server.close(); }
});
