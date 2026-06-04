"use client";

import { Box, Card, Text, Flex } from "@chakra-ui/react";
import { useMemo } from "react";
import type { AlgItem } from "@/services/cubing-pro/algs/algs";
import { getCustomAlgs } from "@/services/cubing-pro/algs/customAlgs";
import { getAlgsSelection, buildAlgsKey } from "../utils/storage";
import { getFormulaFontFamilyCSSValue, type FormulaFontFamilyId } from "../utils/formulaFontFamily";
import AlgsCubeDiagram from "./AlgsCubeDiagram";
import { SET_CARD_COLORS } from "../utils/constants";

interface AlgsFormulaCardProps {
  cube: string;
  classId: string;
  setName: string;
  groupName: string;
  alg: AlgItem;
  setColorIndex?: number;
  formulaFontSize?: number;
  formulaFontFamily?: FormulaFontFamilyId;
  useVisualCube?: boolean;
  onClick: () => void;
}

export default function AlgsFormulaCard({
  cube,
  classId,
  setName,
  groupName,
  alg,
  setColorIndex = 0,
  formulaFontSize = 14,
  formulaFontFamily,
  useVisualCube = true,
  onClick,
}: AlgsFormulaCardProps) {
  const storageKey = buildAlgsKey(cube, classId, setName, groupName, alg.name);
  const selection = getAlgsSelection(storageKey);
  const customFormulas = useMemo(() => getCustomAlgs(storageKey), [storageKey]);

  const displayAlg = useMemo(() => {
    if (selection?.source === "custom") {
      return customFormulas[selection.index] ?? customFormulas[0] ?? "";
    }
    return alg.algs[selection?.index ?? 0] ?? alg.algs[0] ?? "";
  }, [selection, customFormulas, alg.algs]);

  const displayScramble = useMemo(() => {
    const idx = selection?.source === "library" ? (selection.index ?? 0) : 0;
    return alg.scrambles?.[idx] ?? alg.scrambles?.[0] ?? "";
  }, [selection, alg.scrambles]);

  const colors = SET_CARD_COLORS[setColorIndex % SET_CARD_COLORS.length];
  const fontCss = getFormulaFontFamilyCSSValue(formulaFontFamily);

  return (
    <Card.Root
      cursor="pointer"
      onClick={onClick}
      variant="outline"
      borderRadius="xl"
      bg={colors.bg}
      borderColor={colors.border}
      minH="200px"
      transition="all 0.2s"
      _hover={{
        transform: "translateY(-3px)",
        boxShadow: "lg",
        borderColor: colors.accent,
      }}
      css={{ animation: "algsFloat 10s ease-in-out infinite" }}
    >
      <Card.Body p={3} display="flex" flexDirection="column" alignItems="center" minW={0}>
        <Box mt={2} mb={3} w="100%" maxW="160px">
          <AlgsCubeDiagram
            cube={cube}
            classId={classId}
            setName={setName}
            groupName={groupName}
            imageSvg={alg.image}
            scramble={displayScramble}
            formula={displayAlg}
            useVisualCube={useVisualCube}
            maxWidth={160}
            maxHeight={160}
          />
        </Box>
        <Text fontWeight="bold" fontSize="sm" color="fg" mb={2} textAlign="center" lineClamp={1}>
          {alg.name}
        </Text>
        <Flex flex={1} alignItems="flex-end" justifyContent="center" w="100%">
          <Box
            fontFamily={fontCss}
            fontSize={`${formulaFontSize}px`}
            lineHeight={1.4}
            color="fg"
            bg="bg.muted"
            borderRadius="md"
            px={2}
            py={1}
            borderWidth="1px"
            borderColor="border"
            wordBreak="break-all"
            lineClamp={4}
            maxW="100%"
          >
            {displayAlg}
          </Box>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
