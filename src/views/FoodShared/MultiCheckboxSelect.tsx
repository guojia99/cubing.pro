"use client";

import {
  Box,
  Button,
  Checkbox,
  Popover,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMemo } from "react";

import { FOOD_FONT_SIZE } from "./foodTokens";

export interface SelectOption {
  value: string;
  label: string;
}

interface MultiCheckboxSelectProps {
  placeholder: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  maxCount?: number;
  width?: string;
  className?: string;
}

export function MultiCheckboxSelect({
  placeholder,
  options,
  value,
  onChange,
  maxCount,
  width = "200px",
  className,
}: MultiCheckboxSelectProps) {
  const label = useMemo(() => {
    if (value.length === 0) return placeholder;
    if (value.length <= 2) {
      return options
        .filter((o) => value.includes(o.value))
        .map((o) => o.label)
        .join("、");
    }
    return `已选 ${value.length} 项`;
  }, [value, options, placeholder]);

  const toggle = (optValue: string, checked: boolean) => {
    if (checked) {
      const next = [...value, optValue];
      onChange(maxCount ? next.slice(0, maxCount) : next);
    } else {
      onChange(value.filter((v) => v !== optValue));
    }
  };

  return (
    <Popover.Root positioning={{ placement: "bottom-start" }}>
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          className={`food-filter-trigger ${className ?? ""}`}
          w={width}
          minW={width}
          maxW={width}
          justifyContent="flex-start"
          fontWeight="normal"
          fontSize={FOOD_FONT_SIZE}
          h="36px"
          borderRadius="lg"
          borderColor="border"
          bg="bg"
        >
          <Text truncate fontSize={FOOD_FONT_SIZE}>
            {label}
          </Text>
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content width="auto" maxH="280px" overflowY="auto" p="3">
            <VStack align="stretch" gap="1">
              {options.map((opt) => (
                <Checkbox.Root
                  key={opt.value}
                  checked={value.includes(opt.value)}
                  onCheckedChange={(e) => toggle(opt.value, !!e.checked)}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>
                    <Box fontSize={FOOD_FONT_SIZE}>{opt.label}</Box>
                  </Checkbox.Label>
                </Checkbox.Root>
              ))}
            </VStack>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
