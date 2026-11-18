import type { AlgItem } from "@/services/cubing-pro/algs/algs";
import type { Locale } from "@/i18n";

function pickString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readLocalizedField(alg: AlgItem, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = pickString(alg[key]);
    if (v) return v;
  }
  return undefined;
}

/** 中文名优先字段；无则回退英文名 / `name`。 */
export function getAlgDisplayName(alg: AlgItem, locale: Locale): string {
  const language = locale === "yue-Hant-HK" ? "yue" : locale.split("-")[0];
  const localized = readLocalizedField(alg, [
    `name_${locale}`, `name_${language}`, `name${language[0].toUpperCase()}${language.slice(1)}`,
  ]);
  if (localized) return localized;
  const zh = readLocalizedField(alg, [
    "name_zh",
    "nameZh",
    "name_cn",
    "nameCn",
    "cn_name",
    "chinese_name",
  ]);
  const en = readLocalizedField(alg, [
    "name_en",
    "nameEn",
    "english_name",
    "en_name",
  ]);
  const fallback = pickString(alg.name) ?? "";

  if (locale === "zh-CN" || locale === "yue-Hant-HK") {
    return zh ?? en ?? fallback;
  }
  return en ?? zh ?? fallback;
}
