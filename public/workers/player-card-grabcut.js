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
    self.postMessage({ alpha: alpha.buffer, width, height }, [alpha.buffer]);
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  } finally {
    for (const mat of mats.reverse()) mat.delete();
    self.close();
  }
};
