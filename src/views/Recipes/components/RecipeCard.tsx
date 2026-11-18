"use client";

import { Box, Card, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";

import { CardActionButtons } from "@/views/FoodShared/CardActionButtons";
import { FOOD_FONT_SIZE } from "@/views/FoodShared/foodTokens";

import type { Recipe } from "../types";
import { getRecipeCategoryName, getRecipeDisplayName } from "../utils/recipeDisplay";

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
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const [imageFailed, setImageFailed] = useState(false);
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
      >
        <CardActionButtons
          isFavorite={isFav}
          isInTonight={isInTonight}
          inTonightMode={inTonightMode}
          tonightTitle={sc("siteContent.addMenu")}
          onFavoriteClick={(e) => {
            e.stopPropagation();
            onFavoriteChange();
          }}
          onTonightClick={(e) => {
            e.stopPropagation();
            onTonightChange();
          }}
        />
        {coverImg && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImg}
            alt={recipe.title}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover" }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Box
            aspectRatio="16 / 10"
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
        <Card.Body p="5" flex="1" display="flex" flexDirection="column">
          <Text className="food-card-meta" mb="2">{getRecipeCategoryName(recipe.category, locale, recipe.categoryName)}</Text>
          <Text as="h3" className="food-card-title" fontWeight="semibold" mb="2">
            <a className="food-card-link" href={`/other/recipes/${encodeURIComponent(recipe.category)}/${encodeURIComponent(recipe.id)}`} onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onClick(); } }}>{displayName}</a>
          </Text>
          <Text className="food-card-desc" lineClamp={2} minH="42px">
            {recipe.description || sc("siteContent.noDescription")}
          </Text>
          <Text mt="2" color="accent" fontSize={FOOD_FONT_SIZE}>
            {"★".repeat(recipe.difficulty)}
            {"☆".repeat(5 - recipe.difficulty)}
            <Text as="span" ml="1.5" className="food-card-meta">
              {sc("siteContent.stars", { count: recipe.difficulty })}
            </Text>
          </Text>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
