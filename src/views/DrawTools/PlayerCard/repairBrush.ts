import { CARD_SIZE, type Crop } from "./composition";
import { sourcePoint } from "./solidBackground";

export const REPAIR_RADIUS = 12;
export type BrushPoint = { x: number; y: number; rx: number; ry: number };

export function repairPoint(width: number, height: number, bitmapWidth: number, bitmapHeight: number, crop: Crop,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">, clientX: number, clientY: number, radius = REPAIR_RADIUS): BrushPoint {
  const point = sourcePoint(width, height, crop, (clientX - rect.left) * CARD_SIZE / rect.width, (clientY - rect.top) * CARD_SIZE / rect.height);
  const scale = CARD_SIZE / Math.min(width, height) * crop.zoom;
  return {
    x: point.x * bitmapWidth / width, y: point.y * bitmapHeight / height,
    rx: radius * CARD_SIZE / rect.width / scale * bitmapWidth / width,
    ry: radius * CARD_SIZE / rect.height / scale * bitmapHeight / height,
  };
}

export function fullImageRepairPoint(bitmapWidth: number, bitmapHeight: number,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">, clientX: number, clientY: number, radius = REPAIR_RADIUS): BrushPoint {
  const scaleX = rect.width / bitmapWidth, scaleY = rect.height / bitmapHeight;
  return { x: (clientX - rect.left) / scaleX, y: (clientY - rect.top) / scaleY, rx: radius / scaleX, ry: radius / scaleY };
}

export function paintCutoutWorkbench(target: HTMLCanvasElement, sourceImage: HTMLImageElement, replacement: HTMLCanvasElement,
  mode: "erase" | "restore", cropTransform?: { left: number; top: number; width: number; height: number; canvasSize: number }) {
  const { width, height } = target;
  const ctx = target.getContext("2d")!;
  const cell = Math.max(12, Math.round(Math.min(width, height) / 36));
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#eef0f4";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#d8dde6";
  for (let row = 0; row * cell < height; row++) {
    for (let x = (row % 2 === 0 ? cell : 0); x < width; x += cell * 2) ctx.fillRect(x, row * cell, cell, cell);
  }
  const rect: [number, number, number, number] = cropTransform ? [
    cropTransform.left * width / cropTransform.canvasSize, cropTransform.top * height / cropTransform.canvasSize,
    cropTransform.width * width / cropTransform.canvasSize, cropTransform.height * height / cropTransform.canvasSize,
  ] : [0, 0, width, height];
  if (mode === "restore") {
    ctx.globalAlpha = 0.22;
    ctx.drawImage(sourceImage, ...rect);
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(replacement, ...rect);
  ctx.restore();
}

export function eraseSegment(canvas: HTMLCanvasElement, point: BrushPoint, previous = point) {
  const ctx = canvas.getContext("2d")!;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  // Keep the editable mask unfeathered; composition softens it once at output scale.
  ctx.scale(point.rx, point.ry);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(previous.x / point.rx, previous.y / point.ry);
  ctx.lineTo(point.x / point.rx, point.y / point.ry);
  ctx.stroke();
  // A tap must erase even when the path has zero length.
  ctx.beginPath();
  ctx.arc(point.x / point.rx, point.y / point.ry, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function restoreSegment(canvas: HTMLCanvasElement, source: CanvasImageSource, point: BrushPoint, previous = point) {
  const ctx = canvas.getContext("2d")!;
  const x = point.x / point.rx, y = point.y / point.ry;
  const px = previous.x / point.rx, py = previous.y / point.ry;
  const angle = Math.atan2(y - py, x - px);
  ctx.save();
  ctx.scale(point.rx, point.ry);
  // Clip to a round-ended stroke in bitmap space, including a circular tap.
  ctx.beginPath();
  ctx.arc(x, y, 1, angle - Math.PI / 2, angle + Math.PI / 2);
  ctx.arc(px, py, 1, angle + Math.PI / 2, angle + Math.PI * 1.5);
  ctx.closePath();
  ctx.clip();
  ctx.scale(1 / point.rx, 1 / point.ry);
  // Recover only missing pixels; keep the current foreground intact.
  ctx.globalCompositeOperation = "destination-over";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}
