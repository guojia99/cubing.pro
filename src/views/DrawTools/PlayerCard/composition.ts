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

export function paintCard(canvas: HTMLCanvasElement, image: HTMLImageElement, crop: Crop, name: string) {
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
  const font = '"Kaiti SC", "KaiTi", "STKaiti", "Yu Mincho", "Noto Serif CJK SC", serif';
  ctx.font = `600 112px ${font}`;
  const size = Math.min(112, 112 * 936 / ctx.measureText(label).width);
  ctx.font = `600 ${size}px ${font}`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, CARD_SIZE / 2, 960, 936);
}
