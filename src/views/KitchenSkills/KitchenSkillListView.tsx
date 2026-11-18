"use client";

import { Box, Button, Card, Flex, Spinner, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { PageHeader, SectionHeader, Surface } from "@/components/ui/page";

import { FoodFilterSelect } from "@/views/FoodShared/FoodFilterSelect";
import {
  KITCHEN_SKILL_LOAD_ERRORS,
  loadKitchenSkillIndex,
  localizeKitchenTips,
} from "@/lib/kitchenSkillContent";

import type { KitchenTip, KitchenTipsData } from "./types";
import { TIPS_JSON } from "./types";

import "@/views/FoodShared/food-list.css";
import "@/views/FoodShared/food-page.css";

function TipCard({ tip, onClick }: { tip: KitchenTip; onClick: () => void }) {
  const { locale } = useI18n();
  return (
    <Card.Root
      className="food-card"
      borderRadius="xl"
      cursor="pointer"
      height="100%"
      onClick={onClick}
      tabIndex={0}
      role="link"
      onKeyDown={(event) => { if (event.key === "Enter") onClick(); }}
    >
      <Card.Body p="4">
        <Text as="h3" className="food-card-title" fontWeight="semibold" mb="2">
          {tip.title}
        </Text>
        <Text className="food-card-desc" lineClamp={2} minH="42px">
          {tip.description || getSiteContent(locale)("siteContent.noDescription")}
        </Text>
        <Text mt="2" className="food-card-meta">
          {tip.categoryName}
        </Text>
      </Card.Body>
    </Card.Root>
  );
}

export function KitchenSkillListView() {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const router = useRouter();
  const [state, setState] = useState<{
    locale: string;
    data: KitchenTipsData | null;
    error: boolean;
  }>({ locale: "", data: null, error: false });
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(TIPS_JSON, { signal: controller.signal }).then(async (response) => {
        if (!response.ok) throw new Error(`Kitchen tips: HTTP ${response.status}`);
        return await response.json() as KitchenTipsData;
      }),
      loadKitchenSkillIndex(locale, controller.signal),
    ])
      .then(([data, index]) => {
        const tips = localizeKitchenTips(data.tips, index);
        if (!controller.signal.aborted) {
          setState({ locale, data: { ...data, tips }, error: false });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ locale, data: null, error: true });
      });
    return () => controller.abort();
  }, [locale]);

  const loading = state.locale !== locale;
  const data = !loading ? state.data : null;
  const error = !loading && state.error;
  const tips = data?.tips ?? [];
  const categories = data?.categories ?? [];

  const categoryOptions = categories.map((c) => ({
    value: c,
    label: tips.find((t) => t.category === c)?.categoryName ?? c,
  }));

  const filteredTips = tips.filter((t) => !filterCategory || t.category === filterCategory);

  if (loading) {
    return (
      <Flex justify="center" py="12">
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box className="food-page" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }} maxW="1200px" mx="auto">
      <PageHeader eyebrow={sc("siteContent.kitchenEyebrow")} title={sc("siteContent.kitchenTitle")} description={sc("siteContent.kitchenIntro")} />
      {error ? (
        <Text role="alert">{KITCHEN_SKILL_LOAD_ERRORS[locale]}</Text>
      ) : (
        <>
          <Surface className="food-filter-panel" p={{ base: 4, md: 5 }} mb="6">
            <SectionHeader title={sc("siteContent.browseTopics")} description={sc("siteContent.kitchenFilterIntro")} actions={<Button variant="ghost" size="sm" disabled={!filterCategory} onClick={() => setFilterCategory("")}>{sc("siteContent.resetFilters")}</Button>} />
            <Flex className="food-toolbar" flexWrap="wrap" gap="3" mb="6">
              <FoodFilterSelect
                className="food-filter-select--wide"
                w="160px"
                minW="160px"
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
            </Flex>
          </Surface>
          <SectionHeader title={sc("siteContent.kitchenSkills")} description={sc("siteContent.articleCount", { count: filteredTips.length })} />

          {filteredTips.length === 0 ? (
            <Text className="food-empty-hint">{sc("siteContent.noKitchenSkills")}</Text>
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
        </>
      )}
    </Box>
  );
}
