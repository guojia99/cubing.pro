"use client";

import { Box, Card, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent, getCocktailCategoryLabel } from "@/i18n/messages/site-content";

import { CardActionButtons } from "@/views/FoodShared/CardActionButtons";

import { getCocktailDisplayName, type CocktailContent } from "@/lib/cocktailContent";

interface CocktailCardProps {
  cocktail: CocktailContent;
  onClick: () => void;
  isFav: boolean;
  onFavoriteChange: () => void;
  isInTonight: boolean;
  onTonightChange: () => void;
  inTonightMode?: boolean;
}

export function CocktailCard({
  cocktail,
  onClick,
  isFav,
  onFavoriteChange,
  isInTonight,
  onTonightChange,
  inTonightMode,
}: CocktailCardProps) {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const [imageFailed, setImageFailed] = useState(false);
  const displayName = getCocktailDisplayName(cocktail, locale);
  const imgSrc = cocktail.image_path ? `/iba/${cocktail.image_path}` : "";
  const descPreview = (cocktail.ingredients ?? []).slice(0, 3).join(sc("siteContent.separator")) || "—";

  return (
    <Box className="food-card-wrapper">
      <Card.Root
        className="food-card"
        borderRadius="xl"
        overflow="hidden"
        cursor="pointer"
        position="relative"
        height="100%"
      >
        <CardActionButtons
          isFavorite={isFav}
          isInTonight={isInTonight}
          inTonightMode={inTonightMode}
          tonightTitle={sc("siteContent.addDrinks")}
          onFavoriteClick={(e) => {
            e.stopPropagation();
            onFavoriteChange();
          }}
          onTonightClick={(e) => {
            e.stopPropagation();
            onTonightChange();
          }}
        />
        {imgSrc && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={displayName}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Box
            aspectRatio="4 / 3"
            bg="bg.muted"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="5xl"
            color="fg.muted"
          >
            🍸
          </Box>
        )}
        <Card.Body p="5">
          <Text as="h3" className="food-card-title" fontWeight="semibold" mb="1">
            <a className="food-card-link" href={`/other/cocktails/${encodeURIComponent(cocktail.slug)}`} onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onClick(); } }}>{displayName}</a>
          </Text>
          {cocktail.originalName !== displayName ? (
            <Text className="food-card-meta" mb="2">{cocktail.originalName}</Text>
          ) : null}
          <Text className="food-card-desc" lineClamp={2} minH="42px">
            {descPreview}
          </Text>
          <Text mt="2" className="food-card-meta">
            {getCocktailCategoryLabel(locale, cocktail.category)}
          </Text>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
