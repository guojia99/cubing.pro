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

test('feather only changes alpha adjacent to mask edges; RGB and interiors remain exact', () => {
  const data = new Uint8ClampedArray(7 * 5 * 4);
  for (let i = 0; i < 35; i++) data.set([123, 45, 67, i % 7 < 3 ? 0 : 255], i * 4);
  featherAlpha(data, 7, 5);
  for (let i = 0; i < 35; i++) assert.deepEqual([...data.slice(i * 4, i * 4 + 3)], [123, 45, 67]);
  assert.deepEqual(Array.from({ length: 7 }, (_, i) => data[(14 + i) * 4 + 3]), [0, 0, 64, 191, 255, 255, 255]);
});
