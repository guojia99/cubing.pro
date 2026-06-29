export function getInvertedColor(hexColor: string): string {
  let hex = hexColor.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const ir = (255 - r).toString(16).padStart(2, "0");
  const ig = (255 - g).toString(16).padStart(2, "0");
  const ib = (255 - b).toString(16).padStart(2, "0");
  return `#${ir}${ig}${ib}`;
}

export function buildRenderKey(
  storageKey: string,
  elemKey: string,
  disableDrawing?: boolean,
): string {
  let key = `${storageKey}-${elemKey}`;
  if (disableDrawing) {
    key += "_disable";
  }
  return key;
}

export function findSvgClickTarget(target: EventTarget | null, svgRoot: SVGSVGElement | null): {
  key: string | null;
  unbindKey: string | null;
} {
  let node: Element | null = null;
  if (target instanceof Element) {
    node = target;
  } else if (target instanceof Node && target.parentElement) {
    node = target.parentElement;
  }

  while (node && node !== svgRoot) {
    const key = node.getAttribute("data-key");
    if (key) {
      return {
        key,
        unbindKey: node.getAttribute("uncolor-data-key"),
      };
    }
    node = node.parentElement;
  }

  return { key: null, unbindKey: null };
}
