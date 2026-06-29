"use client";

import {
  Box,
  Button,
  CloseButton,
  Dialog,
  HStack,
  IconButton,
  Input,
  SegmentGroup,

  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { useReleaseOverlayOnUnmount } from "@/lib/overlayCleanup";
import type { AlgItem } from "@/services/cubing-pro/algs/algs";
import {
  getCustomAlgs,
  saveCustomAlgs,
} from "@/services/cubing-pro/algs/customAlgs";
import {
  getFormulaProficiency,
  setFormulaProficiency,
  DEFAULT_PROFICIENCY,
  type ProficiencyLevel,
} from "@/services/cubing-pro/algs/formulaPracticeProficiency";
import { buildFormulaKey } from "@/services/cubing-pro/algs/formulaPracticeSelection";

import AlgsCubeDiagram from "./AlgsCubeDiagram";
import ProficiencySelect from "./ProficiencySelect";
import {
  buildAlgsKey,
  getAlgsSelection,
  setAlgsSelection,
  type AlgsSelectionValue,
} from "../utils/storage";
import {
  getFormulaFontFamilyCSSValue,
  type FormulaFontFamilyId,
} from "../utils/formulaFontFamily";
import { getAlgDisplayName } from "../utils/algDisplayName";
import { getDiagramDimensions } from "../utils/diagramDisplay";
import "./algsModal.css";

interface AlgsModalItem {
  alg: AlgItem;
  setName: string;
  groupName: string;
}

interface AlgsModalProps {
  open: boolean;
  onClose: () => void;
  cube: string;
  classId: string;
  items: AlgsModalItem[];
  currentIndex: number;
  onNavigate?: (index: number) => void;
  useVisualCube?: boolean;
  formulaFontFamily?: FormulaFontFamilyId;
  diagramSize?: number;
  hideFormulaDiagram?: boolean;
}

export default function AlgsModal({
  open,
  onClose,
  cube,
  classId,
  items,
  currentIndex,
  onNavigate,
  useVisualCube = true,
  formulaFontFamily,
  diagramSize = 180,
  hideFormulaDiagram = false,
}: AlgsModalProps) {
  const { t, locale } = useI18n();

  const item = items[currentIndex];
  const alg = item?.alg;
  const setName = item?.setName ?? "";
  const groupName = item?.groupName ?? "";

  const storageKey = useMemo(
    () =>
      alg ? buildAlgsKey(cube, classId, setName, groupName, alg.name) : "",
    [cube, classId, setName, groupName, alg],
  );

  const formulaKey = useMemo(
    () => (alg ? buildFormulaKey(setName, groupName, alg.name) : ""),
    [setName, groupName, alg],
  );

  const [tab, setTab] = useState<"library" | "custom">("library");
  const [selection, setSelection] = useState<AlgsSelectionValue | null>(null);
  const [customFormulas, setCustomFormulas] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [proficiency, setProficiencyState] = useState<ProficiencyLevel>(DEFAULT_PROFICIENCY);

  const loadState = useCallback(() => {
    if (!storageKey) return;
    const sel = getAlgsSelection(storageKey);
    setSelection(sel);
    if (sel?.source === "custom") {
      setTab("custom");
    } else {
      setTab("library");
    }
    setCustomFormulas(getCustomAlgs(storageKey));
    if (formulaKey) {
      const map = getFormulaProficiency(cube, classId);
      setProficiencyState(map[formulaKey] ?? 0);
    }
  }, [storageKey, formulaKey, cube, classId]);

  useEffect(() => {
    if (open && storageKey) {
      loadState();
    }
  }, [open, storageKey, loadState]);

  useReleaseOverlayOnUnmount();

  const libraryFormulas = useMemo(() => alg?.algs ?? [], [alg]);
  const scrambleList = useMemo(() => alg?.scrambles ?? [], [alg]);

  const activeFormulas = tab === "library" ? libraryFormulas : customFormulas;

  const displayFormula = useMemo(() => {
    if (tab === "custom") {
      if (selection?.source === "custom") {
        return customFormulas[selection.index] ?? customFormulas[0] ?? "";
      }
      return customFormulas[0] ?? "";
    }
    if (selection?.source === "library" || !selection) {
      return libraryFormulas[selection?.index ?? 0] ?? libraryFormulas[0] ?? "";
    }
    return libraryFormulas[0] ?? "";
  }, [tab, selection, libraryFormulas, customFormulas]);

  const displayScramble = useMemo(() => {
    const idx =
      tab === "library" && selection?.source === "library"
        ? selection.index
        : 0;
    return scrambleList[idx] ?? scrambleList[0] ?? "";
  }, [tab, selection, scrambleList]);

  const handleSelectFormula = useCallback(
    (index: number) => {
      if (!storageKey) return;
      const value: AlgsSelectionValue = { source: tab, index };
      setAlgsSelection(storageKey, value);
      setSelection(value);
    },
    [storageKey, tab],
  );

  const handleAddCustom = useCallback(() => {
    const trimmed = customInput.trim();
    if (!trimmed || !storageKey) return;
    const updated = [...customFormulas, trimmed];
    saveCustomAlgs(storageKey, updated);
    setCustomFormulas(updated);
    const newSel: AlgsSelectionValue = {
      source: "custom",
      index: updated.length - 1,
    };
    setAlgsSelection(storageKey, newSel);
    setSelection(newSel);
    setCustomInput("");
  }, [customInput, customFormulas, storageKey]);

  const handleRemoveCustom = useCallback(
    (index: number) => {
      if (!storageKey) return;
      const updated = [...customFormulas];
      updated.splice(index, 1);
      saveCustomAlgs(storageKey, updated);
      setCustomFormulas(updated);
      if (selection?.source === "custom") {
        if (updated.length === 0) {
          const fallback: AlgsSelectionValue = { source: "library", index: 0 };
          setAlgsSelection(storageKey, fallback);
          setSelection(fallback);
          setTab("library");
        } else if (selection.index >= updated.length) {
          const newSel: AlgsSelectionValue = {
            source: "custom",
            index: updated.length - 1,
          };
          setAlgsSelection(storageKey, newSel);
          setSelection(newSel);
        }
      }
    },
    [storageKey, customFormulas, selection],
  );

  const handleProficiencyChange = useCallback(
    (level: ProficiencyLevel) => {
      if (!formulaKey) return;
      setFormulaProficiency(cube, classId, formulaKey, level);
      setProficiencyState(level);
    },
    [cube, classId, formulaKey],
  );

  const handlePrev = useCallback(() => {
    if (onNavigate && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [onNavigate, currentIndex]);

  const handleNext = useCallback(() => {
    if (onNavigate && currentIndex < items.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [onNavigate, currentIndex, items.length]);

  const fontCss = getFormulaFontFamilyCSSValue(formulaFontFamily);
  const diagramDims = getDiagramDimensions(diagramSize, "square");

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      size="md"
      placement="center"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          className="algs-formula-detail-modal"
          borderRadius="2xl"
          maxH="1080px"
          maxW="700px"
          w="full"
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Dialog.Header
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottomWidth="1px"
            borderColor="border"
            px={4}
            py={3}
          >
            <Dialog.Title fontSize="md" fontWeight="bold" truncate>
              {alg ? getAlgDisplayName(alg, locale) : ""}
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body
            className="algs-formula-detail-modal__body"
            px={4}
            py={4}
            flex="1"
            minH={0}
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            {!alg ? null : (
              <VStack gap={4} align="stretch" flex="1" minH={0}>
                {!hideFormulaDiagram && (
                  <Box flexShrink={0} display="flex" justifyContent="center">
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

                {displayScramble && (
                  <Box
                    flexShrink={0}
                    bg="bg.muted"
                    borderRadius="lg"
                    px={3}
                    py={2}
                    borderWidth="1px"
                    borderColor="border"
                  >
                    <Text fontSize="xs" color="fg.muted" mb={1}>
                      Scramble
                    </Text>
                    <Text
                      fontSize="sm"
                      fontFamily="mono"
                      wordBreak="break-all"
                      lineHeight={1.5}
                    >
                      {displayScramble}
                    </Text>
                  </Box>
                )}

                <Box flexShrink={0}>
                <SegmentGroup.Root
                  value={tab}
                  onValueChange={(e) => {
                    const v = e.value as "library" | "custom";
                    setTab(v);
                    if (v === "library") {
                      handleSelectFormula(
                        selection?.source === "library"
                          ? selection.index
                          : 0,
                      );
                    } else if (customFormulas.length > 0) {
                      handleSelectFormula(
                        selection?.source === "custom"
                          ? Math.min(selection.index, customFormulas.length - 1)
                          : 0,
                      );
                    }
                  }}
                  size="sm"
                  display="flex"
                  width="full"
                  p="1"
                  gap="0"
                  bg="segment.track"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="border"
                >
                  <SegmentGroup.Indicator
                    bg="segment.indicator"
                    borderRadius="md"
                    boxShadow="sm"
                  />
                  <SegmentGroup.Item
                    value="library"
                    flex="1"
                    justifyContent="center"
                    cursor="pointer"
                    borderRadius="md"
                    px={4}
                    py={1.5}
                    fontSize="sm"
                    fontWeight="medium"
                    color="segment.fg"
                    transition="color 0.15s"
                    _checked={{ color: "segment.fg.selected" }}
                  >
                    <SegmentGroup.ItemText>
                      {t("algs.modal.library")}
                    </SegmentGroup.ItemText>
                    <SegmentGroup.ItemHiddenInput />
                  </SegmentGroup.Item>
                  <SegmentGroup.Item
                    value="custom"
                    flex="1"
                    justifyContent="center"
                    cursor="pointer"
                    borderRadius="md"
                    px={4}
                    py={1.5}
                    fontSize="sm"
                    fontWeight="medium"
                    color="segment.fg"
                    transition="color 0.15s"
                    _checked={{ color: "segment.fg.selected" }}
                  >
                    <SegmentGroup.ItemText>
                      {t("algs.custom")}
                    </SegmentGroup.ItemText>
                    <SegmentGroup.ItemHiddenInput />
                  </SegmentGroup.Item>
                </SegmentGroup.Root>
                </Box>

                {tab === "custom" && (
                  <HStack gap={2} flexShrink={0}>
                    <Input
                      placeholder="R U R' U'"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddCustom();
                      }}
                      size="sm"
                      flex={1}
                    />
                    <Button
                      size="sm"
                      colorPalette="brand"
                      onClick={handleAddCustom}
                      disabled={!customInput.trim()}
                    >
                      {t("algs.custom.add")}
                    </Button>
                  </HStack>
                )}

                <Box
                  flex="1"
                  minH={0}
                  overflowY="auto"
                  pr={1}
                  className="algs-formula-detail-modal__list"
                >
                <VStack gap={1.5} align="stretch">
                  {activeFormulas.length === 0 && (
                    <Text fontSize="sm" color="fg.muted" textAlign="center" py={3}>
                      {tab === "custom"
                        ? t("algs.noData")
                        : t("algs.noData")}
                    </Text>
                  )}
                  {activeFormulas.map((formula, idx) => {
                    const isActive =
                      selection?.source === tab && selection.index === idx;
                    return (
                      <HStack
                        key={`${tab}-${idx}`}
                        gap={2}
                        px={3}
                        py={2}
                        borderRadius="lg"
                        borderWidth="1.5px"
                        borderColor={
                          isActive ? "formula.selected.border" : "border"
                        }
                        bg={isActive ? "formula.selected.bg" : "bg.subtle"}
                        cursor="pointer"
                        transition="all 0.15s"
                        _hover={{
                          borderColor: isActive
                            ? "formula.selected.border"
                            : "brand.500",
                          bg: isActive ? "formula.selected.bg" : "bg.muted",
                        }}
                        onClick={() => handleSelectFormula(idx)}
                      >
                        <Box
                          flex={1}
                          fontFamily={fontCss}
                          fontSize="sm"
                          lineHeight={1.5}
                          wordBreak="break-all"
                          fontWeight={isActive ? "bold" : "normal"}
                          color={isActive ? "formula.selected.fg" : "fg"}
                        >
                          {formula}
                        </Box>
                        {tab === "custom" && (
                          <IconButton
                            aria-label={t("algs.custom.remove")}
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCustom(idx);
                            }}
                          >
                            <Box as="span" fontSize="sm">
                              x
                            </Box>
                          </IconButton>
                        )}
                      </HStack>
                    );
                  })}
                </VStack>
                </Box>

                <Box
                  flexShrink={0}
                  borderTopWidth="1px"
                  borderColor="border"
                  pt={3}
                >
                  <Text fontSize="xs" color="fg.muted" mb={2}>
                    {t("algs.proficiency")}
                  </Text>
                  <ProficiencySelect
                    value={proficiency}
                    onChange={handleProficiencyChange}
                    size="sm"
                  />
                </Box>
              </VStack>
            )}
          </Dialog.Body>

          <Box
            flexShrink={0}
            borderTopWidth="1px"
            borderColor="border"
            px={4}
            py={3}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePrev}
              disabled={!hasPrev}
              colorPalette="brand"
            >
              &larr; Prev
            </Button>

            <Text fontSize="xs" color="fg.muted">
              {currentIndex + 1} / {items.length}
            </Text>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleNext}
              disabled={!hasNext}
              colorPalette="brand"
            >
              Next &rarr;
            </Button>
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
