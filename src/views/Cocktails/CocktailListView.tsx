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
import { LuChevronDown, LuChevronUp, LuSmile } from "react-icons/lu";

import { toaster } from "@/components/ui/toaster";
import { FoodFilterSelect } from "@/views/FoodShared/FoodFilterSelect";
import { MultiCheckboxSelect } from "@/views/FoodShared/MultiCheckboxSelect";
import { RandomPickModal } from "@/views/FoodShared/RandomPickModal";
import { SimplePagination } from "@/views/FoodShared/SimplePagination";
import { TonightReceipt } from "@/views/FoodShared/TonightReceipt";

import { getCategoryLabelZh } from "./categoryZh";
import { CocktailCard } from "./components/CocktailCard";
import { CocktailFirstVisitModal } from "./components/CocktailFirstVisitModal";
import { getCocktailZhName } from "./cocktailNameZhMap";
import type { Cocktail } from "./types";
import {
  COCKTAIL_PAGE_SIZE,
  COCKTAILS_JSON,
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
  const router = useRouter();
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetch(COCKTAILS_JSON)
      .then((r) => r.json())
      .then((data: Cocktail[]) => setCocktails(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
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

  const favList = useMemo(() => getCocktailFavorites(), [favoritesVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const tonightList = useMemo(() => getCocktailTonightList(), [tonightVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const cocktailMap = useMemo(() => {
    const m = new Map<string, Cocktail>();
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
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const categorySelectOptions = useMemo(() => {
    const cats = [...new Set(cocktails.map((c) => c.category))];
    return cats.map((c) => ({ value: c, label: getCategoryLabelZh(c) }));
  }, [cocktails]);

  const tonightReceiptItems = useMemo(
    () =>
      tonightList
        .map((t) => cocktailMap.get(t.slug))
        .filter((c): c is Cocktail => !!c)
        .map((c) => ({ key: c.slug, name: getCocktailZhName(c.slug, c.name) })),
    [tonightList, cocktailMap],
  );

  const tonightIngredients = useMemo(() => {
    const map = new Map<string, { count: number; itemNames: string[]; order: number }>();
    let orderIndex = 0;
    tonightList.forEach((t) => {
      const c = cocktailMap.get(t.slug);
      if (!c) return;
      const displayZh = getCocktailZhName(c.slug, c.name);
      (c.ingredients ?? []).forEach((ing) => {
        const existing = map.get(ing);
        if (existing) {
          existing.count += 1;
          if (!existing.itemNames.includes(displayZh)) existing.itemNames.push(displayZh);
        } else {
          map.set(ing, { count: 1, itemNames: [displayZh], order: orderIndex++ });
        }
      });
    });
    return Array.from(map.entries())
      .map(([name, meta]) => ({ name, ...meta }))
      .sort((a, b) => a.order - b.order)
      .map(({ name, count, itemNames }) => ({ name, count, itemNames }));
  }, [tonightList, cocktailMap]);

  const handleFavorite = (c: Cocktail) => {
    if (isCocktailFavorite(c.slug)) {
      removeCocktailFavorite(c.slug);
      refreshFavorites();
      return;
    }
    if (addCocktailFavorite(c.slug)) {
      refreshFavorites();
    } else {
      toaster.create({ type: "warning", title: `最多收藏 ${MAX_COCKTAIL_FAVORITES} 款` });
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
      toaster.create({ type: "success", title: "已添加到今晚喝什么" });
    } else {
      toaster.create({ type: "warning", title: `今晚喝什么最多 ${MAX_COCKTAIL_TONIGHT} 款` });
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

  const listModeSegment =
    listMode === "favorites" ? "favorites" : listMode === "tonight" ? "tonight" : "all";

  return (
    <>
      <CocktailFirstVisitModal />
      <Box className="food-list-page food-page" px={{ base: 4, md: 6 }} py="4" maxW="1600px" mx="auto">
        <Flex className="food-toolbar" flexWrap="wrap" gap="3" align="center" mb="6">
          {listMode !== "tonight" ? (
            <FoodFilterSelect
              className="food-filter-select--wide"
              w="160px"
              minW="160px"
              value={filterCategory}
              onChange={setFilterCategory}
            >
              <option value="">全部分类</option>
              {categorySelectOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </FoodFilterSelect>
          ) : null}
          <SegmentGroup.Root
            className="food-segment-group"
            size="sm"
            value={listModeSegment}
            onValueChange={(e) => setListMode((e.value ?? "all") as ListMode)}
          >
            <SegmentGroup.Indicator />
            <SegmentGroup.Item value="all">
              <SegmentGroup.ItemText>全部</SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
            <SegmentGroup.Item value="favorites">
              <SegmentGroup.ItemText>
                我喜欢的{favList.length ? ` (${favList.length})` : ""}
              </SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
            <SegmentGroup.Item value="tonight">
              <SegmentGroup.ItemText>
                今晚喝什么{tonightList.length ? ` (${tonightList.length})` : ""}
              </SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          </SegmentGroup.Root>
          <Button colorPalette="brand" size="sm" onClick={() => setPickOpen(true)}>
            <LuSmile />
            今晚喝什么
          </Button>
        </Flex>

        {listMode === "tonight" ? (
          <Box className="food-tonight-layout">
            <Box className={`food-tonight-receipt-wrap ${receiptCollapsed ? "collapsed" : ""}`}>
              <Box className="food-tonight-receipt-inner">
                <TonightReceipt
                  key={tonightVersion}
                  title="备料小票"
                  emptyText="暂无酒款，去添加吧"
                  clearTitle="清空今晚喝什么"
                  clearMessage="确定要清空「今晚喝什么」清单吗？已勾选的备料项也会被清除。"
                  tagLabel="酒名"
                  items={tonightReceiptItems}
                  ingredients={tonightIngredients}
                  getCheckedIngredients={getCocktailTonightCheckedIngredients}
                  toggleIngredientChecked={toggleCocktailTonightIngredientChecked}
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
                {receiptCollapsed ? "展开小票" : "收起小票"}
              </Button>
            </Box>
            <Box className="food-tonight-items">
              {filtered.length === 0 ? (
                <Text className="food-empty-hint">暂无酒款，去添加吧</Text>
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
          <Text className="food-empty-hint">暂无匹配的酒款</Text>
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
          title="今晚喝什么"
          countLabel="共 {count} 款可选"
          viewButtonLabel="查看酒款"
          items={pickFiltered}
          getDisplayName={(c) => getCocktailZhName(c.slug, c.name)}
          onClose={() => setPickOpen(false)}
          onViewItem={(c) => router.push(`/other/cocktails/${encodeURIComponent(c.slug)}`)}
          onResult={(c) =>
            appendTodayCocktailSpin({
              slug: c.slug,
              zhName: getCocktailZhName(c.slug, c.name),
              enName: c.name,
            })
          }
          filterSlot={
            <Box>
              <Text fontSize="14px" color="fg.muted" mb="2">
                分类（可多选，已译为中文）
              </Text>
              <MultiCheckboxSelect
                placeholder="全部分类"
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
