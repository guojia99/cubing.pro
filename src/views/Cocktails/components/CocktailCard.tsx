"use client";

import { Box, Card, Text } from "@chakra-ui/react";

import { CardActionButtons } from "@/views/FoodShared/CardActionButtons";

import { getCategoryLabelZh } from "../categoryZh";
import { getCocktailZhName } from "../cocktailNameZhMap";
import type { Cocktail } from "../types";

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f5f5f5' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='14'%3E暂无图片%3C/text%3E%3C/svg%3E";

interface CocktailCardProps {
  cocktail: Cocktail;
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
  const zh = getCocktailZhName(cocktail.slug, cocktail.name);
  const imgSrc = cocktail.image_path ? `/iba/${cocktail.image_path}` : "";
  const descPreview = (cocktail.ingredients ?? []).slice(0, 3).join("、") || "—";

  return (
    <Box className="food-card-wrapper">
      <Card.Root
        className="food-card"
        borderRadius="xl"
        overflow="hidden"
        cursor="pointer"
        position="relative"
        height="100%"
        onClick={onClick}
      >
        <CardActionButtons
          isFavorite={isFav}
          isInTonight={isInTonight}
          inTonightMode={inTonightMode}
          tonightTitle="添加到今晚喝什么"
          onFavoriteClick={(e) => {
            e.stopPropagation();
            onFavoriteChange();
          }}
          onTonightClick={(e) => {
            e.stopPropagation();
            onTonightChange();
          }}
        />
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={zh}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: 350, objectFit: "cover" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
            }}
          />
        ) : (
          <Box
            h="350px"
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
        <Card.Body p="4">
          <Text className="food-card-title" fontWeight="semibold" mb="1">
            {zh}
          </Text>
          <Text className="food-card-meta" mb="2">
            {cocktail.name}
          </Text>
          <Text className="food-card-desc" lineClamp={2} minH="42px">
            {descPreview}
          </Text>
          <Text mt="2" className="food-card-meta">
            {getCategoryLabelZh(cocktail.category)}
          </Text>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
