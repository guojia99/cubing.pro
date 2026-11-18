import { isLocale, type Locale } from "../i18n/locales";

/** Proposed read-side contract, not evidence of backend support or approved translations. */
export type ContentTranslation<Field extends string = string> = {
  resourceId: string;
  field: Field;
  locale: Locale;
  text: string;
} & (
  | { sourceHash: string; sourceVersion?: string }
  | { sourceHash?: string; sourceVersion: string }
);

export type ContentTranslations<Field extends string> = Partial<{
  [Language in Locale]: Partial<{ [Key in Field]: ContentTranslation<Key> }>;
}>;

export interface ContentLocalization<Field extends string> {
  /** Omit when unknown; the UI locale is not evidence of the source language. */
  sourceLocale?: Locale;
  translations?: ContentTranslations<Field>;
}

/** Proposal only; deliberately separate from CompAPI.Data and its write-request alias. */
export type CompetitionContentLocalization = ContentLocalization<
  "Name" | "Illustrate" | "IllustrateHTML" | "RuleMD" | "RuleHTML"
>;

export interface LocalizedContentOptions<Field extends string> {
  /** Namespaced stable identity from the current resource, never a label or array index. */
  resourceId: string;
  original?: string | null;
  locale: Locale;
  sourceLocale?: Locale;
  field: Field;
  translations?: ContentTranslations<Field>;
  /** SHA-256 of the exact current original, computed by the caller, not copied from a translation. */
  sourceHash?: string;
  /** Authoritative current revision for this field (or its containing record). */
  sourceVersion?: string;
}

export type OriginalContentReason =
  | "source-locale"
  | "unsupported-locale"
  | "translation-missing"
  | "translation-invalid"
  | "identity-unverified"
  | "translation-mismatch"
  | "source-unverified"
  | "translation-stale";

export type LocalizedContentResult =
  | { status: "translated"; text: string; locale: Locale }
  | { status: "original"; text: string; locale: Locale | undefined; reason: OriginalContentReason }
  | { status: "missing"; text: null; locale: undefined; reason: "source-missing" };

function ownValue(value: unknown, key: string): unknown {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.prototype.hasOwnProperty.call(value, key)
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

/** Select one field without fetching, mutating, translating or falling back to another target language. */
export function resolveLocalizedContent<Field extends string>(
  options: LocalizedContentOptions<Field>,
): LocalizedContentResult {
  const { original, locale, sourceLocale, resourceId, field, translations } = options;
  if (typeof original !== "string" || !original.trim()) {
    return { status: "missing", text: null, locale: undefined, reason: "source-missing" };
  }
  const originalResult = (reason: OriginalContentReason): LocalizedContentResult => ({
    status: "original", text: original, locale: isLocale(sourceLocale) ? sourceLocale : undefined, reason,
  });
  if (!isLocale(locale)) return originalResult("unsupported-locale");
  if (locale === sourceLocale) return originalResult("source-locale");
  if (typeof resourceId !== "string" || !resourceId.trim()
    || typeof field !== "string" || !field.trim()) return originalResult("identity-unverified");

  const entry = ownValue(ownValue(translations, locale), field);
  if (entry === undefined || entry === null) return originalResult("translation-missing");
  for (const [key, expected] of [["resourceId", resourceId], ["field", field], ["locale", locale]] as const) {
    const actual = ownValue(entry, key);
    if (typeof actual !== "string" || !actual.trim()) return originalResult("translation-invalid");
    if (actual !== expected) return originalResult("translation-mismatch");
  }
  const text = ownValue(entry, "text");
  if (typeof text !== "string" || !text.trim()) return originalResult("translation-invalid");

  let verified = false;
  for (const key of ["sourceHash", "sourceVersion"] as const) {
    const current = ownValue(options, key);
    const translatedFrom = ownValue(entry, key);
    if (current === undefined && translatedFrom === undefined) continue;
    if (typeof current !== "string" || !current.trim()
      || typeof translatedFrom !== "string" || !translatedFrom.trim()) {
      return originalResult("source-unverified");
    }
    if (key === "sourceHash" && (current.length !== 71 || translatedFrom.length !== 71
      || !/^sha256:[a-f0-9]{64}$/.test(current)
      || !/^sha256:[a-f0-9]{64}$/.test(translatedFrom))) {
      return originalResult("source-unverified");
    }
    if (current !== translatedFrom) return originalResult("translation-stale");
    verified = true;
  }
  if (!verified) return originalResult("source-unverified");
  return { status: "translated", text, locale };
}
