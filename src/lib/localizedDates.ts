import { getIntlLocale, type Locale } from "../i18n/locales";

const dateFormatters = new Map<Locale, Intl.DateTimeFormat>();

function dateFormatter(locale: Locale): Intl.DateTimeFormat {
  let formatter = dateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(getIntlLocale(locale), {
      year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
    });
    dateFormatters.set(locale, formatter);
  }
  return formatter;
}

function parseDateOnly(value: string): Date | null {
  // Competition dates are calendar dates, even when serialized with a time/offset.
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T| )/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function formatLocalizedDate(value: string, locale: Locale): string {
  const date = parseDateOnly(value);
  return date ? dateFormatter(locale).format(date) : value;
}

export function formatLocalizedDateRange(start: string, end: string, locale: Locale): string {
  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  if (startDate && endDate && startDate <= endDate) {
    const formatter = dateFormatter(locale);
    return startDate.getTime() === endDate.getTime()
      ? formatter.format(startDate)
      : formatter.formatRange(startDate, endDate);
  }
  return start === end ? formatLocalizedDate(start, locale) : `${formatLocalizedDate(start, locale)} – ${formatLocalizedDate(end, locale)}`;
}
