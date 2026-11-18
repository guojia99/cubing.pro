"use client";

import { downloadSvg, downloadSvgImage } from "@/lib/svgDownload";

/** 2D 图示导出：SVG 无损导出 + PNG 位图导出（白底，2x 高清）。 */

function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(/[/\\?%*:|"<>\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "cube-diagram";
}

function diagramSize(svg: SVGSVGElement): { width: number; height: number } {
  const viewBox = (svg.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  const baseWidth = viewBox.length === 4 && viewBox.every(Number.isFinite) && viewBox[2] > 0 ? viewBox[2] : 240;
  const baseHeight = viewBox.length === 4 && viewBox.every(Number.isFinite) && viewBox[3] > 0 ? viewBox[3] : 240;
  return { width: baseWidth, height: baseHeight };
}

export function findDiagramSvg(container: HTMLElement | null): SVGSVGElement | null {
  return container?.querySelector("svg") ?? null;
}

export async function downloadDiagramSvg(svg: SVGSVGElement, name: string): Promise<void> {
  downloadSvg(svg, `${sanitizeFilename(name)}.svg`, diagramSize(svg));
}

export async function downloadDiagramPng(svg: SVGSVGElement, name: string, scale = 2): Promise<void> {
  await downloadSvgImage(svg, `${sanitizeFilename(name)}.png`, { ...diagramSize(svg), scale, backgroundColor: "#ffffff" });
}
