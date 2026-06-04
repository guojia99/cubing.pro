"use client";

import { Box, Card, Text, Flex } from "@chakra-ui/react";
import { useMemo } from "react";
import type { AlgItem } from "@/services/cubing-pro/algs/algs";
import { getCustomAlgs } from "@/services/cubing-pro/algs/customAlgs";
import { getAlgsSelection, buildAlgsKey } from "../utils/storage";
import { getFormulaFontFamilyCSSValue, type FormulaFontFamilyId } from "../utils/formulaFontFamily";
import { getAlgDisplayName } from "../utils/algDisplayName";
import { useI18n } from "@/contexts/I18nProvider";
import AlgsCubeDiagram from "./AlgsCubeDiagram";
import FormulaNameTag from "./FormulaNameTag";
import { SET_CARD_COLORS } from "../utils/constants";
import { getDiagramDimensions } from "../utils/diagramDisplay";

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
  diagramSize?: number;
  hideFormulaDiagram?: boolean;
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
  diagramSize = 160,
  hideFormulaDiagram = false,
  onClick,
}: AlgsFormulaCardProps) {
  const { locale } = useI18n();
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
  const diagramDims = getDiagramDimensions(diagramSize, "square");
  const displayName = getAlgDisplayName(alg, locale);

  return (
    <Card.Root
      position="relative"
      cursor="pointer"
      onClick={onClick}
      variant="outline"
      borderRadius="xl"
      bg={colors.bg}
      borderColor={colors.border}
      minH={hideFormulaDiagram ? "120px" : "200px"}
      transition="all 0.2s"
      _hover={{
        transform: "translateY(-3px)",
        boxShadow: "lg",
        borderColor: colors.accent,
      }}
      css={{ animation: "algsFloat 10s ease-in-out infinite" }}
    >
      <FormulaNameTag name={displayName} />
      <Card.Body
        pt={10}
        px={3}
        pb={3}
        display="flex"
        flexDirection="column"
        alignItems="center"
        minW={0}
      >
        {!hideFormulaDiagram && (
          <Box mb={3} w="100%" maxW={`${diagramDims.maxWidth}px`}>
            <AlgsCubeDiagram
              cube={cube}
              classId={classId}
              setName={setName}
              groupName={groupName}
              imageSvg={alg.image}
              scramble={displayScramble}
              formula={displayAlg}
              useVisualCube={useVisualCube}
              maxWidth={diagramDims.maxWidth}
              maxHeight={diagramDims.maxHeight}
            />
          </Box>
        )}
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
