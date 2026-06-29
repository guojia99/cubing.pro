"use client";

import { Box, Button, Flex, Spinner } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { MarkdownAnchorNav } from "@/components/Markdown/MarkdownAnchorNav";
import { MarkdownViewer } from "@/components/Markdown/MarkdownViewer";

import { useKitchenSkillMarkdown } from "./hooks/useKitchenSkillMarkdown";

import "@/components/Markdown/detail.css";
import "@/views/FoodShared/food-page.css";

interface KitchenSkillDetailViewProps {
  category: string;
  id: string;
}

export function KitchenSkillDetailView({ category, id }: KitchenSkillDetailViewProps) {
  const router = useRouter();
  const cat = decodeURIComponent(category);
  const rid = decodeURIComponent(id);
  const { mdContent, loading, headings, imageBase } = useKitchenSkillMarkdown(cat, rid);

  if (loading) {
    return (
      <Flex justify="center" py="12">
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box className="food-page" p={{ base: 4, md: 6 }}>
      <Button variant="ghost" size="sm" mb="4" asChild>
        <NextLink href="/other/kitchen-skills">← 返回列表</NextLink>
      </Button>

      <Box className="markdown-detail-layout">
        <Box flex="1" minW="0">
          <MarkdownViewer
            content={mdContent}
            imageBase={imageBase}
            headingIds={headings.map((h) => h.id)}
            isInternalLink={(href) => /tips\/[^/]+\/[^/]+\.md$/.test(href)}
            onInternalLink={(href) => {
              const match = href.match(/tips\/([^/]+)\/([^/]+)\.md$/);
              if (!match) return;
              router.push(
                `/other/kitchen-skills/${encodeURIComponent(match[1])}/${encodeURIComponent(match[2])}`,
              );
            }}
          />
        </Box>
        <MarkdownAnchorNav headings={headings} />
      </Box>
    </Box>
  );
}
