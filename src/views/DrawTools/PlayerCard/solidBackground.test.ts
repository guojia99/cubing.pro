import assert from "node:assert/strict";
import test from "node:test";
import { solidRegion, sourcePoint } from "./solidBackground";
import { clampCrop, zoomCrop } from "./composition";

const wall = [242, 211, 221, 255];
const shirt = [220, 173, 193, 255];
function fixture(width = 100, height = 100) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set(wall, i * 4);
  for (let y = 20; y < height; y++) for (let x = 30; x < 70; x++) data.set(shirt, (y * width + x) * 4);
  return data;
}

test("only the exact edge-connected component is masked; deeper pink shirt and enclosed same color survive", () => {
  const data = fixture();
  for (let y = 40; y < 50; y++) for (let x = 40; x < 50; x++) data.set(wall, (y * 100 + x) * 4);
  const original = data.slice();
  const mask = solidRegion(data, 100, 100, 5, 5)!;
  assert.ok(mask);
  for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) {
    assert.equal(mask[y * 100 + x], y >= 20 && x >= 30 && x < 70 ? 0 : 1, `${x},${y}`);
  }
  assert.deepEqual(data, original, "source bytes remain unchanged");
  assert.equal(solidRegion(data, 100, 100, 45, 45), null, "enclosed patch is rejected");
  assert.equal(solidRegion(data, 100, 100, 45, 70), null, "shirt connected only to the bottom is rejected");
});

test("tolerance stays anchored to the seed rather than walking into deeper pink", () => {
  const data = fixture();
  for (let x = 0; x < 100; x++) for (let y = 0; y < 100; y++) data.set([242, 211 - Math.floor(x / 5), 221, 255], (y * 100 + x) * 4);
  const mask = solidRegion(data, 100, 100, 0, 0)!;
  assert.equal(mask.reduce((a, b) => a + b, 0), 5500);
  assert.equal(mask[54], 1);
  assert.equal(mask[55], 0);
});

test("reject nearly entire image, tiny regions, transparency and crop-only boundaries", () => {
  const uniform = new Uint8ClampedArray(40000);
  for (let i = 0; i < 10000; i++) uniform.set(wall, i * 4);
  assert.equal(solidRegion(uniform, 100, 100, 0, 0), null);
  const data = fixture();
  data.set([0, 0, 0, 255], 0);
  assert.equal(solidRegion(data, 100, 100, 0, 0), null);
  data.set([0, 0, 0, 0], 0);
  assert.equal(solidRegion(data, 100, 100, 0, 0), null);
  for (let y = 35; y < 65; y++) for (let x = 35; x < 65; x++) data.set(wall, (y * 100 + x) * 4);
  assert.equal(solidRegion(data, 100, 100, 35, 40), null);
  assert.equal(solidRegion(data, 100, 100, -1, 0), null);
});

test("preview points invert actual crop and zoom for landscape and portrait sources", () => {
  for (const [width, height] of [[4032, 3024], [3024, 4032], [1080, 1080]]) {
    const dragged = clampCrop(width, height, { zoom: 1, x: 123, y: -75 });
    const crop = zoomCrop(width, height, dragged, 2.37);
    const point = sourcePoint(width, height, crop, 287, 619);
    const scale = 1080 / Math.min(width, height) * crop.zoom;
    assert.ok(Math.abs(point.x * scale + (1080 - width * scale) / 2 + crop.x - 287) < 1e-9);
    assert.ok(Math.abs(point.y * scale + (1080 - height * scale) / 2 + crop.y - 619) < 1e-9);
  }
});

test("a solid shirt that touches a lower image corner is not a backdrop", () => {
  const data = fixture();
  for (let y = 55; y < 100; y++) for (let x = 0; x < 55; x++) data.set(shirt, (y * 100 + x) * 4);
  assert.equal(solidRegion(data, 100, 100, 40, 70), null);
  assert.ok(solidRegion(data, 100, 100, 20, 20));
});
