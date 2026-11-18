"use client";

import { Box, Button, Flex, Spinner, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { LuArrowLeft, LuHeart, LuShoppingCart } from "react-icons/lu";

import { MarkdownAnchorNav } from "@/components/Markdown/MarkdownAnchorNav";
import { MarkdownViewer } from "@/components/Markdown/MarkdownViewer";
import { toaster } from "@/components/ui/toaster";
import { Surface } from "@/components/ui/page";

import { useRecipeMarkdown } from "./hooks/useRecipeMarkdown";
import {
  addFavorite,
  isFavorite,
  removeFavorite,
} from "./utils/favoriteStorage";
import {
  MAX_RECIPE_FAVORITES,
  MAX_RECIPE_TONIGHT,
  getRecipeCategoryName,
} from "./utils/recipeDisplay";
import {
  addToTonight,
  isInTonight,
  removeFromTonight,
} from "./utils/tonightStorage";

import "@/components/Markdown/detail.css";
import "@/views/FoodShared/food-page.css";

interface RecipeDetailViewProps {
  category: string;
  id: string;
}

export function RecipeDetailView({ category, id }: RecipeDetailViewProps) {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const router = useRouter();
  const cat = decodeURIComponent(category);
  const rid = decodeURIComponent(id);
  const { mdContent, loading, headings, imageBase } = useRecipeMarkdown(cat, rid);
  const [favState, setFavState] = useState(false);
  const [tonightState, setTonightState] = useState(false);

  useEffect(() => {
    setFavState(isFavorite(cat, rid));
    setTonightState(isInTonight(cat, rid));
  }, [cat, rid]);

  const handleFavoriteClick = () => {
    if (favState) {
      removeFavorite(cat, rid);
      setFavState(false);
    } else if (addFavorite(cat, rid)) {
      setFavState(true);
    } else {
      toaster.create({ type: "warning", title: sc("siteContent.favoriteLimit", { count: MAX_RECIPE_FAVORITES }) });
    }
  };

  const handleTonightClick = () => {
    if (tonightState) {
      removeFromTonight(cat, rid);
      setTonightState(false);
      toaster.create({ type: "success", title: sc("siteContent.recipeRemoved") });
    } else if (addToTonight(cat, rid)) {
      setTonightState(true);
      toaster.create({ type: "success", title: sc("siteContent.recipeAdded") });
    } else {
      toaster.create({ type: "warning", title: sc("siteContent.recipeLimit", { count: MAX_RECIPE_TONIGHT }) });
    }
  };

  if (loading) {
    return (
      <Flex justify="center" py="12">
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box className="food-page food-detail-page" p={{ base: 4, md: 8 }} maxW="1280px" mx="auto">
      <Flex className="food-detail-actions" mb="4" justify="space-between" align="center" flexWrap="wrap" gap="3">
        <Button variant="ghost" size="sm" asChild>
          <NextLink href="/other/recipes">
            <LuArrowLeft />
            {sc("siteContent.back")}
          </NextLink>
        </Button>
        <Flex gap="2" flexWrap="wrap">
          <Button
            size="sm"
            colorPalette={tonightState ? "brand" : undefined}
            variant={tonightState ? "solid" : "outline"}
            onClick={handleTonightClick}
          >
            <LuShoppingCart />
            {sc(tonightState ? "siteContent.inMenu" : "siteContent.addMenu")}
          </Button>
          <Button
            size="sm"
            colorPalette={favState ? "brand" : undefined}
            variant={favState ? "solid" : "outline"}
            onClick={handleFavoriteClick}
          >
            <LuHeart />
            {sc(favState ? "siteContent.saved" : "siteContent.favorite")}
          </Button>
        </Flex>
      </Flex>

      <Box className="markdown-detail-layout">
        <Surface className="food-reading-surface" flex="1" minW="0" p={{ base: 5, md: 8 }}>
          <Text className="food-card-meta" mb="2">{getRecipeCategoryName(cat, locale)}</Text>
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
        </Surface>
        <MarkdownAnchorNav headings={headings} />
      </Box>
    </Box>
  );
}
