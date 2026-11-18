"use client";

import { Box, Field, Grid, NativeSelect, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { translatePuzzleExtra as extra } from "@/i18n/messages/puzzle-extra";
import {
  CUBE_COLORS,
  cubeFaceColors,
  normalizePuzzlePreferences,
  usePuzzlePreferences,
  writePuzzlePreferences,
  type CubeColor,
  type PuzzlePreferences,
} from "./preferences";

const FACES = [
  { face: "U", row: 1, column: 2 },
  { face: "D", row: 3, column: 2 },
  { face: "F", row: 2, column: 2 },
  { face: "B", row: 2, column: 4 },
  { face: "R", row: 2, column: 3 },
  { face: "L", row: 2, column: 1 },
] as const;

function adjacentFrontColors(bottom: CubeColor): CubeColor[] {
  return CUBE_COLORS.filter((front) => {
    const normalized = normalizePuzzlePreferences({ bottom, front, view: "auto" });
    return normalized.bottom === bottom && normalized.front === front;
  });
}

export default function PuzzlePreferencesPanel() {
  const { locale } = useI18n();
  const preferences = usePuzzlePreferences();
  const [saveFailed, setSaveFailed] = useState(false);
  const frontColors = adjacentFrontColors(preferences.bottom);
  const colors = cubeFaceColors(preferences);
  const colorLabel = (color: CubeColor) => extra(locale, `puzzleExtra.${color}`);

  function save(next: PuzzlePreferences) {
    setSaveFailed(!writePuzzlePreferences(next));
  }

  return (
    <Stack gap={3}>
      <Text fontSize="sm" fontWeight="semibold">
        {extra(locale, "puzzleExtra.colorsView")}
      </Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
        <Field.Root>
          <Field.Label fontSize="sm">{extra(locale, "puzzleExtra.bottom")}</Field.Label>
          <NativeSelect.Root width="100%">
            <NativeSelect.Field
              value={preferences.bottom}
              onChange={(event) => {
                const bottom = event.target.value as CubeColor;
                const adjacent = adjacentFrontColors(bottom);
                const front = adjacent.includes(preferences.front) ? preferences.front : adjacent[0];
                save({ ...preferences, bottom, front });
              }}
            >
              {CUBE_COLORS.map((color) => (
                <option key={color} value={color}>{colorLabel(color)}</option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root>
          <Field.Label fontSize="sm">{extra(locale, "puzzleExtra.front")}</Field.Label>
          <NativeSelect.Root width="100%">
            <NativeSelect.Field
              value={preferences.front}
              onChange={(event) => save({ ...preferences, front: event.target.value as CubeColor })}
            >
              {frontColors.map((color) => (
                <option key={color} value={color}>{colorLabel(color)}</option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root>
          <Field.Label fontSize="sm">{extra(locale, "puzzleExtra.defaultView")}</Field.Label>
          <NativeSelect.Root width="100%">
            <NativeSelect.Field
              value={preferences.view}
              onChange={(event) => save({ ...preferences, view: event.target.value as PuzzlePreferences["view"] })}
            >
              <option value="auto">{extra(locale, "puzzleExtra.auto")}</option>
              <option value="2D">2D</option>
              <option value="3D">3D</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
      </SimpleGrid>
      <Text fontSize="xs" color="fg.muted">
        {extra(locale, "puzzleExtra.colorHint")}
      </Text>
      <Box p={3} borderRadius="lg" borderWidth="1px" borderColor="border" bg="bg.muted">
        <Text fontSize="xs" color="fg.muted" mb={2}>
          {extra(locale, "puzzleExtra.colorPreview")}
        </Text>
        <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap={1} maxW="240px" mx="auto">
          {FACES.map(({ face, row, column }) => (
            <Box
              key={face}
              gridRow={row}
              gridColumn={column}
              aspectRatio={1}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={colors[face]}
              borderWidth="1px"
              borderColor="blackAlpha.500"
              borderRadius="sm"
            >
              <Text fontSize="xs" fontWeight="semibold" color="#ffffff" bg="#171717" px={1} borderRadius="sm">
                {face} {extra(locale, `puzzleExtra.face${face}`)}
              </Text>
            </Box>
          ))}
        </Grid>
        <Text fontSize="xs" color="fg.muted" mt={2}>
          {extra(locale, "puzzleExtra.colorSummary", { bottom: colorLabel(preferences.bottom), front: colorLabel(preferences.front) })}
        </Text>
      </Box>
      {saveFailed ? (
        <Text role="alert" fontSize="sm" color="fg.error">
          {extra(locale, "puzzleExtra.saveFailed")}
        </Text>
      ) : null}
    </Stack>
  );
}
