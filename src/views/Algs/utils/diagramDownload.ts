"use client";

/** 2D 图示导出：SVG 无损导出 + PNG 位图导出（白底，2x 高清）。 */

function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(/[/\\?%*:|"<>\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "cube-diagram";
}

function exportableSvgClone(svg: SVGSVGElement): { element: SVGSVGElement; width: number; height: number } {
  const viewBox = (svg.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  const baseWidth = viewBox.length === 4 && viewBox.every(Number.isFinite) && viewBox[2] > 0 ? viewBox[2] : 240;
  const baseHeight = viewBox.length === 4 && viewBox.every(Number.isFinite) && viewBox[3] > 0 ? viewBox[3] : 240;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("style");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(baseWidth));
  clone.setAttribute("height", String(baseHeight));
  return { element: clone, width: baseWidth, height: baseHeight };
}

function triggerDownload(href: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function findDiagramSvg(container: HTMLElement | null): SVGSVGElement | null {
  return container?.querySelector("svg") ?? null;
}

export async function downloadDiagramSvg(svg: SVGSVGElement, name: string): Promise<void> {
  const { element } = exportableSvgClone(svg);
  const markup = new XMLSerializer().serializeToString(element);
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
  try {
    triggerDownload(url, `${sanitizeFilename(name)}.svg`);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export async function downloadDiagramPng(svg: SVGSVGElement, name: string, scale = 2): Promise<void> {
  const { element, width, height } = exportableSvgClone(svg);
  const markup = new XMLSerializer().serializeToString(element);
  const svgUrl = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const pngUrl = await new Promise<string>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas 2D context unavailable"));
          return;
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => reject(new Error("SVG rasterization failed"));
      image.src = svgUrl;
    });
    triggerDownload(pngUrl, `${sanitizeFilename(name)}.png`);
  } finally {
    setTimeout(() => URL.revokeObjectURL(svgUrl), 0);
  }
}
