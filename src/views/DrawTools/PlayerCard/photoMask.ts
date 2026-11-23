export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

// Rectangle coordinates refer to the normalized source photo, not its displayed size.
// Include left/top pixel centers and exclude right/bottom pixel centers.
export function rectangleMask(width: number, height: number, rect: Rect): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(width * height);
  const left = rect.x * width, right = (rect.x + rect.width) * width;
  const top = rect.y * height, bottom = (rect.y + rect.height) * height;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (x + .5 >= left && x + .5 < right && y + .5 >= top && y + .5 < bottom) mask[y * width + x] = 255;
  }
  return mask;
}

export function eraseMask(mask: Uint8ClampedArray, width: number, height: number, from: Point, to: Point, radius: number): Uint8ClampedArray {
  const result = mask.slice();
  const ax = from.x * width, ay = from.y * height, bx = to.x * width, by = to.y * height;
  const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
  for (let y = Math.max(0, Math.floor(Math.min(ay, by) - radius)); y < Math.min(height, Math.ceil(Math.max(ay, by) + radius)); y++) {
    for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - radius)); x < Math.min(width, Math.ceil(Math.max(ax, bx) + radius)); x++) {
      const t = length ? Math.max(0, Math.min(1, ((x + .5 - ax) * dx + (y + .5 - ay) * dy) / length)) : 0;
      const coverage = Math.max(0, Math.min(1, radius + .5 - Math.hypot(x + .5 - ax - t * dx, y + .5 - ay - t * dy)));
      const p = y * width + x; result[p] = Math.round(result[p] * (1 - coverage));
    }
  }
  return result;
}
