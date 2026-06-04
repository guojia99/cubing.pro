export const DEFAULT_DIAGRAM_SIZE = 160;
export const MIN_DIAGRAM_SIZE = 48;
export const MAX_DIAGRAM_SIZE = 280;

export type DiagramAspect = "square" | "wide";

export function clampDiagramSize(size: number): number {
  return Math.max(
    MIN_DIAGRAM_SIZE,
    Math.min(MAX_DIAGRAM_SIZE, Math.round(size)),
  );
}

export function getDiagramDimensions(
  size: number,
  aspect: DiagramAspect = "square",
): { maxWidth: number; maxHeight: number } {
  const w = clampDiagramSize(size);
  return {
    maxWidth: w,
    maxHeight: aspect === "wide" ? Math.round(w * 1.125) : w,
  };
}
