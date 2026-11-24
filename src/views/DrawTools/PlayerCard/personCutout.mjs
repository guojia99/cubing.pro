// Selection coordinates are fractions of the square preview, never output clipping.
export const INITIAL_BOX = { x: .1, y: .06, width: .8, height: .88 };
export function clampBox(box) {
  const width = Math.max(.03, Math.min(1, box.width));
  const height = Math.max(.03, Math.min(1, box.height));
  return { x: Math.max(0, Math.min(1 - width, box.x)), y: Math.max(0, Math.min(1 - height, box.y)), width, height };
}
export function drawnBox(a, b) {
  return clampBox({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) });
}
export function sourceBox(width, height, crop, box, bitmapWidth, bitmapHeight) {
  const scale = 1080 / Math.min(width, height) * crop.zoom;
  const left = (1080 - width * scale) / 2 + crop.x;
  const top = (1080 - height * scale) / 2 + crop.y;
  const x = Math.max(1, Math.floor((box.x * 1080 - left) / scale * bitmapWidth / width));
  const y = Math.max(1, Math.floor((box.y * 1080 - top) / scale * bitmapHeight / height));
  const right = Math.min(bitmapWidth - 1, Math.ceil(((box.x + box.width) * 1080 - left) / scale * bitmapWidth / width));
  const bottom = Math.min(bitmapHeight - 1, Math.ceil(((box.y + box.height) * 1080 - top) / scale * bitmapHeight / height));
  return { x, y, width: right - x, height: bottom - y };
}
// A one-pixel binomial filter on alpha only: uniform interiors stay exact.
export function featherAlpha(data, width, height) {
  const alpha = Uint8ClampedArray.from({ length: width * height }, (_, i) => data[i * 4 + 3]);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      sum += alpha[Math.max(0, Math.min(height - 1, y + dy)) * width + Math.max(0, Math.min(width - 1, x + dx))] * (dx === 0 ? 2 : 1) * (dy === 0 ? 2 : 1);
    }
    data[(y * width + x) * 4 + 3] = Math.round(sum / 16);
  }
}
