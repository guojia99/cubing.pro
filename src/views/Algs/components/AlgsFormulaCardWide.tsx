"use client";

import { Box, Card, Text, Flex } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AlgItem } from "@/services/cubing-pro/algs/algs";
import { getCustomAlgs } from "@/services/cubing-pro/algs/customAlgs";
import { getAlgsSelection, setAlgsSelection, buildAlgsKey, type AlgsSelectionValue } from "../utils/storage";
import { getFormulaFontFamilyCSSValue, type FormulaFontFamilyId } from "../utils/formulaFontFamily";
import AlgsCubeDiagram from "./AlgsCubeDiagram";
import { SET_CARD_COLORS } from "../utils/constants";

const MAX_ALT = 3;

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
  hideAltFormulas = false,
  onOpenModal,
}: AlgsFormulaCardWideProps) {
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
    const selected = { text: formulas[safeIdx] ?? "", index: safeIdx, isSel: true };
    if (hideAltFormulas || formulas.length <= 1) return [selected];
    const alts = formulas
      .map((text, index) => ({ text, index }))
      .filter((r) => r.index !== safeIdx)
      .slice(0, MAX_ALT)
      .map((r) => ({ ...r, isSel: false }));
    return [selected, ...alts];
  }, [formulas, selectedIdx, hideAltFormulas]);

  const updateSelection = useCallback(
    (source: "library" | "custom", index: number) => {
      const val: AlgsSelectionValue = { source, index };
      setAlgsSelection(storageKey, val);
      setSelectionState(val);
    },
    [storageKey],
  );

  const colors = SET_CARD_COLORS[setColorIndex % SET_CARD_COLORS.length];
  const fontCss = getFormulaFontFamilyCSSValue(formulaFontFamily);

  return (
    <Card.Root
      variant="outline"
      borderRadius="xl"
      bg={colors.bg}
      borderColor={colors.border}
    >
      <Card.Body p={3}>
        <Flex align="stretch" gap={4} minW={0}>
          <button
            type="button"
            style={{
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              minWidth: 120,
              maxWidth: 200,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              textAlign: "center",
              padding: 0,
              font: "inherit",
            }}
            onClick={onOpenModal}
          >
            <Box w="100%" maxW="180px">
              <AlgsCubeDiagram
                cube={cube}
                classId={classId}
                setName={setName}
                groupName={groupName}
                imageSvg={alg.image}
                scramble={displayScramble}
                formula={displayFormula}
                useVisualCube={useVisualCube}
                maxWidth={180}
                maxHeight={200}
              />
            </Box>
            <Text className="wide-name" fontWeight="bold" fontSize="md" color="fg" lineClamp={1}>
              {alg.name}
            </Text>
          </button>

          <Flex flex={1} minW={0} direction="column" justify="center" gap={2}>
            {formulaRows.map((row) => (
              <button
                key={`${activeSource}-${row.index}`}
                type="button"
                style={{
                  width: "100%",
                  margin: 0,
                  padding: 8,
                  border: "none",
                  borderRadius: 6,
                  background: row.isSel ? "var(--chakra-colors-bg-muted)" : "transparent",
                  color: row.isSel ? "var(--chakra-colors-fg)" : "var(--chakra-colors-fg-muted)",
                  fontWeight: row.isSel ? "bold" : "normal",
                  fontSize: `${formulaFontSize}px`,
                  fontFamily: fontCss,
                  lineHeight: 1.45,
                  textAlign: "left",
                  wordBreak: "break-all",
                  whiteSpace: "normal",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onClick={() => updateSelection(activeSource, row.index)}
                onMouseEnter={(e) => { (e.currentTarget.style.background = "var(--chakra-colors-bg-muted)"); }}
                onMouseLeave={(e) => { (e.currentTarget.style.background = row.isSel ? "var(--chakra-colors-bg-muted)" : "transparent"); }}
              >
                {row.text}
              </button>
            ))}
          </Flex>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
