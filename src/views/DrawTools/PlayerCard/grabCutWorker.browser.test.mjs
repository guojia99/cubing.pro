import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import test from 'node:test';
import { chromium } from 'playwright';
import { servePlayerCard } from './browserTestServer.mjs';

test('official 4.11.0 real worker segments person/accessory beyond box prior without uploading', { timeout: 90000 }, async () => {
  await stat('public/vendor/opencv/4.11.0/opencv.js'); // Missing CV is a failure, never a mock pass.
  const server = await servePlayerCard('public');
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE || undefined });
    const page = await browser.newPage();
    const requests = [];
    page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
    await page.goto(server.origin + '/worker-test');
    const result = await page.evaluate(async () => {
      const width = 320, height = 320;
      const pixels = new Uint8ClampedArray(width * height * 4);
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const torso = x >= 100 && x < 200 && y >= 80 && y < 290;
        const head = (x - 150) ** 2 + (y - 60) ** 2 < 30 ** 2;
        const accessory = x >= 180 && x < 275 && y >= 145 && y < 185;
        pixels.set(accessory ? [240, 180, 20, 255] : torso || head ? [200, 30, 40, 255] : [25 + (x % 2) * 10, 90, 160, 255], (y * width + x) * 4);
      }
      const worker = new Worker('/workers/player-card-grabcut.js');
      const data = await new Promise((resolve, reject) => {
        worker.onmessage = event => resolve(event.data);
        worker.onerror = reject;
        worker.postMessage({ pixels: pixels.buffer, width, height, box: { x: 70, y: 20, width: 160, height: 285 } });
      });
      worker.terminate();
      if (data.error) return data;
      const alpha = new Uint8Array(data.alpha);
      return { head: alpha[60 * width + 150], torso: alpha[200 * width + 150], accessoryOutsideBox: alpha[160 * width + 260], background: alpha[160 * width + 40], width: data.width, height: data.height };
    });
    assert.deepEqual(result, { head: 255, torso: 255, accessoryOutsideBox: 255, background: 0, width: 320, height: 320 });
    assert.ok(requests.every(request => request.url.startsWith(server.origin + '/') && request.method === 'GET'));
  } finally { await browser?.close(); await server.close(); }
});
