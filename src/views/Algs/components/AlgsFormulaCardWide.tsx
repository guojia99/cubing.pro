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

const MAX_ALT = 3;
const ALT_FORMULA_FONT_OFFSET = 2;

interface AlgsFormulaCardWideProps {
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
  hideAltFormulas?: boolean;
  refreshVersion?: number;
  onOpenModal: () => void;
}

export default function AlgsFormulaCardWide({
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
  hideAltFormulas = false,
  refreshVersion = 0,
  onOpenModal,
}: AlgsFormulaCardWideProps) {
  const { locale } = useI18n();
  const storageKey = buildAlgsKey(cube, classId, setName, groupName, alg.name);
  const selection = getAlgsSelection(storageKey);

  const activeSource = selection?.source ?? "library";
  const selectedIdx = selection?.index ?? 0;
  const libraryFormulas = alg.algs;
  const customFormulas = useMemo(() => {
    void refreshVersion;
    return getCustomAlgs(storageKey);
  }, [storageKey, refreshVersion]);
  const formulas = activeSource === "custom" ? customFormulas : libraryFormulas;

  const displayScramble = useMemo(() => {
    const idx = activeSource === "library" ? selectedIdx : 0;
    return alg.scrambles?.[idx] ?? alg.scrambles?.[0] ?? "";
  }, [activeSource, alg.scrambles, selectedIdx]);

  const displayFormula = formulas[selectedIdx] ?? formulas[0] ?? "";

  const formulaRows = useMemo(() => {
    if (formulas.length === 0) return [];
    const safeIdx = Math.min(selectedIdx, formulas.length - 1);
    const selected = { text: formulas[safeIdx] ?? "", isSel: true };
    if (hideAltFormulas || formulas.length <= 1) return [selected];
    const alts = formulas
      .map((text, index) => ({ text, index }))
      .filter((r) => r.index !== safeIdx)
      .slice(0, MAX_ALT)
      .map((r) => ({ text: r.text, isSel: false }));
    return [selected, ...alts];
  }, [formulas, selectedIdx, hideAltFormulas]);

  const fontCss = getFormulaFontFamilyCSSValue(formulaFontFamily);
  const displayName = getAlgDisplayName(alg, locale);
  const diagramDims = getDiagramDimensions(diagramSize, "square");

  return (
    <Card.Root
      className={`algs-formula-card algs-formula-card--wide${hideFormulaDiagram ? " algs-formula-card--no-diagram" : ""}`}
      position="relative"
      variant="outline"
      borderRadius="lg"
      bg="bg.elevated"
      borderColor="border"
    >
      <Card.Body className="algs-formula-wide-body">
          <button
            type="button"
            onClick={onOpenModal}
            className="algs-formula-wide-preview"
            aria-label={displayName}
          >
            <Text className="algs-formula-card-title" title={displayName} fontSize="xs" fontWeight="semibold" color="accent">{displayName} <span aria-hidden="true">↗</span></Text>
            {!hideFormulaDiagram && (
              <Box className="algs-formula-card-diagram">
                <AlgsCubeDiagram
                  cube={cube}
                  classId={classId}
                  setName={setName}
                  groupName={groupName}
                  imageSvg={alg.image}
                  scramble={displayScramble}
                  formula={displayFormula}
                  useVisualCube={useVisualCube}
                  maxWidth={diagramDims.maxWidth}
                  maxHeight={diagramDims.maxHeight}
                />
              </Box>
            )}
          </button>

          <Box className="algs-formula-wide-formulas">
            {formulaRows.map((row, i) => (
              <Text
                key={row.isSel ? "selected" : `alt-${i}`}
                fontFamily={fontCss}
                className="algs-formula-card-formula"
                title={row.text}
                fontSize={`${row.isSel ? formulaFontSize : Math.max(8, formulaFontSize - ALT_FORMULA_FONT_OFFSET)}px`}
                lineHeight={1.45}
                fontWeight={row.isSel ? "semibold" : "normal"}
                color={row.isSel ? "accent" : "fg.muted"}
                overflowWrap="anywhere"
                whiteSpace="normal"
                userSelect="text"
              >
                <span>{row.text}</span>
              </Text>
            ))}
          </Box>
      </Card.Body>
    </Card.Root>
  );
}
