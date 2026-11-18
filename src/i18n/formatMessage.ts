import type { MessageKey } from "./index";
import type { Locale } from "./locales";
import { applyPlural } from "./plurals";

/** Select grammar before substituting data, without interpreting replacement tokens. */
export function formatMessage(
  locale: Locale,
  key: MessageKey,
  template: string,
  params: Readonly<Record<string, string | number>> = {},
): string {
  return applyPlural(locale, key, template, params).replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : placeholder,
  );
}
