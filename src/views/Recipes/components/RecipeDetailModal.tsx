"use client";

import { Box, Button, Dialog, Flex, Portal, Spinner } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuHeart, LuShoppingCart, LuX } from "react-icons/lu";

import { MarkdownAnchorNav } from "@/components/Markdown/MarkdownAnchorNav";
import { MarkdownViewer } from "@/components/Markdown/MarkdownViewer";
import { toaster } from "@/components/ui/toaster";

import { useRecipeMarkdown } from "../hooks/useRecipeMarkdown";
import {
  addFavorite,
  isFavorite,
  removeFavorite,
} from "../utils/favoriteStorage";
import {
  MAX_RECIPE_FAVORITES,
  MAX_RECIPE_TONIGHT,
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
      toaster.create({ type: "warning", title: `最多收藏 ${MAX_RECIPE_FAVORITES} 道菜` });
    }
    onFavoriteChange?.();
  };

  const handleTonightClick = () => {
    if (tonightState) {
      removeFromTonight(category, id);
      setTonightState(false);
      toaster.create({ type: "success", title: "已从今晚吃啥移除" });
    } else if (addToTonight(category, id)) {
      setTonightState(true);
      toaster.create({ type: "success", title: "已添加到今晚吃啥" });
    } else {
      toaster.create({ type: "warning", title: `今晚吃啥最多 ${MAX_RECIPE_TONIGHT} 道菜` });
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
          <Dialog.Content maxW="900px" maxH="calc(100vh - 48px)" overflow="hidden" display="flex" flexDirection="column">
            <Dialog.Header>
              <Flex justify="space-between" align="center" flexWrap="wrap" gap="2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <LuX />
                  关闭
                </Button>
                <Flex gap="2">
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
            </Dialog.Header>
            <Dialog.Body overflowY="auto" flex="1">
              {loading ? (
                <Flex justify="center" py="12">
                  <Spinner size="lg" />
                </Flex>
              ) : (
                <Box className="markdown-detail-layout">
                  <Box flex="1" minW="0">
                    <MarkdownViewer
                      content={mdContent}
                      imageBase={imageBase}
                      headingIds={headings.map((h) => h.id)}
                      isInternalLink={(href) => href.endsWith(".md") && href.includes("tips/")}
                    onInternalLink={handleInternalLink}
                    />
                  </Box>
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
