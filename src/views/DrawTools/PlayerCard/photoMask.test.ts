import assert from "node:assert/strict";
import test from "node:test";
import { eraseMask, rectangleMask } from "./photoMask";

test("normalized rectangle retains exactly pixel centers inside its half-open bounds", () => {
  const mask = rectangleMask(8, 4, { x: .1875, y: .125, width: .5, height: .5 });
  assert.deepEqual([...mask], [
    0,255,255,255,255,0,0,0,
    0,255,255,255,255,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
  ]);
});

test("full resolution normalized photo has only 255 inside and 0 outside", () => {
  const width = 1620, height = 2160;
  const rect = { x: .25, y: .125, width: .5, height: .75 };
  const mask = rectangleMask(width, height, rect);
  for (let y = 0; y < height; y++) {
    const row = mask.subarray(y * width, (y + 1) * width);
    if (y >= 270 && y < 1890) {
      assert.ok(row.subarray(0,405).every(v => v === 0));
      assert.ok(row.subarray(405,1215).every(v => v === 255));
      assert.ok(row.subarray(1215).every(v => v === 0));
    } else assert.ok(row.every(v => v === 0));
  }
  assert.deepEqual(mask, rectangleMask(width, height, rect));
  assert.ok(rectangleMask(8, 4, { x: 0, y: 0, width: 1, height: 1 }).every(v => v === 255));
  assert.ok(rectangleMask(8, 4, { x: .5, y: .5, width: 0, height: 0 }).every(v => v === 0));
});

test("continuous round erasing respects independent axes and immutable undo snapshots", () => {
  const w = 200, h = 80;
  const original = rectangleMask(w, h, { x: 0, y: 0, width: 1, height: 1 });
  const erased = eraseMask(original, w, h, { x: .1, y: .5 }, { x: .9, y: .5 }, 5);
  for (let x = 20; x < 180; x++) assert.equal(erased[40 * w + x], 0);
  assert.equal(erased[34 * w + 100], 255);
  assert.ok(erased[40 * w + 15] < 15, "Round endpoint is lightly antialiased");
  assert.ok(original.every(v => v === 255), "Undo snapshot is unchanged");
  const small = eraseMask(original, w, h, { x: .5, y: .5 }, { x: .5, y: .5 }, 2);
  const large = eraseMask(original, w, h, { x: .5, y: .5 }, { x: .5, y: .5 }, 8);
  assert.equal(small[40 * w + 105], 255);
  assert.equal(large[40 * w + 105], 0);
});
