import { NICKNAME_FONT_SLICES, type NicknameFontSlice } from "./nicknameFontSlices";

export const NICKNAME_FALLBACK = '"Kaiti SC", "KaiTi", "STKaiti", "Yu Mincho", "Noto Serif CJK SC", serif';
const family = "Player Card The Peak Font Plus";
export const NICKNAME_FONT = `"${family}", ${NICKNAME_FALLBACK}`;
const requested = new Map<string, Promise<boolean>>();
const loaded = new Set<string>();

function matchingSlices(text: string) {
  const points = new Set<number>();
  for (const ch of text) points.add(ch.codePointAt(0)!);
  return NICKNAME_FONT_SLICES.filter(slice => {
    for (const point of points) {
      let low = 0, high = slice.ranges.length - 1;
      while (low <= high) {
        const mid = (low + high) >>> 1;
        const [start, end] = slice.ranges[mid];
        if (point < start) high = mid - 1;
        else if (point > end) low = mid + 1;
        else return true;
      }
    }
    return false;
  });
}

export function hasLoadedNicknameFont(text: string): boolean {
  return loaded.size > 0 && matchingSlices(text).every(slice => loaded.has(slice.file));
}

export async function loadNicknameFont(text: string): Promise<string> {
  await Promise.all(matchingSlices(text).map(loadSlice));
  return loaded.size ? NICKNAME_FONT : NICKNAME_FALLBACK;
}

function loadSlice(slice: NicknameFontSlice): Promise<boolean> {
  const { file } = slice;
  const cached = requested.get(file);
  if (cached) return cached;
  const promise = new FontFace(family, `url("${file}") format("woff2")`, {
    weight: "400", style: "normal", unicodeRange: slice.unicodeRange,
  }).load().then(face => {
    document.fonts.add(face);
    loaded.add(file);
    return true;
  }, () => false);
  requested.set(file, promise);
  return promise;
}
