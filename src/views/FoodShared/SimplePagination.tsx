"use client";

import { Button, Flex, Text } from "@chakra-ui/react";

import { FOOD_FONT_SIZE } from "./foodTokens";

interface SimplePaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function SimplePagination({ current, total, pageSize, onChange }: SimplePaginationProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  if (totalPages <= 1) return null;

  return (
    <Flex justify="center" align="center" gap="3" mt="6" mb="6" flexWrap="wrap">
      <Button
        size="sm"
        variant="outline"
        fontSize={FOOD_FONT_SIZE}
        h="36px"
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
      >
        上一页
      </Button>
      <Text fontSize={FOOD_FONT_SIZE} color="fg.muted">
        第 {current} / {totalPages} 页（共 {total} 项）
      </Text>
      <Button
        size="sm"
        variant="outline"
        fontSize={FOOD_FONT_SIZE}
        h="36px"
        disabled={current >= totalPages}
        onClick={() => onChange(current + 1)}
      >
        下一页
      </Button>
    </Flex>
  );
}
