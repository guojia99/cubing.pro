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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { toaster } from "@/components/ui/toaster";
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
import { displayPracticeScramble } from "@/components/puzzles/practiceSetup";
import {
  downloadDiagramPng,
  downloadDiagramSvg,
  findDiagramSvg,
} from "../utils/diagramDownload";
import { copyTextToClipboard } from "../utils/formulaClipboard";
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
  initialLibraryIndex?: number;
  onNavigate?: (index: number) => void;
  useVisualCube?: boolean;
  formulaFontFamily?: FormulaFontFamilyId;
  diagramSize?: number;
  hideFormulaDiagram?: boolean;
  onChanged?: () => void;
}

export default function AlgsModal({
  open,
  onClose,
  cube,
  classId,
  items,
  currentIndex,
  initialLibraryIndex,
  onNavigate,
  useVisualCube = true,
  formulaFontFamily,
  diagramSize = 180,
  hideFormulaDiagram = false,
  onChanged,
}: AlgsModalProps) {
  const { t, locale } = useI18n();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const resize = () => modalRef.current?.style.setProperty("--algs-dialog-viewport-height", `${viewport.height}px`);
    resize();
    viewport.addEventListener("resize", resize);
    return () => viewport.removeEventListener("resize", resize);
  }, [open]);

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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagramSetup, setDiagramSetup] = useState<string | null>(null);
  const handleDiagramPrepared = useCallback(
    (info: { puzzle: string; setup: string } | null) => setDiagramSetup(info?.setup ?? null),
    [],
  );

  useEffect(() => () => {
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
  }, []);

  const handleCopy = useCallback(async (key: string, text: string) => {
    if (!(await copyTextToClipboard(text))) return;
    setCopiedKey(key);
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    copyResetTimer.current = setTimeout(() => setCopiedKey(null), 1600);
  }, []);

  const diagramName = useMemo(
    () => [cube, setName, groupName, alg ? getAlgDisplayName(alg, locale) : ""].filter(Boolean).join("-"),
    [cube, setName, groupName, alg, locale],
  );

  const handleDownloadDiagram = useCallback(async (format: "png" | "svg") => {
    const svg = findDiagramSvg(diagramRef.current);
    if (!svg) return;
    try {
      if (format === "png") await downloadDiagramPng(svg, diagramName);
      else await downloadDiagramSvg(svg, diagramName);
    } catch {
      toaster.create({ title: t("teamMatch.exportFailed"), type: "error" });
    }
  }, [diagramName, t]);

  const loadState = useCallback(() => {
    if (!storageKey) return;
    // Deep links preview the source variant without changing the saved preference.
    const sel = initialLibraryIndex !== undefined
      && Number.isInteger(initialLibraryIndex)
      && initialLibraryIndex >= 0
      && initialLibraryIndex < (alg?.algs.length ?? 0)
      ? { source: "library" as const, index: initialLibraryIndex }
      : getAlgsSelection(storageKey);
    setSelection(sel);
    if (sel?.source === "custom") {
      setTab("custom");
    } else {
      setTab("library");
    }
    setCustomFormulas(getCustomAlgs(storageKey));
    setCustomInput("");
    if (formulaKey) {
      const map = getFormulaProficiency(cube, classId);
      setProficiencyState(map[formulaKey] ?? DEFAULT_PROFICIENCY);
    }
  }, [storageKey, formulaKey, cube, classId, alg, initialLibraryIndex]);

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
    (index: number, source: "library" | "custom" = tab) => {
      if (!storageKey) return;
      const value: AlgsSelectionValue = { source, index };
      setAlgsSelection(storageKey, value);
      setSelection(value);
      onChanged?.();
    },
    [storageKey, tab, onChanged],
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
    onChanged?.();
  }, [customInput, customFormulas, storageKey, onChanged]);

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
        } else {
          const newSel: AlgsSelectionValue = {
            source: "custom",
            index: selection.index > index
              ? selection.index - 1
              : Math.min(selection.index, updated.length - 1),
          };
          setAlgsSelection(storageKey, newSel);
          setSelection(newSel);
        }
      }
      onChanged?.();
    },
    [storageKey, customFormulas, selection, onChanged],
  );

  const handleProficiencyChange = useCallback(
    (level: ProficiencyLevel) => {
      if (!formulaKey) return;
      setFormulaProficiency(cube, classId, formulaKey, level);
      setProficiencyState(level);
      onChanged?.();
    },
    [cube, classId, formulaKey, onChanged],
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
      <Dialog.Positioner className="algs-formula-detail-positioner">
        <Dialog.Content
          ref={modalRef}
          className="algs-formula-detail-modal"
          borderRadius="12px"
          w="full"
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Dialog.Header
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
            borderBottomWidth="1px"
            borderColor="border"
            px={4}
            py="10px"
          >
            <Dialog.Title fontSize="15px" lineHeight={1.5} fontWeight="semibold" minW={0} overflowWrap="anywhere">
              {alg ? getAlgDisplayName(alg, locale) : ""}
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <CloseButton className="algs-formula-detail-modal__close" size="sm" flexShrink={0}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </CloseButton>
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body
            className="algs-formula-detail-modal__body"
            px={4}
            py={3}
            flex="1"
            minH={0}
            overflowY="auto"
            display="flex"
            flexDirection="column"
          >
            {!alg ? null : (
              <Box className="algs-formula-detail-modal__layout">
                <VStack className="algs-formula-detail-modal__preview" gap={3} align="stretch" minW={0}>
                <Text fontSize="11px" color="fg.muted" overflowWrap="anywhere">{setName} · {groupName}</Text>

                {!hideFormulaDiagram && diagramSetup !== null && (
                  <Box>
                    <Text fontSize="11px" color="fg.muted" mb={1.5}>{t("algs.modal.scramble")}</Text>
                    <Box
                      bg="bg.subtle"
                      borderWidth="1px"
                      borderStyle="dashed"
                      borderColor="border"
                      borderRadius="8px"
                      p="10px"
                      fontFamily={fontCss}
                      fontSize="md"
                      overflowWrap="anywhere"
                      fontWeight="semibold"
                    >
                      {displayPracticeScramble(diagramSetup) || t("algs.modal.solvedCube")}
                    </Box>
                  </Box>
                )}

                {!hideFormulaDiagram && (
                  <Box ref={diagramRef} className="algs-diagram-figure" flexShrink={0} display="flex" flexDirection="column" alignItems="center">
                    <AlgsCubeDiagram
                      cube={cube}
                      classId={classId}
                      setName={setName}
                      groupName={groupName}
                      imageSvg={alg.image}
                      scramble={displayScramble}
                      formula={displayFormula}
                      interactive
                      useVisualCube={useVisualCube}
                      maxWidth={diagramDims.maxWidth}
                      maxHeight={diagramDims.maxHeight}
                      hideSetupDetails
                      onPrepared={handleDiagramPrepared}
                    />
                    <HStack className="algs-diagram-tools" gap={1} mt={1} role="group" aria-label={t("algs.modal.downloadImage")}>
                      <Button size="xs" fontSize="11px" variant="ghost" onClick={() => void handleDownloadDiagram("png")}>
                        {t("algs.modal.downloadPng")}
                      </Button>
                      <Button size="xs" fontSize="11px" variant="ghost" onClick={() => void handleDownloadDiagram("svg")}>
                        {t("algs.modal.downloadSvg")}
                      </Button>
                    </HStack>
                  </Box>
                )}

                <HStack bg="accent.soft" borderRadius="8px" p="10px" gap={1.5} alignItems="center">
                  <Box flex={1} minW={0} fontFamily={fontCss} fontSize="md" overflowWrap="anywhere" fontWeight="semibold">{displayFormula}</Box>
                  {displayFormula ? (
                    <IconButton
                      aria-label={t("algs.modal.copyFormula")}
                      title={copiedKey === "display" ? t("algs.modal.copied") : t("algs.modal.copyFormula")}
                      size="xs"
                      variant="ghost"
                      flexShrink={0}
                      color={copiedKey === "display" ? "brand" : undefined}
                      onClick={() => void handleCopy("display", displayFormula)}
                    >
                      <Box as="span" display="inline-flex" w="14px" h="14px">
                        {copiedKey === "display" ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m5 13 4 4L19 7" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                        )}
                      </Box>
                    </IconButton>
                  ) : null}
                </HStack>
                <Box>
                  <Text fontSize="11px" color="fg.muted" mb={1.5}>{t("algs.proficiency")}</Text>
                  <HStack gap={1} flexWrap="wrap" role="group" aria-label={t("algs.proficiency")}>
                    {(["unknown", "unskilled", "average", "skilled", "mastered"] as const).map((level) => (
                      <Button key={level} size="xs" fontSize="12px" borderRadius="8px" colorPalette="brand" aria-pressed={proficiency === level}
                        variant={proficiency === level ? "solid" : "outline"}
                        onClick={() => handleProficiencyChange(level)}>
                        {t(`algs.formulaPractice.proficiency.${level}`)}
                      </Button>
                    ))}
                  </HStack>
                </Box>
                </VStack>
                <VStack gap={3} align="stretch" minW={0}>

                <Box flexShrink={0}>
                <SegmentGroup.Root
                  value={tab}
                  onValueChange={(e) => {
                    if (e.value !== "library" && e.value !== "custom") return;
                    const v = e.value;
                    setTab(v);
                    if (v === "library") {
                      handleSelectFormula(
                        selection?.source === "library"
                          ? selection.index
                          : 0, v,
                      );
                    } else if (customFormulas.length > 0) {
                      handleSelectFormula(
                        selection?.source === "custom"
                          ? Math.min(selection.index, customFormulas.length - 1)
                          : 0, v,
                      );
                    }
                  }}
                  size="sm"
                  display="flex"
                  width="full"
                  p="1"
                  gap="0"
                  bg="segment.track"
                  borderRadius="8px"
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
                    px={3}
                    py={1}
                    minH="32px"
                    fontSize="12px"
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
                    px={3}
                    py={1}
                    minH="32px"
                    fontSize="12px"
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
                      aria-label={t("algs.custom")}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) handleAddCustom();
                      }}
                      size="sm"
                      fontSize="sm"
                      borderRadius="8px"
                      flex={1}
                    />
                    <Button
                      size="sm"
                      fontSize="12px"
                      borderRadius="8px"
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
                    <Text fontSize="12px" color="fg.muted" textAlign="center" py={3}>
                      {tab === "custom"
                        ? t("algs.noData")
                        : t("algs.noData")}
                    </Text>
                  )}
                  {activeFormulas.map((formula, idx) => {
                    const isActive = (selection?.source ?? "library") === tab && (selection?.index ?? 0) === idx;
                    return (
                      <HStack
                        key={`${tab}-${idx}`}
                        gap={2}
                        px="10px"
                        py={1.5}
                        borderRadius="8px"
                        borderWidth="1px"
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
                      >
                        <Box
                          as="button"
                          onClick={() => handleSelectFormula(idx)}
                          aria-pressed={isActive}
                          textAlign="left"
                          minW={0}
                          p={1}
                          flex={1}
                          fontFamily={fontCss}
                          fontSize="sm"
                          lineHeight={1.5}
                          overflowWrap="anywhere"
                          fontWeight={isActive ? "bold" : "normal"}
                          color={isActive ? "formula.selected.fg" : "fg"}
                        >
                          {formula}
                        </Box>
                        <IconButton
                          aria-label={t("algs.modal.copyFormula")}
                          title={copiedKey === `${tab}-${idx}` ? t("algs.modal.copied") : t("algs.modal.copyFormula")}
                          size="xs"
                          variant="ghost"
                          flexShrink={0}
                          color={copiedKey === `${tab}-${idx}` ? "brand" : undefined}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleCopy(`${tab}-${idx}`, formula);
                          }}
                        >
                          <Box as="span" display="inline-flex" w="14px" h="14px">
                            {copiedKey === `${tab}-${idx}` ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m5 13 4 4L19 7" /></svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                            )}
                          </Box>
                        </IconButton>
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

                </VStack>
              </Box>
            )}
          </Dialog.Body>

          <Box
            flexShrink={0}
            borderTopWidth="1px"
            borderColor="border"
            px={4}
            py="10px"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Button
              size="sm"
              fontSize="12px"
              borderRadius="8px"
              variant="ghost"
              onClick={handlePrev}
              disabled={!hasPrev}
              colorPalette="brand"
            >
              &larr; {t("algs.modal.prev")}
            </Button>

            <Text fontSize="11px" color="fg.muted">
              {items.length ? currentIndex + 1 : 0} / {items.length}
            </Text>

            <Button
              size="sm"
              fontSize="12px"
              borderRadius="8px"
              variant="ghost"
              onClick={handleNext}
              disabled={!hasNext}
              colorPalette="brand"
            >
              {t("algs.modal.next")} &rarr;
            </Button>
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
