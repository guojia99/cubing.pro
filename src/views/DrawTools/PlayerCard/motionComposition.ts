import { CARD_SIZE, type Crop } from "./composition";
import { featherAlpha } from "./personCutout.mjs";

export const MOTION_HEIGHT = 1440;
export function paintMotionCard(canvas: HTMLCanvasElement, image: HTMLImageElement, crop: Crop, name: string, font: string, replacement: HTMLCanvasElement | null) {
  canvas.width = CARD_SIZE;
  canvas.height = MOTION_HEIGHT;
  const ctx = canvas.getContext("2d")!;
  const backdrop = ctx.createLinearGradient(0, 0, 1080, 1440);
  backdrop.addColorStop(0, "#101a2d"); backdrop.addColorStop(.6, "#15182b"); backdrop.addColorStop(1, "#090f1c");
  ctx.fillStyle = backdrop; ctx.fillRect(0, 0, 1080, 1440);
  for (const [x, y, radius, color] of [
    [220, 440, 640, "rgba(64, 133, 193, .46)"],
    [890, 790, 610, "rgba(117, 94, 179, .38)"],
  ] as const) {
    const pool = ctx.createRadialGradient(x, y, 0, x, y, radius);
    pool.addColorStop(0, color); pool.addColorStop(1, "transparent");
    ctx.fillStyle = pool; ctx.fillRect(0, 0, 1080, 1440);
  }
  // Broken orbits sit behind the photograph, leaving the subject uninterrupted.
  ctx.strokeStyle = "rgba(169, 188, 214, .24)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(540, 680, 425, 520, -.24, 3.55, 4.15); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(540, 680, 425, 520, -.24, .2, .68); ctx.stroke();
  // Reuse the editor's square crop, without its classic frame or lettering.
  const layer = document.createElement("canvas"); layer.width = layer.height = CARD_SIZE;
  const photo = layer.getContext("2d")!;
  const scale = CARD_SIZE / Math.min(image.naturalWidth, image.naturalHeight) * crop.zoom;
  const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
  photo.drawImage(replacement ?? image, (1080 - w) / 2 + crop.x, (1080 - h) / 2 + crop.y, w, h);
  if (replacement) {
    const pixels = photo.getImageData(0, 0, 1080, 1080);
    featherAlpha(pixels.data, 1080, 1080, 5 * crop.zoom); photo.putImageData(pixels, 0, 0);
  }
  photo.globalCompositeOperation = "destination-in";
  const fade = photo.createLinearGradient(0, 0, 0, 1080);
  fade.addColorStop(0, "transparent"); fade.addColorStop(.14, "black"); fade.addColorStop(.74, "black"); fade.addColorStop(1, "transparent");
  photo.fillStyle = fade; photo.fillRect(0, 0, 1080, 1080);
  ctx.drawImage(layer, 0, 160);
  const metal = ctx.createLinearGradient(0, 0, 1080, 1440);
  metal.addColorStop(0, "#827047"); metal.addColorStop(.22, "#d8c18b");
  metal.addColorStop(.46, "#a18a58"); metal.addColorStop(.72, "#73603c"); metal.addColorStop(1, "#c7ad76");
  ctx.strokeStyle = metal; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.roundRect(30, 30, 1020, 1380, 26); ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(224, 202, 153, .64)";
  ctx.beginPath(); ctx.roundRect(43, 43, 994, 1354, 20); ctx.stroke();
  ctx.strokeStyle = "rgba(184, 157, 101, .38)";
  ctx.beginPath(); ctx.roundRect(55, 55, 970, 1330, 16); ctx.stroke();
  ctx.strokeStyle = metal; ctx.lineWidth = 2;
  for (const [x, y, sx, sy] of [[76, 76, 1, 1], [1004, 76, -1, 1], [76, 1364, 1, -1], [1004, 1364, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(x, y + sy * 46); ctx.lineTo(x, y + sy * 12);
    ctx.quadraticCurveTo(x, y, x + sx * 12, y);
    ctx.lineTo(x + sx * 46, y); ctx.stroke();
  }
  ctx.fillStyle = "#b9a883"; ctx.font = '500 24px serif';
  ctx.fillText("C U B I N G   P R O", 104, 126);
  ctx.strokeStyle = "rgba(212, 189, 143, .72)"; ctx.lineWidth = 1.5;
  for (const [x, y, r] of [[952, 134, 13], [122, 1088, 10]]) {
    ctx.beginPath(); ctx.moveTo(x-r,y); ctx.quadraticCurveTo(x,y,x,y-r);
    ctx.quadraticCurveTo(x,y,x+r,y); ctx.quadraticCurveTo(x,y,x,y+r);
    ctx.quadraticCurveTo(x,y,x-r,y); ctx.stroke();
  }
  ctx.fillStyle = "#f1eee8";
  let size = 180;
  const label = name.trim();
  ctx.font = `400 ${size}px ${font}`;
  while (label && ctx.measureText(label).width > 900 && size > 1) { size--; ctx.font = `400 ${size}px ${font}`; }
  ctx.font = `400 ${size * .85}px ${font}`;
  ctx.textAlign = "center"; ctx.fillText(label, 540, 1260);
  ctx.strokeStyle = metal; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(478, 1320); ctx.lineTo(602, 1320); ctx.stroke();
}
