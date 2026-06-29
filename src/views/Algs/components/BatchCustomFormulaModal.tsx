"use client";

import {
  Box,
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Input,
  Progress,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { useReleaseOverlayOnUnmount } from "@/lib/overlayCleanup";
import { toaster } from "@/components/ui/toaster";
import { getCustomAlgs, saveCustomAlgs } from "@/services/cubing-pro/algs/customAlgs";
import type { FormulaItem } from "../types";
import { buildAlgsKey } from "../utils/storage";
import {
  getFormulaFontFamilyCSSValue,
  type FormulaFontFamilyId,
} from "../utils/formulaFontFamily";
import AlgsCubeDiagram from "./AlgsCubeDiagram";
import "./batchCustomFormulaModal.css";

type Step = "selectSets" | "fill";

export interface BatchCustomFormulaModalProps {
  open: boolean;
  onClose: () => void;
  cube: string;
  classId: string;
  flatAlgs: FormulaItem[];
  useVisualCube?: boolean;
  formulaFontFamily?: FormulaFontFamilyId;
}

function hasCustomFormula(cube: string, classId: string, item: FormulaItem): boolean {
  const key = buildAlgsKey(cube, classId, item.setName, item.groupName, item.alg.name);
  return getCustomAlgs(key).length > 0;
}

export default function BatchCustomFormulaModal({
  open,
  onClose,
  cube,
  classId,
  flatAlgs,
  useVisualCube = true,
  formulaFontFamily,
}: BatchCustomFormulaModalProps) {
  useReleaseOverlayOnUnmount();
  const { t, tf } = useI18n();
  const formulaFontCss = getFormulaFontFamilyCSSValue(formulaFontFamily);

  const setNames = useMemo(() => {
    const names = new Set<string>();
    flatAlgs.forEach((f) => names.add(f.setName));
    return Array.from(names);
  }, [flatAlgs]);

  const [step, setStep] = useState<Step>("selectSets");
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [hideFilled, setHideFilled] = useState(true);
  const [queue, setQueue] = useState<FormulaItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [customAlgs, setCustomAlgsLocal] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [previewLibraryIdx, setPreviewLibraryIdx] = useState(0);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);

  const resetState = useCallback(() => {
    setStep("selectSets");
    setSelectedSets(setNames);
    setHideFilled(true);
    setQueue([]);
    setCurrentIdx(0);
    setCustomAlgsLocal([]);
    setCustomInput("");
    setPreviewLibraryIdx(0);
    setDeleteConfirmIdx(null);
  }, [setNames]);

  useEffect(() => {
    if (open) resetState();
  }, [open, resetState]);

  const setStats = useMemo(() => {
    const map = new Map<string, { total: number; filled: number }>();
    for (const name of setNames) {
      map.set(name, { total: 0, filled: 0 });
    }
    for (const item of flatAlgs) {
      const stat = map.get(item.setName);
      if (!stat) continue;
      stat.total += 1;
      if (hasCustomFormula(cube, classId, item)) stat.filled += 1;
    }
    return map;
  }, [flatAlgs, setNames, cube, classId]);

  const previewPending = flatAlgs.filter((item) => {
    if (!selectedSets.includes(item.setName)) return false;
    if (hideFilled && hasCustomFormula(cube, classId, item)) return false;
    return true;
  }).length;

  const handleSetToggle = (name: string) => {
    setSelectedSets((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };

  const buildQueue = useCallback(
    () =>
      flatAlgs.filter((item) => {
        if (!selectedSets.includes(item.setName)) return false;
        if (hideFilled && hasCustomFormula(cube, classId, item)) return false;
        return true;
      }),
    [flatAlgs, selectedSets, hideFilled, cube, classId],
  );

  const handleStartFill = () => {
    const nextQueue = buildQueue();
    if (nextQueue.length === 0) return;
    setQueue(nextQueue);
    setCurrentIdx(0);
    setStep("fill");
  };

  const currentItem = queue[currentIdx];
  const storageKey = currentItem
    ? buildAlgsKey(cube, classId, currentItem.setName, currentItem.groupName, currentItem.alg.name)
    : "";

  useEffect(() => {
    if (!currentItem || step !== "fill") return;
    const key = buildAlgsKey(
      cube,
      classId,
      currentItem.setName,
      currentItem.groupName,
      currentItem.alg.name,
    );
    setCustomAlgsLocal(getCustomAlgs(key));
    setCustomInput("");
    setPreviewLibraryIdx(0);
    setDeleteConfirmIdx(null);
  }, [currentItem, step, cube, classId, currentIdx]);

  const goNext = useCallback(() => {
    setCurrentIdx((i) => (i >= queue.length - 1 ? i : i + 1));
  }, [queue.length]);

  const goPrev = () => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  };

  const persistCustom = useCallback(
    (formulas: string[], advance: boolean) => {
      if (!storageKey) return;
      saveCustomAlgs(storageKey, formulas);
      setCustomAlgsLocal(formulas);
      if (advance) {
        if (currentIdx >= queue.length - 1) {
          toaster.create({ title: t("algs.batchCustom.allDone"), type: "success" });
          setStep("selectSets");
          setQueue([]);
          setCurrentIdx(0);
        } else {
          goNext();
        }
      }
    },
    [storageKey, currentIdx, queue.length, goNext, t],
  );

  const handleAddCustom = (advance = true) => {
    const val = customInput.trim();
    if (!val) return;
    persistCustom([...customAlgs, val], advance);
    setCustomInput("");
  };

  const handleAdoptLibrary = (formula: string, idx: number) => {
    setPreviewLibraryIdx(idx);
    if (customAlgs.includes(formula)) return;
    persistCustom([...customAlgs, formula], true);
  };

  const handleDeleteCustom = (idx: number) => {
    persistCustom(
      customAlgs.filter((_, i) => i !== idx),
      false,
    );
    setDeleteConfirmIdx(null);
  };

  const modalTitle =
    step === "selectSets"
      ? t("algs.batchCustom.selectSetsTitle")
      : t("algs.batchCustom.fillTitle");

  const dialogSize = step === "fill" ? "xl" : "md";

  const renderSetSelect = () => (
    <div className="batch-custom-set-select">
      <Checkbox.Root
        checked={hideFilled}
        onCheckedChange={(e) => setHideFilled(!!e.checked)}
        mb={3}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Label>{t("algs.batchCustom.hideFilled")}</Checkbox.Label>
      </Checkbox.Root>
      <HStack gap={2} mb={2}>
        <Button size="xs" variant="outline" onClick={() => setSelectedSets([...setNames])}>
          {t("algs.detail.selectAll")}
        </Button>
        <Button size="xs" variant="outline" onClick={() => setSelectedSets([])}>
          {t("algs.detail.deselectAll")}
        </Button>
      </HStack>
      <div className="batch-custom-set-list">
        {setNames.map((name) => {
          const stat = setStats.get(name) ?? { total: 0, filled: 0 };
          const pending = flatAlgs.filter((item) => {
            if (item.setName !== name) return false;
            return !(hideFilled && hasCustomFormula(cube, classId, item));
          }).length;
          return (
            <label key={name} className="batch-custom-set-row">
              <Checkbox.Root
                checked={selectedSets.includes(name)}
                onCheckedChange={() => handleSetToggle(name)}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Label>
                  <span>{name}</span>
                  <span className="batch-custom-set-meta">
                    {tf("algs.batchCustom.setProgress", {
                      pending,
                      total: stat.total,
                      filled: stat.filled,
                    })}
                  </span>
                </Checkbox.Label>
              </Checkbox.Root>
            </label>
          );
        })}
      </div>
      <Text mt={4} fontSize="sm" color="fg.muted">
        {tf("algs.batchCustom.pendingCount", { count: previewPending })}
      </Text>
    </div>
  );

  const renderFill = () => {
    if (!currentItem) {
      return (
        <Text textAlign="center" py={6}>
          {t("algs.batchCustom.allDone")}
        </Text>
      );
    }

    const { alg, setName, groupName } = currentItem;
    const progressPercent =
      queue.length > 0 ? Math.round(((currentIdx + 1) / queue.length) * 100) : 0;
    const defaultScramble = currentItem.alg.scrambles?.[0] ?? "";
    const selectedLibraryFormula =
      currentItem.alg.algs[previewLibraryIdx] ?? currentItem.alg.algs[0] ?? "";

    return (
      <>
        <Progress.Root value={progressPercent} size="sm" mb={3}>
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
        <div className="batch-custom-fill-top">
          <div className="batch-custom-fill-name">{alg.name}</div>
          <div className="batch-custom-fill-meta">
            {setName} · {groupName} · {currentIdx + 1} / {queue.length}
          </div>
          <AlgsCubeDiagram
            cube={cube}
            classId={classId}
            setName={setName}
            groupName={groupName}
            imageSvg={alg.image}
            scramble={defaultScramble}
            formula=""
            useVisualCube={useVisualCube}
            maxWidth={260}
            maxHeight={260}
          />
        </div>

        <div className="batch-custom-fill-bottom">
          <div className="batch-custom-column">
            <div className="batch-custom-column-title">{t("algs.modal.library")}</div>
            <div className="batch-custom-formula-list">
              {alg.algs.map((formula, idx) => (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  className={`batch-custom-formula-item${
                    previewLibraryIdx === idx ? " batch-custom-formula-item--selected" : ""
                  }`}
                  style={{ fontFamily: formulaFontCss }}
                  onClick={() => setPreviewLibraryIdx(idx)}
                  onDoubleClick={() => handleAdoptLibrary(formula, idx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleAdoptLibrary(formula, idx);
                    }
                  }}
                >
                  {formula}
                </div>
              ))}
            </div>
            <Flex mt={2} gap={2} flexWrap="wrap" align="center">
              <Button
                size="xs"
                colorPalette="brand"
                disabled={
                  !selectedLibraryFormula || customAlgs.includes(selectedLibraryFormula)
                }
                onClick={() =>
                  handleAdoptLibrary(selectedLibraryFormula, previewLibraryIdx)
                }
              >
                {t("algs.batchCustom.adoptSelected")}
              </Button>
              <Text fontSize="xs" color="fg.muted">
                {t("algs.batchCustom.adoptHint")}
              </Text>
            </Flex>
          </div>

          <div className="batch-custom-column">
            <div className="batch-custom-column-title">{t("algs.modal.custom")}</div>
            <div className="batch-custom-formula-list">
              {customAlgs.length === 0 ? (
                <Text py={4} textAlign="center" fontSize="sm" color="fg.muted">
                  {t("algs.modal.noCustomAlgs")}
                </Text>
              ) : (
                customAlgs.map((formula, idx) => (
                  <div
                    key={idx}
                    className="batch-custom-formula-item batch-custom-formula-item--custom"
                    style={{ fontFamily: formulaFontCss }}
                  >
                    <span style={{ flex: 1 }}>{formula}</span>
                    {deleteConfirmIdx === idx ? (
                      <HStack gap={1}>
                        <Button
                          size="xs"
                          colorPalette="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustom(idx);
                          }}
                        >
                          {t("algs.practiceHistoryStats.clearConfirmOk")}
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmIdx(null);
                          }}
                        >
                          {t("algs.practiceHistoryStats.clearConfirmCancel")}
                        </Button>
                      </HStack>
                    ) : (
                      <IconButton
                        aria-label={t("algs.modal.deleteCustomConfirm")}
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmIdx(idx);
                        }}
                      >
                        ×
                      </IconButton>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="batch-custom-add-row">
              <Input
                size="sm"
                placeholder={t("algs.modal.addCustomPlaceholder")}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCustom(true);
                }}
                flex={1}
                fontFamily={formulaFontCss}
              />
              <Button size="sm" onClick={() => handleAddCustom(true)}>
                {t("algs.modal.addCustom")}
              </Button>
            </div>
          </div>
        </div>

        <div className="batch-custom-footer">
          <HStack gap={2}>
            <Button size="sm" variant="outline" onClick={() => setStep("selectSets")}>
              {t("algs.batchCustom.backToSets")}
            </Button>
            <Button size="sm" variant="outline" onClick={goPrev} disabled={currentIdx <= 0}>
              ← {t("algs.modal.prev")}
            </Button>
          </HStack>
          <HStack gap={2}>
            <Button size="sm" variant="outline" onClick={goNext} disabled={currentIdx >= queue.length - 1}>
              {t("algs.batchCustom.skip")}
            </Button>
            <Button
              size="sm"
              colorPalette="brand"
              onClick={goNext}
              disabled={currentIdx >= queue.length - 1}
            >
              {t("algs.modal.next")} →
            </Button>
          </HStack>
        </div>
      </>
    );
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      size={dialogSize}
      placement="center"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          borderRadius="xl"
          className="batch-custom-formula-modal"
          maxW={step === "fill" ? "820px" : "520px"}
        >
          <Dialog.Header display="flex" justifyContent="space-between" alignItems="center">
            <Dialog.Title fontSize="md" fontWeight="bold">
              {modalTitle}
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body pt={2} pb={4}>
            {step === "selectSets" ? renderSetSelect() : renderFill()}
          </Dialog.Body>
          {step === "selectSets" && (
            <Box borderTopWidth="1px" borderColor="border" px={4} py={3}>
              <HStack justify="flex-end" gap={2}>
                <Button variant="outline" onClick={onClose}>
                  {t("algs.modal.close")}
                </Button>
                <Button
                  colorPalette="brand"
                  disabled={previewPending === 0}
                  onClick={handleStartFill}
                >
                  {t("algs.batchCustom.startFill")}
                </Button>
              </HStack>
            </Box>
          )}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
