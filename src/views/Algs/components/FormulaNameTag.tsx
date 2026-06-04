"use client";

import { Badge } from "@chakra-ui/react";

const CARD_INSET = "8px";

interface Props {
  name: string;
}

/** 卡片左上角公式名标签，距边框 8px */
export default function FormulaNameTag({ name }: Props) {
  return (
    <Badge
      position="absolute"
      top={CARD_INSET}
      left={CARD_INSET}
      zIndex={1}
      maxW="calc(100% - 16px)"
      borderRadius="md"
      px={2}
      py={0.5}
      fontSize="xs"
      fontWeight="semibold"
      color="fg"
      bg="bg.elevated"
      borderWidth="1px"
      borderColor="border"
      lineClamp={1}
      title={name}
    >
      {name}
    </Badge>
  );
}
