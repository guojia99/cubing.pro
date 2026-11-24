import { CARD_SIZE, type Crop } from "./composition";

export function sourcePoint(width: number, height: number, crop: Crop, x: number, y: number) {
  const scale = CARD_SIZE / Math.min(width, height) * crop.zoom;
  return {
    x: (x - (CARD_SIZE - width * scale) / 2 - crop.x) / scale,
    y: (y - (CARD_SIZE - height * scale) / 2 - crop.y) / scale,
  };
}

// Four-connected, fixed seed comparison: nearby shades cannot accumulate drift.
export function solidRegion(data: Uint8ClampedArray, width: number, height: number, x: number, y: number): Uint8Array | null {
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  const seed = y * width + x;
  const offset = seed * 4;
  const matches = (i: number) => data[i * 4 + 3] === 255 &&
    Math.abs(data[i * 4] - data[offset]) <= 10 &&
    Math.abs(data[i * 4 + 1] - data[offset + 1]) <= 10 &&
    Math.abs(data[i * 4 + 2] - data[offset + 2]) <= 10;
  if (!matches(seed)) return null;
  const total = width * height;
  const mask = new Uint8Array(total);
  const queue = new Uint32Array(total);
  let count = 1;
  let top = false, left = false, right = false;
  mask[seed] = 1;
  queue[0] = seed;
  for (let head = 0; head < count; head++) {
    const i = queue[head];
    const column = i % width;
    if (column === 0) left = true;
    if (column === width - 1) right = true;
    if (i < width) top = true;
    for (let direction = 0; direction < 4; direction++) {
      const next = direction === 0 ? (column > 0 ? i - 1 : -1)
        : direction === 1 ? (column < width - 1 ? i + 1 : -1)
        : direction === 2 ? i - width : i + width;
      if (next < 0 || next >= total || mask[next] || !matches(next)) continue;
      mask[next] = 1;
      queue[count++] = next;
    }
  }
  // A portrait's clothing often reaches the bottom and a lower corner. Do
  // not treat that alone as a background: require the top and a side, or both sides.
  const backgroundEdges = (top && (left || right)) || (left && right);
  return backgroundEdges && count >= Math.max(16, total * 0.01) && count <= total * 0.95 ? mask : null;
}

export function replaceSolidBackground(image: HTMLImageElement, point: { x: number; y: number }): HTMLCanvasElement | null {
  const scale = Math.min(1, 2160 / Math.max(image.naturalWidth, image.naturalHeight));
  const result = document.createElement("canvas");
  result.width = Math.max(1, Math.round(image.naturalWidth * scale));
  result.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = result.getContext("2d")!;
  ctx.drawImage(image, 0, 0, result.width, result.height);
  const pixels = ctx.getImageData(0, 0, result.width, result.height);
  const mask = solidRegion(pixels.data, result.width, result.height,
    point.x * result.width / image.naturalWidth, point.y * result.height / image.naturalHeight);
  if (!mask) return null;
  for (let i = 0; i < mask.length; i++) if (mask[i]) pixels.data[i * 4 + 3] = 0;
  ctx.putImageData(pixels, 0, 0);
  return result;
}
