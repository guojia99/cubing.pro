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

  if (locale === "zh-CN") {
    return zh ?? en ?? fallback;
  }
  return en ?? zh ?? fallback;
}
