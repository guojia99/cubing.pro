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

import {
  readStoredLocale,
  translate,
  writeStoredLocale,
  type Locale,
  type MessageKey,
} from "@/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh-CN");

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  const setLocale = useCallback((next: Locale) => {
    writeStoredLocale(next);
    setLocaleState(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next === "en-US" ? "en" : "zh-CN";
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "en-US" ? "en" : "zh-CN";
  }, [locale]);

  const t = useCallback(
    (key: MessageKey) => translate(locale, key),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
