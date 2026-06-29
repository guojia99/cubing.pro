"use client";

import { useEffect, useState } from "react";

import { extractMarkdownHeadings } from "@/components/Markdown/markdownUtils";

import { RECIPES_JSON } from "../utils/recipeDisplay";

export function useRecipeMarkdown(category: string, id: string, enabled = true) {
  const [mdContent, setMdContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState(extractMarkdownHeadings(""));
  const [mdPath, setMdPath] = useState("");

  useEffect(() => {
    if (!enabled || !category || !id) return;

    setLoading(true);
    const fallbackPath = `dishes/${category}/${id}.md`;

    fetch(RECIPES_JSON)
      .then((r) => r.json())
      .then((data) => {
        const recipe = data.recipes?.find(
          (r: { category: string; id: string }) => r.category === category && r.id === id,
        );
        return recipe?.mdPath || fallbackPath;
      })
      .catch(() => fallbackPath)
      .then((path) => {
        setMdPath(path);
        return fetch(`/HowToCook/${path}`);
      })
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.text();
      })
      .then((text) => {
        const cleaned = text.replace(
          /\n*如果您遵循本指南的制作流程而发现有问题或可以改进的流程，请提出 Issue 或 Pull request 。\s*$/,
          "",
        );
        setMdContent(cleaned);
        setHeadings(extractMarkdownHeadings(cleaned));
      })
      .catch(() => {
        setMdContent("# 菜谱加载失败\n请检查链接是否正确。");
        setHeadings([]);
      })
      .finally(() => setLoading(false));
  }, [category, id, enabled]);

  const imageBase = mdPath ? `/HowToCook/${mdPath.replace(/\/[^/]+\.md$/, "/")}` : "/HowToCook/dishes/";

  return { mdContent, loading, headings, imageBase };
}
