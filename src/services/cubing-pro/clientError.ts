import { readStoredLocale } from "@/i18n";
import { translateShared, type SharedMessageKey } from "@/i18n/messages/shared";

/** Known client failures carry message IDs; server messages are never guessed. */
export class ClientMessageError extends Error {
  constructor(
    public readonly messageKey: SharedMessageKey,
    public readonly params: Record<string, string | number> = {},
  ) {
    super();
    this.name = "ClientMessageError";
    Object.defineProperty(this, "message", { configurable: true, get: () => this.display() });
  }

  display(locale: string = readStoredLocale()): string {
    return translateShared(locale, this.messageKey, this.params);
  }
}

export function clientErrorMessage(error: unknown, locale: string, fallback: SharedMessageKey): string {
  if (error instanceof ClientMessageError) return error.display(locale);
  return error instanceof Error && error.message ? error.message : translateShared(locale, fallback);
}
