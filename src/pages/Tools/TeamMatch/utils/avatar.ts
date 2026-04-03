/**
 * 裁剪区域（相对 0-100）+ 输出最长边 maxSide 的 JPEG data URL
 */
export async function processAvatarFile(
  file: File,
  crop: { x: number; y: number; width: number; height: number },
  imageEl: HTMLImageElement,
  maxSide = 256,
  quality = 0.82,
): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = imageEl.naturalWidth / 100;
  const scaleY = imageEl.naturalHeight / 100;
  const sx = crop.x * scaleX;
  const sy = crop.y * scaleY;
  const sw = crop.width * scaleX;
  const sh = crop.height * scaleY;
  let dw = sw;
  let dh = sh;
  if (dw > dh) {
    if (dw > maxSide) {
      dh = (dh * maxSide) / dw;
      dw = maxSide;
    }
  } else if (dh > maxSide) {
    dw = (dw * maxSide) / dh;
    dh = maxSide;
  }
  canvas.width = Math.max(1, Math.round(dw));
  canvas.height = Math.max(1, Math.round(dh));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}
