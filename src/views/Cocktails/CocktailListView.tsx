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
import { getSiteContent, getCocktailCategoryLabel } from "@/i18n/messages/site-content";
import { getCocktailDisplayName, type CocktailContent } from "@/lib/cocktailContent";
import { LuChevronDown, LuChevronUp, LuSmile } from "react-icons/lu";

import { toaster } from "@/components/ui/toaster";
import { PageHeader, SectionHeader, Surface } from "@/components/ui/page";
import { FoodFilterSelect } from "@/views/FoodShared/FoodFilterSelect";
import { MultiCheckboxSelect } from "@/views/FoodShared/MultiCheckboxSelect";
import { RandomPickModal } from "@/views/FoodShared/RandomPickModal";
import { SimplePagination } from "@/views/FoodShared/SimplePagination";
import { TonightReceipt } from "@/views/FoodShared/TonightReceipt";

import { CocktailCard } from "./components/CocktailCard";
import { CocktailFirstVisitModal } from "./components/CocktailFirstVisitModal";
import { getCocktailZhName } from "./cocktailNameZhMap";
import { useCocktails } from "./hooks/useCocktails";
import type { Cocktail } from "./types";
import {
  COCKTAIL_PAGE_SIZE,
  MAX_COCKTAIL_FAVORITES,
  MAX_COCKTAIL_TONIGHT,
} from "./types";
import {
  addCocktailFavorite,
  getCocktailFavorites,
  isCocktailFavorite,
  removeCocktailFavorite,
} from "./utils/cocktailFavoriteStorage";
import { appendTodayCocktailSpin } from "./utils/cocktailSpinHistory";
import {
  addCocktailToTonight,
  clearCocktailTonightList,
  getCocktailTonightCheckedIngredients,
  getCocktailTonightList,
  isCocktailInTonight,
  removeCocktailFromTonight,
  toggleCocktailTonightIngredientChecked,
} from "./utils/cocktailTonightStorage";

import "@/views/FoodShared/food-list.css";
import "@/views/FoodShared/food-page.css";

type ListMode = "all" | "favorites" | "tonight";

export function CocktailListView() {
  const { locale, t } = useI18n();
  const sc = getSiteContent(locale);
  const router = useRouter();
  const { cocktails, loading, error, retry } = useCocktails();
  const [filterCategory, setFilterCategory] = useState("");
  const [listMode, setListMode] = useState<ListMode>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pickOpen, setPickOpen] = useState(false);
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const [tonightVersion, setTonightVersion] = useState(0);
  const [receiptCollapsed, setReceiptCollapsed] = useState(false);
  const [pickCategories, setPickCategories] = useState<string[]>([]);

  const refreshFavorites = useCallback(() => setFavoritesVersion((v) => v + 1), []);
  const refreshTonight = useCallback(() => setTonightVersion((v) => v + 1), []);

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

  const favList = useMemo(() => getCocktailFavorites(), [favoritesVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const tonightList = useMemo(() => getCocktailTonightList(), [tonightVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const cocktailMap = useMemo(() => {
    const m = new Map<string, CocktailContent>();
    cocktails.forEach((c) => m.set(c.slug, c));
    return m;
  }, [cocktails]);

  const baseList =
    listMode === "favorites"
      ? cocktails.filter((c) => favList.some((f) => f.slug === c.slug))
      : listMode === "tonight"
        ? cocktails.filter((c) => tonightList.some((t) => t.slug === c.slug))
        : cocktails;

  const filtered = baseList.filter((c) => !filterCategory || c.category === filterCategory);

  const totalPages = Math.ceil(filtered.length / COCKTAIL_PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * COCKTAIL_PAGE_SIZE;
    return filtered.slice(start, start + COCKTAIL_PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, listMode]);

  useEffect(() => {
    if (!loading && !error && currentPage > totalPages && totalPages > 0) setCurrentPage(1);
  }, [currentPage, totalPages, loading, error]);

  const categorySelectOptions = useMemo(() => {
    const cats = [...new Set(cocktails.map((c) => c.category))];
    return cats.map((c) => ({ value: c, label: getCocktailCategoryLabel(locale, c) }));
  }, [cocktails, locale]);

  const tonightReceiptItems = useMemo(
    () =>
      tonightList
        .map((t) => cocktailMap.get(t.slug))
        .filter((c): c is CocktailContent => !!c)
        .map((c) => ({ key: c.slug, name: getCocktailDisplayName(c, locale) })),
    [tonightList, cocktailMap, locale],
  );

  const tonightIngredients = useMemo(() => {
    const map = new Map<string, { count: number; itemNames: string[]; order: number }>();
    let orderIndex = 0;
    tonightList.forEach((t) => {
      const c = cocktailMap.get(t.slug);
      if (!c) return;
      const displayName = getCocktailDisplayName(c, locale);
      (c.ingredients ?? []).forEach((ing) => {
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
  }, [tonightList, cocktailMap, locale]);

  // Keep the persisted source-text keys while displaying translated ingredients.
  const ingredientSources = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const item of tonightList) {
      const cocktail = cocktailMap.get(item.slug);
      cocktail?.ingredients.forEach((ingredient, index) => {
        const sources = map.get(ingredient) ?? new Set<string>();
        sources.add(cocktail.originalIngredients[index]);
        map.set(ingredient, sources);
      });
    }
    return map;
  }, [tonightList, cocktailMap]);

  const getCheckedIngredients = useCallback(() => {
    const stored = getCocktailTonightCheckedIngredients();
    return new Set([...ingredientSources].filter(([name, sources]) =>
      stored.has(name) || [...sources].every((source) => stored.has(source)),
    ).map(([name]) => name));
  }, [ingredientSources]);

  const toggleIngredientChecked = useCallback((name: string) => {
    const stored = getCocktailTonightCheckedIngredients();
    const checked = getCheckedIngredients().has(name);
    const sources = ingredientSources.get(name) ?? new Set([name]);
    for (const source of sources) {
      if (stored.has(source) === checked) toggleCocktailTonightIngredientChecked(source);
    }
    if (!sources.has(name) && stored.has(name)) toggleCocktailTonightIngredientChecked(name);
  }, [getCheckedIngredients, ingredientSources]);

  const handleFavorite = (c: Cocktail) => {
    if (isCocktailFavorite(c.slug)) {
      removeCocktailFavorite(c.slug);
      refreshFavorites();
      return;
    }
    if (addCocktailFavorite(c.slug)) {
      refreshFavorites();
    } else {
      toaster.create({ type: "warning", title: sc("siteContent.drinkFavoriteLimit", { count: MAX_COCKTAIL_FAVORITES }) });
    }
  };

  const handleTonight = (c: Cocktail, inTonightMode?: boolean) => {
    if (inTonightMode || isCocktailInTonight(c.slug)) {
      removeCocktailFromTonight(c.slug);
      refreshTonight();
      return;
    }
    if (addCocktailToTonight(c.slug)) {
      refreshTonight();
      toaster.create({ type: "success", title: sc("siteContent.drinkAdded") });
    } else {
      toaster.create({ type: "warning", title: sc("siteContent.drinkLimit", { count: MAX_COCKTAIL_TONIGHT }) });
    }
  };

  const pickFiltered = useMemo(
    () =>
      cocktails.filter((c) => pickCategories.length === 0 || pickCategories.includes(c.category)),
    [cocktails, pickCategories],
  );

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

  if (error) {
    return (
      <>
        <CocktailFirstVisitModal />
        <Box p="6">
          <Text role="alert" whiteSpace="pre-line">{sc("siteContent.documentLoadError").replace(/^#\s*/, "")}</Text>
          <Button mt="4" onClick={retry}>{t("algs.practice.retry")}</Button>
        </Box>
      </>
    );
  }

  const listModeSegment =
    listMode === "favorites" ? "favorites" : listMode === "tonight" ? "tonight" : "all";

  return (
    <>
      <CocktailFirstVisitModal />
      <Box className="food-list-page food-page" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }} maxW="1440px" mx="auto">
        <PageHeader eyebrow={sc("siteContent.cocktailEyebrow")} title={sc("siteContent.cocktailTitle")} description={sc("siteContent.cocktailIntro")} actions={
          <Button colorPalette="brand" onClick={() => setPickOpen(true)}><LuSmile />{sc("siteContent.pickDrink")}</Button>
        } />
        <Surface className="food-filter-panel" p={{ base: 4, md: 5 }} mb="6">
          <SectionHeader title={sc("siteContent.chooseDrink")} description={sc("siteContent.drinkFilterIntro")} actions={listMode !== "tonight" ? <Button variant="ghost" size="sm" disabled={!filterCategory} onClick={() => setFilterCategory("")}>{sc("siteContent.resetFilters")}</Button> : undefined} />
        <Flex className="food-toolbar" flexWrap="wrap" gap="3" align="center" mb="6">
          {listMode !== "tonight" ? (
            <FoodFilterSelect
              className="food-filter-select--wide"
              w="160px"
              minW="160px"
              value={filterCategory}
              onChange={setFilterCategory}
            >
              <option value="">{sc("siteContent.allCategories")}</option>
              {categorySelectOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </FoodFilterSelect>
          ) : null}
          <SegmentGroup.Root
            className="food-segment-group food-list-modes"
            aria-label={sc("siteContent.drinkList")}
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
                {sc("siteContent.pickDrink")}{tonightList.length ? ` (${tonightList.length})` : ""}
              </SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          </SegmentGroup.Root>
        </Flex>
        </Surface>
        <SectionHeader title={sc(listMode === "tonight" ? "siteContent.tonightDrinks" : listMode === "favorites" ? "siteContent.savedDrinks" : "siteContent.classicDrinks")} description={sc("siteContent.drinkCount", { count: filtered.length })} />

        {listMode === "tonight" ? (
          <Box className="food-tonight-layout">
            <Box className={`food-tonight-receipt-wrap ${receiptCollapsed ? "collapsed" : ""}`}>
              <Box className="food-tonight-receipt-inner">
                <TonightReceipt
                  key={`${tonightVersion}:${locale}`}
                  title={sc("siteContent.prepReceipt")}
                  emptyText={sc("siteContent.noDrinks")}
                  clearTitle={sc("siteContent.clearDrinks")}
                  clearMessage={sc("siteContent.clearDrinksConfirm")}
                  tagLabel={sc("siteContent.drinkNames")}
                  items={tonightReceiptItems}
                  ingredients={tonightIngredients}
                  getCheckedIngredients={getCheckedIngredients}
                  toggleIngredientChecked={toggleIngredientChecked}
                  onClear={() => {
                    clearCocktailTonightList();
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
              {filtered.length === 0 ? (
                <Text className="food-empty-hint">{sc("siteContent.noDrinks")}</Text>
              ) : (
                <Box className="food-grid-responsive">
                  {filtered.map((c) => (
                    <CocktailCard
                      key={c.slug}
                      cocktail={c}
                      onClick={() => router.push(`/other/cocktails/${encodeURIComponent(c.slug)}`)}
                      isFav={isCocktailFavorite(c.slug)}
                      onFavoriteChange={() => handleFavorite(c)}
                      isInTonight={isCocktailInTonight(c.slug)}
                      onTonightChange={() => handleTonight(c, true)}
                      inTonightMode
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ) : filtered.length === 0 ? (
          <Text className="food-empty-hint">{sc("siteContent.noMatchingDrinks")}</Text>
        ) : (
          <>
            <Box className="food-grid-responsive">
              {paginated.map((c) => (
                <CocktailCard
                  key={c.slug}
                  cocktail={c}
                  onClick={() => router.push(`/other/cocktails/${encodeURIComponent(c.slug)}`)}
                  isFav={isCocktailFavorite(c.slug)}
                  onFavoriteChange={() => handleFavorite(c)}
                  isInTonight={isCocktailInTonight(c.slug)}
                  onTonightChange={() => handleTonight(c)}
                />
              ))}
            </Box>
            <SimplePagination
              current={currentPage}
              total={filtered.length}
              pageSize={COCKTAIL_PAGE_SIZE}
              onChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}

        <RandomPickModal
          open={pickOpen}
          title={sc("siteContent.pickDrink")}
          countLabel={sc("siteContent.pickDrinkCount")}
          viewButtonLabel={sc("siteContent.viewDrink")}
          items={pickFiltered}
          getDisplayName={(c) => getCocktailDisplayName(c, locale)}
          onClose={() => setPickOpen(false)}
          onViewItem={(c) => router.push(`/other/cocktails/${encodeURIComponent(c.slug)}`)}
          onResult={(c) =>
            appendTodayCocktailSpin({
              slug: c.slug,
              zhName: getCocktailZhName(c.slug, c.originalName),
              enName: c.originalName,
            })
          }
          filterSlot={
            <Box>
              <Text fontSize="14px" color="fg.muted" mb="2">
                {sc("siteContent.multiCategories")}
              </Text>
              <MultiCheckboxSelect
                placeholder={sc("siteContent.allCategories")}
                options={categorySelectOptions}
                value={pickCategories}
                onChange={setPickCategories}
                width="100%"
              />
            </Box>
          }
        />
      </Box>
    </>
  );
}
