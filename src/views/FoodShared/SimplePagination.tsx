"use client";

import { Button, Flex, Text } from "@chakra-ui/react";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";

import { FOOD_FONT_SIZE } from "./foodTokens";

interface SimplePaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function SimplePagination({ current, total, pageSize, onChange }: SimplePaginationProps) {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const totalPages = Math.ceil(total / pageSize) || 1;
  if (totalPages <= 1) return null;

  return (
    <Flex as="nav" aria-label={sc("siteContent.pagination")} justify="center" align="center" gap="3" mt="8" mb="6" flexWrap="wrap">
      <Button
        size="sm"
        variant="outline"
        fontSize={FOOD_FONT_SIZE}
        h="44px"
        colorPalette="brand"
        borderRadius="12px"
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
      >
        {sc("siteContent.previous")}
      </Button>
      <Text fontSize={FOOD_FONT_SIZE} color="fg.muted">
        {sc("siteContent.pageCount", { current, pages: totalPages, total })}
      </Text>
      <Button
        size="sm"
        variant="outline"
        fontSize={FOOD_FONT_SIZE}
        h="44px"
        colorPalette="brand"
        borderRadius="12px"
        disabled={current >= totalPages}
        onClick={() => onChange(current + 1)}
      >
        {sc("siteContent.next")}
      </Button>
    </Flex>
  );
}
