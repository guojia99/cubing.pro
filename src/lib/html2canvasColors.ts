import html2canvas, { type Options } from 'html2canvas';

const colorFunctions = new Set([
  'rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch',
  'color', 'color-mix', 'light-dark', 'device-cmyk', 'contrast-color',
]);

/** Resolve browser-supported colors through an sRGB pixel, including alpha. */
export function createCanvasColorNormalizer(doc: Document): (value: string) => string {
  const canvas = doc.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D is unavailable');
  const cache = new Map<string, string>();

  function color(value: string): string {
    const cached = cache.get(value);
    if (cached !== undefined) return cached;
    // Invalid canvas assignments are silently ignored. Two sentinels distinguish
    // rejection from a valid color that happens to equal the first sentinel.
    context!.fillStyle = '#010203';
    context!.fillStyle = value;
    if (context!.fillStyle === '#010203') {
      context!.fillStyle = '#040506';
      context!.fillStyle = value;
      if (context!.fillStyle === '#040506') throw new Error(`Cannot rasterize CSS color: ${value}`);
    }
    context!.clearRect(0, 0, 1, 1);
    context!.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context!.getImageData(0, 0, 1, 1).data;
    const result = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    cache.set(value, result);
    return result;
  }

  function normalize(value: string): string {
    let result = '';
    let index = 0;
    while (index < value.length) {
      const start = index;
      if (value[index] === '"' || value[index] === "'") {
        const quote = value[index++];
        while (index < value.length) {
          if (value[index++] === '\\') index++;
          else if (value[index - 1] === quote) break;
        }
      } else {
        const name = /^[a-z][a-z0-9-]*\(/i.exec(value.slice(index));
        if (name) {
          const functionName = name[0].slice(0, -1).toLowerCase();
          const contentStart = index + name[0].length;
          index = contentStart;
          let depth = 1;
          let quote = '';
          while (index < value.length && depth > 0) {
            const char = value[index++];
            if (char === '\\') index++;
            else if (quote) { if (char === quote) quote = ''; }
            else if (char === '"' || char === "'") quote = char;
            else if (char === '(') depth++;
            else if (char === ')') depth--;
          }
          if (depth !== 0) throw new Error(`Unbalanced CSS value: ${value}`);
          const token = value.slice(start, index);
          result += colorFunctions.has(functionName)
            ? color(token)
            : functionName === 'url'
              ? token
              : `${name[0]}${normalize(value.slice(contentStart, index - 1))})`;
          continue;
        }
        index++;
      }
      result += value.slice(start, index);
    }
    return result;
  }
  return normalize;
}

const colorProperties = [
  'color', 'background-color', 'border-top-color', 'border-right-color',
  'border-bottom-color', 'border-left-color', 'text-decoration-color', '-webkit-text-stroke-color',
  'box-shadow', 'text-shadow', 'background-image', 'list-style-image',
];

/** Only call with the html2canvas clone, after its pseudo-elements exist. */
export function normalizeHtml2CanvasCloneColors(doc: Document, root: HTMLElement): void {
  const normalize = createCanvasColorNormalizer(doc);
  const elements = new Set<Element>([doc.documentElement, doc.body, root, ...root.querySelectorAll('*')]);
  // Snapshot first: writing a parent's color can change descendants' currentColor.
  const snapshots = [...elements].map(element => {
    const computed = doc.defaultView!.getComputedStyle(element);
    return { element, values: colorProperties.map(property => computed.getPropertyValue(property)) };
  });
  for (const { element, values } of snapshots) {
    const style = (element as HTMLElement | SVGElement).style;
    if (!style) continue;
    colorProperties.forEach((property, index) => {
      const value = values[index];
      const converted = normalize(value);
      if (converted !== value) style.setProperty(property, converted, 'important');
    });
  }
}

/** html2canvas 1.4 leaves its iframe attached when cloning/parsing rejects. */
export async function html2canvasWithColors(
  element: HTMLElement,
  options: Partial<Options> = {},
): Promise<HTMLCanvasElement> {
  const doc = element.ownerDocument;
  const existingFrames = new Set(doc.querySelectorAll('iframe.html2canvas-container'));
  const ownedFrames = new Set<Element>();
  try {
    const rendering = html2canvas(element, {
      ...options,
      backgroundColor: typeof options.backgroundColor === 'string'
        ? createCanvasColorNormalizer(doc)(options.backgroundColor)
        : options.backgroundColor,
      removeContainer: false,
      onclone: async (clonedDoc, cloned) => {
        const frame = clonedDoc.defaultView?.frameElement;
        if (frame) ownedFrames.add(frame);
        await options.onclone?.(clonedDoc, cloned);
        normalizeHtml2CanvasCloneColors(clonedDoc, cloned);
      },
    });
    // In 1.4.1 the iframe is appended synchronously, before the first await.
    // Capture immediately, so a concurrent export's later iframe is never owned.
    for (const frame of doc.querySelectorAll('iframe.html2canvas-container')) {
      if (!existingFrames.has(frame)) ownedFrames.add(frame);
    }
    return await rendering;
  } finally {
    for (const frame of ownedFrames) frame.remove();
  }
}
