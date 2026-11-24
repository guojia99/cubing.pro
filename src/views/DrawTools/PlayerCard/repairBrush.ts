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
