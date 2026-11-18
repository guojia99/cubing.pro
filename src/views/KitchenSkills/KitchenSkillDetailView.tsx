"use client";

import { Box, Button, Flex, Spinner, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";

import { MarkdownAnchorNav } from "@/components/Markdown/MarkdownAnchorNav";
import { MarkdownViewer } from "@/components/Markdown/MarkdownViewer";
import { PageHeader, Surface } from "@/components/ui/page";

import { useKitchenSkillMarkdown } from "./hooks/useKitchenSkillMarkdown";

import "@/components/Markdown/detail.css";
import "@/views/FoodShared/food-page.css";

interface KitchenSkillDetailViewProps {
  category: string;
  id: string;
}

export function KitchenSkillDetailView({ category, id }: KitchenSkillDetailViewProps) {
  const { locale } = useI18n();
  const router = useRouter();
  const cat = decodeURIComponent(category);
  const rid = decodeURIComponent(id);
  const { mdContent, loading, headings, imageBase, tip, error } = useKitchenSkillMarkdown(cat, rid);
  // The index supplies the page title; keep the remaining article headings and their IDs.
  const content = mdContent.replace(/^#\s+[^\r\n]*(?:\r?\n|$)/m, "");
  const bodyHeadings = headings.slice(1);

  if (loading) {
    return (
      <Flex justify="center" py="12">
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box className="food-page food-detail-page" p={{ base: 4, md: 8 }} maxW="1280px" mx="auto">
      <Button variant="ghost" size="sm" mb="4" asChild>
        <NextLink href="/other/kitchen-skills">{getSiteContent(locale)("siteContent.back")}</NextLink>
      </Button>

      {error ? (
        <Text role="alert">{mdContent}</Text>
      ) : tip ? (
        <>
          <PageHeader title={tip.title} description={tip.description} eyebrow={tip.categoryName} />
          <Box className="markdown-detail-layout">
            <Surface className="food-reading-surface" flex="1" minW="0" p={{ base: 5, md: 8 }}>
              <MarkdownViewer
                content={content}
                imageBase={imageBase}
                headingIds={bodyHeadings.map((h) => h.id)}
                isInternalLink={(href) => href.startsWith("/other/kitchen-skills/")}
                onInternalLink={(href) => router.push(href)}
              />
            </Surface>
            <MarkdownAnchorNav headings={bodyHeadings} />
          </Box>
        </>
      ) : null}
    </Box>
  );
}
