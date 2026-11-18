"use client";

import { HStack, Tag } from "@chakra-ui/react";
import type { ProficiencyLevel } from "@/services/cubing-pro/algs/formulaPracticeProficiency";
import { useI18n } from "@/contexts/I18nProvider";
import { translateShared } from "@/i18n/messages/shared";

const LEVELS: { value: ProficiencyLevel; color: string }[] = [
  { value: "unknown", color: "gray" },
  { value: "unskilled", color: "red" },
  { value: "average", color: "orange" },
  { value: "skilled", color: "blue" },
  { value: "mastered", color: "green" },
];

interface ProficiencySelectProps {
  value: ProficiencyLevel;
  onChange: (level: ProficiencyLevel) => void;
  size?: "sm" | "md";
}

export default function ProficiencySelect({
  value,
  onChange,
  size = "md",
}: ProficiencySelectProps) {
  const { locale } = useI18n();
  return (
    <HStack gap="1">
      {LEVELS.map((l) => (
        <Tag.Root
          key={l.value}
          size={size === "sm" ? "sm" : "md"}
          variant={value === l.value ? "solid" : "outline"}
          colorPalette={value === l.value ? l.color as "red" | "orange" | "blue" | "green" | "gray" : "gray"}
          cursor="pointer"
          onClick={() => onChange(l.value)}
          borderRadius="full"
          px={size === "sm" ? 2 : 3}
          transition="all 0.15s"
          _hover={{ opacity: 0.8 }}
        >
          <Tag.Label fontSize={size === "sm" ? "xs" : "sm"} fontWeight="bold">
            {translateShared(locale, `shared.proficiency.${l.value}`)}
          </Tag.Label>
        </Tag.Root>
      ))}
    </HStack>
  );
}
