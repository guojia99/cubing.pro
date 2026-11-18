"use client";

import {
  Box,
  Button,
  Flex,
  SegmentGroup,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { LuChevronDown, LuChevronUp, LuSmile } from "react-icons/lu";

import { toaster } from "@/components/ui/toaster";
import { PageHeader, SectionHeader, Surface } from "@/components/ui/page";
import { FoodFilterSelect } from "@/views/FoodShared/FoodFilterSelect";
import { FoodMetaLink, FoodMetaRow, FoodMetaText } from "@/views/FoodShared/FoodMetaRow";
import { MultiCheckboxSelect } from "@/views/FoodShared/MultiCheckboxSelect";
import { RandomPickModal } from "@/views/FoodShared/RandomPickModal";
import { SimplePagination } from "@/views/FoodShared/SimplePagination";
import { TonightReceipt } from "@/views/FoodShared/TonightReceipt";

import { RecipeCard } from "./components/RecipeCard";
import { RecipeDetailModal } from "./components/RecipeDetailModal";
import type { Recipe, RecipesData } from "./types";
import {
  addFavorite,
  getFavorites,
  isFavorite,
  removeFavorite,
} from "./utils/favoriteStorage";
import {
  getRecipeDisplayName,
  getRecipeCategoryName,
  MAX_RECIPE_FAVORITES,
  MAX_RECIPE_TONIGHT,
  RECIPE_PAGE_SIZE,
  RECIPES_DATA_SOURCE_URL,
  RECIPES_JSON,
} from "./utils/recipeDisplay";
import {
  addToTonight,
  clearTonightList,
  getCheckedIngredients,
  getTonightList,
  isInTonight,
  removeFromTonight,
  toggleIngredientChecked,
} from "./utils/tonightStorage";

import "@/views/FoodShared/food-list.css";
import "@/views/FoodShared/food-page.css";

type ListMode = "all" | "favorites" | "tonight";

export function RecipeListView() {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const router = useRouter();
  const [data, setData] = useState<RecipesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<number | "">("");
  const [filterIngredients, setFilterIngredients] = useState<string[]>([]);
  const [showOnlyWithImage, setShowOnlyWithImage] = useState(false);
  const [listMode, setListMode] = useState<ListMode>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [todayPickOpen, setTodayPickOpen] = useState(false);
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const [tonightVersion, setTonightVersion] = useState(0);
  const [receiptCollapsed, setReceiptCollapsed] = useState(false);
  const [tonightDetail, setTonightDetail] = useState<{ category: string; id: string } | null>(null);

  const refreshFavorites = useCallback(() => setFavoritesVersion((v) => v + 1), []);
  const refreshTonight = useCallback(() => setTonightVersion((v) => v + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(RECIPES_JSON, { signal: controller.signal })
      .then((r) => r.json())
      .then((value) => { if (!controller.signal.aborted) setData(value); })
      .catch(() => { if (!controller.signal.aborted) setData(null); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (listMode === "tonight") refreshTonight();
  }, [listMode, refreshTonight]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && listMode === "tonight") refreshTonight();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [listMode, refreshTonight]);

  const recipes = data?.recipes ?? [];
  // favoritesVersion / tonightVersion 用于在 localStorage 变更后触发重算
  const favList = useMemo(() => getFavorites(), [favoritesVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const tonightRecipesList = useMemo(() => getTonightList(), [tonightVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const baseRecipes =
    listMode === "favorites"
      ? recipes.filter((r) => favList.some((f) => f.category === r.category && f.id === r.id))
      : listMode === "tonight"
        ? recipes.filter((r) => tonightRecipesList.some((t) => t.category === r.category && t.id === r.id))
        : recipes;

  const allIngredients = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => (r.ingredients ?? []).forEach((i) => set.add(i)));
    return Array.from(set).sort();
  }, [recipes]);

  const categoryOptions = useMemo(
    () =>
      [...new Map(recipes.map((r) => [r.category, { value: r.category, label: getRecipeCategoryName(r.category, locale, r.categoryName) }])).values()].filter(
        (o) => o.value !== "template",
      ),
    [recipes, locale],
  );

  const filteredRecipes = baseRecipes.filter((r) => {
    if (filterCategory && r.category !== filterCategory) return false;
    if (filterDifficulty !== "" && r.difficulty !== filterDifficulty) return false;
    if (showOnlyWithImage && !r.hasImage) return false;
    if (filterIngredients.length > 0) {
      const ings = r.ingredients ?? [];
      if (!filterIngredients.every((fi) => ings.includes(fi))) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredRecipes.length / RECIPE_PAGE_SIZE) || 1;
  const paginatedRecipes = useMemo(() => {
    const start = (currentPage - 1) * RECIPE_PAGE_SIZE;
    return filteredRecipes.slice(start, start + RECIPE_PAGE_SIZE);
  }, [filteredRecipes, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterDifficulty, filterIngredients, showOnlyWithImage, listMode]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const recipeMap = useMemo(() => {
    const m = new Map<string, Recipe>();
    recipes.forEach((r) => m.set(`${r.category}-${r.id}`, r));
    return m;
  }, [recipes]);

  const tonightReceiptItems = useMemo(
    () =>
      tonightRecipesList
        .map((t) => recipeMap.get(`${t.category}-${t.id}`))
        .filter((r): r is Recipe => !!r)
        .map((r) => ({ key: `${r.category}-${r.id}`, name: getRecipeDisplayName(r) })),
    [tonightRecipesList, recipeMap],
  );

  const tonightIngredients = useMemo(() => {
    const map = new Map<string, { count: number; itemNames: string[]; order: number }>();
    let orderIndex = 0;
    tonightRecipesList.forEach((t) => {
      const r = recipeMap.get(`${t.category}-${t.id}`);
      if (!r) return;
      const displayName = getRecipeDisplayName(r);
      (r.ingredients ?? []).forEach((ing) => {
        const existing = map.get(ing);
        if (existing) {
          existing.count += 1;
          if (!existing.itemNames.includes(displayName)) existing.itemNames.push(displayName);
        } else {
          map.set(ing, { count: 1, itemNames: [displayName], order: orderIndex++ });
        }
      });
    });
    return Array.from(map.entries())
      .map(([name, meta]) => ({ name, ...meta }))
      .sort((a, b) => a.order - b.order)
      .map(({ name, count, itemNames }) => ({ name, count, itemNames }));
  }, [tonightRecipesList, recipeMap]);

  const handleFavorite = (recipe: Recipe) => {
    if (isFavorite(recipe.category, recipe.id)) {
      removeFavorite(recipe.category, recipe.id);
      refreshFavorites();
      return;
    }
    if (addFavorite(recipe.category, recipe.id)) {
      refreshFavorites();
    } else {
      toaster.create({ type: "warning", title: sc("siteContent.favoriteLimit", { count: MAX_RECIPE_FAVORITES }) });
    }
  };

  const handleTonight = (recipe: Recipe, inTonightMode?: boolean) => {
    if (inTonightMode || isInTonight(recipe.category, recipe.id)) {
      removeFromTonight(recipe.category, recipe.id);
      refreshTonight();
      return;
    }
    if (addToTonight(recipe.category, recipe.id)) {
      refreshTonight();
      toaster.create({ type: "success", title: sc("siteContent.recipeAdded") });
    } else {
      toaster.create({ type: "warning", title: sc("siteContent.recipeLimit", { count: MAX_RECIPE_TONIGHT }) });
    }
  };

  const handleCardClick = (recipe: Recipe) => {
    if (listMode === "tonight") {
      setTonightDetail({ category: recipe.category, id: recipe.id });
    } else {
      router.push(
        `/other/recipes/${encodeURIComponent(recipe.category)}/${encodeURIComponent(recipe.id)}`,
      );
    }
  };

  const todayPickFiltered = useMemo(() => {
    return recipes.filter((r) => {
      // filters applied inside modal via separate state - pass all and filter in modal
      return r.category !== "template";
    });
  }, [recipes]);

  if (loading) {
    return (
      <Flex justify="center" py="12">
        <Spinner size="lg" />
      </Flex>
    );
  }

  const listModeSegment =
    listMode === "favorites" ? "favorites" : listMode === "tonight" ? "tonight" : "all";

  return (
    <Box className="food-list-page food-page" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }} maxW="1440px" mx="auto">
      <PageHeader eyebrow={sc("siteContent.recipeEyebrow")} title={sc("siteContent.recipeTitle")} description={sc("siteContent.recipeIntro")} actions={
        <Button colorPalette="brand" onClick={() => setTodayPickOpen(true)}><LuSmile />{sc("siteContent.pickFood")}</Button>
      } />
      <Surface className="food-filter-panel" p={{ base: 4, md: 5 }} mb="6">
        <SectionHeader title={sc("siteContent.findRecipe")} description={sc("siteContent.recipeFilterIntro")} actions={listMode !== "tonight" ? <Button variant="ghost" size="sm" disabled={!filterCategory && filterDifficulty === "" && filterIngredients.length === 0 && !showOnlyWithImage} onClick={() => { setFilterCategory(""); setFilterDifficulty(""); setFilterIngredients([]); setShowOnlyWithImage(false); }}>{sc("siteContent.resetFilters")}</Button> : undefined} />
      <Flex className="food-toolbar" flexWrap="wrap" gap="3" align="center" mb="6">
        {listMode !== "tonight" ? (
          <>
            <FoodFilterSelect
              className="food-filter-select--category"
              w="140px"
              minW="140px"
              value={filterCategory}
              onChange={setFilterCategory}
            >
              <option value="">{sc("siteContent.allCategories")}</option>
              {categoryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </FoodFilterSelect>
            <FoodFilterSelect
              className="food-filter-select--difficulty"
              label={sc("siteContent.difficultyFilter")}
              w="112px"
              minW="112px"
              value={filterDifficulty === "" ? "" : String(filterDifficulty)}
              onChange={(v) => setFilterDifficulty(v ? Number(v) : "")}
            >
              <option value="">{sc("siteContent.allDifficulties")}</option>
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {sc("siteContent.stars", { count: d })}
                </option>
              ))}
            </FoodFilterSelect>
            <MultiCheckboxSelect
              placeholder={sc("siteContent.ingredientsFilter")}
              className="food-filter-select--ingredients"
              options={allIngredients.map((i) => ({ value: i, label: i }))}
              value={filterIngredients}
              onChange={setFilterIngredients}
              maxCount={8}
              width="200px"
            />
          </>
        ) : null}
        <SegmentGroup.Root
          className="food-segment-group food-list-modes"
          aria-label={sc("siteContent.recipeLists")}
          size="sm"
          value={listModeSegment}
          onValueChange={(e) => setListMode((e.value ?? "all") as ListMode)}
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Item value="all">
            <SegmentGroup.ItemText>{sc("siteContent.all")}</SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
          <SegmentGroup.Item value="favorites">
            <SegmentGroup.ItemText>
              {sc("siteContent.favorites")}{favList.length ? ` (${favList.length})` : ""}
            </SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
          <SegmentGroup.Item value="tonight">
            <SegmentGroup.ItemText>
              {sc("siteContent.tonightFood")}{tonightRecipesList.length ? ` (${tonightRecipesList.length})` : ""}
            </SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
        </SegmentGroup.Root>
        {listMode !== "tonight" ? (
          <SegmentGroup.Root
            className="food-segment-group"
            aria-label={sc("siteContent.imageFilter")}
            size="sm"
            value={showOnlyWithImage ? "image" : "all"}
            onValueChange={(e) => setShowOnlyWithImage(e.value === "image")}
          >
            <SegmentGroup.Indicator />
            <SegmentGroup.Item value="all">
              <SegmentGroup.ItemText>{sc("siteContent.all")}</SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
            <SegmentGroup.Item value="image">
              <SegmentGroup.ItemText>{sc("siteContent.withImages")}</SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          </SegmentGroup.Root>
        ) : null}
      </Flex>
      </Surface>

      <FoodMetaRow>
        <FoodMetaText>
          {sc("siteContent.source")}
          <FoodMetaLink href={RECIPES_DATA_SOURCE_URL} external ml="1">
            HowToCook
          </FoodMetaLink>
        </FoodMetaText>
        <FoodMetaLink href="/other/kitchen-skills">{sc("siteContent.kitchenSkills")}</FoodMetaLink>
        <FoodMetaLink href="/other/cocktails">{sc("siteContent.cocktails")}</FoodMetaLink>
      </FoodMetaRow>

      <SectionHeader title={sc(listMode === "tonight" ? "siteContent.tonightMenu" : listMode === "favorites" ? "siteContent.savedRecipes" : "siteContent.recipeIdeas")} description={sc("siteContent.recipeCount", { count: filteredRecipes.length })} />

      {listMode === "tonight" ? (
        <Box className="food-tonight-layout">
          <Box className={`food-tonight-receipt-wrap ${receiptCollapsed ? "collapsed" : ""}`}>
            <Box className="food-tonight-receipt-inner">
              <TonightReceipt
                key={tonightVersion}
                title={sc("siteContent.shoppingReceipt")}
                emptyText={sc("siteContent.noRecipes")}
                clearTitle={sc("siteContent.clearMenu")}
                clearMessage={sc("siteContent.clearMenuConfirm")}
                tagLabel={sc("siteContent.dishNames")}
                items={tonightReceiptItems}
                ingredients={tonightIngredients}
                getCheckedIngredients={getCheckedIngredients}
                toggleIngredientChecked={toggleIngredientChecked}
                onClear={() => {
                  clearTonightList();
                  refreshTonight();
                }}
              />
            </Box>
            <Button
              variant="ghost"
              size="sm"
              className="food-tonight-receipt-toggle"
              onClick={() => setReceiptCollapsed(!receiptCollapsed)}
            >
              {receiptCollapsed ? <LuChevronDown /> : <LuChevronUp />}
              {sc(receiptCollapsed ? "siteContent.expandReceipt" : "siteContent.collapseReceipt")}
            </Button>
          </Box>
          <Box className="food-tonight-items">
            {filteredRecipes.length === 0 ? (
              <Text className="food-empty-hint">{sc("siteContent.noRecipes")}</Text>
            ) : (
              <Box className="food-grid-responsive">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={`${recipe.category}-${recipe.id}`}
                    recipe={recipe}
                    onClick={() => handleCardClick(recipe)}
                    isFav={isFavorite(recipe.category, recipe.id)}
                    onFavoriteChange={() => handleFavorite(recipe)}
                    isInTonight={isInTonight(recipe.category, recipe.id)}
                    onTonightChange={() => handleTonight(recipe, true)}
                    inTonightMode
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      ) : filteredRecipes.length === 0 ? (
        <Text className="food-empty-hint">{sc("siteContent.noMatchingRecipes")}</Text>
      ) : (
        <>
          <Box className="food-grid-responsive">
            {paginatedRecipes.map((recipe) => (
              <RecipeCard
                key={`${recipe.category}-${recipe.id}`}
                recipe={recipe}
                onClick={() => handleCardClick(recipe)}
                isFav={isFavorite(recipe.category, recipe.id)}
                onFavoriteChange={() => handleFavorite(recipe)}
                isInTonight={isInTonight(recipe.category, recipe.id)}
                onTonightChange={() => handleTonight(recipe)}
              />
            ))}
          </Box>
          <SimplePagination
            current={currentPage}
            total={filteredRecipes.length}
            pageSize={RECIPE_PAGE_SIZE}
            onChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}

      <TodayPickModalWrapper
        open={todayPickOpen}
        recipes={todayPickFiltered}
        onClose={() => setTodayPickOpen(false)}
      />

      {tonightDetail ? (
        <RecipeDetailModal
          open
          category={tonightDetail.category}
          id={tonightDetail.id}
          onClose={() => setTonightDetail(null)}
          onFavoriteChange={refreshFavorites}
          onTonightChange={refreshTonight}
        />
      ) : null}
    </Box>
  );
}

function TodayPickModalWrapper({
  open,
  recipes,
  onClose,
}: {
  open: boolean;
  recipes: Recipe[];
  onClose: () => void;
}) {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const router = useRouter();
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterDifficulties, setFilterDifficulties] = useState<number[]>([]);

  const categoryOptions = useMemo(
    () =>
      [...new Map(recipes.map((r) => [r.category, { value: r.category, label: getRecipeCategoryName(r.category, locale, r.categoryName) }])).values()].filter(
        (o) => o.value !== "template",
      ),
    [recipes, locale],
  );

  const filtered = recipes.filter((r) => {
    if (filterCategories.length > 0 && !filterCategories.includes(r.category)) return false;
    if (filterDifficulties.length > 0 && !filterDifficulties.includes(r.difficulty)) return false;
    return true;
  });

  return (
    <RandomPickModal
      open={open}
      title={sc("siteContent.pickFood")}
      countLabel={sc("siteContent.pickRecipeCount")}
      viewButtonLabel={sc("siteContent.viewRecipe")}
      items={filtered}
      getDisplayName={getRecipeDisplayName}
      onClose={onClose}
      onViewItem={(recipe) =>
        router.push(
          `/other/recipes/${encodeURIComponent(recipe.category)}/${encodeURIComponent(recipe.id)}`,
        )
      }
      filterSlot={
        <>
          <Box>
            <Text fontSize="14px" color="fg.muted" mb="2">
              {sc("siteContent.multiCategories")}
            </Text>
            <MultiCheckboxSelect
              placeholder={sc("siteContent.allCategories")}
              options={categoryOptions}
              value={filterCategories}
              onChange={setFilterCategories}
              width="100%"
            />
          </Box>
          <Box>
            <Text fontSize="14px" color="fg.muted" mb="2">
              {sc("siteContent.multiDifficulties")}
            </Text>
            <MultiCheckboxSelect
              placeholder={sc("siteContent.allDifficulties")}
              options={[1, 2, 3, 4, 5].map((d) => ({ value: String(d), label: sc("siteContent.stars", { count: d }) }))}
              value={filterDifficulties.map(String)}
              onChange={(vals) => setFilterDifficulties(vals.map(Number))}
              width="100%"
            />
          </Box>
        </>
      }
    />
  );
}
