"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { matchRoute } from "@/config/routes";
import { useI18n } from "@/contexts/I18nProvider";
import { getShellRouteKey, translateShell } from "@/i18n/messages/shell";

// These views own document.title (including async results and locale changes).
// Never write a generic title here, even before their data has loaded.
const PAGE_OWNED_TITLES = new Set(["competition-detail", "player-detail", "wca-player"]);

/** Mount once inside I18nProvider. Only title/description change; URLs stay intact. */
export function LocalizedMetadata() {
  const pathname = usePathname();
  const { locale } = useI18n();

  useEffect(() => {
    // Static-export fallback HTML can have a different router pathname initially.
    const browserPath = window.location.pathname;
    const route = matchRoute(browserPath === "/" ? "/welcome" : browserPath);
    const routeKey = route ? getShellRouteKey(route.id) : undefined;
    const title = translateShell(locale, routeKey ?? "shell.notFound.title");

    if (!route || !PAGE_OWNED_TITLES.has(route.id)) {
      document.title = `${title} · Cubing Pro`;
    }

    let description = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content = route
      ? translateShell(locale, "shell.metadata.description").replace("{title}", () => title)
      : translateShell(locale, "shell.notFound.description");
  }, [locale, pathname]);

  return null;
}
