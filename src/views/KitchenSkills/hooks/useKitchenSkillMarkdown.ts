"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { extractMarkdownHeadings } from "@/components/Markdown/markdownUtils";
import {
  getKitchenSkillLocale,
  KITCHEN_SKILL_LOAD_ERRORS,
  loadKitchenSkillContent,
  type KitchenSkillTranslation,
} from "@/lib/kitchenSkillContent";

export function useKitchenSkillMarkdown(category: string, id: string) {
  const { locale } = useI18n();
  const key = JSON.stringify([locale, category, id]);
  const [state, setState] = useState<{
    key: string;
    mdContent: string;
    loading: boolean;
    tip: KitchenSkillTranslation | null;
    error: boolean;
  }>({ key: "", mdContent: "", loading: true, tip: null, error: false });

  useEffect(() => {
    if (!category || !id) return;
    const controller = new AbortController();
    loadKitchenSkillContent(locale, category, id, controller.signal)
      .then(({ mdContent, tip }) => {
        if (controller.signal.aborted) return;
        setState({ key, mdContent, loading: false, tip, error: false });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ key, mdContent: KITCHEN_SKILL_LOAD_ERRORS[getKitchenSkillLocale(locale)], loading: false, tip: null, error: true });
      });
    return () => controller.abort();
  }, [category, id, locale, key]);

  const active = Boolean(category && id);
  const mdContent = active && state.key === key ? state.mdContent : "";
  const loading = active && (state.key !== key || state.loading);
  const tip = active && state.key === key ? state.tip : null;
  const error = active && state.key === key && state.error;
  // The shared slugger strips Hangul and kana; use stable nonempty IDs for the local TOC.
  const headings = extractMarkdownHeadings(mdContent).map((heading, index) => ({
    ...heading,
    id: `kitchen-heading-${index}`,
  }));
  const imageBase = `/HowToCook/tips/${category && category !== "base" ? `${category}/` : ""}`;

  return { mdContent, loading, headings, imageBase, tip, error };
}
