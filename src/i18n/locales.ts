export const LOCALE_STORAGE_KEY = "cubing_pro_locale";

export const SUPPORTED_LOCALES = [
  { key: "zh-CN", label: "简体中文", labelKey: "lang.zh", flag: "cn", intl: "zh-CN" },
  { key: "en-US", label: "English", labelKey: "lang.en", flag: "us", intl: "en-US" },
  { key: "ja", label: "日本語", labelKey: "lang.ja", flag: "jp", intl: "ja-JP" },
  { key: "yue-Hant-HK", label: "廣東話", labelKey: "lang.yue", flag: "hk", intl: "zh-HK" },
  { key: "ko", label: "한국어", labelKey: "lang.ko", flag: "kr", intl: "ko-KR" },
  { key: "fr", label: "Français", labelKey: "lang.fr", flag: "fr", intl: "fr-FR" },
  { key: "es", label: "Español", labelKey: "lang.es", flag: "es", intl: "es-ES" },
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number]["key"];

export function isLocale(value: unknown): value is Locale {
  return SUPPORTED_LOCALES.some(({ key }) => key === value);
}

export function getIntlLocale(locale: Locale): string {
  return SUPPORTED_LOCALES.find(({ key }) => key === locale)?.intl ?? "zh-CN";
}

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "zh-CN";
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(raw) ? raw : "zh-CN";
  } catch {
    return "zh-CN";
  }
}

export function writeStoredLocale(locale: Locale): void {
  if (typeof window === "undefined" || !isLocale(locale)) return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Language switching still works when browser storage is unavailable.
  }
}
