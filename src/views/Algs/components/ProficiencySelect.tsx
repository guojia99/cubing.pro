"use client";

import { HStack, Tag } from "@chakra-ui/react";
import type { ProficiencyLevel } from "@/services/cubing-pro/algs/formulaPracticeProficiency";

const LEVELS: { value: ProficiencyLevel; label: string; color: string }[] = [
  { value: "unknown", label: "?", color: "gray" },
  { value: "unskilled", label: "生", color: "red" },
  { value: "average", label: "中", color: "orange" },
  { value: "skilled", label: "熟", color: "blue" },
  { value: "mastered", label: "精", color: "green" },
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
            {l.label}
          </Tag.Label>
        </Tag.Root>
      ))}
    </HStack>
  );
}
