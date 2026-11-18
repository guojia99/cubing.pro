export const KITCHEN_SKILL_LOCALES = [
  "zh-CN", "en-US", "ja", "yue-Hant-HK", "ko", "fr", "es",
] as const;

export type KitchenSkillLocale = (typeof KITCHEN_SKILL_LOCALES)[number];
export type KitchenSkillCategory = "base" | "learn" | "advanced";

export interface KitchenSkillTranslation {
  id: string;
  category: KitchenSkillCategory;
  title: string;
  description: string;
  categoryName: string;
  /** Relative to /i18n/kitchen-skills/{locale}/; identity stays untranslated. */
  mdPath: string;
}

export interface KitchenSkillContentIndex {
  locale: KitchenSkillLocale;
  tips: KitchenSkillTranslation[];
}

export function getKitchenSkillLocale(locale: string): KitchenSkillLocale {
  if (!(KITCHEN_SKILL_LOCALES as readonly string[]).includes(locale)) {
    throw new Error(`Unsupported kitchen skill locale: ${locale}`);
  }
  return locale as KitchenSkillLocale;
}

export function getKitchenSkillIndexUrl(locale: string): string {
  return `/i18n/kitchen-skills/${getKitchenSkillLocale(locale)}/index.json`;
}

export function getKitchenSkillMarkdownUrl(
  locale: string,
  category: string,
  id: string,
): string {
  if (!["base", "learn", "advanced"].includes(category) || !id || /[/\\]|^\.{1,2}$/.test(id)) {
    throw new Error("Invalid kitchen skill identity");
  }
  return `/i18n/kitchen-skills/${getKitchenSkillLocale(locale)}/${category}/${encodeURIComponent(id)}.md`;
}

export async function loadKitchenSkillIndex(
  locale: string,
  signal?: AbortSignal,
): Promise<KitchenSkillContentIndex> {
  const response = await fetch(getKitchenSkillIndexUrl(locale), { signal });
  if (!response.ok) throw new Error(`Kitchen skill index: HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("locale" in data) || data.locale !== locale ||
      !("tips" in data) || !Array.isArray(data.tips) || data.tips.length !== 19) {
    throw new Error("Invalid kitchen skill index");
  }
  const seen = new Set<string>();
  for (const tip of data.tips) {
    if (!tip || typeof tip !== "object" ||
        !["id", "category", "title", "description", "categoryName", "mdPath"].every(
          (field) => typeof tip[field] === "string" && tip[field].trim().length > 0,
        ) || tip.mdPath !== `${tip.category}/${tip.id}.md`) {
      throw new Error("Invalid kitchen skill translation");
    }
    getKitchenSkillMarkdownUrl(locale, tip.category, tip.id);
    const key = `${tip.category}/${tip.id}`;
    if (seen.has(key)) throw new Error(`Duplicate kitchen skill: ${key}`);
    seen.add(key);
  }
  return data as KitchenSkillContentIndex;
}

/** Override display text only, retaining the source identity, mdPath and extra fields. */
export function localizeKitchenTips<
  T extends { id: string; category: string; title: string; description: string; categoryName: string },
>(tips: readonly T[], index: KitchenSkillContentIndex): T[] {
  const translations = new Map(index.tips.map((tip) => [`${tip.category}/${tip.id}`, tip]));
  return tips.map((tip) => {
    const translated = translations.get(`${tip.category}/${tip.id}`);
    if (!translated) throw new Error(`Missing kitchen skill translation: ${tip.category}/${tip.id}`);
    return {
      ...tip,
      title: translated.title,
      description: translated.description,
      categoryName: translated.categoryName,
    };
  });
}

function sourcePath(tip: Pick<KitchenSkillTranslation, "category" | "id">): string {
  return `tips/${tip.category === "base" ? "" : `${tip.category}/`}${tip.id}.md`;
}

/** Resolve against the upstream file, never against the translated resource directory. */
export function resolveKitchenSkillMarkdown(
  markdown: string,
  tip: Pick<KitchenSkillTranslation, "category" | "id">,
  index: KitchenSkillContentIndex,
): string {
  const origin = "https://kitchen.invalid";
  const base = `${origin}/HowToCook/${sourcePath(tip)}`;
  const routes = new Map(index.tips.map((entry) => [
    `/HowToCook/${sourcePath(entry)}`,
    `/other/kitchen-skills/${entry.category}/${encodeURIComponent(entry.id)}`,
  ]));
  const resolve = (destination: string, image: boolean): string => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(destination)) return destination;
    const url = new URL(destination, base);
    const path = decodeURIComponent(url.pathname);
    const route = !image && routes.get(path);
    return `${route || url.pathname}${url.search}${url.hash}`;
  };

  let fence = "";
  return markdown.split("\n").map((line) => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = "";
      return line;
    }
    if (fence) return line;
    // Reference definitions and inline destinations; leave footnotes and link labels intact.
    return line
      .replace(/^(\s{0,3}\[(?!\^)[^\]]+\]:\s*)(<[^>]+>|\S+)/, (_, prefix: string, target: string) => {
        const wrapped = target.startsWith("<");
        const result = resolve(wrapped ? target.slice(1, -1) : target, false);
        return `${prefix}${wrapped ? `<${result}>` : result}`;
      })
      .replace(/(!?\[[^\]]*\]\(\s*)(<[^>]+>|[^\s)]+)([^)]*\))/g,
        (_, prefix: string, target: string, suffix: string) => {
          const wrapped = target.startsWith("<");
          const result = resolve(wrapped ? target.slice(1, -1) : target, prefix.startsWith("!"));
          return `${prefix}${wrapped ? `<${result}>` : result}${suffix}`;
        });
  }).join("\n");
}

export async function loadKitchenSkillContent(
  locale: string,
  category: string,
  id: string,
  signal?: AbortSignal,
) {
  const index = await loadKitchenSkillIndex(locale, signal);
  const tip = index.tips.find((entry) => entry.category === category && entry.id === id);
  if (!tip) throw new Error(`Unknown kitchen skill: ${category}/${id}`);
  const response = await fetch(getKitchenSkillMarkdownUrl(locale, category, id), { signal });
  if (!response.ok) throw new Error(`Kitchen skill Markdown: HTTP ${response.status}`);
  const markdown = await response.text();
  if (!/^#\s+\S/m.test(markdown)) throw new Error("Invalid kitchen skill Markdown");
  return {
    tip,
    mdContent: resolveKitchenSkillMarkdown(markdown, tip, index),
    imageBase: `/HowToCook/tips/${category === "base" ? "" : `${category}/`}`,
  };
}

export const KITCHEN_SKILL_LOAD_ERRORS: Record<KitchenSkillLocale, string> = {
  "zh-CN": "文档加载失败，请稍后重试。",
  "en-US": "The article could not be loaded. Please try again later.",
  ja: "記事を読み込めませんでした。しばらくしてからもう一度お試しください。",
  "yue-Hant-HK": "載入唔到篇文章，請稍後再試。",
  ko: "문서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  fr: "Impossible de charger l’article. Veuillez réessayer plus tard.",
  es: "No se pudo cargar el artículo. Inténtalo de nuevo más tarde.",
};
