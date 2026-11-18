import { getCocktailZhName } from "../views/Cocktails/cocktailNameZhMap";
import { COCKTAILS_JSON, type Cocktail } from "../views/Cocktails/types";

export type CocktailLocale = "zh-CN" | "en-US" | "ja" | "yue-Hant-HK" | "ko" | "fr" | "es";
export type CocktailContent = Cocktail & { originalName: string; originalIngredients: string[] };
type Translation = Pick<Cocktail, "name" | "ingredients" | "method" | "garnish">;
type RequestEntry = {
  controller: AbortController;
  promise: Promise<unknown>;
  consumers: number;
  settled: boolean;
};

const requests = new Map<string, RequestEntry>();
const translatedFields = ["ingredients", "method", "garnish"] as const;
const locales: readonly string[] = ["zh-CN", "en-US", "ja", "yue-Hant-HK", "ko", "fr", "es"];

export function getCocktailsResourceUrl(locale: CocktailLocale): string {
  if (!locales.includes(locale)) throw new Error(`Unsupported cocktail locale: ${locale}`);
  return locale === "zh-CN" ? COCKTAILS_JSON : `/i18n/cocktails/${locale}.json`;
}

function abortError() {
  return new DOMException("Cocktail content request aborted", "AbortError");
}

// Each caller owns a subscription; cancelling one must not cancel other readers.
function readJson(url: string, signal?: AbortSignal): Promise<unknown> {
  if (signal?.aborted) return Promise.reject(abortError());
  let entry = requests.get(url);
  if (!entry || entry.controller.signal.aborted) {
    const controller = new AbortController();
    const next: RequestEntry = { controller, consumers: 0, settled: false, promise: Promise.resolve() };
    next.promise = fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Cocktail content HTTP ${response.status}: ${url}`);
        return response.json() as Promise<unknown>;
      })
      .then((value) => {
        next.settled = true;
        return value;
      }, (error: unknown) => {
        if (requests.get(url) === next) requests.delete(url);
        next.settled = true;
        throw error;
      });
    requests.set(url, next);
    entry = next;
  }
  const current = entry;
  current.consumers += 1;
  return new Promise((resolve, reject) => {
    let finished = false;
    const release = () => {
      if (finished) return false;
      finished = true;
      signal?.removeEventListener("abort", onAbort);
      current.consumers -= 1;
      // Let a Strict Mode remount subscribe before aborting the shared fetch.
      queueMicrotask(() => {
        if (!current.settled && current.consumers === 0) {
          current.controller.abort();
          if (requests.get(url) === current) requests.delete(url);
        }
      });
      return true;
    };
    const onAbort = () => { if (release()) reject(abortError()); };
    signal?.addEventListener("abort", onAbort, { once: true });
    current.promise.then(
      (value) => { if (release()) resolve(value); },
      (error: unknown) => { if (release()) reject(error); },
    );
    if (signal?.aborted) onAbort();
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isTextArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

export async function loadCocktailContent(
  locale: CocktailLocale,
  signal?: AbortSignal,
): Promise<CocktailContent[]> {
  const url = getCocktailsResourceUrl(locale);
  const [source, translations] = await Promise.all([
    readJson(COCKTAILS_JSON, signal),
    locale === "zh-CN" ? Promise.resolve(null) : readJson(url, signal),
  ]);
  if (signal?.aborted) throw abortError();
  if (!Array.isArray(source) || source.length === 0) {
    requests.delete(COCKTAILS_JSON);
    throw new Error("Invalid cocktail source");
  }
  const slugs = new Set<string>();
  for (const row of source) {
    if (!isRecord(row) || typeof row.slug !== "string" || !row.slug || slugs.has(row.slug)
      || typeof row.name !== "string" || !row.name.trim()
      || typeof row.category !== "string" || typeof row.source_url !== "string"
      || !translatedFields.every((field) => isTextArray(row[field]))) {
      requests.delete(COCKTAILS_JSON);
      throw new Error("Invalid cocktail source entry");
    }
    slugs.add(row.slug);
  }
  if (locale !== "zh-CN" && (!isRecord(translations)
    || Object.keys(translations).length !== slugs.size
    || Object.keys(translations).some((slug) => !slugs.has(slug)))) {
    requests.delete(url);
    throw new Error(`Incomplete cocktail translations: ${locale}`);
  }
  return (source as Cocktail[]).map((cocktail) => {
    let text: Translation = cocktail;
    if (locale !== "zh-CN") {
      const row = (translations as Record<string, unknown>)[cocktail.slug];
      if (!isRecord(row) || Object.keys(row).length !== 4
        || typeof row.name !== "string" || !row.name.trim()
        || !translatedFields.every((field) => isTextArray(row[field])
          && (row[field] as string[]).length === cocktail[field].length)) {
        requests.delete(url);
        throw new Error(`Invalid cocktail translation: ${locale}/${cocktail.slug}`);
      }
      text = row as Translation;
    }
    return {
      ...cocktail,
      originalName: cocktail.name,
      originalIngredients: [...cocktail.ingredients],
      name: text.name,
      ingredients: [...text.ingredients],
      method: [...text.method],
      garnish: [...text.garnish],
    };
  });
}

export function getCocktailDisplayName(cocktail: Cocktail, locale: CocktailLocale): string {
  return locale === "zh-CN" ? getCocktailZhName(cocktail.slug, cocktail.name) : cocktail.name;
}
