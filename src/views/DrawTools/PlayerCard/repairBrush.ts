import { CARD_SIZE, type Crop } from "./composition";
import { sourcePoint } from "./solidBackground";

export const REPAIR_RADIUS = 12;
export type BrushPoint = { x: number; y: number; rx: number; ry: number };

export function repairPoint(width: number, height: number, bitmapWidth: number, bitmapHeight: number, crop: Crop,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">, clientX: number, clientY: number): BrushPoint {
  const point = sourcePoint(width, height, crop, (clientX - rect.left) * CARD_SIZE / rect.width, (clientY - rect.top) * CARD_SIZE / rect.height);
  const scale = CARD_SIZE / Math.min(width, height) * crop.zoom;
  return {
    x: point.x * bitmapWidth / width, y: point.y * bitmapHeight / height,
    rx: REPAIR_RADIUS * CARD_SIZE / rect.width / scale * bitmapWidth / width,
    ry: REPAIR_RADIUS * CARD_SIZE / rect.height / scale * bitmapHeight / height,
  };
}

export function eraseSegment(canvas: HTMLCanvasElement, point: BrushPoint, previous = point) {
  const ctx = canvas.getContext("2d")!;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
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
