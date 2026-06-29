"use client";

import { Box, Card, Text, Flex } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import type { AlgItem } from "@/services/cubing-pro/algs/algs";
import { getCustomAlgs } from "@/services/cubing-pro/algs/customAlgs";
import { getAlgsSelection, buildAlgsKey, type AlgsSelectionValue } from "../utils/storage";
import { getFormulaFontFamilyCSSValue, type FormulaFontFamilyId } from "../utils/formulaFontFamily";
import { getAlgDisplayName } from "../utils/algDisplayName";
import { useI18n } from "@/contexts/I18nProvider";
import AlgsCubeDiagram from "./AlgsCubeDiagram";
import FormulaNameTag from "./FormulaNameTag";
import { SET_CARD_COLORS } from "../utils/constants";
import { getDiagramDimensions } from "../utils/diagramDisplay";

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
  onOpenModal: () => void;
}

export default function AlgsFormulaCardWide({
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
  hideAltFormulas = false,
  onOpenModal,
}: AlgsFormulaCardWideProps) {
  const { locale } = useI18n();
  const storageKey = buildAlgsKey(cube, classId, setName, groupName, alg.name);
  const [selection, setSelectionState] = useState<AlgsSelectionValue | null>(() =>
    getAlgsSelection(storageKey),
  );

  useEffect(() => {
    setSelectionState(getAlgsSelection(storageKey));
  }, [storageKey]);

  const activeSource = selection?.source ?? "library";
  const selectedIdx = selection?.index ?? 0;
  const libraryFormulas = alg.algs;
  const customFormulas = useMemo(() => getCustomAlgs(storageKey), [storageKey]);
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

  const colors = SET_CARD_COLORS[setColorIndex % SET_CARD_COLORS.length];
  const fontCss = getFormulaFontFamilyCSSValue(formulaFontFamily);
  const displayName = getAlgDisplayName(alg, locale);
  const diagramDims = getDiagramDimensions(diagramSize, "wide");

  return (
    <Card.Root
      position="relative"
      variant="outline"
      borderRadius="xl"
      bg={colors.bg}
      borderColor={colors.border}
    >
      <FormulaNameTag name={displayName} />
      <Card.Body pt={10} px={3} pb={3}>
        <Flex align="stretch" gap={4} minW={0}>
          <button
            type="button"
            onClick={onOpenModal}
            style={{
              flex: hideFormulaDiagram ? "0 0 auto" : "0 0 33%",
              maxWidth: hideFormulaDiagram ? "28%" : "33%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              textAlign: "center",
              padding: 0,
              minWidth: 0,
            }}
          >
            {!hideFormulaDiagram && (
              <Box w="100%">
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

          <Flex flex={1} minW={0} direction="column" justify="center" gap={1.5}>
            {formulaRows.map((row, i) => (
              <Text
                key={row.isSel ? "selected" : `alt-${i}`}
                fontFamily={fontCss}
                fontSize={`${row.isSel ? formulaFontSize : Math.max(8, formulaFontSize - ALT_FORMULA_FONT_OFFSET)}px`}
                lineHeight={1.45}
                fontWeight={row.isSel ? "semibold" : "normal"}
                color={row.isSel ? "accent" : "fg.muted"}
                wordBreak="break-all"
                whiteSpace="normal"
                userSelect="text"
              >
                {row.text}
              </Text>
            ))}
          </Flex>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
