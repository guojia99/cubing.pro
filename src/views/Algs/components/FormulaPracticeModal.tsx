"use client";

import {
  Box,
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  HStack,
  NativeSelect,
  Slider,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { useReleaseOverlayOnUnmount } from "@/lib/overlayCleanup";
import type { MessageKey } from "@/i18n";
import {
  appendFormulaPracticeRecord,
  clearFormulaPracticeHistory,
  computeAverages,
  createPracticeSession,
  deleteFormulaPracticeRecord,
  getFormulaPracticeHistory,
  PAGE_SIZE,
  type FormulaPracticeRecord,
} from "@/services/cubing-pro/algs/formulaPracticeHistory";
import {
  getFormulaPracticeConfig,
  saveFormulaPracticeConfig,
} from "@/services/cubing-pro/algs/formulaPracticeConfig";
import {
  buildFormulaKey,
  buildGroupKey,
  getFormulaPracticeSelection,
  saveFormulaPracticeSelection,
} from "@/services/cubing-pro/algs/formulaPracticeSelection";
import {
  getFormulaProficiency,
  getProficiencyLevel,
  PROFICIENCY_WEIGHTS,
  setFormulaProficiency,
  type ProficiencyLevel,
} from "@/services/cubing-pro/algs/formulaPracticeProficiency";

import type { FormulaItem, FormulaPracticeMode } from "../types";
import ProficiencySelect from "./ProficiencySelect";
import SvgRenderer from "./SvgRenderer";
import "./formulaPracticeModal.css";

export type { FormulaPracticeMode, FormulaItem } from "../types";

interface FormulaPracticeModalProps {
  open: boolean;
  onClose: () => void;
  cube: string;
  classId: string;
  flatAlgs: FormulaItem[];
}

const PRACTICE_MODES: FormulaPracticeMode[] = [
  "sequential",
  "random",
  "nonRepeatRandom",
  "weightedRandom",
];

const MODE_LABEL_KEYS: Record<FormulaPracticeMode, MessageKey> = {
  sequential: "algs.formulaPractice.modeSequential",
  random: "algs.formulaPractice.modeRandom",
  nonRepeatRandom: "algs.formulaPractice.modeNonRepeat",
  weightedRandom: "algs.formulaPractice.modeWeighted",
};

const PROFICIENCY_LEVELS: ProficiencyLevel[] = [
  "mastered",
  "skilled",
  "average",
  "unskilled",
  "unknown",
];

const PROFICIENCY_LABEL_KEYS: Record<ProficiencyLevel, MessageKey> = {
  mastered: "algs.formulaPractice.proficiency.mastered",
  skilled: "algs.formulaPractice.proficiency.skilled",
  average: "algs.formulaPractice.proficiency.average",
  unskilled: "algs.formulaPractice.proficiency.unskilled",
  unknown: "algs.formulaPractice.proficiency.unknown",
};

const SELECTED_BTN_PROPS = {
  colorPalette: "teal" as const,
  variant: "solid" as const,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildFormulaSlots(
  selectedAlgs: FormulaItem[],
): Array<{ algIdx: number; scrambleIdx: number }> {
  return selectedAlgs.map((item, algIdx) => {
    const scrambles = item.alg.scrambles ?? [];
    const scrambleIdx =
      scrambles.length <= 1 ? 0 : Math.floor(Math.random() * scrambles.length);
    return { algIdx, scrambleIdx };
  });
}

function buildWeightedSlots(
  selectedAlgs: FormulaItem[],
  getWeight: (formulaKey: string) => number,
  count: number,
): Array<{ algIdx: number; scrambleIdx: number }> {
  if (selectedAlgs.length === 0) return [];
  const slots: Array<{ algIdx: number; scrambleIdx: number }> = [];
  const baseSlots = selectedAlgs.map((item, algIdx) => {
    const scrambles = item.alg.scrambles ?? [];
    const scrambleIdx =
      scrambles.length <= 1 ? 0 : Math.floor(Math.random() * scrambles.length);
    return {
      algIdx,
      scrambleIdx,
      key: buildFormulaKey(item.setName, item.groupName, item.alg.name),
    };
  });
  const totalWeight =
    baseSlots.reduce((s, slot) => s + getWeight(slot.key), 0) || 1;
  for (let i = 0; i < count; i++) {
    let r = Math.random() * totalWeight;
    let picked = false;
    for (const slot of baseSlots) {
      r -= getWeight(slot.key);
      if (r <= 0) {
        slots.push({ algIdx: slot.algIdx, scrambleIdx: slot.scrambleIdx });
        picked = true;
        break;
      }
    }
    if (!picked) {
      slots.push({
        algIdx: baseSlots[0].algIdx,
        scrambleIdx: baseSlots[0].scrambleIdx,
      });
    }
  }
  return slots;
}

function FormulaPracticeDialog({
  open,
  onClose,
  title,
  children,
  size,
  className,
  contentClassName,
  hideHeader,
  closeOnInteractOutside = true,
  wrapClassName,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: "md" | "lg" | "xl" | { base: "full"; md: "lg" | "xl" | "md" };
  className?: string;
  contentClassName?: string;
  hideHeader?: boolean;
  closeOnInteractOutside?: boolean;
  wrapClassName?: string;
}) {
  useReleaseOverlayOnUnmount();

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      size={size ?? "md"}
      placement="center"
      closeOnInteractOutside={closeOnInteractOutside}
      closeOnEscape={closeOnInteractOutside}
    >
      <Dialog.Backdrop className={wrapClassName} />
      <Dialog.Positioner className={wrapClassName}>
        <Dialog.Content
          className={`formula-practice-modal formula-practice-dialog-content ${contentClassName ?? ""} ${className ?? ""}`}
          borderRadius={{ base: wrapClassName ? "0" : "2xl", md: "2xl" }}
        >
          {!hideHeader && title != null && (
            <Dialog.Header
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderBottomWidth="1px"
              borderColor="border"
            >
              <Dialog.Title fontSize="md" fontWeight="semibold">
                {title}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
          )}
          <Dialog.Body className="formula-practice-dialog-body">{children}</Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

export default function FormulaPracticeModal({
  open,
  onClose,
  cube,
  classId,
  flatAlgs,
}: FormulaPracticeModalProps) {
  useReleaseOverlayOnUnmount();
  const { t, tf } = useI18n();

  const [phase, setPhase] = useState<"config" | "practice">("practice");
  const [mode, setMode] = useState<FormulaPracticeMode>("weightedRandom");
  const [selectedFormulaKeys, setSelectedFormulaKeys] = useState<Set<string>>(
    new Set(),
  );
  const [scrambleSlots, setScrambleSlots] = useState<
    Array<{ algIdx: number; scrambleIdx: number }>
  >([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [timerState, setTimerState] = useState<"ready" | "running" | "stopped">(
    "ready",
  );
  const [timerMs, setTimerMs] = useState(0);
  const [history, setHistory] = useState<FormulaPracticeRecord[]>([]);
  const [detailRecord, setDetailRecord] = useState<FormulaPracticeRecord | null>(
    null,
  );
  const [contentVisible, setContentVisible] = useState(true);
  const [practiceSubView, setPracticeSubView] = useState<
    "main" | "fullHistory" | "detail"
  >("main");
  const [detailReturnView, setDetailReturnView] = useState<
    "main" | "fullHistory"
  >("main");
  const [historyPage, setHistoryPage] = useState(1);
  const [trimRatio, setTrimRatio] = useState(
    () => getFormulaPracticeConfig(cube, classId).trimRatio,
  );
  const [proficiencyRemindOpen, setProficiencyRemindOpen] = useState(false);
  const [lastPracticedFormula, setLastPracticedFormula] = useState<{
    formulaKey: string;
    formulaName: string;
    setName: string;
    groupName: string;
  } | null>(null);
  const [proficiencyMap, setProficiencyMap] = useState<
    Record<string, ProficiencyLevel>
  >(() => getFormulaProficiency(cube, classId));
  const [remindProficiency, setRemindProficiency] = useState(
    () => getFormulaPracticeConfig(cube, classId).remindProficiency,
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerStateRef = useRef(timerState);
  const remindProficiencyRef = useRef(remindProficiency);
  timerStateRef.current = timerState;
  remindProficiencyRef.current = remindProficiency;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  type PracticeSession = {
    sessionId: string;
    algs: FormulaItem[];
    slots: Array<{ algIdx: number; scrambleIdx: number }>;
    mode: FormulaPracticeMode;
  };
  const sessionRef = useRef<PracticeSession | null>(null);
  const currentSlotIndexRef = useRef(0);
  currentSlotIndexRef.current = currentSlotIndex;

  const selectedAlgs = useMemo(
    () =>
      flatAlgs.filter((item) =>
        selectedFormulaKeys.has(
          buildFormulaKey(item.setName, item.groupName, item.alg.name),
        ),
      ),
    [flatAlgs, selectedFormulaKeys],
  );

  const formulaKeyToImage = useMemo(() => {
    const map = new Map<string, string>();
    flatAlgs.forEach((item) => {
      map.set(
        buildFormulaKey(item.setName, item.groupName, item.alg.name),
        item.alg.image ?? "",
      );
    });
    return map;
  }, [flatAlgs]);

  const currentSlot = scrambleSlots[currentSlotIndex];
  const currentItem = currentSlot ? selectedAlgs[currentSlot.algIdx] : null;
  const currentScramble = currentItem
    ? ((currentItem.alg.scrambles ?? [])[currentSlot?.scrambleIdx ?? 0] ?? "")
    : "";

  const loadHistory = useCallback(() => {
    setHistory(getFormulaPracticeHistory(cube, classId));
  }, [cube, classId]);

  const initSelection = useCallback(() => {
    const saved = getFormulaPracticeSelection(cube, classId);
    if (saved?.selectedFormulas?.length) {
      const keys = new Set<string>();
      saved.selectedFormulas.forEach((key) => {
        if (
          flatAlgs.some(
            (item) =>
              buildFormulaKey(item.setName, item.groupName, item.alg.name) ===
              key,
          )
        ) {
          keys.add(key);
        }
      });
      if (keys.size > 0) {
        setSelectedFormulaKeys(keys);
        return;
      }
    }
    setSelectedFormulaKeys(
      new Set(
        flatAlgs.map((i) =>
          buildFormulaKey(i.setName, i.groupName, i.alg.name),
        ),
      ),
    );
  }, [cube, classId, flatAlgs]);

  const saveSelection = useCallback(() => {
    const selectedSets = new Set<string>();
    const selectedGroups = new Set<string>();
    const selectedFormulas: string[] = [];
    selectedFormulaKeys.forEach((key) => {
      const parts = key.split(":");
      if (parts.length >= 3) {
        const [setName, groupName] = parts;
        selectedSets.add(setName);
        selectedGroups.add(buildGroupKey(setName, groupName));
        selectedFormulas.push(key);
      }
    });
    saveFormulaPracticeSelection(cube, classId, {
      selectedSets: Array.from(selectedSets),
      selectedGroups: Array.from(selectedGroups),
      selectedFormulas,
    });
  }, [cube, classId, selectedFormulaKeys]);

  const getWeightForKey = useCallback(
    (formulaKey: string) => {
      const level = proficiencyMap[formulaKey] ?? "average";
      return PROFICIENCY_WEIGHTS[level];
    },
    [proficiencyMap],
  );

  const buildSlotsForMode = useCallback(
    (m: FormulaPracticeMode) => {
      const baseSlots = buildFormulaSlots(selectedAlgs);
      if (m === "sequential") return baseSlots;
      if (m === "weightedRandom") {
        return buildWeightedSlots(
          selectedAlgs,
          getWeightForKey,
          Math.max(selectedAlgs.length, 1),
        );
      }
      return shuffle([...baseSlots]);
    },
    [selectedAlgs, getWeightForKey],
  );

  useEffect(() => {
    if (open) {
      loadHistory();
      initSelection();
      const config = getFormulaPracticeConfig(cube, classId);
      setTrimRatio(config.trimRatio);
      setRemindProficiency(config.remindProficiency);
      setProficiencyMap(getFormulaProficiency(cube, classId));
      setPracticeSubView("main");
      setDetailRecord(null);
    }
  }, [open, loadHistory, initSelection, cube, classId]);

  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (!open) {
      hasAutoStarted.current = false;
      return;
    }
    if (selectedAlgs.length === 0 && scrambleSlots.length === 0) {
      setPhase("config");
    } else if (
      selectedAlgs.length > 0 &&
      scrambleSlots.length === 0 &&
      !hasAutoStarted.current
    ) {
      hasAutoStarted.current = true;
      saveSelection();
      const formulaKeys = selectedAlgs.map((i) =>
        buildFormulaKey(i.setName, i.groupName, i.alg.name),
      );
      const sessionId = createPracticeSession(cube, classId, {
        mode,
        selectedFormulas: formulaKeys,
      });
      const slots = buildSlotsForMode(mode);
      sessionRef.current = {
        sessionId,
        algs: [...selectedAlgs],
        slots: [...slots],
        mode,
      };
      setScrambleSlots(slots);
      setCurrentSlotIndex(0);
      setPhase("practice");
    }
  }, [
    open,
    selectedAlgs.length,
    scrambleSlots.length,
    mode,
    saveSelection,
    cube,
    classId,
    buildSlotsForMode,
    selectedAlgs,
  ]);

  const groupedAlgs = useMemo(() => {
    const map = new Map<string, Map<string, FormulaItem[]>>();
    flatAlgs.forEach((item) => {
      if (!map.has(item.setName)) {
        map.set(item.setName, new Map());
      }
      const groupMap = map.get(item.setName)!;
      if (!groupMap.has(item.groupName)) {
        groupMap.set(item.groupName, []);
      }
      groupMap.get(item.groupName)!.push(item);
    });
    return map;
  }, [flatAlgs]);

  const handleSetToggle = (setName: string) => {
    const groupMap = groupedAlgs.get(setName);
    if (!groupMap) return;
    const keys: string[] = [];
    groupMap.forEach((items) => {
      items.forEach((item) =>
        keys.push(
          buildFormulaKey(item.setName, item.groupName, item.alg.name),
        ),
      );
    });
    setSelectedFormulaKeys((prev) => {
      const next = new Set(prev);
      const allSelected = keys.every((k) => prev.has(k));
      keys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const handleGroupToggle = (setName: string, groupName: string) => {
    const items = groupedAlgs.get(setName)?.get(groupName) ?? [];
    const keys = items.map((i) =>
      buildFormulaKey(i.setName, i.groupName, i.alg.name),
    );
    setSelectedFormulaKeys((prev) => {
      const next = new Set(prev);
      const allSelected = keys.every((k) => prev.has(k));
      keys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const handleFormulaToggle = (
    setName: string,
    groupName: string,
    algName: string,
  ) => {
    const key = buildFormulaKey(setName, groupName, algName);
    setSelectedFormulaKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const startPractice = () => {
    if (selectedAlgs.length === 0) return;
    saveSelection();

    const formulaKeys = selectedAlgs.map((i) =>
      buildFormulaKey(i.setName, i.groupName, i.alg.name),
    );
    const sessionId = createPracticeSession(cube, classId, {
      mode,
      selectedFormulas: formulaKeys,
    });

    const slots = buildSlotsForMode(mode);

    sessionRef.current = {
      sessionId,
      algs: [...selectedAlgs],
      slots: [...slots],
      mode,
    };

    setScrambleSlots(slots);
    setCurrentSlotIndex(0);
    setTimerState("ready");
    setTimerMs(0);
    setContentVisible(true);
    setPhase("practice");
  };

  const startTimer = useCallback(() => {
    if (!open || phase !== "practice") return;
    if (timerStateRef.current !== "ready") return;
    startTimeRef.current = Date.now();
    setTimerMs(0);
    setTimerState("running");
  }, [open, phase]);

  const stopTimerAndNext = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const elapsedMs = Date.now() - startTimeRef.current;
    setTimerState("stopped");

    const session = sessionRef.current;
    const slotIdx = currentSlotIndexRef.current;

    if (!session) {
      setTimerState("ready");
      setTimerMs(0);
      return;
    }

    const { algs, slots, mode: sessionMode } = session;
    const slot = slots[slotIdx];
    const item = slot != null ? algs[slot.algIdx] : null;

    const formulaKey =
      item != null
        ? buildFormulaKey(item.setName, item.groupName, item.alg.name)
        : "";
    if (item != null && slot != null && session.sessionId) {
      const scramble =
        (item.alg.scrambles ?? [])[slot.scrambleIdx ?? 0] ?? "";

      const nextHistory = appendFormulaPracticeRecord(
        cube,
        classId,
        session.sessionId,
        {
          timeMs: elapsedMs,
          formulaKey,
          formulaName: item.alg.name,
          setName: item.setName,
          groupName: item.groupName,
          scramble,
          scrambleIndex: slot.scrambleIdx,
          image: "",
          algs: item.alg.algs ?? [],
        },
      );
      setHistory(nextHistory);

      if (sessionMode === "weightedRandom" && remindProficiencyRef.current) {
        setLastPracticedFormula({
          formulaKey,
          formulaName: item.alg.name,
          setName: item.setName,
          groupName: item.groupName,
        });
        setProficiencyRemindOpen(true);
      }
    }

    const nextIdx = slotIdx + 1 >= slots.length ? 0 : slotIdx + 1;

    if (nextIdx === 0 && slots.length > 1) {
      if (sessionMode === "nonRepeatRandom") {
        const shuffled = shuffle([...slots]);
        sessionRef.current = {
          sessionId: session.sessionId,
          algs,
          slots: shuffled,
          mode: sessionMode,
        };
        setScrambleSlots(shuffled);
      } else if (sessionMode === "weightedRandom") {
        const newSlots = buildWeightedSlots(
          algs,
          (k) => PROFICIENCY_WEIGHTS[getProficiencyLevel(cube, classId, k)],
          Math.max(algs.length, 1),
        );
        sessionRef.current = {
          sessionId: session.sessionId,
          algs,
          slots: newSlots,
          mode: sessionMode,
        };
        setScrambleSlots(newSlots);
      }
    }

    setCurrentSlotIndex(nextIdx);
    setTimerState("ready");
    setTimerMs(0);
  }, [cube, classId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open || phase !== "practice") return;
      if (timerStateRef.current === "running") {
        e.preventDefault();
        e.stopPropagation();
        stopTimerAndNext();
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (timerStateRef.current === "ready") {
          startTimer();
        }
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setCurrentSlotIndex(
          (i) => (i - 1 + scrambleSlots.length) % scrambleSlots.length,
        );
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setCurrentSlotIndex((i) => (i + 1) % scrambleSlots.length);
      }
    },
    [open, phase, scrambleSlots.length, stopTimerAndNext, startTimer],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyDown(e);
    document.addEventListener("keydown", handler, true);
    return () => {
      document.removeEventListener("keydown", handler, true);
      if (timerRef.current != null) clearInterval(timerRef.current);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (timerState === "running" && phase === "practice") {
      const tick = () => {
        setTimerMs(Date.now() - startTimeRef.current);
      };
      timerRef.current = setInterval(tick, 50);
      return () => {
        if (timerRef.current != null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [timerState, phase]);

  const handleClearHistory = () => {
    if (!window.confirm(t("algs.formulaPractice.clearHistory") + "?")) return;
    clearFormulaPracticeHistory(cube, classId);
    loadHistory();
  };

  const handleBackToConfig = () => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    sessionRef.current = null;
    setPhase("config");
    setTimerState("ready");
    setTimerMs(0);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const cent = Math.floor((ms % 1000) / 10);
    return `${m > 0 ? `${m}:` : ""}${sec.toString().padStart(2, "0")}.${cent.toString().padStart(2, "0")}`;
  };

  const handlePracticeClose = () => {
    if (phase === "practice" && timerState === "running") return;
    setPracticeSubView("main");
    setDetailRecord(null);
    onClose();
  };

  const openDetailView = useCallback(
    (
      record: FormulaPracticeRecord,
      returnView: "main" | "fullHistory" = "main",
    ) => {
      setDetailRecord(record);
      setDetailReturnView(returnView);
      setPracticeSubView("detail");
    },
    [],
  );

  const toggleBtnProps = (selected: boolean) =>
    selected ? SELECTED_BTN_PROPS : { variant: "outline" as const, size: "sm" as const };

  const totalHistoryPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));

  if (phase === "config") {
    return (
      <FormulaPracticeDialog
        open={open}
        onClose={onClose}
        title={t("algs.formulaPractice.title")}
        size={isMobile ? { base: "full", md: "md" } : "md"}
        className="formula-practice-modal--config"
        wrapClassName={
          isMobile ? "formula-practice-modal-wrap--fullscreen-mobile" : undefined
        }
      >
        <div className="formula-practice-config">
          <div className="formula-practice-mode-row">
            <Text fontWeight="medium" mb={2}>
              {t("algs.formulaPractice.mode")}
            </Text>
            <div className="formula-practice-mode-radio">
              {PRACTICE_MODES.map((m) => (
                <label key={m}>
                  <input
                    type="radio"
                    name="practice-mode"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                  />
                  {t(MODE_LABEL_KEYS[m])}
                </label>
              ))}
            </div>
          </div>

          <div className="formula-practice-selector">
            <HStack gap={2} mb={2} flexWrap="wrap">
              <Text fontSize="xs" color="fg.muted">
                {t("algs.detail.set")}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setSelectedFormulaKeys(
                    new Set(
                      flatAlgs.map((i) =>
                        buildFormulaKey(i.setName, i.groupName, i.alg.name),
                      ),
                    ),
                  )
                }
              >
                {t("algs.detail.selectAll")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFormulaKeys(new Set())}
              >
                {t("algs.detail.deselectAll")}
              </Button>
            </HStack>
            <HStack gap={2} flexWrap="wrap" mb={3}>
              {Array.from(groupedAlgs.keys()).map((setName) => {
                const groupMap = groupedAlgs.get(setName)!;
                const allKeys = Array.from(groupMap.values())
                  .flat()
                  .map((i) =>
                    buildFormulaKey(i.setName, i.groupName, i.alg.name),
                  );
                const setSelected = allKeys.every((k) =>
                  selectedFormulaKeys.has(k),
                );
                return (
                  <Button
                    key={setName}
                    size="sm"
                    borderRadius="full"
                    onClick={() => handleSetToggle(setName)}
                    {...toggleBtnProps(setSelected)}
                  >
                    {setName}
                  </Button>
                );
              })}
            </HStack>
            <Text fontSize="xs" color="fg.muted" mb={2}>
              {t("algs.detail.group")}
            </Text>
            <VStack align="stretch" gap={3}>
              {Array.from(groupedAlgs.entries()).map(([setName, groupMap]) => (
                <Box key={setName}>
                  <Text fontSize="xs" color="fg.subtle" mb={1.5}>
                    {setName}
                  </Text>
                  <VStack align="stretch" gap={2}>
                    {Array.from(groupMap.entries()).map(([groupName, items]) => {
                      const groupKey = buildGroupKey(setName, groupName);
                      const groupSelected = items.every((item) =>
                        selectedFormulaKeys.has(
                          buildFormulaKey(
                            item.setName,
                            item.groupName,
                            item.alg.name,
                          ),
                        ),
                      );
                      return (
                        <Box key={groupKey}>
                          <HStack gap={2} flexWrap="wrap">
                            <Button
                              size="sm"
                              borderRadius="full"
                              onClick={() =>
                                handleGroupToggle(setName, groupName)
                              }
                              {...toggleBtnProps(groupSelected)}
                            >
                              {groupName}
                            </Button>
                            {items.map((item) => {
                              const key = buildFormulaKey(
                                item.setName,
                                item.groupName,
                                item.alg.name,
                              );
                              const sel = selectedFormulaKeys.has(key);
                              return (
                                <Button
                                  key={key}
                                  size="sm"
                                  borderRadius="full"
                                  onClick={() =>
                                    handleFormulaToggle(
                                      setName,
                                      groupName,
                                      item.alg.name,
                                    )
                                  }
                                  {...toggleBtnProps(sel)}
                                >
                                  {item.alg.name}
                                </Button>
                              );
                            })}
                          </HStack>
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              ))}
            </VStack>
          </div>

          <Text fontSize="sm" color="fg.muted" mb={3}>
            {tf("algs.formulaPractice.selectedCount", {
              count: selectedAlgs.length,
            })}
          </Text>

          <Box mb={4}>
            <Text fontWeight="medium" mb={2}>
              {t("algs.formulaPractice.trimRatio")}
            </Text>
            <HStack gap={3} align="center">
              <Slider.Root
                min={0}
                max={50}
                step={1}
                value={[trimRatio]}
                flex={1}
                maxW="200px"
                onValueChange={(details) => {
                  const n = details.value[0];
                  if (n == null) return;
                  setTrimRatio(n);
                  saveFormulaPracticeConfig(cube, classId, { trimRatio: n });
                }}
              >
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumb index={0} />
              </Slider.Root>
              <Text fontSize="xs" color="fg.muted">
                {trimRatio}%
              </Text>
            </HStack>
            <Text fontSize="xs" color="fg.subtle" mt={1}>
              {tf("algs.formulaPractice.trimRatioDesc", { p: trimRatio })}
            </Text>
          </Box>

          <Button
            colorPalette="teal"
            size="lg"
            onClick={startPractice}
            disabled={selectedAlgs.length === 0}
          >
            {t("algs.formulaPractice.start")}
          </Button>
        </div>
      </FormulaPracticeDialog>
    );
  }

  const practiceDialogTitle = (
    <HStack justify="space-between" flexWrap="wrap" gap={2} w="full">
      {practiceSubView === "fullHistory" ? (
        <HStack gap={2} minW={0}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPracticeSubView("main")}
          >
            ←
          </Button>
          <Text fontWeight="semibold">{t("algs.formulaPractice.fullHistory")}</Text>
        </HStack>
      ) : practiceSubView === "detail" && detailRecord ? (
        <HStack gap={2} minW={0} flex={1}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPracticeSubView(detailReturnView)}
          >
            ←
          </Button>
          <Text fontWeight="semibold" truncate>
            {detailRecord.formulaName}
          </Text>
        </HStack>
      ) : (
        <>
          <Text fontWeight="semibold">{t("algs.formulaPractice.title")}</Text>
          <NativeSelect.Root size="sm" width="140px" ml="auto">
            <NativeSelect.Field
              value={mode}
              onChange={(e) => {
                const newMode = e.target.value as FormulaPracticeMode;
                setMode(newMode);
                if (sessionRef.current) {
                  const { algs } = sessionRef.current;
                  const newSlots =
                    newMode === "sequential"
                      ? buildFormulaSlots(algs)
                      : newMode === "weightedRandom"
                        ? buildWeightedSlots(
                            algs,
                            getWeightForKey,
                            Math.max(algs.length, 1),
                          )
                        : shuffle(buildFormulaSlots(algs));
                  sessionRef.current = {
                    ...sessionRef.current,
                    mode: newMode,
                    slots: newSlots,
                  };
                  setScrambleSlots(newSlots);
                  setCurrentSlotIndex(0);
                }
              }}
            >
              {PRACTICE_MODES.map((m) => (
                <option key={m} value={m}>
                  {t(MODE_LABEL_KEYS[m])}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </>
      )}
    </HStack>
  );

  const renderFullHistoryPanel = () => (
    <div className="formula-practice-full-history-inline">
      <div className="formula-practice-full-history-list">
        {history.length === 0 ? (
          <div
            className="formula-practice-empty"
            style={{ padding: 24, textAlign: "center" }}
          >
            {t("algs.formulaPractice.historyEmpty")}
          </div>
        ) : (
          (() => {
            const start = (historyPage - 1) * PAGE_SIZE;
            const pageRecords = history.slice(start, start + PAGE_SIZE);
            return pageRecords.map((record) => {
              const displayImage =
                record.image || formulaKeyToImage.get(record.formulaKey) || "";
              const prof = proficiencyMap[record.formulaKey] ?? "average";
              return (
                <div key={record.id} className="formula-practice-full-history-item">
                  <SvgRenderer
                    svg={displayImage}
                    maxWidth={40}
                    maxHeight={56}
                    style={{ flexShrink: 0 }}
                  />
                  <div
                    className="formula-practice-full-history-item-info"
                    onClick={() => openDetailView(record, "fullHistory")}
                  >
                    <div className="formula-practice-full-history-item-name">
                      {record.formulaName}
                    </div>
                    <div className="formula-practice-full-history-item-meta">
                      {record.setName} · {record.groupName}
                    </div>
                  </div>
                  <span className="formula-practice-full-history-item-time">
                    {formatTime(record.timeMs)}
                  </span>
                  <ProficiencySelect
                    value={prof}
                    onChange={(v) => {
                      setFormulaProficiency(cube, classId, record.formulaKey, v);
                      setProficiencyMap((prev) => ({
                        ...prev,
                        [record.formulaKey]: v,
                      }));
                    }}
                    size="sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    aria-label={t("algs.formulaPractice.confirmDelete")}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        !window.confirm(t("algs.formulaPractice.confirmDelete"))
                      ) {
                        return;
                      }
                      const next = deleteFormulaPracticeRecord(
                        cube,
                        classId,
                        record.id,
                      );
                      setHistory(next);
                      if (pageRecords.length === 1 && historyPage > 1) {
                        setHistoryPage(historyPage - 1);
                      }
                    }}
                  >
                    🗑
                  </Button>
                </div>
              );
            });
          })()
        )}
      </div>
      {history.length > PAGE_SIZE && (
        <div className="formula-practice-pagination">
          <Button
            size="sm"
            variant="outline"
            disabled={historyPage <= 1}
            onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </Button>
          {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map(
            (p) => (
              <Button
                key={p}
                size="sm"
                variant={p === historyPage ? "solid" : "outline"}
                colorPalette={p === historyPage ? "teal" : undefined}
                onClick={() => setHistoryPage(p)}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={historyPage >= totalHistoryPages}
            onClick={() =>
              setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))
            }
          >
            ›
          </Button>
          <Text fontSize="xs" color="fg.muted" ml={2}>
            {tf("algs.formulaPractice.totalRecords", { total: history.length })}
          </Text>
        </div>
      )}
    </div>
  );

  const renderDetailPanel = () =>
    detailRecord ? (
      <Box>
        <Text fontSize="xs" color="fg.muted" mb={2}>
          {t("algs.modal.scramble")}
        </Text>
        <div className="formula-practice-detail-scramble">
          {detailRecord.scramble}
        </div>
        <SvgRenderer
          svg={
            detailRecord.image ||
            formulaKeyToImage.get(detailRecord.formulaKey) ||
            ""
          }
          maxHeight={180}
          style={{ marginBottom: 16 }}
        />
        <HStack gap={2} mb={4} align="center">
          <Text fontSize="xs" color="fg.muted">
            {t("algs.proficiencyCard.title")}:
          </Text>
          <ProficiencySelect
            value={proficiencyMap[detailRecord.formulaKey] ?? "average"}
            onChange={(v) => {
              setFormulaProficiency(cube, classId, detailRecord.formulaKey, v);
              setProficiencyMap((prev) => ({
                ...prev,
                [detailRecord.formulaKey]: v,
              }));
            }}
            size="sm"
          />
        </HStack>
        <Text fontSize="xs" color="fg.muted" mb={2}>
          {t("algs.modal.formulaList")}
        </Text>
        <VStack gap={2} align="stretch">
          {detailRecord.algs.map((alg, idx) => (
            <div key={idx} className="formula-practice-detail-alg-item">
              {alg}
            </div>
          ))}
        </VStack>
      </Box>
    ) : null;

  return (
    <>
      <FormulaPracticeDialog
        open={open}
        onClose={handlePracticeClose}
        title={practiceDialogTitle}
        size={isMobile ? { base: "full", md: "xl" } : "xl"}
        hideHeader={timerState === "running" && practiceSubView === "main"}
        closeOnInteractOutside={
          timerState !== "running" && practiceSubView === "main"
        }
        wrapClassName={
          isMobile ? "formula-practice-modal-wrap--fullscreen-mobile" : undefined
        }
        className={`formula-practice-modal--practice ${
          timerState === "running"
            ? "formula-practice-modal--timer-running"
            : isMobile
              ? "formula-practice-modal--mobile"
              : ""
        }`.trim()}
      >
        {practiceSubView === "fullHistory" ? (
          renderFullHistoryPanel()
        ) : practiceSubView === "detail" ? (
          renderDetailPanel()
        ) : (
        <div
          className={`formula-practice-practice-root ${
            timerState === "running"
              ? "formula-practice-practice-root--timing"
              : ""
          }`}
        >
          {timerState === "running" && (
            <div
              className="formula-practice-timing-overlay"
              onPointerDown={(e) => {
                e.preventDefault();
                stopTimerAndNext();
              }}
              role="presentation"
            >
              <div className="formula-practice-timing-digits">
                {formatTime(timerMs)}
              </div>
            </div>
          )}

          <div className="formula-practice-main" aria-hidden={timerState === "running"}>
            {currentScramble ? (
              <>
                <div className="formula-practice-formula-section">
                  {currentItem && (
                    <div
                      className={`formula-practice-header ${contentVisible ? "" : "formula-practice-header-hidden"}`}
                    >
                      {contentVisible ? (
                        <>
                          <SvgRenderer
                            svg={currentItem.alg.image ?? ""}
                            maxWidth={isMobile ? 120 : 140}
                            maxHeight={isMobile ? 160 : 200}
                            style={{ flexShrink: 0 }}
                          />
                          <div className="formula-practice-header-info">
                            <div className="formula-practice-formula-name">
                              {currentItem.alg.name}
                            </div>
                            <div className="formula-practice-formula-meta">
                              {currentItem.setName} · {currentItem.groupName}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="formula-practice-header-placeholder">
                          •••
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        ml={2}
                        onClick={() => setContentVisible(!contentVisible)}
                      >
                        {contentVisible ? "🙈" : "👁"}{" "}
                        {contentVisible
                          ? t("algs.formulaPractice.hideContent")
                          : t("algs.formulaPractice.showContent")}
                      </Button>
                    </div>
                  )}

                  <div
                    className="formula-practice-scramble-block formula-practice-scramble-clickable"
                    onClick={() =>
                      currentItem &&
                      openDetailView({
                        id: "",
                        createdAt: 0,
                        timeMs: 0,
                        formulaKey: buildFormulaKey(
                          currentItem.setName,
                          currentItem.groupName,
                          currentItem.alg.name,
                        ),
                        formulaName: currentItem.alg.name,
                        setName: currentItem.setName,
                        groupName: currentItem.groupName,
                        scramble: currentScramble,
                        scrambleIndex: currentSlot?.scrambleIdx ?? 0,
                        image: currentItem.alg.image ?? "",
                        algs: currentItem.alg.algs ?? [],
                      })
                    }
                  >
                    <div className="formula-practice-scramble-label">
                      {t("algs.formulaPractice.scrambleLabel")}
                    </div>
                    <div className="formula-practice-scramble">{currentScramble}</div>
                  </div>
                </div>

                <div className="formula-practice-timer-panel">
                  <div className="formula-practice-timer-panel-title">
                    {t("algs.formulaPractice.timerZone")}
                  </div>
                  <div
                    className="formula-practice-start-zone"
                    onPointerDown={(e) => {
                      if (timerState !== "ready") return;
                      e.preventDefault();
                      startTimer();
                    }}
                    role="presentation"
                  >
                    <div
                      className={`formula-practice-timer ready ${isMobile ? "formula-practice-timer--mobile-start" : ""}`}
                    >
                      {t("algs.formulaPractice.tapMiddleToStart")}
                    </div>
                  </div>
                </div>

                {currentItem && (
                  <div className="formula-practice-nav-hint">
                    {tf("algs.formulaPractice.formulaNavHint", {
                      current: currentSlotIndex + 1,
                      total: scrambleSlots.length,
                    })}
                  </div>
                )}
              </>
            ) : (
              <Text color="fg.muted">{t("algs.formulaPractice.noScramble")}</Text>
            )}

            {timerState !== "running" && (
              <div className="formula-practice-hints">
                {t("algs.formulaPractice.hintArrow")}
              </div>
            )}
          </div>

          <div
            className={`formula-practice-below-main ${timerState === "running" ? "formula-practice-below-main--inert" : ""}`}
            aria-hidden={timerState === "running"}
          >
            <HStack justify="space-between" mt={4}>
              <Button size="sm" variant="outline" onClick={handleBackToConfig}>
                {t("algs.formulaPractice.backToConfig")}
              </Button>
              <Button
                size="sm"
                colorPalette="red"
                variant="outline"
                onClick={handleClearHistory}
              >
                🗑 {t("algs.formulaPractice.clearHistory")}
              </Button>
            </HStack>

            <div className="formula-practice-history">
              <HStack justify="space-between" mb={2}>
                <span className="formula-practice-history-header">
                  {t("algs.formulaPractice.historyTitle")}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setHistoryPage(1);
                    setPracticeSubView("fullHistory");
                  }}
                >
                  📜 {t("algs.formulaPractice.viewAllHistory")} ({history.length})
                </Button>
              </HStack>
              {history.length > 0 &&
                (() => {
                  const avgs = computeAverages(history, trimRatio);
                  return (
                    <div className="formula-practice-ao-row">
                      {avgs.ao50 != null && (
                        <span className="formula-practice-ao-item">
                          ao50: {formatTime(avgs.ao50)}
                        </span>
                      )}
                      {avgs.ao100 != null && (
                        <span className="formula-practice-ao-item">
                          ao100: {formatTime(avgs.ao100)}
                        </span>
                      )}
                      {avgs.ao1000 != null && (
                        <span className="formula-practice-ao-item">
                          ao1000: {formatTime(avgs.ao1000)}
                        </span>
                      )}
                    </div>
                  );
                })()}
              {history.length === 0 ? (
                <div className="formula-practice-empty">
                  {t("algs.formulaPractice.historyEmpty")}
                </div>
              ) : (
                history.slice(0, 3).map((record) => {
                  const displayImage =
                    record.image || formulaKeyToImage.get(record.formulaKey) || "";
                  const prof = proficiencyMap[record.formulaKey] ?? "average";
                  return (
                    <div
                      key={record.id}
                      className="formula-practice-history-item"
                      onClick={() => openDetailView(record)}
                    >
                      <SvgRenderer
                        svg={displayImage}
                        maxWidth={36}
                        maxHeight={48}
                        style={{ flexShrink: 0 }}
                      />
                      <div className="formula-practice-history-item-info">
                        <div className="formula-practice-history-item-name">
                          {record.formulaName}
                        </div>
                        <div className="formula-practice-history-item-meta">
                          {record.setName} · {record.groupName}
                        </div>
                      </div>
                      <span className="formula-practice-history-item-time">
                        {formatTime(record.timeMs)}
                      </span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ProficiencySelect
                          value={prof}
                          onChange={(v) => {
                            setFormulaProficiency(
                              cube,
                              classId,
                              record.formulaKey,
                              v,
                            );
                            setProficiencyMap((prev) => ({
                              ...prev,
                              [record.formulaKey]: v,
                            }));
                          }}
                          size="sm"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        )}
      </FormulaPracticeDialog>

      <FormulaPracticeDialog
        open={proficiencyRemindOpen}
        onClose={() => setProficiencyRemindOpen(false)}
        title={t("algs.formulaPractice.proficiencyRemindTitle")}
        size="md"
      >
        {lastPracticedFormula && (
          <Box>
            <Text fontSize="sm" color="fg.muted" mb={3}>
              {tf("algs.formulaPractice.proficiencyRemindDesc", {
                name: lastPracticedFormula.formulaName,
              })}
            </Text>
            <HStack gap={2} flexWrap="wrap" mb={4}>
              {PROFICIENCY_LEVELS.map((level) => (
                <Button
                  key={level}
                  size="sm"
                  onClick={() => {
                    setFormulaProficiency(
                      cube,
                      classId,
                      lastPracticedFormula.formulaKey,
                      level,
                    );
                    setProficiencyMap((prev) => ({
                      ...prev,
                      [lastPracticedFormula.formulaKey]: level,
                    }));
                    setProficiencyRemindOpen(false);
                  }}
                  {...toggleBtnProps(
                    proficiencyMap[lastPracticedFormula.formulaKey] === level,
                  )}
                >
                  {t(PROFICIENCY_LABEL_KEYS[level])}
                </Button>
              ))}
            </HStack>
            <Checkbox.Root
              checked={!remindProficiency}
              onCheckedChange={(e) => {
                const checked = e.checked === true;
                const next = !checked;
                setRemindProficiency(next);
                saveFormulaPracticeConfig(cube, classId, {
                  remindProficiency: next,
                });
              }}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>
                {t("algs.formulaPractice.proficiencyDontRemind")}
              </Checkbox.Label>
            </Checkbox.Root>
          </Box>
        )}
      </FormulaPracticeDialog>
    </>
  );
}
