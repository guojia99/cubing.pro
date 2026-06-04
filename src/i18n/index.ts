import enUS from "@/i18n/messages/en-US";
import zhCN, { type MessageKey } from "@/i18n/messages/zh-CN";

export type Locale = "zh-CN" | "en-US";

export const LOCALE_STORAGE_KEY = "cubing_pro_locale";

export const SUPPORTED_LOCALES: {
  key: Locale;
  labelKey: MessageKey;
  flag: string;
}[] = [
  { key: "zh-CN", labelKey: "lang.zh", flag: "cn" },
  { key: "en-US", labelKey: "lang.en", flag: "us" },
];

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

export function translate(locale: Locale, key: MessageKey): string {
  return catalogs[locale][key] ?? catalogs["zh-CN"][key] ?? key;
}

export function translateWithParams(
  locale: Locale,
  key: MessageKey,
  params: Record<string, string | number>,
): string {
  let text = translate(locale, key);
  for (const [name, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${name}\\}`, "g"), String(value));
  }
  return text;
}

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "zh-CN";
  const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (raw === "en-US" || raw === "zh-CN") return raw;
  return "zh-CN";
}

export function writeStoredLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export type { MessageKey };
