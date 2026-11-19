import type { Advertisement } from "@/services/cubing-pro/advertisements";
import type { AdvertisementMessageKey } from "@/i18n/messages/advertisements";

export function newAdvertisement(): Advertisement {
  return { key: crypto.randomUUID(), title: "", description: "", contact: "", imageUrl: "", targetUrl: "", duration: 5, enabled: false, products: [], showcase: [] };
}

export function isAdvertisementUrl(value: string, required = false): boolean {
  if (!value) return !required;
  if (value.trim() !== value) return false;
  // Match the API's bounded unescaping, including nested encoded separators.
  let decoded = value;
  for (let depth = 0; ; depth++) {
    if (/[\x00-\x1f\x7f-\x9f\\]/.test(decoded) || decoded.startsWith("//")) return false;
    let next: string;
    try { next = decodeURIComponent(decoded); } catch { return false; }
    if (next === decoded) break;
    if (depth === 4) return false;
    decoded = next;
  }
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const url = new URL(value);
    return /^https?:\/\//i.test(value) && ["http:", "https:"].includes(url.protocol) && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

export function validateAdvertisements(items: Advertisement[]): { index: number; messageKey: AdvertisementMessageKey } | null {
  if (items.length > 50) return { index: 0, messageKey: "advertisements.limit" };
  const keys = new Set<string>();
  for (const [index, ad] of items.entries()) {
    const invalid = (messageKey: AdvertisementMessageKey) => ({ index, messageKey });
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(ad.key) || ["cuberwenjun", "contact"].includes(ad.key) || keys.has(ad.key)) return invalid("advertisements.invalidKey");
    keys.add(ad.key);
    if (!ad.title.trim() || [...ad.title].length > 200) return invalid("advertisements.invalidTitle");
    if ([...ad.description].length > 4000 || [...ad.contact].length > 500) return invalid("advertisements.textLimit");
    if (!Number.isFinite(ad.duration) || ad.duration < 1 || ad.duration > 120) return invalid("advertisements.invalidDuration");
    if (ad.products.length > 20 || ad.showcase.length > 20) return invalid("advertisements.limit");
    if (!isAdvertisementUrl(ad.imageUrl, true) || !isAdvertisementUrl(ad.targetUrl)) return invalid("advertisements.invalidUrl");
    if ([...ad.products, ...ad.showcase].some(image => !isAdvertisementUrl(image.imageUrl, true) || !isAdvertisementUrl(image.href ?? ""))) return invalid("advertisements.invalidUrl");
  }
  if (new TextEncoder().encode(JSON.stringify(items)).byteLength > 8 * 1024 * 1024) return { index: 0, messageKey: "advertisements.payloadLimit" };
  return null;
}

export function moveAdvertisement<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function validAdvertisementImage(file: Pick<File, "type" | "size">, width: number, height: number) {
  return ["image/jpeg", "image/png"].includes(file.type) && file.size > 0 && file.size <= 5 * 1024 * 1024 && width > 0 && height > 0 && width <= 8192 && height <= 8192 && width * height <= 20_000_000;
}
