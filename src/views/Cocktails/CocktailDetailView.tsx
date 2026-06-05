"use client";

import {
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  Link,
  List,
  Portal,
  Spinner,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuExternalLink, LuHeart, LuShoppingCart } from "react-icons/lu";

import { toaster } from "@/components/ui/toaster";

import { getCategoryLabelZh } from "./categoryZh";
import { CocktailFirstVisitModal } from "./components/CocktailFirstVisitModal";
import { getCocktailZhName } from "./cocktailNameZhMap";
import type { Cocktail } from "./types";
import { COCKTAILS_JSON, MAX_COCKTAIL_FAVORITES, MAX_COCKTAIL_TONIGHT } from "./types";
import {
  addCocktailFavorite,
  isCocktailFavorite,
  removeCocktailFavorite,
} from "./utils/cocktailFavoriteStorage";
import "@/views/FoodShared/food-page.css";

import {
  addCocktailToTonight,
  isCocktailInTonight,
  removeCocktailFromTonight,
} from "./utils/cocktailTonightStorage";

interface CocktailDetailViewProps {
  slug: string;
}

export function CocktailDetailView({ slug: slugParam }: CocktailDetailViewProps) {
  const slug = decodeURIComponent(slugParam);
  const [cocktail, setCocktail] = useState<Cocktail | null>(null);
  const [loading, setLoading] = useState(true);
  const [favState, setFavState] = useState(false);
  const [tonightState, setTonightState] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setFavState(isCocktailFavorite(slug));
    setTonightState(isCocktailInTonight(slug));
    fetch(COCKTAILS_JSON)
      .then((r) => r.json())
      .then((data: Cocktail[]) => {
        const c = Array.isArray(data) ? data.find((x) => x.slug === slug) : undefined;
        setCocktail(c ?? null);
      })
      .catch(() => setCocktail(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleFavoriteClick = () => {
    if (!slug) return;
    if (favState) {
      removeCocktailFavorite(slug);
      setFavState(false);
    } else if (addCocktailFavorite(slug)) {
      setFavState(true);
    } else {
      toaster.create({ type: "warning", title: `最多收藏 ${MAX_COCKTAIL_FAVORITES} 款` });
    }
  };

  const handleTonightClick = () => {
    if (!slug) return;
    if (tonightState) {
      removeCocktailFromTonight(slug);
      setTonightState(false);
      toaster.create({ type: "success", title: "已从今晚喝什么移除" });
    } else if (addCocktailToTonight(slug)) {
      setTonightState(true);
      toaster.create({ type: "success", title: "已添加到今晚喝什么" });
    } else {
      toaster.create({ type: "warning", title: `今晚喝什么最多 ${MAX_COCKTAIL_TONIGHT} 款` });
    }
  };

  if (loading) {
    return (
      <>
        <CocktailFirstVisitModal />
        <Flex justify="center" py="12">
          <Spinner size="lg" />
        </Flex>
      </>
    );
  }

  if (!cocktail) {
    return (
      <>
        <CocktailFirstVisitModal />
        <Box p="6">
          <Button variant="ghost" size="sm" asChild>
            <NextLink href="/other/cocktails">
              <LuArrowLeft />
              返回列表
            </NextLink>
          </Button>
          <Text mt="6">未找到该酒款，请检查链接。</Text>
        </Box>
      </>
    );
  }

  const zh = getCocktailZhName(cocktail.slug, cocktail.name);
  const imgSrc = cocktail.image_path ? `/iba/${cocktail.image_path}` : "";

  return (
    <>
      <CocktailFirstVisitModal />
      <Box className="food-page" p={{ base: 4, md: 6 }} maxW="960px" mx="auto">
        <Flex className="food-detail-actions" mb="4" justify="space-between" align="center" flexWrap="wrap" gap="3">
          <Button variant="ghost" size="sm" asChild>
            <NextLink href="/other/cocktails">
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
              {tonightState ? "已在今晚喝什么" : "添加到今晚喝什么"}
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

        <Box borderRadius="xl" bg="bg" borderWidth="1px" borderColor="border" p={{ base: 4, md: 6 }}>
          <Heading size="xl" mb="2">
            {zh}
          </Heading>
          <Text fontSize="14px" color="fg.muted" mb="3">
            {cocktail.name} · {getCategoryLabelZh(cocktail.category)}
          </Text>
          {cocktail.source_url ? (
            <Link href={cocktail.source_url} target="_blank" rel="noreferrer" color="accent" display="inline-flex" alignItems="center" gap="1" mb="4">
              <LuExternalLink />
              IBA 原文
            </Link>
          ) : null}

          {imgSrc ? (
            <Box mb="6" textAlign="center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={zh}
                style={{
                  width: "100%",
                  maxWidth: 480,
                  height: 350,
                  objectFit: "cover",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
                onClick={() => setPreviewSrc(imgSrc)}
              />
            </Box>
          ) : null}

          <Heading size="md" mb="2">
            材料
          </Heading>
          <List.Root gap="1" mb="6" fontSize="14px">
            {(cocktail.ingredients ?? []).map((item) => (
              <List.Item key={item}>{item}</List.Item>
            ))}
          </List.Root>

          <Heading size="md" mb="2">
            调制方法
          </Heading>
          <List.Root gap="1" mb="6" fontSize="14px">
            {(cocktail.method ?? []).map((item, i) => (
              <List.Item key={`${i}-${item}`}>
                <Text as="span" fontWeight="semibold">
                  {i + 1}.{" "}
                </Text>
                {item}
              </List.Item>
            ))}
          </List.Root>

          <Heading size="md" mb="2">
            装饰
          </Heading>
          <List.Root gap="1" fontSize="14px">
            {(cocktail.garnish ?? []).map((item) => (
              <List.Item key={item}>{item}</List.Item>
            ))}
          </List.Root>
        </Box>
      </Box>

      <Dialog.Root open={!!previewSrc} onOpenChange={(e) => !e.open && setPreviewSrc(null)} size="lg">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Body textAlign="center" p="4">
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt="" style={{ maxWidth: "100%", borderRadius: 8 }} />
                ) : null}
              </Dialog.Body>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
