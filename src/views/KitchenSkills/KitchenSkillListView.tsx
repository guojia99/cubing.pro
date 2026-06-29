"use client";

import { Box, Card, Flex, Spinner, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { FoodFilterSelect } from "@/views/FoodShared/FoodFilterSelect";

import type { KitchenTip, KitchenTipsData } from "./types";
import { TIPS_JSON } from "./types";

import "@/views/FoodShared/food-list.css";
import "@/views/FoodShared/food-page.css";

function TipCard({ tip, onClick }: { tip: KitchenTip; onClick: () => void }) {
  return (
    <Card.Root
      className="food-card"
      borderRadius="xl"
      cursor="pointer"
      height="100%"
      onClick={onClick}
      _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
      transition="all 0.2s ease"
    >
      <Card.Body p="4">
        <Text className="food-card-title" fontWeight="semibold" mb="2">
          {tip.title}
        </Text>
        <Text className="food-card-desc" lineClamp={2} minH="42px">
          {tip.description || "暂无描述"}
        </Text>
        <Text mt="2" className="food-card-meta">
          {tip.categoryName}
        </Text>
      </Card.Body>
    </Card.Root>
  );
}

export function KitchenSkillListView() {
  const router = useRouter();
  const [data, setData] = useState<KitchenTipsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    fetch(TIPS_JSON)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const tips = data?.tips ?? [];
  const categories = data?.categories ?? [];

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c,
        label: tips.find((t) => t.category === c)?.categoryName ?? c,
      })),
    [categories, tips],
  );

  const filteredTips = tips.filter((t) => !filterCategory || t.category === filterCategory);

  if (loading) {
    return (
      <Flex justify="center" py="12">
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box className="food-page" px={{ base: 4, md: 6 }} py="4" maxW="1200px" mx="auto">
      <Flex className="food-toolbar" flexWrap="wrap" gap="3" mb="6">
        <FoodFilterSelect
          className="food-filter-select--wide"
          w="160px"
          minW="160px"
          value={filterCategory}
          onChange={setFilterCategory}
        >
          <option value="">全部分类</option>
          {categoryOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </FoodFilterSelect>
      </Flex>

      {filteredTips.length === 0 ? (
        <Text className="food-empty-hint">暂无厨房技能</Text>
      ) : (
        <Box className="food-grid-responsive">
          {filteredTips.map((tip) => (
            <TipCard
              key={`${tip.category}-${tip.id}`}
              tip={tip}
              onClick={() =>
                router.push(
                  `/other/kitchen-skills/${encodeURIComponent(tip.category)}/${encodeURIComponent(tip.id)}`,
                )
              }
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
