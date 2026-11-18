"use client";

import { Box, Button, Dialog, Flex, Portal, Spinner, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { LuHeart, LuShoppingCart, LuX } from "react-icons/lu";

import { MarkdownAnchorNav } from "@/components/Markdown/MarkdownAnchorNav";
import { MarkdownViewer } from "@/components/Markdown/MarkdownViewer";
import { toaster } from "@/components/ui/toaster";
import { Surface } from "@/components/ui/page";

import { useRecipeMarkdown } from "../hooks/useRecipeMarkdown";
import {
  addFavorite,
  isFavorite,
  removeFavorite,
} from "../utils/favoriteStorage";
import {
  MAX_RECIPE_FAVORITES,
  MAX_RECIPE_TONIGHT,
  getRecipeCategoryName,
} from "../utils/recipeDisplay";
import {
  addToTonight,
  isInTonight,
  removeFromTonight,
} from "../utils/tonightStorage";

interface RecipeDetailModalProps {
  open: boolean;
  category: string;
  id: string;
  onClose: () => void;
  onFavoriteChange?: () => void;
  onTonightChange?: () => void;
}

export function RecipeDetailModal({
  open,
  category,
  id,
  onClose,
  onFavoriteChange,
  onTonightChange,
}: RecipeDetailModalProps) {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const router = useRouter();
  const { mdContent, loading, headings, imageBase } = useRecipeMarkdown(category, id, open);
  const [favState, setFavState] = useState(false);
  const [tonightState, setTonightState] = useState(false);

  useEffect(() => {
    if (open) {
      setFavState(isFavorite(category, id));
      setTonightState(isInTonight(category, id));
    }
  }, [open, category, id]);

  const handleFavoriteClick = () => {
    if (favState) {
      removeFavorite(category, id);
      setFavState(false);
    } else if (addFavorite(category, id)) {
      setFavState(true);
    } else {
      toaster.create({ type: "warning", title: sc("siteContent.favoriteLimit", { count: MAX_RECIPE_FAVORITES }) });
    }
    onFavoriteChange?.();
  };

  const handleTonightClick = () => {
    if (tonightState) {
      removeFromTonight(category, id);
      setTonightState(false);
      toaster.create({ type: "success", title: sc("siteContent.recipeRemoved") });
    } else if (addToTonight(category, id)) {
      setTonightState(true);
      toaster.create({ type: "success", title: sc("siteContent.recipeAdded") });
    } else {
      toaster.create({ type: "warning", title: sc("siteContent.recipeLimit", { count: MAX_RECIPE_TONIGHT }) });
    }
    onTonightChange?.();
  };

  const handleInternalLink = (href: string) => {
    const match = href.match(/tips\/([^/]+)\/([^/]+)\.md$/);
    if (!match) return false;
    onClose();
    router.push(
      `/other/kitchen-skills/${encodeURIComponent(match[1])}/${encodeURIComponent(match[2])}`,
    );
    return true;
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="xl">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="food-page" maxW="1100px" maxH="calc(100dvh - 32px)" mx={{ base: 3, md: 6 }} borderRadius="var(--radius-card)" boxShadow="var(--shadow-float)" overflow="hidden" display="flex" flexDirection="column">
            <Dialog.Header>
              <Dialog.Title mb="3">{sc("siteContent.recipeDetails")}</Dialog.Title>
              <Flex justify="space-between" align="center" flexWrap="wrap" gap="2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <LuX />
                  {sc("siteContent.close")}
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
            </Dialog.Header>
            <Dialog.Body overflowY="auto" flex="1">
              {loading ? (
                <Flex justify="center" py="12">
                  <Spinner size="lg" />
                </Flex>
              ) : (
                <Box className="markdown-detail-layout">
                  <Surface className="food-reading-surface" flex="1" minW="0" p={{ base: 4, md: 6 }}>
                    <Text className="food-card-meta" mb="2">{getRecipeCategoryName(category, locale)}</Text>
                    <MarkdownViewer
                      content={mdContent}
                      imageBase={imageBase}
                      headingIds={headings.map((h) => h.id)}
                      isInternalLink={(href) => href.endsWith(".md") && href.includes("tips/")}
                      onInternalLink={handleInternalLink}
                    />
                  </Surface>
                  <MarkdownAnchorNav headings={headings} />
                </Box>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
