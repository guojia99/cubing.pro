export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

// Input is the editor's bounded (longest edge <= 350) RGB work surface.
export function segmentPhoto(data: Uint8ClampedArray, width: number, height: number, rect: Rect): Uint8ClampedArray {
  const count = width * height;
  const inside = (x: number, y: number) => x >= rect.x * width && x < (rect.x + rect.width) * width && y >= rect.y * height && y < (rect.y + rect.height) * height;
  const bg = new Map<number, number[]>(), fg = new Map<number, number[]>();
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const core = Math.abs(x / width - rect.x - rect.width / 2) < rect.width * .24 && Math.abs(y / height - rect.y - rect.height / 2) < rect.height * .36;
    if (inside(x, y) && !core) continue;
    const bins = inside(x, y) ? fg : bg;
    const key = (data[i] >> 5) * 64 + (data[i + 1] >> 5) * 8 + (data[i + 2] >> 5);
    const bin = bins.get(key) ?? [0, 0, 0, 0];
    for (let c = 0; c < 3; c++) bin[c] += data[i + c];
    bin[3]++; bins.set(key, bin);
  }
  const palette = (bins: Map<number, number[]>) => [...bins.values()].sort((a, b) => b[3] - a[3]).slice(0, 32).map(b => b.slice(0, 3).map(v => v / b[3]));
  const backgrounds = palette(bg), foregrounds = palette(fg);
  const distance = (i: number, colors: number[][]) => {
    let best = 195075;
    for (const c of colors) best = Math.min(best, (data[i] - c[0]) ** 2 + (data[i + 1] - c[1]) ** 2 + (data[i + 2] - c[2]) ** 2);
    return Math.sqrt(best);
  };
  const score = new Float32Array(count);
  let labels = new Uint8ClampedArray(count);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x;
    if (!inside(x, y)) { score[p] = -100; continue; }
    const b = distance(p * 4, backgrounds), f = distance(p * 4, foregrounds);
    const interior = Math.max(0, 1 - Math.max(Math.abs((x / width - rect.x) / rect.width * 2 - 1),
      Math.abs((y / height - rect.y) / rect.height * 2 - 1)));
    score[p] = (b - f - 6 + 10 * interior) / 25;
    labels[p] = score[p] > 0 ? 255 : 0;
  }
  // Local edge-weighted regularization removes color noise without crossing strong edges.
  for (let pass = 0; pass < 5; pass++) {
    const next = labels.slice();
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      if (!inside(x, y)) continue;
      let vote = score[p];
      for (const q of [p - 1, p + 1, p - width, p + width]) {
        let edge = 0;
        for (let c = 0; c < 3; c++) edge += (data[p * 4 + c] - data[q * 4 + c]) ** 2;
        vote += .8 * Math.exp(-edge / 1200) * (labels[q] ? 1 : -1);
      }
      next[p] = vote > 0 ? 255 : 0;
    }
    labels = next;
  }
  const seen = new Uint8Array(count), queue = new Int32Array(count);
  for (let p = 0; p < count; p++) {
    if (!labels[p] || seen[p]) continue;
    let start = 0, end = 1; queue[0] = p; seen[p] = 1;
    while (start < end) {
      const q = queue[start++], x = q % width;
      for (const n of [x > 0 ? q - 1 : -1, x < width - 1 ? q + 1 : -1, q - width, q + width]) {
        if (n < 0 || n >= count || seen[n] || !labels[n]) continue;
        seen[n] = 1; queue[end++] = n;
      }
    }
    if (end < Math.max(4, count * .0004)) for (let j = 0; j < end; j++) labels[queue[j]] = 0;
  }
  // Closing reconnects fine gaps such as dark eyes and edges of strands.
  for (const goal of [255, 0]) {
    const next = labels.slice();
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      if (!inside(x, y)) continue;
      const p = y * width + x;
      if (labels[p] === goal) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (dx * dx + dy * dy > 4 || x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
        if (labels[p + dy * width + dx] === goal) next[p] = goal;
      }
    }
    labels = next;
  }
  // Fill small enclosed holes, whether their colors resemble the background or not.
  seen.fill(0);
  for (let p = 0; p < count; p++) {
    if (labels[p] || seen[p] || !inside(p % width, Math.floor(p / width))) continue;
    let start = 0, end = 1, outside = false; queue[0] = p; seen[p] = 1;
    while (start < end) {
      const q = queue[start++], x = q % width;
      for (const n of [x > 0 ? q - 1 : -1, x < width - 1 ? q + 1 : -1, q - width, q + width]) {
        if (n < 0 || n >= count || !inside(n % width, Math.floor(n / width))) { outside = true; continue; }
        if (seen[n] || labels[n]) continue;
        seen[n] = 1; queue[end++] = n;
      }
    }
    if (!outside && end <= count * rect.width * rect.height * .06) for (let j = 0; j < end; j++) labels[queue[j]] = 255;
  }
  if (!labels.some(v => v > 0)) {
    // No color separation was found. Start with the user's box, not a blank card.
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (inside(x, y)) labels[y * width + x] = 255;
    }
  }
  // Only a fraction of one work pixel is softened; strong color edges stay crisp.
  const result = labels.slice();
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const p = y * width + x;
    let sum = labels[p] * 8, weight = 8;
    for (const q of [p - 1, p + 1, p - width, p + width]) {
      let edge = 0;
      for (let c = 0; c < 3; c++) edge += (data[p * 4 + c] - data[q * 4 + c]) ** 2;
      const w = Math.exp(-edge / 1200); sum += labels[q] * w; weight += w;
    }
    result[p] = Math.round(sum / weight);
  }
  return result;
}

export function brushMask(mask: Uint8ClampedArray, width: number, height: number, from: Point, to: Point, radius: number, value: 0 | 255): Uint8ClampedArray {
  const result = mask.slice();
  const ax = from.x * width, ay = from.y * height, bx = to.x * width, by = to.y * height;
  const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
  for (let y = Math.max(0, Math.floor(Math.min(ay, by) - radius)); y < Math.min(height, Math.ceil(Math.max(ay, by) + radius)); y++) {
    for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - radius)); x < Math.min(width, Math.ceil(Math.max(ax, bx) + radius)); x++) {
      const t = length ? Math.max(0, Math.min(1, ((x + .5 - ax) * dx + (y + .5 - ay) * dy) / length)) : 0;
      const coverage = Math.max(0, Math.min(1, radius + .5 - Math.hypot(x + .5 - ax - t * dx, y + .5 - ay - t * dy)));
      const p = y * width + x; result[p] = Math.round(result[p] * (1 - coverage) + value * coverage);
    }
  }
  return result;
}
