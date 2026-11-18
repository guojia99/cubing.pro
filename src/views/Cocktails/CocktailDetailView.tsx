"use client";

import {
  Box,
  Button,
  Dialog,
  Flex,
  Link,
  List,
  Portal,
  Spinner,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent, getCocktailCategoryLabel } from "@/i18n/messages/site-content";
import { getCocktailDisplayName } from "@/lib/cocktailContent";
import { LuArrowLeft, LuExternalLink, LuHeart, LuShoppingCart } from "react-icons/lu";

import { toaster } from "@/components/ui/toaster";
import { PageHeader, SectionHeader, Surface } from "@/components/ui/page";

import { CocktailFirstVisitModal } from "./components/CocktailFirstVisitModal";
import { useCocktail } from "./hooks/useCocktails";
import { MAX_COCKTAIL_FAVORITES, MAX_COCKTAIL_TONIGHT } from "./types";
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
  const { locale, t } = useI18n();
  const sc = getSiteContent(locale);
  const slug = decodeURIComponent(slugParam);
  const { cocktail, loading, error, retry } = useCocktail(slug);
  const [favState, setFavState] = useState(false);
  const [tonightState, setTonightState] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  useEffect(() => {
    setFavState(isCocktailFavorite(slug));
    setTonightState(isCocktailInTonight(slug));
    setPreviewSrc(null);
  }, [slug]);

  const handleFavoriteClick = () => {
    if (!slug) return;
    if (favState) {
      removeCocktailFavorite(slug);
      setFavState(false);
    } else if (addCocktailFavorite(slug)) {
      setFavState(true);
    } else {
      toaster.create({ type: "warning", title: sc("siteContent.drinkFavoriteLimit", { count: MAX_COCKTAIL_FAVORITES }) });
    }
  };

  const handleTonightClick = () => {
    if (!slug) return;
    if (tonightState) {
      removeCocktailFromTonight(slug);
      setTonightState(false);
      toaster.create({ type: "success", title: sc("siteContent.drinkRemoved") });
    } else if (addCocktailToTonight(slug)) {
      setTonightState(true);
      toaster.create({ type: "success", title: sc("siteContent.drinkAdded") });
    } else {
      toaster.create({ type: "warning", title: sc("siteContent.drinkLimit", { count: MAX_COCKTAIL_TONIGHT }) });
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

  if (error || !cocktail) {
    return (
      <>
        <CocktailFirstVisitModal />
        <Box p="6">
          <Button variant="ghost" size="sm" asChild>
            <NextLink href="/other/cocktails">
              <LuArrowLeft />
              {sc("siteContent.back")}
            </NextLink>
          </Button>
          <Text mt="6" role={error ? "alert" : undefined} whiteSpace="pre-line">
            {error ? sc("siteContent.documentLoadError").replace(/^#\s*/, "") : sc("siteContent.drinkNotFound")}
          </Text>
          {error ? <Button mt="4" onClick={retry}>{t("algs.practice.retry")}</Button> : null}
        </Box>
      </>
    );
  }

  const displayName = getCocktailDisplayName(cocktail, locale);
  const imgSrc = cocktail.image_path ? `/iba/${cocktail.image_path}` : "";

  return (
    <>
      <CocktailFirstVisitModal />
      <Box className="food-page food-detail-page" p={{ base: 4, md: 8 }} maxW="1200px" mx="auto">
        <Flex className="food-detail-actions" mb="4" justify="space-between" align="center" flexWrap="wrap" gap="3">
          <Button variant="ghost" size="sm" asChild>
            <NextLink href="/other/cocktails">
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
              {sc(tonightState ? "siteContent.inDrinks" : "siteContent.addDrinks")}
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

        <PageHeader eyebrow={getCocktailCategoryLabel(locale, cocktail.category)} title={displayName} description={cocktail.originalName !== displayName ? cocktail.originalName : undefined} />
        <Surface p={{ base: 5, md: 8 }}>
        <Box className="cocktail-detail-grid">
          <Box>
          {cocktail.source_url ? (
            <Link href={cocktail.source_url} target="_blank" rel="noreferrer" color="accent" display="inline-flex" alignItems="center" gap="1" mb="4">
              <LuExternalLink />
              {sc("siteContent.ibaSource")}
            </Link>
          ) : null}

          {imgSrc ? (
            <Box asChild w="full" textAlign="center">
               <button type="button" aria-label={sc("siteContent.enlargeDrink", { name: displayName })} onClick={() => setPreviewSrc(imgSrc)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={displayName}
                className="cocktail-detail-image"
              />
              </button>
            </Box>
          ) : null}
          </Box>
          <Box minW="0">

          <SectionHeader title={sc("siteContent.ingredients")} eyebrow={sc("siteContent.prepStep")} />
          <List.Root gap="1" mb="6" fontSize="14px">
            {(cocktail.ingredients ?? []).map((item) => (
              <List.Item key={item}>{item}</List.Item>
            ))}
          </List.Root>

          <SectionHeader title={sc("siteContent.method")} eyebrow={sc("siteContent.mixStep")} />
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

          <SectionHeader title={sc("siteContent.garnish")} eyebrow={sc("siteContent.finishStep")} />
          <List.Root gap="1" fontSize="14px">
            {(cocktail.garnish ?? []).map((item) => (
              <List.Item key={item}>{item}</List.Item>
            ))}
          </List.Root>
          </Box>
        </Box>
        </Surface>
      </Box>

      <Dialog.Root open={!!previewSrc} onOpenChange={(e) => !e.open && setPreviewSrc(null)} size="lg">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="var(--radius-card)" boxShadow="var(--shadow-float)">
              <Dialog.Header><Dialog.Title>{displayName}</Dialog.Title></Dialog.Header>
              <Dialog.Body textAlign="center" p="4">
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt={displayName} style={{ maxWidth: "100%", borderRadius: "var(--radius-card)" }} />
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
