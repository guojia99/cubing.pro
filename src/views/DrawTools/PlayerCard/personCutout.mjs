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
// A separable box filter on MASK alpha only. Cap by the original coverage:
// never resurrect removed background RGB, and retain fine strands at lower alpha.
// Radius is measured in the raster being painted (5 pixels at 1080, before zoom).
export function featherAlpha(data, width, height, radius = 5) {
  radius = Math.max(1, Math.round(radius));
  const span = radius * 2 + 1;
  const horizontal = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let dx = -radius; dx <= radius; dx++) sum += data[(y * width + Math.max(0, Math.min(width - 1, dx))) * 4 + 3];
    for (let x = 0; x < width; x++) {
      horizontal[y * width + x] = sum / span;
      sum += data[(y * width + Math.min(width - 1, x + radius + 1)) * 4 + 3]
        - data[(y * width + Math.max(0, x - radius)) * 4 + 3];
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let dy = -radius; dy <= radius; dy++) sum += horizontal[Math.max(0, Math.min(height - 1, dy)) * width + x];
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4 + 3;
      data[i] = Math.min(data[i], Math.round(sum / span));
      sum += horizontal[Math.min(height - 1, y + radius + 1) * width + x]
        - horizontal[Math.max(0, y - radius) * width + x];
    }
  }
}
