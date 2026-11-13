"use client";

import { Button, CloseButton, Dialog } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { displayPracticeScramble, hasPracticeScramble, preparePracticeSetups } from "@/components/puzzles/practiceSetup";
import { useI18n } from "@/contexts/I18nProvider";
import type { MessageKey } from "@/i18n";
import { useReleaseOverlayOnUnmount } from "@/lib/overlayCleanup";
import {
  appendFormulaPracticeRecord, clearFormulaPracticeHistory, computeAverages, computeTrimmedMean,
  createPracticeSession, deleteFormulaPracticeRecord, getFormulaPracticeHistoryPage,
  getFormulaPracticeHistorySummary, PAGE_SIZE, type FormulaPracticeRecord,
  type FormulaPracticeHistorySummary, type HistoryPageResult,
} from "@/services/cubing-pro/algs/formulaPracticeHistory";
import { getFormulaPracticeConfig, saveFormulaPracticeConfig } from "@/services/cubing-pro/algs/formulaPracticeConfig";
import { buildGroupKey, getFormulaPracticeSelection, saveFormulaPracticeSelection } from "@/services/cubing-pro/algs/formulaPracticeSelection";
import { getFormulaProficiency, getProficiencyLevel, PROFICIENCY_WEIGHTS, setFormulaProficiency, type ProficiencyLevel } from "@/services/cubing-pro/algs/formulaPracticeProficiency";
import type { FormulaItem, FormulaPracticeMode } from "../types";
import { formulaKey, formatPracticeTime, PracticeTimer, snapshotIdentity, type PracticeSnapshot, type TimerView } from "./formulaPracticeTimer";
import AlgsCubeDiagram from "./AlgsCubeDiagram";
import "./formulaPracticeModal.css";

export type { FormulaPracticeMode, FormulaItem } from "../types";
interface Props { open: boolean; onClose: () => void; cube: string; classId: string; flatAlgs: FormulaItem[] }
type View = "config" | "main" | "history" | "detail" | "confirm";
type PracticeDetail =
  | { kind: "record"; value: FormulaPracticeRecord }
  | { kind: "question"; value: Omit<FormulaPracticeRecord, "id" | "createdAt" | "timeMs"> };
const MODES: Record<FormulaPracticeMode, MessageKey> = {
  sequential: "algs.formulaPractice.modeSequential", random: "algs.formulaPractice.modeRandom",
  nonRepeatRandom: "algs.formulaPractice.modeNonRepeat", weightedRandom: "algs.formulaPractice.modeWeighted",
};
const PHASE_LABELS: Record<TimerView["phase"], MessageKey> = {
  ready: "algs.practice.ready", armed: "algs.practice.armed", running: "algs.practice.running",
  saving: "algs.practice.saving", loading: "algs.practice.loading", error: "algs.practice.error", clearing: "algs.practice.clearing",
};
const PROFICIENCY_LABELS: Record<ProficiencyLevel, MessageKey> = {
  mastered: "algs.formulaPractice.proficiency.mastered", skilled: "algs.formulaPractice.proficiency.skilled",
  average: "algs.formulaPractice.proficiency.average", unskilled: "algs.formulaPractice.proficiency.unskilled", unknown: "algs.formulaPractice.proficiency.unknown",
};

function PracticeProficiency({ value, onChange, disabled }: { value: ProficiencyLevel; onChange: (level: ProficiencyLevel) => void; disabled?: boolean }) {
  const { t } = useI18n();
  return <div className="fp-proficiency" role="group" aria-label={t("algs.formulaPractice.proficiencyRemindTitle")}>
    {(Object.keys(PROFICIENCY_LABELS) as ProficiencyLevel[]).map((level) => <button key={level} type="button" disabled={disabled} aria-pressed={value === level} onClick={() => onChange(level)}>{t(PROFICIENCY_LABELS[level])}</button>)}
  </div>;
}

function initialSelection(cube: string, classId: string, algs: FormulaItem[]): Set<string> {
  const saved = getFormulaPracticeSelection(cube, classId);
  // An explicitly empty selection is distinct from no saved selection.
  return new Set(saved ? saved.selectedFormulas.filter((key) => algs.some((item) => formulaKey(item) === key)) : algs.map(formulaKey));
}

function TimerDigits({ state, open }: { state: TimerView; open: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!open || state.phase !== "running") return;
    let frame = 0;
    const tick = () => {
      setElapsed(Math.max(0, performance.now() - state.startedAt));
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [open, state.phase, state.startedAt]);
  return <span className="fp-digits" aria-hidden="true">{formatPracticeTime(state.phase === "running" ? elapsed : state.elapsed)}</span>;
}

export default function FormulaPracticeModal(props: Props) {
  // Keep each library's pending save and session isolated when the parent changes libraries.
  const [timers] = useState(() => new Map<string, PracticeTimer>());
  const key = JSON.stringify([props.cube, props.classId]);
  let timer = timers.get(key);
  if (!timer) {
    timer = new PracticeTimer({
      now: () => performance.now(), random: Math.random,
      weight: (formula) => PROFICIENCY_WEIGHTS[getProficiencyLevel(props.cube, props.classId, formula)],
      create: (snapshot) => createPracticeSession(snapshot.cube, snapshot.classId, { mode: snapshot.mode, selectedFormulas: snapshot.algs.map(formulaKey) }),
      append: (snapshot, sessionId, input) => appendFormulaPracticeRecord(snapshot.cube, snapshot.classId, sessionId, input),
      clear: (snapshot) => clearFormulaPracticeHistory(snapshot.cube, snapshot.classId),
    });
    timers.set(key, timer);
  }
  return <PreparedPracticeLibrary key={key} {...props} timer={timer} />;
}

function PreparedPracticeLibrary(props: Props & { timer: PracticeTimer }) {
  const { open, cube, classId, flatAlgs } = props;
  // A parent may reallocate flatAlgs; only changed setup inputs restart preparation.
  const setupKey = JSON.stringify([cube, classId, flatAlgs.map((item) => hasPracticeScramble(item.alg.scrambles) ? null : item.alg.algs)]);
  const needsSetup = flatAlgs.some((item) => !hasPracticeScramble(item.alg.scrambles));
  const [result, setResult] = useState<{ key: string; setups: string[][] } | null>(null);
  const ready = !needsSetup || result?.key === setupKey;

  useEffect(() => {
    if (!open || ready) return;
    let active = true;
    const [requestCube, requestClassId, formulas] = JSON.parse(setupKey) as [string, string, (string[] | null)[]];
    void preparePracticeSetups(requestCube, requestClassId, formulas).then((setups) => {
      if (active) setResult({ key: setupKey, setups });
    }).catch(() => {
      if (active) setResult({ key: setupKey, setups: [] });
    });
    return () => { active = false; };
  }, [open, ready, setupKey]);

  const preparedAlgs = useMemo(() => {
    if (!needsSetup || result?.key !== setupKey) return flatAlgs;
    return flatAlgs.map((item, index) => {
      const scrambles = result.setups[index];
      return hasPracticeScramble(item.alg.scrambles) || !scrambles?.length ? item : { ...item, alg: { ...item.alg, scrambles } };
    });
  }, [flatAlgs, needsSetup, result, setupKey]);

  return <PracticeLibrary {...props} flatAlgs={preparedAlgs} setupBusy={!ready} />;
}

function PracticeLibrary({ open, onClose, cube, classId, flatAlgs, timer, setupBusy }: Props & { timer: PracticeTimer; setupBusy: boolean }) {
  useReleaseOverlayOnUnmount();
  const { t, tf, locale } = useI18n();
  const state = useSyncExternalStore(timer.subscribe, timer.getSnapshot, timer.getSnapshot);
  const [view, setView] = useState<View>(() => state.snapshot ? "main" : "config");
  const [mode, setMode] = useState<FormulaPracticeMode>(() => state.snapshot?.mode ?? "weightedRandom");
  const [selected, setSelected] = useState(() => initialSelection(cube, classId, flatAlgs));
  const [config, setConfig] = useState(() => getFormulaPracticeConfig(cube, classId));
  const [answerVisible, setAnswerVisible] = useState(false);
  const [detail, setDetail] = useState<PracticeDetail | null>(null);
  const [returnView, setReturnView] = useState<View>("main");
  const [confirmation, setConfirmation] = useState<FormulaPracticeRecord | "clear" | null>(null);
  const [confirmationReturn, setConfirmationReturn] = useState<View>("history");
  const [notice, setNotice] = useState<MessageKey | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const actionLock = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const timerButtonRef = useRef<HTMLButtonElement>(null);
  const [proficiencies, setProficiencies] = useState(() => getFormulaProficiency(cube, classId));
  const [dismissedReminder, setDismissedReminder] = useState<string | null>(null);
  const [summary, setSummary] = useState<FormulaPracticeHistorySummary | null>(null);
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<HistoryPageResult | null>(null);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [dataError, setDataError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const summaryRequest = useRef(0);
  const historyRequest = useRef(0);
  const selectedAlgs = flatAlgs.filter((item) => selected.has(formulaKey(item)));
  const draft: PracticeSnapshot = { cube, classId, algs: selectedAlgs, mode, ...config };
  const identity = snapshotIdentity(draft);
  const snapshotMatches = identity === state.identity;
  const locked = timer.isBlocked() || actionBusy;
  const slot = state.slots[state.index];
  const item = slot ? state.snapshot?.algs[slot.algIdx] : null;
  const scramble = item?.alg.scrambles?.[slot?.scrambleIdx ?? 0] ?? "";
  const running = state.phase === "running";
  const canTime = open && view === "main" && !setupBusy && snapshotMatches && !actionBusy && Boolean(scramble.trim());
  const controls = useRef({ canTime });
  controls.current = { canTime };

  useEffect(() => {
    if (!open) { timer.interrupt(); return; }
    const nextConfig = getFormulaPracticeConfig(cube, classId);
    setConfig(nextConfig);
    setSelected(initialSelection(cube, classId, flatAlgs));
    setMode(timer.getSnapshot().snapshot?.mode ?? "weightedRandom");
    setProficiencies(getFormulaProficiency(cube, classId));
    setNotice(null);
    setView(timer.getSnapshot().snapshot ? "main" : "config");
    // Re-read stored preferences on each open, not on a parent array reallocation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cube, classId, timer]);

  useEffect(() => {
    if (!open || view !== "main" || snapshotMatches || !state.snapshot) return;
    timer.interrupt();
    if (setupBusy) return;
    if (!timer.getSnapshot().pending && !["loading", "saving", "clearing"].includes(timer.getSnapshot().phase)) {
      setView("config");
      setNotice("algs.practice.updated");
    }
  }, [open, view, snapshotMatches, identity, state.snapshot, state.phase, timer, setupBusy]);

  useEffect(() => {
    return () => { timer.interrupt(); };
  }, [timer]);

  useEffect(() => { setAnswerVisible(false); }, [state.index, state.sessionId, state.revision]);
  useEffect(() => { setNotice(null); }, [state.revision]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      if (view === "main") {
        if (!timer.isBlocked()) timerButtonRef.current?.focus({ preventScroll: true });
      } else contentRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, view, state.sessionId, state.revision, timer]);

  const effectiveTrim = state.snapshot?.trimRatio ?? config.trimRatio;
  useEffect(() => {
    if (!open) return;
    let active = true;
    const request = ++summaryRequest.current;
    setSummaryBusy(true);
    setDataError(false);
    getFormulaPracticeHistorySummary(cube, classId, effectiveTrim).then((result) => {
      if (active && request === summaryRequest.current) setSummary(result);
    }).catch(() => {
      if (active && request === summaryRequest.current) setDataError(true);
    }).finally(() => { if (active && request === summaryRequest.current) setSummaryBusy(false); });
    return () => { active = false; };
  }, [open, cube, classId, effectiveTrim, state.revision, refresh]);

  useEffect(() => {
    if (!open || view !== "history") return;
    let active = true;
    const request = ++historyRequest.current;
    setHistoryBusy(true);
    setHistory(null);
    setDataError(false);
    getFormulaPracticeHistoryPage(cube, classId, page, PAGE_SIZE).then((result) => {
      if (!active || request !== historyRequest.current) return;
      const max = Math.max(1, Math.ceil(result.total / result.pageSize));
      if (page > max) setPage(max);
      else setHistory(result);
    }).catch(() => { if (active && request === historyRequest.current) setDataError(true); })
      .finally(() => { if (active && request === historyRequest.current) setHistoryBusy(false); });
    return () => { active = false; };
  }, [open, view, page, cube, classId, state.revision, refresh]);

  useEffect(() => {
    if (!open) return;
    const interactive = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"]'));
    const eligible = (event: KeyboardEvent, allowRepeat = false) => {
      if (!controls.current.canTime || event.defaultPrevented || event.isComposing || (!allowRepeat && event.repeat) || event.altKey || event.ctrlKey || event.metaKey) return false;
      const target = event.target;
      const root = contentRef.current;
      if (!root || !(target instanceof Element) || target.closest('[role="dialog"]') !== root) return false;
      return target === timerButtonRef.current || !interactive(target);
    };
    const down = (event: KeyboardEvent) => {
      if (event.repeat) {
        if (event.code === "Space" && eligible(event, true)) event.preventDefault();
        return;
      }
      if (!eligible(event)) return;
      const phase = timer.getSnapshot().phase;
      if (phase === "running") {
        event.preventDefault();
        event.stopPropagation();
        if (event.code === "Escape") timer.interrupt();
        else timer.stop();
      } else if (event.code === "Space" && phase === "ready") {
        event.preventDefault();
        timer.arm("keyboard");
      } else if (event.code === "ArrowUp" || event.code === "ArrowDown") {
        event.preventDefault();
        timer.navigate(event.code === "ArrowUp" ? -1 : 1);
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      if (eligible(event)) { event.preventDefault(); timer.release("keyboard"); }
      else timer.cancelArm("keyboard");
    };
    const interrupt = () => timer.interrupt();
    const visibility = () => { if (document.hidden) interrupt(); };
    document.addEventListener("keydown", down);
    document.addEventListener("keyup", up);
    window.addEventListener("blur", interrupt);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("keyup", up);
      window.removeEventListener("blur", interrupt);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [open, timer]);

  function go(next: View) {
    if (timer.isBlocked() || actionLock.current) return;
    if (view === "config" && next === "main" && state.snapshot) {
      setMode(state.snapshot.mode);
      setConfig({ trimRatio: state.snapshot.trimRatio, remindProficiency: state.snapshot.remindProficiency });
      setSelected(new Set(state.snapshot.algs.map(formulaKey)));
    }
    controls.current.canTime = false;
    setNotice(null);
    setView(next);
  }
  function requestClose() {
    const current = timer.getSnapshot();
    if (current.pending || ["saving", "loading", "clearing"].includes(current.phase) || actionLock.current) {
      setNotice("algs.practice.pendingClose"); return;
    }
    if (current.phase === "running") { setNotice("algs.practice.runningClose"); return; }
    timer.interrupt();
    controls.current.canTime = false;
    onClose();
  }
  async function startPractice() {
    if (setupBusy || timer.isBlocked() || actionLock.current || !selectedAlgs.length) return;
    setNotice(null);
    try {
      saveFormulaPracticeSelection(cube, classId, {
        selectedSets: [...new Set(selectedAlgs.map((alg) => alg.setName))],
        selectedGroups: [...new Set(selectedAlgs.map((alg) => buildGroupKey(alg.setName, alg.groupName)))],
        selectedFormulas: selectedAlgs.map(formulaKey),
      });
      saveFormulaPracticeConfig(cube, classId, config);
      if (await timer.configure(draft) && mounted.current) setView("main");
    } catch { if (mounted.current) setNotice("algs.practice.actionError"); }
  }
  function toggle(keys: string[]) {
    setSelected((previous) => {
      const next = new Set(previous);
      const all = keys.every((key) => previous.has(key));
      keys.forEach((key) => all ? next.delete(key) : next.add(key));
      return next;
    });
  }
  function proficiency(key: string, level: ProficiencyLevel) {
    setFormulaProficiency(cube, classId, key, level);
    setProficiencies((previous) => ({ ...previous, [key]: level }));
  }
  function showDetail(record: FormulaPracticeRecord, from: View) {
    if (timer.isBlocked() || actionLock.current) return;
    setDetail({ kind: "record", value: record }); setReturnView(from); go("detail");
  }
  function showQuestion() {
    if (timer.getSnapshot().phase !== "ready" || actionLock.current || !item || !slot) return;
    setDetail({ kind: "question", value: {
      formulaKey: formulaKey(item), formulaName: item.alg.name, setName: item.setName, groupName: item.groupName,
      scramble, scrambleIndex: slot.scrambleIdx, image: item.alg.image ?? "", algs: [...item.alg.algs],
    } });
    setReturnView("main"); go("detail");
  }
  function confirmDelete(record: FormulaPracticeRecord | "clear", from: View) {
    setConfirmation(record); setConfirmationReturn(from); go("confirm");
  }
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function performDeletion() {
    if (actionLock.current || timer.isBlocked() || !confirmation) return;
    actionLock.current = true;
    setActionBusy(true);
    setNotice(null);
    try {
      if (confirmation === "clear") {
        if (!await timer.clearHistory()) { if (mounted.current) setNotice("algs.practice.actionError"); return; }
      } else await deleteFormulaPracticeRecord(cube, classId, confirmation.id);
      if (!mounted.current) return;
      setRefresh((value) => value + 1);
      setView(confirmationReturn === "detail" ? returnView : confirmationReturn);
      setConfirmation(null);
    } catch { if (mounted.current) setNotice("algs.practice.actionError"); }
    finally { actionLock.current = false; if (mounted.current) setActionBusy(false); }
  }

  const groups = new Map<string, Map<string, FormulaItem[]>>();
  const formulaImages = new Map<string, string>();
  flatAlgs.forEach((alg) => {
    formulaImages.set(formulaKey(alg), alg.alg.image ?? "");
    if (!groups.has(alg.setName)) groups.set(alg.setName, new Map());
    const set = groups.get(alg.setName)!;
    if (!set.has(alg.groupName)) set.set(alg.groupName, []);
    set.get(alg.groupName)!.push(alg);
  });
  const records = summary?.recentRecords ?? [];
  const averages = computeAverages(records, effectiveTrim);
  const mean = computeTrimmedMean(records.map((record) => record.timeMs), 0);
  const reminder = state.snapshot?.mode === "weightedRandom" && state.snapshot.remindProficiency && state.lastRecord && state.lastRecord.id !== dismissedReminder ? state.lastRecord : null;
  const detailItem = detail?.value;
  const detailRecord = detail?.kind === "record" ? detail.value : null;
  const detailImage = detailItem ? detailItem.image || formulaImages.get(detailItem.formulaKey) || "" : "";
  const title = view === "config" ? t("algs.practice.config") : view === "history" ? t("algs.formulaPractice.fullHistory") : view === "detail" ? t(detailRecord ? "algs.practice.recordDetail" : "algs.practice.questionDetail") : t("algs.formulaPractice.title");
  const setupLoadingText = locale === "en-US" ? "Preparing missing scrambles. Practice will be available when ready." : "正在为缺失打乱的公式准备打乱，完成后可开始练习。";
  const missingSetupText = locale === "en-US" ? "Some formulas have no usable scramble. You can view or skip them, but cannot start their timer." : "部分公式暂无可用打乱，可查看或切换题目，但不能启动计时。";

  function renderRecords(list: FormulaPracticeRecord[], from: View) {
    return list.map((record) => <div className="fp-record" key={record.id}>
      <button type="button" className="fp-record-open" onClick={() => showDetail(record, from)} disabled={locked}>
        {(record.algs[0] || record.scramble || record.image || formulaImages.get(record.formulaKey)) && <span className="fp-record-image" aria-hidden="true"><AlgsCubeDiagram cube={cube} classId={classId} setName={record.setName} groupName={record.groupName} formula={record.algs[0]} scramble={record.scramble} stateSource="scramble" interactive={false} imageSvg={record.image || formulaImages.get(record.formulaKey)} useVisualCube={Boolean(record.algs[0]?.trim() || record.scramble?.trim())} maxWidth={40} maxHeight={48} /></span>}
        <span className="fp-record-info"><strong>{record.formulaName}</strong><small>{record.setName} / {record.groupName}</small></span>
        <span className="fp-record-time">{formatPracticeTime(record.timeMs)}</span>
      </button>
      <PracticeProficiency disabled={locked} value={proficiencies[record.formulaKey] ?? "average"} onChange={(level) => proficiency(record.formulaKey, level)} />
      <Button size="xs" variant="ghost" disabled={locked} onClick={() => confirmDelete(record, from)}>{t("algs.practice.delete")}</Button>
    </div>);
  }

  return <Dialog.Root open={open} onOpenChange={(event) => { if (!event.open) requestClose(); }} placement="center" size="xl" closeOnInteractOutside={false} closeOnEscape={false}
    onEscapeKeyDown={(event) => {
      event.preventDefault();
      if (timer.getSnapshot().phase === "running" || timer.getSnapshot().phase === "armed") timer.interrupt();
      else if (view !== "main" && view !== "config") go(view === "confirm" ? confirmationReturn : view === "detail" ? returnView : "main");
      else requestClose();
    }}>
    <Dialog.Backdrop />
    <Dialog.Positioner className="fp-positioner">
      <Dialog.Content ref={contentRef} colorPalette="brand" className={`formula-practice-modal fp-dialog ${running ? "fp-running" : ""}`} aria-busy={setupBusy || state.phase === "loading" || actionBusy}>
        <Dialog.Header className="fp-header">
          <div><Dialog.Title>{title}</Dialog.Title><Dialog.Description className="fp-meta">{cube} / {classId}</Dialog.Description></div>
          <div className="fp-actions">
            {view !== "main" && state.sessionId && <Button size="sm" variant="ghost" disabled={locked} onClick={() => go(view === "confirm" ? confirmationReturn : view === "detail" ? returnView : "main")}>{t("algs.practice.back")}</Button>}
            <CloseButton className="fp-close" size="sm" variant="ghost" aria-label={t("algs.practice.close")} title={t("algs.practice.close")} onClick={requestClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </CloseButton>
          </div>
        </Dialog.Header>
        <Dialog.Body className="fp-body">
          {notice && <div className="fp-notice" role="status">{t(notice)}</div>}
          {setupBusy ? <div className="fp-notice" role="status">{setupLoadingText}</div> : flatAlgs.some((alg) => !hasPracticeScramble(alg.alg.scrambles)) && <div className="fp-notice" role="status">{missingSetupText}</div>}
          {state.pending && <div className="fp-notice" role="status">
            <strong>{formatPracticeTime(state.pending.timeMs)} · {state.pending.formulaName}</strong>
            <p>{t(state.phase === "saving" ? "algs.practice.saving" : "algs.practice.saveError")}</p>
            {state.phase === "error" && <Button size="sm" colorPalette="brand" onClick={() => timer.retry()}>{t("algs.practice.retry")}</Button>}
          </div>}
          {state.phase === "error" && !state.pending && <div className="fp-notice" role="alert">{t("algs.practice.sessionError")} <Button size="sm" disabled={setupBusy} onClick={startPractice}>{t("algs.practice.retry")}</Button></div>}
          {dataError && <div className="fp-notice" role="status">{t("algs.practice.dataError")} <Button size="sm" variant="outline" onClick={() => setRefresh((value) => value + 1)}>{t("algs.practice.retry")}</Button></div>}

          {view === "config" && <div className="fp-config">
            <fieldset disabled={locked} className="fp-fieldset">
              <legend>{t("algs.formulaPractice.mode")}</legend>
              <div className="fp-modes">{(Object.keys(MODES) as FormulaPracticeMode[]).map((value) => <label key={value} className={mode === value ? "fp-mode fp-selected" : "fp-mode"}>
                <input type="radio" name="fp-mode" checked={mode === value} onChange={() => setMode(value)} />{t(MODES[value])}
              </label>)}</div>
            </fieldset>
            <fieldset disabled={locked} className="fp-fieldset">
              <legend>{tf("algs.formulaPractice.selectedCount", { count: selectedAlgs.length })}</legend>
              <div className="fp-actions"><Button size="sm" variant="outline" onClick={() => setSelected(new Set(flatAlgs.map(formulaKey)))}>{t("algs.detail.selectAll")}</Button><Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>{t("algs.detail.deselectAll")}</Button></div>
              {[...groups].map(([setName, set]) => <section className="fp-set" key={setName}>
                <Button size="sm" variant="outline" aria-pressed={[...set.values()].flat().every((alg) => selected.has(formulaKey(alg)))} onClick={() => toggle([...set.values()].flat().map(formulaKey))}>{setName}</Button>
                {[...set].map(([groupName, algs]) => <div className="fp-group" key={groupName}>
                  <Button size="xs" variant="ghost" aria-pressed={algs.every((alg) => selected.has(formulaKey(alg)))} onClick={() => toggle(algs.map(formulaKey))}>{groupName}</Button>
                  <div className="fp-choices">{algs.map((alg) => <label key={formulaKey(alg)}><input type="checkbox" checked={selected.has(formulaKey(alg))} onChange={() => toggle([formulaKey(alg)])} />{alg.alg.name}{!setupBusy && !hasPracticeScramble(alg.alg.scrambles) && <small className="fp-meta"> · {t("algs.formulaPractice.noScramble")}</small>}</label>)}</div>
                </div>)}
              </section>)}
            </fieldset>
            <fieldset disabled={locked} className="fp-fieldset">
              <legend>{t("algs.formulaPractice.trimRatio")}</legend>
              <label className="fp-range"><span>{config.trimRatio}%</span><input type="range" min={0} max={50} step={1} aria-label={t("algs.formulaPractice.trimRatio")} value={config.trimRatio} onChange={(event) => setConfig({ ...config, trimRatio: Number(event.target.value) })} /></label>
              <p className="fp-meta">{tf("algs.formulaPractice.trimRatioDesc", { p: config.trimRatio })}</p>
              <label className="fp-check"><input type="checkbox" checked={config.remindProficiency} onChange={(event) => setConfig({ ...config, remindProficiency: event.target.checked })} />{t("algs.practice.remind")}</label>
            </fieldset>
            {!selectedAlgs.length && <p role="status">{t("algs.practice.emptySelection")}</p>}
            <Button colorPalette="brand" size="lg" disabled={setupBusy || locked || !selectedAlgs.length} loading={setupBusy || state.phase === "loading"} onClick={startPractice}>{t(snapshotMatches && state.sessionId ? "algs.practice.resume" : "algs.formulaPractice.start")}</Button>
          </div>}

          {view === "main" && <div className="fp-layout">
            <section className="fp-stage" aria-label={t("algs.formulaPractice.timerZone")}>
              <div className="fp-stage-top"><span className="fp-meta">{state.snapshot ? t(MODES[state.snapshot.mode]) : ""}</span><span className="fp-meta">{tf("algs.formulaPractice.formulaNavHint", { current: state.slots.length ? state.index + 1 : 0, total: state.slots.length })}</span></div>
              <p className="fp-scramble">{displayPracticeScramble(scramble) || t("algs.formulaPractice.noScramble")}</p>
              <button type="button" ref={timerButtonRef} className={`fp-timer fp-timer-${state.phase}`} aria-label={`${t(PHASE_LABELS[state.phase])}. ${t("algs.practice.controls")}`} aria-describedby="fp-instructions" disabled={!canTime || !["ready", "armed", "running"].includes(state.phase)}
                onKeyDown={(event) => {
                  if (event.code !== "Enter") return;
                  event.preventDefault();
                  if (event.repeat || event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey || !canTime) return;
                  if (timer.getSnapshot().phase === "running") timer.stop();
                  else if (timer.arm("activation")) timer.release("activation");
                }}
                onPointerDown={(event) => {
                  if (!event.isPrimary || event.button !== 0 || !canTime) return;
                  event.preventDefault();
                  event.currentTarget.focus({ preventScroll: true });
                  if (timer.getSnapshot().phase === "running") { timer.stop(); return; }
                  if (timer.arm(`pointer:${event.pointerId}`)) event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerUp={(event) => {
                  if (!event.isPrimary || event.button !== 0) return;
                  event.preventDefault();
                  if (canTime) timer.release(`pointer:${event.pointerId}`);
                  else timer.cancelArm(`pointer:${event.pointerId}`);
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                onPointerCancel={(event) => timer.cancelArm(`pointer:${event.pointerId}`)}
                onLostPointerCapture={(event) => timer.cancelArm(`pointer:${event.pointerId}`)}
                onBlur={() => timer.cancelArm("keyboard")}
                onClick={(event) => {
                  // Native Enter/assistive activation has no pointer sequence. Space is handled on keyup.
                  if (event.detail !== 0 || !canTime) return;
                  if (timer.getSnapshot().phase === "running") timer.stop();
                  else if (timer.arm("activation")) timer.release("activation");
                }}>
                <TimerDigits state={state} open={open} /><span className="fp-timer-label">{t(PHASE_LABELS[state.phase])}</span>
              </button>
              <p id="fp-instructions" className="fp-meta fp-instructions">{t("algs.practice.controls")}</p>
              <div className="fp-actions fp-navigation">
                <Button variant="outline" size="sm" disabled={locked} onClick={() => timer.navigate(-1)}>{t("algs.practice.previous")}</Button>
                <Button variant="outline" size="sm" disabled={locked} onClick={() => timer.navigate(1)}>{t("algs.practice.next")}</Button>
                {(running || state.phase === "armed") && <Button size="sm" variant="outline" onClick={() => timer.interrupt()}>{t("algs.practice.interrupt")}</Button>}
              </div>
              {state.interrupted && <p className="fp-meta" role="status">{t("algs.practice.interrupted")}</p>}
              <div className="fp-answer">
                <Button size="sm" variant="ghost" disabled={locked} aria-expanded={answerVisible} onClick={() => setAnswerVisible(!answerVisible)}>{t(answerVisible ? "algs.practice.hideAnswer" : "algs.practice.showAnswer")}</Button>
                <Button size="sm" variant="ghost" disabled={locked || state.phase !== "ready" || !item} onClick={showQuestion}>{t("algs.practice.questionDetail")}</Button>
                {answerVisible && item && <div className="fp-answer-content">
                  {item.alg.algs[0] || scramble || item.alg.image ? <AlgsCubeDiagram cube={cube} classId={classId} setName={item.setName} groupName={item.groupName} formula={item.alg.algs[0]} scramble={scramble} stateSource="scramble" interactive={false} imageSvg={item.alg.image} useVisualCube={Boolean(item.alg.algs[0]?.trim() || scramble.trim())} maxWidth={140} maxHeight={140} style={{ width: 140, maxWidth: "100%" }} /> : <span className="fp-meta">{t("algs.practice.noImage")}</span>}
                  <div><h3>{item.alg.name}</h3><p className="fp-meta">{item.setName} / {item.groupName}</p>{item.alg.algs.map((alg, index) => <p className="fp-alg" key={index}>{alg}</p>)}</div>
                </div>}
              </div>
            </section>
            <aside className="fp-sidebar" inert={running || state.phase === "armed" ? true : undefined}>
              <div className="fp-actions"><Button size="sm" variant="outline" disabled={locked} onClick={() => go("config")}>{t("algs.practice.config")}</Button><Button size="sm" variant="ghost" disabled={locked} onClick={() => { setPage(1); go("history"); }}>{t("algs.formulaPractice.viewAllHistory")} ({summary?.total ?? 0})</Button></div>
              <section className="fp-stats" aria-busy={summaryBusy}>
                <p className="fp-meta">{tf("algs.practice.mean", { count: records.length })}</p><strong className="fp-mean">{mean === null ? "—" : formatPracticeTime(mean)}</strong>
                <p className="fp-meta">{tf("algs.practice.statistics", { trim: effectiveTrim })}</p>
                <dl className="fp-averages">{([50, 100, 1000] as const).map((n) => <div key={n}><dt>ao{n}</dt><dd>{averages[`ao${n}`] === null ? records.length < n ? tf("algs.practice.progress", { count: records.length, total: n }) : "—" : formatPracticeTime(averages[`ao${n}`]!)}</dd></div>)}</dl>
                {effectiveTrim === 50 && records.length >= 50 && <p className="fp-meta">{t("algs.practice.trimUnavailable")}</p>}
              </section>
              {reminder && <section className="fp-reminder" aria-label={t("algs.formulaPractice.proficiencyRemindTitle")}>
                <p>{tf("algs.formulaPractice.proficiencyRemindDesc", { name: reminder.formulaName })}</p>
                <div className="fp-actions"><PracticeProficiency disabled={locked} value={proficiencies[reminder.formulaKey] ?? "average"} onChange={(level) => { proficiency(reminder.formulaKey, level); setDismissedReminder(reminder.id); }} /><Button size="xs" variant="ghost" onClick={() => setDismissedReminder(reminder.id)}>{t("algs.practice.skip")}</Button></div>
              </section>}
              <section><h3 className="fp-section-title">{t("algs.formulaPractice.historyTitle")}</h3>{summaryBusy && !summary ? <p className="fp-meta">{t("algs.practice.loadingHistory")}</p> : !records.length ? <p className="fp-meta">{t("algs.formulaPractice.historyEmpty")}</p> : renderRecords(records.slice(0, 3), "main")}</section>
            </aside>
          </div>}

          {view === "history" && <section aria-busy={historyBusy}>
            <div className="fp-history-heading"><p className="fp-meta">{tf("algs.formulaPractice.totalRecords", { total: history?.total ?? summary?.total ?? 0 })}</p><Button size="sm" variant="outline" disabled={locked || !(history?.total ?? summary?.total)} onClick={() => confirmDelete("clear", "history")}>{t("algs.formulaPractice.clearHistory")}</Button></div>
            {historyBusy ? <p role="status">{t("algs.practice.loadingHistory")}</p> : history && !history.records.length ? <p>{t("algs.formulaPractice.historyEmpty")}</p> : renderRecords(history?.records ?? [], "history")}
            {history && <nav className="fp-pagination" aria-label={t("algs.formulaPractice.fullHistory")}>
              <Button size="sm" variant="outline" disabled={locked || historyBusy || page <= 1} onClick={() => setPage((value) => value - 1)}>{t("algs.practice.previousPage")}</Button>
              <span className="fp-meta">{tf("algs.practice.page", { page: history.page, pages: Math.max(1, Math.ceil(history.total / PAGE_SIZE)), total: history.total })}</span>
              <Button size="sm" variant="outline" disabled={locked || historyBusy || page >= Math.ceil(history.total / PAGE_SIZE)} onClick={() => setPage((value) => value + 1)}>{t("algs.practice.nextPage")}</Button>
            </nav>}
          </section>}
          {view === "detail" && detailItem && <section className="fp-detail">
            <div className="fp-history-heading"><div><h2>{detailItem.formulaName}</h2><p className="fp-meta">{detailItem.setName} / {detailItem.groupName}</p></div>{detailRecord && <strong className="fp-mean">{formatPracticeTime(detailRecord.timeMs)}</strong>}</div>
            {detailRecord && <p className="fp-meta">{new Date(detailRecord.createdAt).toLocaleString(locale)}</p>}
            <p className="fp-scramble">{displayPracticeScramble(detailItem.scramble)}</p>
            {detailItem.algs[0] || detailItem.scramble || detailImage ? <AlgsCubeDiagram cube={cube} classId={classId} setName={detailItem.setName} groupName={detailItem.groupName} formula={detailItem.algs[0]} scramble={detailItem.scramble} stateSource="scramble" interactive imageSvg={detailImage} useVisualCube={Boolean(detailItem.algs[0]?.trim() || detailItem.scramble?.trim())} maxWidth={200} maxHeight={200} /> : <p className="fp-meta">{t("algs.practice.noImage")}</p>}
            <h3>{t("algs.practice.answer")}</h3>{detailItem.algs.map((alg, index) => <p className="fp-alg" key={index}>{alg}</p>)}
            <div className="fp-actions"><PracticeProficiency value={proficiencies[detailItem.formulaKey] ?? "average"} onChange={(level) => proficiency(detailItem.formulaKey, level)} />{detailRecord && <Button variant="outline" onClick={() => confirmDelete(detailRecord, "detail")}>{t("algs.practice.delete")}</Button>}</div>
          </section>}
          {view === "confirm" && <section className="fp-confirm" aria-busy={actionBusy}>
            <h2>{t(confirmation === "clear" ? "algs.formulaPractice.clearHistory" : "algs.practice.delete")}</h2>
            <p>{t(confirmation === "clear" ? "algs.practice.confirmClear" : "algs.formulaPractice.confirmDelete")}</p>
            <div className="fp-actions"><Button variant="outline" disabled={actionBusy} onClick={() => go(confirmationReturn)}>{t("algs.practice.cancel")}</Button><Button colorPalette="red" loading={actionBusy} disabled={actionBusy} onClick={performDeletion}>{t("algs.practice.confirmAction")}</Button></div>
          </section>}
        </Dialog.Body>
      </Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Root>;
}
