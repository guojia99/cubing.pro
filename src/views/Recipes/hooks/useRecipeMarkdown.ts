"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";

import { extractMarkdownHeadings } from "@/components/Markdown/markdownUtils";

import { RECIPES_JSON } from "../utils/recipeDisplay";

export function useRecipeMarkdown(category: string, id: string, enabled = true) {
  const { locale } = useI18n();
  const [mdContent, setMdContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState(extractMarkdownHeadings(""));
  const [mdPath, setMdPath] = useState("");

  useEffect(() => {
    if (!enabled || !category || !id) return;
    const controller = new AbortController();
    setLoading(true);
    setMdContent("");
    setHeadings([]);
    const fallbackPath = `dishes/${category}/${id}.md`;

    fetch(RECIPES_JSON, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const recipe = data.recipes?.find(
          (r: { category: string; id: string }) => r.category === category && r.id === id,
        );
        return recipe?.mdPath || fallbackPath;
      })
      .catch((error) => { if (controller.signal.aborted) throw error; return fallbackPath; })
      .then((path) => {
        if (controller.signal.aborted) throw new Error("Aborted");
        setMdPath(path);
        return fetch(`/HowToCook/${path}`, { signal: controller.signal });
      })
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.text();
      })
      .then((text) => {
        if (controller.signal.aborted) return;
        const cleaned = text.replace(
          /\n*如果您遵循本指南的制作流程而发现有问题或可以改进的流程，请提出 Issue 或 Pull request 。\s*$/,
          "",
        );
        setMdContent(cleaned);
        setHeadings(extractMarkdownHeadings(cleaned));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setMdContent(getSiteContent(locale)("siteContent.recipeLoadError"));
        setHeadings([]);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category, id, enabled, locale]);

  const imageBase = mdPath ? `/HowToCook/${mdPath.replace(/\/[^/]+\.md$/, "/")}` : "/HowToCook/dishes/";

  return { mdContent, loading, headings, imageBase };
}
