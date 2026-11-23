export const CARD_SIZE = 1080;
export type Crop = { zoom: number; x: number; y: number };
export const INITIAL_CROP: Crop = { zoom: 1, x: 0, y: 0 };

// Offsets are in output pixels, independent of the preview's CSS dimensions.
export function clampCrop(width: number, height: number, crop: Crop): Crop {
  const zoom = Math.max(1, Math.min(3, crop.zoom));
  const scale = CARD_SIZE / Math.min(width, height) * zoom;
  const limitX = (width * scale - CARD_SIZE) / 2;
  const limitY = (height * scale - CARD_SIZE) / 2;
  return { zoom, x: Math.max(-limitX, Math.min(limitX, crop.x)), y: Math.max(-limitY, Math.min(limitY, crop.y)) };
}

export function zoomCrop(width: number, height: number, crop: Crop, zoom: number): Crop {
  const nextZoom = Math.max(1, Math.min(3, zoom));
  return clampCrop(width, height, { zoom: nextZoom, x: crop.x * nextZoom / crop.zoom, y: crop.y * nextZoom / crop.zoom });
}

export function cardFilename(name: string): string {
  const safe = Array.from(name.trim().replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "-").replace(/[. ]+$/g, "")).slice(0, 64).join("");
  return `${safe || "player"}-card.png`;
}

export function paintCard(canvas: HTMLCanvasElement, image: HTMLImageElement, crop: Crop, name: string, font: string) {
  const ctx = canvas.getContext("2d")!;
  const scale = CARD_SIZE / Math.min(image.naturalWidth, image.naturalHeight) * crop.zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.clearRect(0, 0, CARD_SIZE, CARD_SIZE);
  ctx.fillStyle = "#eaf0f5";
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
  ctx.drawImage(image, (CARD_SIZE - width) / 2 + crop.x, (CARD_SIZE - height) / 2 + crop.y, width, height);
  const gradient = ctx.createLinearGradient(0, CARD_SIZE * 0.55, 0, CARD_SIZE);
  gradient.addColorStop(0, "rgba(8, 25, 51, 0)");
  gradient.addColorStop(1, "rgba(8, 25, 51, 0.8)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, CARD_SIZE * 0.55, CARD_SIZE, CARD_SIZE * 0.45);
  const label = name.trim();
  if (!label) return;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(8, 25, 51, 0.4)";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const centerY = 895;
  // Reserve space for the outline and antialiasing inside the ink margins.
  const padding = 2;
  const maxWidth = CARD_SIZE - 72 * 2 - padding * 2;
  const maxHeight = (CARD_SIZE - 36 - centerY - padding) * 2;
  let size = 220;
  ctx.font = `400 ${size}px ${font}`;
  let metrics = ctx.measureText(label);
  while (true) {
    const inkWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    const inkHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    const fit = Math.min(
      maxWidth / inkWidth,
      maxHeight / inkHeight,
      220 / inkHeight,
    );
    if (fit >= 1) break;
    // Whole-pixel font sizes avoid fractional-size rounding differences at paint time.
    size = Math.min(size - 1, Math.floor(size * fit));
    ctx.font = `400 ${size}px ${font}`;
    metrics = ctx.measureText(label);
  }
  // Center actual ink; advance width does not include glyph overhangs.
  const x = CARD_SIZE / 2 + (metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2;
  const y = centerY + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
  ctx.strokeText(label, x, y);
  ctx.fillText(label, x, y);
  ctx.restore();
}
