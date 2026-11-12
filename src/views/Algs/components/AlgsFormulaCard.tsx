"use client";

import { Box, Card, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import type { AlgItem } from "@/services/cubing-pro/algs/algs";
import { getCustomAlgs } from "@/services/cubing-pro/algs/customAlgs";
import { getAlgsSelection, buildAlgsKey } from "../utils/storage";
import { getFormulaFontFamilyCSSValue, type FormulaFontFamilyId } from "../utils/formulaFontFamily";
import { getAlgDisplayName } from "../utils/algDisplayName";
import { useI18n } from "@/contexts/I18nProvider";
import AlgsCubeDiagram from "./AlgsCubeDiagram";
import { getDiagramDimensions } from "../utils/diagramDisplay";
import "../styles/algsDetail.css";

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
  refreshVersion?: number;
  onClick: () => void;
}

export default function AlgsFormulaCard({
  cube,
  classId,
  setName,
  groupName,
  alg,
  formulaFontSize = 14,
  formulaFontFamily,
  useVisualCube = true,
  diagramSize = 160,
  hideFormulaDiagram = false,
  refreshVersion = 0,
  onClick,
}: AlgsFormulaCardProps) {
  const { locale } = useI18n();
  const storageKey = buildAlgsKey(cube, classId, setName, groupName, alg.name);
  const selection = getAlgsSelection(storageKey);
  const customFormulas = useMemo(() => {
    void refreshVersion;
    return getCustomAlgs(storageKey);
  }, [storageKey, refreshVersion]);

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

  const fontCss = getFormulaFontFamilyCSSValue(formulaFontFamily);
  const diagramDims = getDiagramDimensions(diagramSize, "square");
  const displayName = getAlgDisplayName(alg, locale);

  return (
    <Card.Root
      as="button"
      className={`algs-formula-card algs-formula-card--tile${hideFormulaDiagram ? " algs-formula-card--no-diagram" : ""}`}
      aria-label={displayName}
      position="relative"
      cursor="pointer"
      onClick={onClick}
      variant="outline"
      borderRadius="lg"
      bg="bg.elevated"
      borderColor="border"
      transition="border-color 0.15s, background-color 0.15s"
      _hover={{
        borderColor: "accent",
        bg: "algs.card.bg",
      }}
    >
      <Text className="algs-formula-card-title" title={displayName} fontSize="xs" fontWeight="semibold" color="accent">{displayName}</Text>
      <Card.Body className="algs-formula-card-body">
        {!hideFormulaDiagram && (
          <Box className="algs-formula-card-diagram">
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
          <Box
            fontFamily={fontCss}
            className="algs-formula-card-formula"
            title={displayAlg}
            fontSize={`${formulaFontSize}px`}
            lineHeight={1.4}
            color="fg"
          >
            <span>{displayAlg}</span>
          </Box>
      </Card.Body>
    </Card.Root>
  );
}
