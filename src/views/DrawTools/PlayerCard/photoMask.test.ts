import assert from "node:assert/strict";
import test from "node:test";
import { brushMask, segmentPhoto } from "./photoMask";

function scene(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const subject = ((x - width * .5) / (width * .16)) ** 2 + ((y - height * .5) / (height * .37)) ** 2 < 1;
    const color = subject ? [160 + (x % 9), 60 + (y % 12), 35] : x < width / 2 ? [35 + y % 25, 130, 170] : [70, 170 + y % 25, 80];
    data.set([...color, 255], (y * width + x) * 4);
  }
  return data;
}

test("nonuniform background preserves textured silhouette, including edges, deterministically", () => {
  const w = 120, h = 180, data = scene(w, h);
  const box = { x: .28, y: .08, width: .44, height: .84 };
  const mask = segmentPhoto(data, w, h, box);
  assert.deepEqual(mask, segmentPhoto(data, w, h, box));
  let correct = 0, total = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const subject = data[(y * w + x) * 4] >= 160;
    if ((mask[y * w + x] > 127) === subject) correct++;
    total++;
  }
  assert.ok(correct / total > .98);
  assert.equal(mask[90 * w + 60], 255);
  assert.equal(mask[90 * w + 38], 0);
  assert.ok(mask[90 * w + 41] > 245, "High contrast edge remains crisp");
  assert.equal(data[4 * (90 * w + 60)], 166, "Source pixels are untouched");
});

test("continuous round strokes use independent x/y scales, keep/erase and immutable undo", () => {
  const w = 200, h = 80, original = new Uint8ClampedArray(w * h);
  const kept = brushMask(original, w, h, { x: .1, y: .5 }, { x: .9, y: .5 }, 5, 255);
  for (let x = 20; x < 180; x++) assert.equal(kept[40 * w + x], 255);
  assert.equal(kept[34 * w + 100], 0);
  assert.ok(kept[40 * w + 15] > 240, "Round endpoint has a lightly antialiased edge");
  const erased = brushMask(kept, w, h, { x: .5, y: .1 }, { x: .5, y: .9 }, 4, 0);
  assert.equal(erased[40 * w + 100], 0);
  assert.equal(kept[40 * w + 100], 255, "Previous mask is a complete one-step undo snapshot");
  assert.ok(original.every(v => v === 0));
  const repaired = brushMask(erased, w, h, { x: .5, y: .5 }, { x: .5, y: .5 }, 5, 255);
  assert.equal(repaired[40 * w + 100], 255);
});

test("when both sides have the same color, the person box remains editable rather than disappearing", () => {
  const width = 40, height = 40;
  const pixels = new Uint8ClampedArray(width * height * 4).fill(120);
  const result = segmentPhoto(pixels, width, height, { x: .2, y: .2, width: .6, height: .6 });
  assert.equal(result[20 * width + 20], 255);
  assert.equal(result[0], 0);
});
