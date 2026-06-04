"use client";

import { Button, CloseButton, Dialog } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/contexts/I18nProvider";
import { useReleaseOverlayOnUnmount } from "@/lib/overlayCleanup";
import type { AlgListItem } from "@/services/cubing-pro/algs/algs";
import {
  clearDailyPick,
  getDailyPickState,
  getRemainingPicks,
  saveDailyPick,
  type PickedOption,
} from "@/services/cubing-pro/algs/dailyRandomPick";
import { isLocal } from "@/services/cubing-pro/request";

import AlgsCubeDiagram from "./AlgsCubeDiagram";
import RandomWheel, { type WheelSegment } from "./RandomWheel";
import "./randomPickModal.css";

const WHEEL_SEGMENT_COUNT = 12;
const SPIN_DURATION_MIN = 5000;
const SPIN_DURATION_MAX = 8000;

const RANDOM_PICK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="44" fill="rgba(230,240,255,0.8)" stroke="rgba(100,149,237,0.5)" stroke-width="3"/>
  <path d="M50 50 L50 10 L54 50 Z" fill="rgba(100,149,237,0.7)"/>
  <path d="M50 50 L77 27 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <path d="M50 50 L77 73 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <path d="M50 50 L50 90 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <path d="M50 50 L23 73 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <path d="M50 50 L23 27 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <circle cx="50" cy="50" r="10" fill="rgba(100,149,237,0.9)"/>
</svg>`;

interface RandomPickModalProps {
  open: boolean;
  onClose: () => void;
  classMap: Record<string, AlgListItem[]>;
  cubeKeys: string[];
}

function collectOptions(
  classMap: Record<string, AlgListItem[]>,
  cubeKeys: string[],
  exclude?: PickedOption[],
): PickedOption[] {
  const all: PickedOption[] = [];
  cubeKeys.forEach((cube) => {
    (classMap[cube] ?? []).forEach((cls) => {
      if (!exclude?.some((e) => e.cube === cube && e.className === cls.name)) {
        all.push({
          cube,
          className: cls.name,
          image: cls.image,
          alg: cls.alg,
        });
      }
    });
  });
  return all;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RandomPickModal({
  open,
  onClose,
  classMap,
  cubeKeys,
}: RandomPickModalProps) {
  useReleaseOverlayOnUnmount();
  const { t, tf } = useI18n();
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");
  const [picks, setPicks] = useState<PickedOption[]>([]);
  const [remaining, setRemaining] = useState(2);
  const [spinning, setSpinning] = useState(false);
  const [wheelSegments, setWheelSegments] = useState<PickedOption[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [spinParams, setSpinParams] = useState<{
    duration: number;
    rotation: number;
  } | null>(null);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadState = useCallback(async () => {
    const state = await getDailyPickState();
    const rem = getRemainingPicks(state);
    setRemaining(rem);
    if (state?.picks?.length) {
      setPicks(state.picks);
      setPhase("result");
      setCountdown(null);
    } else {
      setPicks([]);
      setPhase("idle");
      const opts = collectOptions(classMap, cubeKeys, []);
      if (opts.length > 0 && rem > 0) {
        setCountdown(3);
      }
    }
  }, [classMap, cubeKeys]);

  useEffect(() => {
    if (open) void loadState();
  }, [open, loadState]);

  const allOptions = useMemo(
    () => collectOptions(classMap, cubeKeys, picks),
    [classMap, cubeKeys, picks],
  );
  const canSpin = allOptions.length > 0 && remaining > 0;

  const doSpin = useCallback(() => {
    if (spinning || remaining <= 0 || allOptions.length === 0) return;

    const count = Math.min(WHEEL_SEGMENT_COUNT, allOptions.length);
    const shuffled = shuffle(allOptions);
    const segments = shuffled.slice(0, count);
    const landIdx = Math.floor(Math.random() * count);
    const winner = segments[landIdx];

    setWheelSegments(segments);
    setSpinning(true);
    setPhase("spinning");

    const newPicks = [...picks, winner];
    setPicks(newPicks);
    setRemaining(remaining - 1);

    const duration =
      SPIN_DURATION_MIN + Math.random() * (SPIN_DURATION_MAX - SPIN_DURATION_MIN);
    const degPerSeg = 360 / count;
    const segmentCenterAngle = (landIdx + 0.5) * degPerSeg;
    const fullSpins = 360 * 8;
    const finalRotation = fullSpins + (360 - segmentCenterAngle);

    setSpinParams({ duration, rotation: finalRotation });

    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinTimerRef.current = setTimeout(() => {
      setSpinning(false);
      setPhase("result");
      void saveDailyPick(newPicks);
    }, duration);
  }, [allOptions, picks, remaining, spinning]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setTimeout(() => {
      if (countdown === 1) {
        setCountdown(null);
        doSpin();
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, doSpin]);

  useEffect(
    () => () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    },
    [],
  );

  const wheelSegmentLabels: WheelSegment[] = useMemo(
    () =>
      wheelSegments.map((seg, i) => ({
        key: `${seg.cube}-${seg.className}-${i}`,
        label:
          seg.className.length > 8
            ? `${seg.className.slice(0, 7)}…`
            : seg.className,
      })),
    [wheelSegments],
  );

  const handleOptionClick = (opt: PickedOption) => {
    router.push(
      `/algs/${encodeURIComponent(opt.cube)}/${encodeURIComponent(opt.className)}`,
    );
    handleClose();
  };

  const handleClose = () => {
    setPhase("idle");
    setPicks([]);
    setSpinning(false);
    setWheelSegments([]);
    setCountdown(null);
    setSpinParams(null);
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    onClose();
  };

  const handleClear = async () => {
    await clearDailyPick();
    setPicks([]);
    setRemaining(2);
    setPhase("idle");
    setWheelSegments([]);
    setCountdown(null);
    setSpinParams(null);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) handleClose();
      }}
      placement="center"
      size="md"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content borderRadius="2xl" maxW="460px">
          <Dialog.Header display="flex" justifyContent="space-between" alignItems="center">
            <Dialog.Title fontSize="md" fontWeight="bold">
              {t("algs.randomPick.title")}
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body pb={6}>
            <div className="random-pick-modal-content">
              {phase === "idle" && (
                <>
                  <RandomWheel
                    segments={[]}
                    spinParams={null}
                    placeholder={
                      <span
                        className={
                          countdown !== null ? "random-pick-countdown" : undefined
                        }
                      >
                        {countdown !== null ? String(countdown) : "?"}
                      </span>
                    }
                  />
                  <p className="random-pick-hint">
                    {countdown !== null
                      ? tf("algs.randomPick.countdown", { count: countdown })
                      : t("algs.randomPick.hintStart")}
                  </p>
                  {countdown === null && (
                    <Button
                      colorPalette="brand"
                      size="lg"
                      className="random-pick-btn"
                      onClick={doSpin}
                      disabled={spinning || !canSpin}
                    >
                      {t("algs.randomPick.start")}
                    </Button>
                  )}
                </>
              )}

              {(phase === "spinning" || phase === "result") &&
                wheelSegments.length > 0 && (
                  <>
                    <RandomWheel
                      segments={wheelSegmentLabels}
                      spinParams={spinParams}
                    />
                    {phase === "spinning" && (
                      <p className="random-pick-hint">
                        {t("algs.randomPick.spinning")}
                      </p>
                    )}
                  </>
                )}

              {phase === "result" && (
                <>
                  <p className="random-pick-result-title">
                    {t("algs.randomPick.resultTitle")}
                  </p>
                  <div
                    className={`random-pick-options ${
                      picks.length === 1 ? "single" : "double"
                    }`}
                  >
                    {picks.map((opt) => (
                      <div
                        key={`${opt.cube}-${opt.className}`}
                        className="random-pick-option-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOptionClick(opt)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleOptionClick(opt);
                          }
                        }}
                      >
                        <AlgsCubeDiagram
                          cube={opt.cube}
                          classId={opt.className}
                          setName=""
                          groupName=""
                          imageSvg={opt.image}
                          formula={opt.alg}
                          useVisualCube
                          maxWidth={120}
                          maxHeight={160}
                          style={{ marginBottom: 8 }}
                        />
                        <div className="random-pick-option-name">{opt.className}</div>
                        <div className="random-pick-option-cube">{opt.cube}</div>
                      </div>
                    ))}
                  </div>
                  <p className="random-pick-click-hint">
                    {t("algs.randomPick.clickHint")}
                  </p>
                  {remaining > 0 && (
                    <Button
                      variant="outline"
                      colorPalette="brand"
                      onClick={doSpin}
                      disabled={spinning}
                    >
                      {t("algs.randomPick.again")}
                    </Button>
                  )}
                  {remaining <= 0 && (
                    <p className="random-pick-limit-hint">
                      {t("algs.randomPick.limitReached")}
                    </p>
                  )}
                  {isLocal() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      colorPalette="red"
                      mt={3}
                      onClick={() => void handleClear()}
                    >
                      {t("algs.randomPick.clear")}
                    </Button>
                  )}
                </>
              )}
            </div>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

export { RANDOM_PICK_ICON_SVG };
