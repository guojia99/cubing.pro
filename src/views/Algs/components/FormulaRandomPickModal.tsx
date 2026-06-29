"use client";

import { Button, CloseButton, Dialog } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { useReleaseOverlayOnUnmount } from "@/lib/overlayCleanup";
import type { FormulaPickItem } from "@/services/cubing-pro/algs/formulaRandomPick";
import {
  getFormulaPickHistory,
  saveFormulaPick,
} from "@/services/cubing-pro/algs/formulaRandomPick";
import type { FormulaItem } from "../types";
import SvgRenderer from "./SvgRenderer";
import RandomWheel, { type WheelSegment } from "./RandomWheel";
import "./formulaRandomPickModal.css";

const WHEEL_SEGMENT_COUNT = 12;
const SPIN_DURATION_MIN = 5000;
const SPIN_DURATION_MAX = 8000;

interface FormulaRandomPickModalProps {
  open: boolean;
  onClose: () => void;
  mode: "random" | "history";
  cube: string;
  classId: string;
  flatAlgs: FormulaItem[];
  onPickFormula: (index: number) => void;
  onPickSuccess?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FormulaRandomPickModal({
  open,
  onClose,
  mode,
  cube,
  classId,
  flatAlgs,
  onPickFormula,
  onPickSuccess,
}: FormulaRandomPickModalProps) {
  useReleaseOverlayOnUnmount();
  const { t } = useI18n();
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");
  const [spinning, setSpinning] = useState(false);
  const [wheelSegments, setWheelSegments] = useState<FormulaItem[]>([]);
  const [winner, setWinner] = useState<FormulaItem | null>(null);
  const [history, setHistory] = useState<FormulaPickItem[]>([]);
  const [spinParams, setSpinParams] = useState<{
    duration: number;
    rotation: number;
  } | null>(null);

  const loadHistory = useCallback(() => {
    setHistory(getFormulaPickHistory(cube, classId));
  }, [cube, classId]);

  const doSpin = useCallback(() => {
    if (spinning || flatAlgs.length < 8) return;

    const count = Math.min(WHEEL_SEGMENT_COUNT, flatAlgs.length);
    const shuffled = shuffle(flatAlgs);
    const segments = shuffled.slice(0, count);

    const landIdx = Math.floor(Math.random() * count);
    const winnerItem = segments[landIdx];

    setWheelSegments(segments);
    setSpinning(true);
    setPhase("spinning");
    setWinner(winnerItem);

    const duration =
      SPIN_DURATION_MIN + Math.random() * (SPIN_DURATION_MAX - SPIN_DURATION_MIN);
    const degPerSeg = 360 / count;
    const segmentCenterAngle = (landIdx + 0.5) * degPerSeg;
    const fullSpins = 360 * 8;
    const finalRotation = fullSpins + (360 - segmentCenterAngle);

    setSpinParams({ duration, rotation: finalRotation });

    setTimeout(() => {
      setSpinning(false);
      setPhase("result");
      saveFormulaPick(cube, classId, {
        setName: winnerItem.setName,
        groupName: winnerItem.groupName,
        algName: winnerItem.alg.name,
        image: winnerItem.alg.image ?? "",
      });
      loadHistory();
      onPickSuccess?.();
    }, duration);
  }, [flatAlgs, spinning, cube, classId, loadHistory, onPickSuccess]);

  useEffect(() => {
    if (open) {
      loadHistory();
      if (mode === "random") {
        setPhase("idle");
        setWinner(null);
        setWheelSegments([]);
        setSpinParams(null);
        setSpinning(false);
      }
    }
  }, [open, mode, loadHistory]);

  const wheelSegmentsForWheel: WheelSegment[] = useMemo(
    () =>
      wheelSegments.map((s) => ({
        label: `${s.groupName} - ${s.alg.name}`,
        key: `${s.setName}-${s.groupName}-${s.alg.name}`,
      })),
    [wheelSegments],
  );

  const handlePickClick = (item: FormulaItem) => {
    const idx = flatAlgs.findIndex(
      (f) =>
        f.setName === item.setName &&
        f.groupName === item.groupName &&
        f.alg.name === item.alg.name,
    );
    if (idx >= 0) {
      handleClose();
      queueMicrotask(() => onPickFormula(idx));
    }
  };

  const handleHistoryItemClick = (item: FormulaPickItem) => {
    const idx = flatAlgs.findIndex(
      (f) =>
        f.setName === item.setName &&
        f.groupName === item.groupName &&
        f.alg.name === item.algName,
    );
    if (idx >= 0) {
      handleClose();
      queueMicrotask(() => onPickFormula(idx));
    }
  };

  const handleClose = () => {
    setPhase("idle");
    setSpinning(false);
    setWheelSegments([]);
    setWinner(null);
    setSpinParams(null);
    onClose();
  };

  if (mode === "history") {
    return (
      <Dialog.Root
        open={open}
        onOpenChange={(e) => {
          if (!e.open) handleClose();
        }}
        size="sm"
        placement="center"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            borderRadius="xl"
            maxW="400px"
            className="formula-random-pick-modal formula-random-history-modal"
          >
            <Dialog.Header display="flex" justifyContent="space-between" alignItems="center">
              <Dialog.Title fontSize="md" fontWeight="bold">
                {t("algs.formulaRandom.historyTitle")}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body pb={4}>
              <div className="formula-random-history-list">
                {history.length === 0 ? (
                  <p className="formula-random-history-empty">
                    {t("algs.formulaRandom.historyEmpty")}
                  </p>
                ) : (
                  history.map((item, i) => (
                    <div
                      key={`${item.setName}-${item.groupName}-${item.algName}-${i}`}
                      className="formula-random-history-item"
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <SvgRenderer
                        svg={item.image}
                        maxWidth={60}
                        maxHeight={80}
                        style={{ flexShrink: 0 }}
                      />
                      <div className="formula-random-history-item-info">
                        <div className="formula-random-history-item-name">
                          {item.algName}
                        </div>
                        <div className="formula-random-history-item-meta">
                          {item.setName} · {item.groupName}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) handleClose();
      }}
      size="sm"
      placement="center"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          borderRadius="xl"
          maxW="460px"
          className="formula-random-pick-modal random-pick-modal"
        >
          <Dialog.CloseTrigger asChild position="absolute" top={3} right={3}>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
          <Dialog.Body pt={8} pb={6} px={6}>
            <div className="random-pick-content">
              {phase === "idle" && (
                <>
                  <RandomWheel
                    segments={[]}
                    spinParams={null}
                    placeholder="?"
                    className="formula-random-wheel"
                  />
                  <p className="random-pick-hint">
                    {t("algs.formulaRandom.hintStart")}
                  </p>
                  <Button
                    colorPalette="brand"
                    size="lg"
                    onClick={doSpin}
                    disabled={spinning || flatAlgs.length < 8}
                    className="random-pick-btn"
                  >
                    {t("algs.formulaRandom.start")}
                  </Button>
                </>
              )}

              {(phase === "spinning" || phase === "result") &&
                wheelSegments.length > 0 && (
                  <>
                    <RandomWheel
                      segments={wheelSegmentsForWheel}
                      spinParams={phase === "spinning" ? spinParams : null}
                      onSpinStart={() => setSpinParams(null)}
                      className="formula-random-wheel"
                    />
                    {phase === "spinning" && (
                      <p className="random-pick-hint">
                        {t("algs.randomPick.spinning")}
                      </p>
                    )}
                  </>
                )}

              {phase === "result" && winner && (
                <>
                  <p className="random-pick-result-title">
                    {t("algs.formulaRandom.resultTitle")}
                  </p>
                  <div
                    className="formula-random-result-card formula-random-option-card"
                    onClick={() => handlePickClick(winner)}
                  >
                    <SvgRenderer
                      svg={winner.alg.image ?? ""}
                      maxWidth={120}
                      maxHeight={160}
                      style={{ marginBottom: 8 }}
                    />
                    <div className="random-pick-option-name">{winner.alg.name}</div>
                    <div className="formula-random-option-meta">
                      {winner.setName} · {winner.groupName}
                    </div>
                  </div>
                  <p className="random-pick-click-hint">
                    {t("algs.randomPick.clickHint")}
                  </p>
                  <Button
                    size="md"
                    variant="outline"
                    onClick={doSpin}
                    disabled={spinning}
                    className="random-pick-again-btn"
                  >
                    {t("algs.formulaRandom.again")}
                  </Button>
                </>
              )}
            </div>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
