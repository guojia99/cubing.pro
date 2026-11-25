/* Dedicated classic worker. No photo network calls; OpenCV is same-origin only. */
self.onmessage = async ({ data: { pixels, width, height, box } }) => {
  const mats = [];
  try {
    importScripts('/vendor/opencv/4.11.0/opencv.js');
    const cv = await self.cv;
    if (typeof cv?.grabCut !== 'function' || !cv.getBuildInformation().includes('4.11.0')) {
      throw new Error('Official OpenCV 4.11.0 GrabCut binding unavailable');
    }
    const keep = mat => { mats.push(mat); return mat; };
    const rgba = keep(cv.matFromArray(height, width, cv.CV_8UC4, new Uint8ClampedArray(pixels)));
    const rgb = keep(new cv.Mat());
    cv.cvtColor(rgba, rgb, cv.COLOR_RGBA2RGB);
    const mask = keep(new cv.Mat(height, width, cv.CV_8UC1));
    // The rectangle is a probabilistic prior, not a clipping boundary. Only
    // the source image's outermost pixel supplies definite background seeds.
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      mask.data[y * width + x] = x === 0 || y === 0 || x === width - 1 || y === height - 1 ? cv.GC_BGD
        : x >= box.x && x < box.x + box.width && y >= box.y && y < box.y + box.height ? cv.GC_PR_FGD : cv.GC_PR_BGD;
    }
    const bg = keep(new cv.Mat()), fg = keep(new cv.Mat());
    cv.setRNGSeed(0);
    cv.grabCut(rgb, mask, new cv.Rect(0, 0, 0, 0), bg, fg, 5, cv.GC_INIT_WITH_MASK);
    const alpha = Uint8Array.from(mask.data, value => value === cv.GC_FGD || value === cv.GC_PR_FGD ? 255 : 0);
    if (!alpha.some(value => value !== 0)) throw new Error('GrabCut returned an empty subject');
    cleanSubjectMask(alpha, width, height, box);
    self.postMessage({ alpha: alpha.buffer, width, height }, [alpha.buffer]);
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  } finally {
    for (const mat of mats.reverse()) mat.delete();
    self.close();
  }
};

function cleanSubjectMask(alpha, width, height, box) {
  const total = width * height;
  const visited = new Uint8Array(total), queue = new Int32Array(total);
  let largest = queue.subarray(0, 0), foundInBox = false;
  for (const component of components(255, true)) {
    if (component.length > largest.length) largest = component;
    if (component.some(index => {
      const x = index % width, y = Math.floor(index / width);
      return x >= box.x && x < box.x + box.width && y >= box.y && y < box.y + box.height;
    })) foundInBox = true;
    else for (const index of component) alpha[index] = 0;
  }
  if (!foundInBox) for (const index of largest) alpha[index] = 255;

  const maxHole = Math.round(total * 0.06);
  visited.fill(0);
  for (const component of components(0, false)) {
    if (component.length <= maxHole && !component.some(index =>
      index < width || index >= total - width || index % width === 0 || index % width === width - 1)) {
      for (const index of component) alpha[index] = 255;
    }
  }

  function* components(value, diagonal) {
    let tail = 0;
    for (let seed = 0; seed < total; seed++) {
      if (visited[seed] || alpha[seed] !== value) continue;
      const start = tail;
      queue[tail++] = seed;
      visited[seed] = 1;
      for (let head = start; head < tail; head++) {
        const index = queue[head], x = index % width, y = Math.floor(index / width);
        for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny++) {
          for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx++) {
            if (!diagonal && nx !== x && ny !== y) continue;
            const neighbor = ny * width + nx;
            if (visited[neighbor] || alpha[neighbor] !== value) continue;
            visited[neighbor] = 1;
            queue[tail++] = neighbor;
          }
        }
      }
      yield queue.subarray(start, tail);
    }
  }
}
