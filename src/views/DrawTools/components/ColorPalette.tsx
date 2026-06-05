"use client";

import {
  Box,
  Button,
  Flex,
  Input,
  Popover,
  Portal,
  Separator,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";

export interface ColorPaletteProps {
  selectedColor?: string;
  onSelectedColorChange: (color: string) => void;
  onSelectColor: (key: string, color: string) => void;
  presetColors?: string[];
  storageKey?: string;
  allKeys?: string[];
}

export function ColorPalette({
  selectedColor,
  onSelectedColorChange,
  onSelectColor,
  presetColors = [],
  storageKey = "color-history",
  allKeys = [],
}: ColorPaletteProps) {
  const { t } = useI18n();
  const [historyColors, setHistoryColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState("#3366ff");

  const resetColors = useCallback(() => {
    for (let i = 0; i < allKeys.length; i++) {
      if (allKeys[i].includes("fonts")) {
        onSelectColor(allKeys[i], "#000");
      } else {
        onSelectColor(allKeys[i], "#777");
      }
    }
  }, [allKeys, onSelectColor]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
      setHistoryColors(Array.isArray(stored) ? stored : []);
    } catch {
      setHistoryColors([]);
    }
    resetColors();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- match legacy mount init
  }, []);

  const applyCustomColor = () => {
    onSelectedColorChange(customColor);
    const updated = [customColor, ...historyColors.filter((c) => c !== customColor)].slice(
      0,
      14,
    );
    setHistoryColors(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      /* ignore quota */
    }
  };

  const renderColorBlock = (color: string) => {
    const isTransparent = color === "#00000000";
    const isSelected = selectedColor === color;

    return (
      <Box
        key={color}
        w="8"
        h="8"
        borderRadius="md"
        borderWidth="2px"
        borderColor={isSelected ? "fg" : "border"}
        bg={isTransparent ? "transparent" : color}
        cursor="pointer"
        display="flex"
        alignItems="center"
        justifyContent="center"
        backgroundImage={
          isTransparent
            ? "linear-gradient(45deg, var(--chakra-colors-border) 25%, transparent 25%, transparent 75%, var(--chakra-colors-border) 75%, var(--chakra-colors-border)), linear-gradient(45deg, var(--chakra-colors-border) 25%, transparent 25%, transparent 75%, var(--chakra-colors-border) 75%, var(--chakra-colors-border))"
            : undefined
        }
        backgroundSize="8px 8px"
        backgroundPosition="0 0, 4px 4px"
        onClick={() => onSelectedColorChange(color)}
        aria-label={color}
        role="button"
      >
        {isSelected ? (
          <Box color={isTransparent ? "fg" : "white"} lineHeight={0}>
            <svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="currentColor" aria-hidden>
              <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
            </svg>
          </Box>
        ) : null}
      </Box>
    );
  };

  return (
    <Flex direction="column" gap="3">
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap="1.5">
        {presetColors.map(renderColorBlock)}
      </Box>

      <Separator borderColor="border" />

      <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
        {t("draws.color.custom_color")}
      </Text>

      {historyColors.length > 0 ? (
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap="1.5">
          {historyColors.map(renderColorBlock)}
        </Box>
      ) : null}

      <Popover.Root>
        <Popover.Trigger asChild>
          <Button size="sm" variant="outline">
            {t("draws.color.select_custom_color")}
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content p="3" w="auto">
              <Flex direction="column" gap="2">
                <Input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  p="0"
                  h="10"
                  cursor="pointer"
                />
                <Button size="sm" onClick={applyCustomColor}>
                  {t("draws.color.select_color")}
                </Button>
              </Flex>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>

      <Separator borderColor="border" />

      <Button size="sm" variant="outline" onClick={resetColors}>
        {t("draws.color.reset_color")}
      </Button>
    </Flex>
  );
}
