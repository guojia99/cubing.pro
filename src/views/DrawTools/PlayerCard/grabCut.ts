import { sourceBox, featherAlpha } from './personCutout.mjs';
import type { Crop } from './composition';

type Box = { x: number; y: number; width: number; height: number };

// Called exclusively by the explicit cutout button. Terminating the dedicated
// worker cancels synchronous WASM computation as well as an in-flight load.
export function startGrabCut(image: HTMLImageElement, crop: Crop, box: Box) {
  const sample = document.createElement('canvas');
  const ratio = Math.min(1, 720 / Math.max(image.naturalWidth, image.naturalHeight));
  sample.width = Math.max(3, Math.round(image.naturalWidth * ratio));
  sample.height = Math.max(3, Math.round(image.naturalHeight * ratio));
  const ctx = sample.getContext('2d')!;
  ctx.drawImage(image, 0, 0, sample.width, sample.height);
  const pixels = ctx.getImageData(0, 0, sample.width, sample.height);
  const rect = sourceBox(image.naturalWidth, image.naturalHeight, crop, box, sample.width, sample.height);
  if (rect.width < 2 || rect.height < 2) throw new Error('Selection is too small');
  const worker = new Worker('/workers/player-card-grabcut.js');
  let rejectTask: (error: Error) => void;
  const result = new Promise<HTMLCanvasElement>((resolve, reject) => {
    rejectTask = reject;
    worker.onerror = event => { event.preventDefault(); reject(new Error(event.message)); worker.terminate(); };
    worker.onmessage = ({ data }) => {
      worker.terminate();
      if (data.error) { reject(new Error(data.error)); return; }
      try {
        const alpha = new Uint8Array(data.alpha);
        for (let i = 0; i < alpha.length; i++) {
          pixels.data[i * 4] = pixels.data[i * 4 + 1] = pixels.data[i * 4 + 2] = 255;
          pixels.data[i * 4 + 3] = alpha[i];
        }
        ctx.putImageData(pixels, 0, 0);
        const output = document.createElement('canvas');
        const outputRatio = Math.min(1, 2160 / Math.max(image.naturalWidth, image.naturalHeight));
        output.width = Math.round(image.naturalWidth * outputRatio);
        output.height = Math.round(image.naturalHeight * outputRatio);
        const outputCtx = output.getContext('2d')!;
        outputCtx.drawImage(sample, 0, 0, output.width, output.height);
        const mask = outputCtx.getImageData(0, 0, output.width, output.height);
        featherAlpha(mask.data, output.width, output.height);
        outputCtx.putImageData(mask, 0, 0);
        outputCtx.globalCompositeOperation = 'source-in';
        outputCtx.drawImage(image, 0, 0, output.width, output.height);
        outputCtx.globalCompositeOperation = 'source-over';
        resolve(output);
      } catch (error) { reject(error); }
    };
    const buffer = pixels.data.buffer.slice(0);
    worker.postMessage({ pixels: buffer, width: sample.width, height: sample.height, box: rect }, [buffer]);
  });
  return { result, cancel() { worker.terminate(); rejectTask(new DOMException('Cancelled', 'AbortError')); } };
}
