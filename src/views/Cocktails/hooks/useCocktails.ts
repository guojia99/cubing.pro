"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { loadCocktailContent, type CocktailContent, type CocktailLocale } from "@/lib/cocktailContent";

const empty: CocktailContent[] = [];
type State = { key: string; cocktails: CocktailContent[]; error: Error | null };

export function useCocktails(requestedLocale?: CocktailLocale) {
  const { locale: siteLocale } = useI18n();
  const locale = requestedLocale ?? siteLocale;
  const [attempt, setAttempt] = useState(0);
  const key = `${locale}:${attempt}`;
  const [state, setState] = useState<State | null>(null);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    loadCocktailContent(locale, controller.signal).then(
      (cocktails) => {
        if (!controller.signal.aborted) setState({ key, cocktails, error: null });
      },
      (reason: unknown) => {
        if (!controller.signal.aborted) setState({
          key,
          cocktails: empty,
          error: reason instanceof Error ? reason : new Error(String(reason)),
        });
      },
    );
    return () => controller.abort();
  }, [locale, key]);

  const current = state?.key === key ? state : null;
  return { cocktails: current?.cocktails ?? empty, loading: !current, error: current?.error ?? null, retry };
}

export function useCocktail(slug: string, locale?: CocktailLocale) {
  const { cocktails, loading, error, retry } = useCocktails(locale);
  return { cocktail: cocktails.find((cocktail) => cocktail.slug === slug) ?? null, loading, error, retry };
}
