import assert from 'node:assert/strict';
import test from 'node:test';
import { clampBox, drawnBox, sourceBox, featherAlpha } from './personCutout.mjs';

test('selection stays in preview and supports reversed/outside drags', () => {
  assert.deepEqual(clampBox({ x: -1, y: 2, width: .8, height: .5 }), { x: 0, y: .5, width: .8, height: .5 });
  assert.deepEqual(drawnBox({ x: .75, y: .75 }, { x: .25, y: .25 }), { x: .25, y: .25, width: .5, height: .5 });
  assert.deepEqual(clampBox({ x: .5, y: .5, width: 3, height: -1 }), { x: 0, y: .5, width: 1, height: .03 });
});

test('preview prior maps to full source raster after crop and zoom, including portrait/landscape', () => {
  assert.deepEqual(sourceBox(1600, 800, { zoom: 1, x: 0, y: 0 }, { x: .25, y: .25, width: .5, height: .5 }, 720, 360), { x: 270, y: 90, width: 180, height: 180 });
  assert.deepEqual(sourceBox(800, 1600, { zoom: 1, x: 0, y: 0 }, { x: .25, y: .25, width: .5, height: .5 }, 360, 720), { x: 90, y: 270, width: 180, height: 180 });
  assert.deepEqual(sourceBox(1080, 1080, { zoom: 2, x: 108, y: -108 }, { x: .2, y: .2, width: .4, height: .4 }, 720, 720), { x: 216, y: 288, width: 144, height: 144 });
  assert.deepEqual(sourceBox(100, 100, { zoom: 1, x: 0, y: 0 }, { x: 0, y: 0, width: 1, height: 1 }, 100, 100), { x: 1, y: 1, width: 98, height: 98 });
});

test('output feather has 5px coverage at 1080 and follows zoom, without RGB changes or outward halo', () => {
  for (const radius of [5, 8, 15]) {
    const width = 100, height = 40;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) data.set([123, 45, 67, i % width < 50 ? 0 : 255], i * 4);
    featherAlpha(data, width, height, radius);
    const row = Array.from({ length: width }, (_, x) => data[(20 * width + x) * 4 + 3]);
    assert.equal(row.filter(a => a > 0 && a < 255).length, radius);
    assert.ok(row.slice(0, 50).every(a => a === 0));
    assert.ok(row.slice(50 + radius).every(a => a === 255));
    for (let i = 0; i < width * height; i++) assert.deepEqual([...data.slice(i * 4, i * 4 + 3)], [123, 45, 67]);
    // Integrated loss is a modest ~1.4 output pixels at zoom 1, not a 5px erosion.
    const loss = row.slice(50).reduce((sum, alpha) => sum + 1 - alpha / 255, 0);
    assert.ok(loss < radius * .3);
  }
});

test('thin mask strands survive and uniform masks stay exact, including raster boundaries', () => {
  for (const alpha of [0, 128, 255]) {
    const data = new Uint8ClampedArray(9 * 7 * 4).fill(alpha);
    const before = data.slice();
    featherAlpha(data, 9, 7);
    assert.deepEqual(data, before);
  }
  const strand = new Uint8ClampedArray(21 * 21 * 4);
  for (let y = 0; y < 21; y++) strand[(y * 21 + 10) * 4 + 3] = 255;
  featherAlpha(strand, 21, 21);
  assert.ok(strand[(10 * 21 + 10) * 4 + 3] > 0);
  assert.equal(strand[(10 * 21 + 9) * 4 + 3], 0);
});
