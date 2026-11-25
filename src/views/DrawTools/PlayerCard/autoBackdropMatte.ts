type RGB = [number, number, number];

// The caller supplies an opaque photograph, already decoded at export resolution.
// Returning false leaves every byte intact for the full-window photograph path.
export function autoBackdropMatte({ data, width, height }: ImageData): boolean {
  const sample = sampleBackdrop(data, width, height);
  if (!sample) return false;
  const { color, removeIslands } = sample;
  const total = width * height, distance = new Uint8Array(total);
  const tinted = Math.max(...color) - Math.min(...color) >= 14;
  for (let i = 0; i < total; i++) {
    const p = i * 4, r = data[p] - color[0], g = data[p + 1] - color[1], b = data[p + 2] - color[2];
    // A studio shadow shifts the channels together. A change of hue can cross
    // into the hand even while every channel is still within the RGB tolerance.
    const chroma = tinted ? 2 * (Math.max(r, g, b) - Math.min(r, g, b)) : 0;
    distance[i] = Math.min(255, Math.max(Math.abs(r), Math.abs(g), Math.abs(b), chroma));
  }

  const removed = new Uint8Array(total), queue = new Int32Array(total);
  let tail = 0;
  function seed(i: number) {
    if (!removed[i] && distance[i] <= 28) { removed[i] = 1; queue[tail++] = i; }
  }
  for (let x = 0; x < width; x++) { seed(x); seed(total - width + x); }
  for (let y = 1; y < height - 1; y++) { seed(y * width); seed(y * width + width - 1); }

  function spread(next: number, at: number) {
    if (removed[next] || distance[next] > 30) return;
    const n = next * 4;
    if (Math.abs(data[n] - data[at]) > 12 || Math.abs(data[n + 1] - data[at + 1]) > 12 ||
        Math.abs(data[n + 2] - data[at + 2]) > 12) return;
    removed[next] = 1; queue[tail++] = next;
  }
  for (let head = 0; head < tail; head++) {
    const i = queue[head], x = i % width, at = i * 4;
    if (x > 0) spread(i - 1, at);
    if (x + 1 < width) spread(i + 1, at);
    if (i >= width) spread(i - width, at);
    if (i + width < total) spread(i + width, at);
  }
  if (!tail || tail === total) return false;

  const seen = new Uint8Array(total);
  if (removeIslands) {
    // An enclosed highlight may briefly approach the tint in a JPEG. Require an
    // actual patch of the studio color, not a few pinkish pixels on an eye mask.
    for (let i = 0; i < total; i++) {
      if (removed[i] || seen[i] || distance[i] > 14) continue;
      const count = component(i, removed, seen, queue, width, distance);
      if (count < 4 || count > total * .08) continue;
      // Require a 2×2 patch inside the color tolerance; scattered JPEG highlights
      // have no interior, while enclosed studio color can differ by up to 14.
      let hasInterior = false;
      for (let j = 0; j < count && !hasInterior; j++) {
        const p = queue[j];
        if (p % width === width - 1 || p + width + 1 >= total) continue;
        hasInterior = !removed[p + 1] && !removed[p + width] && !removed[p + width + 1] &&
          distance[p + 1] <= 14 && distance[p + width] <= 14 && distance[p + width + 1] <= 14;
      }
      if (hasInterior) for (let j = 0; j < count; j++) removed[queue[j]] = 1;
    }
    seen.fill(0);
  }

  const speck = Math.max(24, total * .00035);
  let kept = 0;
  for (let i = 0; i < total; i++) {
    if (removed[i] || seen[i]) continue;
    const count = component(i, removed, seen, queue, width);
    if (count < speck) {
      let touchesEdge = false;
      for (let j = 0; j < count && !touchesEdge; j++) {
        const p = queue[j], x = p % width;
        touchesEdge = x === 0 || x === width - 1 || p < width || p >= total - width;
      }
      if (!touchesEdge) {
        for (let j = 0; j < count; j++) removed[queue[j]] = 1;
        continue;
      }
    }
    kept += count;
  }
  if (!kept) return false;
  featherAndUnmix(data, width, height, removed, distance, color);
  return true;
}

function colorDistance(data: Uint8ClampedArray, pixel: number, color: RGB) {
  const p = pixel * 4;
  return Math.max(Math.abs(data[p] - color[0]), Math.abs(data[p + 1] - color[1]), Math.abs(data[p + 2] - color[2]));
}

function sampleBackdrop(data: Uint8ClampedArray, w: number, h: number) {
  const total = w * h, border: number[] = [];
  for (let x = 0; x < w; x++) {
    border.push(x);
    if (x < .18 * w || x >= .82 * w) border.push(total - w + x);
  }
  for (let y = 1; y < .75 * h; y++) border.push(y * w, y * w + w - 1);
  const median = (c: number) => border.map(i => data[i * 4 + c]).sort((a, b) => a - b)[border.length >> 1];
  const color: RGB = [median(0), median(1), median(2)];
  if (border.filter(i => colorDistance(data, i, color) <= 26).length < .55 * border.length) return null;
  let uniform = 0, perimeter = 0;
  function measure(i: number) { perimeter++; if (colorDistance(data, i, color) <= 26) uniform++; }
  for (let x = 0; x < w; x++) { measure(x); measure(total - w + x); }
  for (let y = 1; y < h - 1; y++) { measure(y * w); measure(y * w + w - 1); }
  return { color, removeIslands: uniform >= .75 * perimeter && Math.max(...color) - Math.min(...color) >= 14 };
}

// Four-connected background islands; use eight neighbors for foreground so a
// diagonal hair, glasses arm or fingertip remains attached to its subject.
function component(start: number, removed: Uint8Array, seen: Uint8Array, queue: Int32Array, w: number, distance?: Uint8Array) {
  let count = 1;
  seen[start] = 1; queue[0] = start;
  function visit(i: number) {
    if (!seen[i] && !removed[i] && (!distance || distance[i] <= 14)) { seen[i] = 1; queue[count++] = i; }
  }
  for (let j = 0; j < count; j++) {
    const i = queue[j], x = i % w, up = i >= w, down = i + w < removed.length;
    if (up) visit(i - w);
    if (down) visit(i + w);
    if (x > 0) { visit(i - 1); if (!distance && up) visit(i - w - 1); if (!distance && down) visit(i + w - 1); }
    if (x + 1 < w) { visit(i + 1); if (!distance && up) visit(i - w + 1); if (!distance && down) visit(i + w + 1); }
  }
  return count;
}

function featherAndUnmix(data: Uint8ClampedArray, w: number, h: number, removed: Uint8Array, distance: Uint8Array, bg: RGB) {
  // Separable five-tap filter (2.5 source pixels of support). Only change the
  // inward band: fully transparent background must never grow a pale fringe.
  const row = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const left = y * w, right = left + w - 1;
    for (let i = left; i <= right; i++) {
      row[i] = removed[Math.max(left, i - 2)] + 4 * removed[Math.max(left, i - 1)] + 6 * removed[i] +
        4 * removed[Math.min(right, i + 1)] + removed[Math.min(right, i + 2)];
    }
  }
  for (let y = 0; y < h; y++) {
    const top2 = Math.max(0, y - 2) * w, top = Math.max(0, y - 1) * w, mid = y * w;
    const bottom = Math.min(h - 1, y + 1) * w, bottom2 = Math.min(h - 1, y + 2) * w;
    for (let x = 0; x < w; x++) {
      const i = mid + x, p = i * 4;
      if (removed[i]) { data[p + 3] = 0; continue; }
      const outside = row[top2 + x] + 4 * row[top + x] + 6 * row[i] + 4 * row[bottom + x] + row[bottom2 + x];
      if (!outside) continue;
      // Estimate local foreground contrast for previously antialiased/JPEG edges.
      // The most distant adjacent color bounds how much studio color could remain.
      let reference = distance[i];
      for (let yy = Math.max(0, y - 2); yy <= Math.min(h - 1, y + 2); yy++) {
        for (let xx = Math.max(0, x - 2); xx <= Math.min(w - 1, x + 2); xx++) {
          const n = yy * w + xx;
          if (!removed[n] && distance[n] > reference) reference = distance[n];
        }
      }
      const a = Math.min(1 - outside / 256, Math.max(.12, distance[i] / (reference || 1)));
      for (let c = 0; c < 3; c++) data[p + c] = bg[c] + (data[p + c] - bg[c]) / a;
      data[p + 3] = Math.round(255 * a);
    }
  }
}
