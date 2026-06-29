"use client";

import { useEffect, useState } from "react";

import { extractMarkdownHeadings } from "@/components/Markdown/markdownUtils";

import { TIPS_JSON } from "../types";

export function useKitchenSkillMarkdown(category: string, id: string) {
  const [mdContent, setMdContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState(extractMarkdownHeadings(""));

  useEffect(() => {
    if (!category || !id) return;

    setLoading(true);
    const fallbackPath = `tips/${category}/${id}.md`;

    fetch(TIPS_JSON)
      .then((r) => r.json())
      .then((data) => {
        const tip = data.tips?.find(
          (t: { category: string; id: string }) => t.category === category && t.id === id,
        );
        return tip?.mdPath || fallbackPath;
      })
      .catch(() => fallbackPath)
      .then((path) => fetch(`/HowToCook/${path}`))
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.text();
      })
      .then((text) => {
        setMdContent(text);
        setHeadings(extractMarkdownHeadings(text));
      })
      .catch(() => {
        setMdContent("# 文档加载失败\n请检查链接是否正确。");
        setHeadings([]);
      })
      .finally(() => setLoading(false));
  }, [category, id]);

  const imageBase = category ? `/HowToCook/tips/${category}/` : "/HowToCook/tips/";

  return { mdContent, loading, headings, imageBase };
}
