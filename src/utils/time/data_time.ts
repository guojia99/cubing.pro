import { readStoredLocale } from "@/i18n";

export function parseDateTime(val: string, locale: string = readStoredLocale()) {
  const date = new Date(val);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}
