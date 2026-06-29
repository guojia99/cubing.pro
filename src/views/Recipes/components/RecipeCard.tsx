"use client";

import { Box, Card, Text } from "@chakra-ui/react";

import { CardActionButtons } from "@/views/FoodShared/CardActionButtons";
import { FOOD_FONT_SIZE } from "@/views/FoodShared/foodTokens";

import type { Recipe } from "../types";
import { getRecipeDisplayName } from "../utils/recipeDisplay";

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f5f5f5' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='14'%3E暂无图片%3C/text%3E%3C/svg%3E";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  isFav: boolean;
  onFavoriteChange: () => void;
  isInTonight: boolean;
  onTonightChange: () => void;
  inTonightMode?: boolean;
}

export function RecipeCard({
  recipe,
  onClick,
  isFav,
  onFavoriteChange,
  isInTonight,
  onTonightChange,
  inTonightMode,
}: RecipeCardProps) {
  const hasImage = recipe.hasImage && recipe.coverImage;
  const coverImg = hasImage ? `/HowToCook/${recipe.coverImage}` : "";
  const displayName = getRecipeDisplayName(recipe);

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
          tonightTitle="添加到今晚吃啥"
          onFavoriteClick={(e) => {
            e.stopPropagation();
            onFavoriteChange();
          }}
          onTonightClick={(e) => {
            e.stopPropagation();
            onTonightChange();
          }}
        />
        {coverImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImg}
            alt={recipe.title}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: 160, objectFit: "cover" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
            }}
          />
        ) : (
          <Box
            h="160px"
            bg="bg.muted"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="5xl"
            color="fg.muted"
          >
            🍳
          </Box>
        )}
        <Card.Body p="4" flex="1" display="flex" flexDirection="column">
          <Text className="food-card-title" fontWeight="semibold" mb="2">
            {displayName}
          </Text>
          <Text className="food-card-desc" lineClamp={2} minH="42px">
            {recipe.description || "暂无描述"}
          </Text>
          <Text mt="2" color="orange.solid" fontSize={FOOD_FONT_SIZE}>
            {"★".repeat(recipe.difficulty)}
            {"☆".repeat(5 - recipe.difficulty)}
            <Text as="span" ml="1.5" className="food-card-meta">
              {recipe.difficulty}星
            </Text>
          </Text>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
