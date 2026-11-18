type SvgSize = { width?: number; height?: number };

function exportableSvg(svg: SVGSVGElement, size: SvgSize): { markup: string; width: number; height: number } {
  const viewBox = svg.viewBox.baseVal;
  const width = size.width ?? (svg.width.baseVal.value || viewBox.width);
  const height = size.height ?? (svg.height.baseVal.value || viewBox.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Invalid SVG export dimensions");
  }
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // Responsive page constraints must not shrink the standalone image.
  clone.removeAttribute("style");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  return { markup: new XMLSerializer().serializeToString(clone), width, height };
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  try {
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    // Let the browser consume the download before releasing its URL.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export function downloadSvg(svg: SVGSVGElement, filename: string, size: SvgSize = {}): void {
  const { markup } = exportableSvg(svg, size);
  downloadBlob(new Blob([markup], { type: "image/svg+xml" }), filename);
}

/** Rasterize only the SVG; parsing surrounding page CSS is unnecessary. */
export async function downloadSvgImage(
  svg: SVGSVGElement,
  filename: string,
  { format = "png", scale = 2, backgroundColor, ...size }: SvgSize & {
    format?: "png" | "jpeg";
    scale?: number;
    backgroundColor?: string;
  } = {},
): Promise<void> {
  await svg.ownerDocument.fonts?.ready;
  const { markup, width, height } = exportableSvg(svg, size);
  if (!Number.isFinite(scale) || scale <= 0) throw new Error("Invalid SVG export scale");
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("SVG rasterization failed"));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");
    const background = backgroundColor ?? (format === "jpeg" ? "#ffffff" : undefined);
    if (background) {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(value => value ? resolve(value) : reject(new Error("Image encoding failed")), `image/${format}`, 0.92);
    });
    downloadBlob(blob, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}
