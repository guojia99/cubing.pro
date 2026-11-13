"use client";

import { Box, Field, Grid, NativeSelect, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import {
  CUBE_COLORS,
  cubeFaceColors,
  normalizePuzzlePreferences,
  usePuzzlePreferences,
  writePuzzlePreferences,
  type CubeColor,
  type PuzzlePreferences,
} from "./preferences";

const COLOR_LABELS: Record<CubeColor, readonly [string, string]> = {
  white: ["白色", "White"],
  yellow: ["黄色", "Yellow"],
  red: ["红色", "Red"],
  orange: ["橙色", "Orange"],
  green: ["绿色", "Green"],
  blue: ["蓝色", "Blue"],
};

const FACES = [
  { face: "U", row: 1, column: 2, zh: "上", en: "Up" },
  { face: "D", row: 3, column: 2, zh: "底", en: "Down" },
  { face: "F", row: 2, column: 2, zh: "前", en: "Front" },
  { face: "B", row: 2, column: 4, zh: "后", en: "Back" },
  { face: "R", row: 2, column: 3, zh: "右", en: "Right" },
  { face: "L", row: 2, column: 1, zh: "左", en: "Left" },
] as const;

function adjacentFrontColors(bottom: CubeColor): CubeColor[] {
  return CUBE_COLORS.filter((front) => {
    const normalized = normalizePuzzlePreferences({ bottom, front, view: "auto" });
    return normalized.bottom === bottom && normalized.front === front;
  });
}

export default function PuzzlePreferencesPanel() {
  const { locale } = useI18n();
  const zh = locale === "zh-CN";
  const preferences = usePuzzlePreferences();
  const [saveFailed, setSaveFailed] = useState(false);
  const frontColors = adjacentFrontColors(preferences.bottom);
  const colors = cubeFaceColors(preferences);
  const colorLabel = (color: CubeColor) => COLOR_LABELS[color][zh ? 0 : 1];

  function save(next: PuzzlePreferences) {
    setSaveFailed(!writePuzzlePreferences(next));
  }

  return (
    <Stack gap={3}>
      <Text fontSize="sm" fontWeight="semibold">
        {zh ? "魔方配色与视图" : "Puzzle colors and view"}
      </Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
        <Field.Root>
          <Field.Label fontSize="sm">{zh ? "底色" : "Bottom color"}</Field.Label>
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
          <Field.Label fontSize="sm">{zh ? "前色" : "Front color"}</Field.Label>
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
          <Field.Label fontSize="sm">{zh ? "默认视图" : "Default view"}</Field.Label>
          <NativeSelect.Root width="100%">
            <NativeSelect.Field
              value={preferences.view}
              onChange={(event) => save({ ...preferences, view: event.target.value as PuzzlePreferences["view"] })}
            >
              <option value="auto">{zh ? "自动" : "Auto"}</option>
              <option value="2D">2D</option>
              <option value="3D">3D</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
      </SimpleGrid>
      <Text fontSize="xs" color="fg.muted">
        {zh
          ? "底色与前色必须相邻；更换底色时，如原前色不再相邻，将自动选取相邻色。自动视图按图示场景选择 2D 或 3D。修改后自动保存并在当前页面同步。"
          : "Bottom and front must be adjacent. Changing the bottom also adjusts an incompatible front. Auto selects 2D or 3D for the diagram context. Changes save automatically and sync across this page."}
      </Text>
      <Box p={3} borderRadius="lg" borderWidth="1px" borderColor="border" bg="bg.muted">
        <Text fontSize="xs" color="fg.muted" mb={2}>
          {zh ? "六面配色预览（展开图）" : "Six-face color preview (cube net)"}
        </Text>
        <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap={1} maxW="240px" mx="auto">
          {FACES.map(({ face, row, column, zh: faceZh, en }) => (
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
                {face} {zh ? faceZh : en}
              </Text>
            </Box>
          ))}
        </Grid>
        <Text fontSize="xs" color="fg.muted" mt={2}>
          {zh
            ? `底色 ${colorLabel(preferences.bottom)}，前色 ${colorLabel(preferences.front)}；其余四面按标准实物色序旋转推导，配色不随浅色或深色主题改变。此展开图仅预览配色。`
            : `Bottom ${colorLabel(preferences.bottom)}, front ${colorLabel(preferences.front)}. The other faces follow the physical cube's color order, independently of light or dark theme. This net previews colors only.`}
        </Text>
      </Box>
      {saveFailed ? (
        <Text role="alert" fontSize="sm" color="fg.error">
          {zh ? "保存失败，偏好未保存。请检查浏览器存储权限或空间后重试。" : "Save failed. Preferences were not saved. Check browser storage permissions or available space and try again."}
        </Text>
      ) : null}
    </Stack>
  );
}
