"use client";

import { Box, Button, Grid, Text } from "@chakra-ui/react";

import { useI18n } from "@/contexts/I18nProvider";
import {
  PALETTES,
  type Palette,
} from "@/lib/websiteUiConfig";

type Props = {
  value: Palette;
  onChange: (palette: Palette) => void;
  columns?: number;
};

export function PalettePicker({ value, onChange, columns = 3 }: Props) {
  const { t } = useI18n();

  return (
    <Grid templateColumns={`repeat(${columns}, 1fr)`} gap="3">
      {PALETTES.map((p) => {
        const selected = value === p.id;
        return (
          <Button
            key={p.id}
            variant="ghost"
            h="auto"
            p="0"
            minW="0"
            onClick={() => onChange(p.id)}
            borderWidth="2px"
            borderColor={selected ? "accent" : "border"}
            borderRadius="md"
            overflow="hidden"
            bg="bg.elevated"
            _hover={{ borderColor: selected ? "accent" : "border.strong" }}
            aria-pressed={selected}
            aria-label={t(p.labelKey)}
          >
            <Box w="full">
              <Box display="flex" h="10">
                <Box flex="1" bg={p.preview.accent} />
                <Box
                  flex="1"
                  bg={p.preview.muted}
                  borderLeftWidth="1px"
                  borderColor="color-mix(in srgb, var(--foreground) 12%, transparent)"
                />
                <Box
                  flex="1"
                  bg={p.preview.foreground}
                  borderLeftWidth="1px"
                  borderColor="color-mix(in srgb, var(--foreground) 12%, transparent)"
                />
              </Box>
              <Text
                fontSize="xs"
                py="1.5"
                px="2"
                textAlign="center"
                color={selected ? "accent" : "fg.muted"}
                fontWeight={selected ? "semibold" : "normal"}
              >
                {t(p.labelKey)}
              </Text>
            </Box>
          </Button>
        );
      })}
    </Grid>
  );
}
