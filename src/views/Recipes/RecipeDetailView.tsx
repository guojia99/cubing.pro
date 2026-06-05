"use client";

import { Box, Button, Flex, Spinner } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuHeart, LuShoppingCart } from "react-icons/lu";

import { MarkdownAnchorNav } from "@/components/Markdown/MarkdownAnchorNav";
import { MarkdownViewer } from "@/components/Markdown/MarkdownViewer";
import { toaster } from "@/components/ui/toaster";

import { useRecipeMarkdown } from "./hooks/useRecipeMarkdown";
import {
  addFavorite,
  isFavorite,
  removeFavorite,
} from "./utils/favoriteStorage";
import {
  MAX_RECIPE_FAVORITES,
  MAX_RECIPE_TONIGHT,
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
      toaster.create({ type: "warning", title: `最多收藏 ${MAX_RECIPE_FAVORITES} 道菜` });
    }
  };

  const handleTonightClick = () => {
    if (tonightState) {
      removeFromTonight(cat, rid);
      setTonightState(false);
      toaster.create({ type: "success", title: "已从今晚吃啥移除" });
    } else if (addToTonight(cat, rid)) {
      setTonightState(true);
      toaster.create({ type: "success", title: "已添加到今晚吃啥" });
    } else {
      toaster.create({ type: "warning", title: `今晚吃啥最多 ${MAX_RECIPE_TONIGHT} 道菜` });
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
    <Box className="food-page" p={{ base: 4, md: 6 }}>
      <Flex className="food-detail-actions" mb="4" justify="space-between" align="center" flexWrap="wrap" gap="3">
        <Button variant="ghost" size="sm" asChild>
          <NextLink href="/other/recipes">
            <LuArrowLeft />
            返回列表
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
            {tonightState ? "已在今晚吃啥" : "添加到今晚吃啥"}
          </Button>
          <Button
            size="sm"
            colorPalette={favState ? "brand" : undefined}
            variant={favState ? "solid" : "outline"}
            onClick={handleFavoriteClick}
          >
            <LuHeart />
            {favState ? "已收藏" : "收藏"}
          </Button>
        </Flex>
      </Flex>

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
