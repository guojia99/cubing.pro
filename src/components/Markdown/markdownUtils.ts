export interface MarkdownHeading {
  id: string;
  text: string;
  level: number;
}

export function extractMarkdownHeadings(text: string): MarkdownHeading[] {
  const items: MarkdownHeading[] = [];
  const seen = new Set<string>();

  for (const line of text.split("\n")) {
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (!m) continue;

    const level = m[1].length;
    const headingText = m[2].trim();
    const baseId = headingText.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").slice(0, 30);
    let id = baseId;
    let n = 0;

    while (seen.has(id)) {
      n += 1;
      id = `${baseId}-${n}`;
    }
    seen.add(id);
    items.push({ id, text: headingText, level });
  }

  return items;
}

export function resolveMarkdownImageSrc(src: string, imageBase: string): string {
  if (src.startsWith("./")) return `${imageBase}${src.slice(1)}`;
  if (!src.startsWith("http") && !src.startsWith("/")) return `${imageBase}${src}`;
  return src;
}
