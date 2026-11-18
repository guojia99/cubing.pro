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
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";

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
  const { locale } = useI18n();
  const label = useMemo(() => {
    const sc = getSiteContent(locale);
    if (value.length === 0) return placeholder;
    if (value.length <= 2) {
      return options
        .filter((o) => value.includes(o.value))
        .map((o) => o.label)
        .join(sc("siteContent.separator"));
    }
    return sc("siteContent.selected", { count: value.length });
  }, [value, options, placeholder, locale]);

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
          minW="0"
          maxW={width}
          justifyContent="flex-start"
          fontWeight="normal"
          fontSize={FOOD_FONT_SIZE}
          h="44px"
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
          <Popover.Content width="auto" minW="min(260px, calc(100vw - 2rem))" maxW="calc(100vw - 2rem)" maxH="min(360px, 60dvh)" overflowY="auto" p="4" borderRadius="var(--radius-card)" boxShadow="var(--shadow-float)">
            <VStack align="stretch" gap="1">
              {options.map((opt) => (
                <Checkbox.Root
                  key={opt.value}
                  checked={value.includes(opt.value)}
                  colorPalette="brand"
                  minH="10"
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
