"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LocaleProvider } from "@chakra-ui/react";

import {
  readStoredLocale,
  translate,
  translateWithParams,
  LOCALE_STORAGE_KEY,
  isLocale,
  getIntlLocale,
  writeStoredLocale,
  type Locale,
  type MessageKey,
} from "@/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  tf: (key: MessageKey, params: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh-CN");

  useEffect(() => {
    setLocaleState(readStoredLocale());
    const syncLocale = (event: StorageEvent) => {
      if (event.key === LOCALE_STORAGE_KEY || event.key === null) setLocaleState(readStoredLocale());
    };
    window.addEventListener("storage", syncLocale);
    return () => window.removeEventListener("storage", syncLocale);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    if (!isLocale(next)) return;
    writeStoredLocale(next);
    setLocaleState(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: MessageKey) => translate(locale, key),
    [locale],
  );

  const tf = useCallback(
    (key: MessageKey, params: Record<string, string | number>) => {
      return translateWithParams(locale, key, params);
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, tf }),
    [locale, setLocale, t, tf],
  );

  return <I18nContext.Provider value={value}><LocaleProvider locale={getIntlLocale(locale)}>{children}</LocaleProvider></I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
