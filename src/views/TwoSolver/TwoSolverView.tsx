"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { useI18n } from "@/contexts/I18nProvider";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n";
import type { twoSolverMainZhCN } from "@/i18n/messages/two-solver-main";
import { parseMoves } from "./engine/state";
import { SCORE_VERSION } from "./engine/ergonomicsScale";
import { METHODS, DEFAULT_METHODS, DEFAULT_FAMILY_DEPTHS, COLORS, familyOf, type FamilyDepths, type MethodFamily, type MethodId, type SearchOptions, type SearchResult, type Solution } from "./engine/types";
import { useTwoSolver } from "./useTwoSolver";
import SolutionCards from "./SolutionCards";
import SolverCube from "./SolverCube";
import PracticeStats from "./PracticeStats";
import { adjustedTime, formatTime, usePracticeTimer, type PracticeQuestion, type PracticeRecord, type Penalty } from "./uiPractice";
import styles from "./TwoSolver.module.css";
import { localizeEngineText } from "./solverMessages";

const EXAMPLE = "R U R' F2 U' R2 F U2 R'";
const INITIAL_OPTIONS: SearchOptions = {
  methods: [...DEFAULT_METHODS], colors: COLORS.map((color) => color.id), maxDepth: 5,
  moveSet: "ruf", maxSolutions: 20, timeLimitMs: 8000,
  familyDepths: { ...DEFAULT_FAMILY_DEPTHS }, maxOverlap: 1, forbidTransitionRotations: true,
};
const SETTINGS_KEY = "cubing.pro.two-solver.settings.v1";
const UI_KEY = "cubing.pro.two-solver.ui.v1";
const SOLUTION_LIMITS = [20, 50, 100, 250, 500];
const TIME_LIMITS = [3000, 8000, 15000, 30000];
type Snapshot = Readonly<{ scramble: string; options: SearchOptions; result: SearchResult }>;
type Question = PracticeQuestion & Snapshot & { searchOptions: SearchOptions };
type Filters = { method: string; color: string; base: string; moves: string; ergonomics: string; cancelled: string; regrips: string; text: string; group: string };
const INITIAL_FILTERS: Filters = { method: "", color: "", base: "", moves: "", ergonomics: "", cancelled: "", regrips: "", text: "", group: "" };
type Sampling = { special: boolean; method: string; base: string; moves: string; cancelled: number; attempts: number };
const INITIAL_SAMPLING: Sampling = { special: false, method: "", base: "", moves: "", cancelled: 0, attempts: 20 };
type Display = { timerFont: number; precision: 0 | 1 | 2 | 3; runningDisplay: "live" | "seconds" | "hidden"; focus: boolean; showCube: boolean; cubeSize: 180 | 240; holdMs: 0 | 300 | 550; fullscreen: boolean; showStats: boolean; chartWindow: 20 | 50 | 100 | 200 };
const INITIAL_DISPLAY: Display = { timerFont: 120, precision: 2, runningDisplay: "live", focus: true, showCube: true, cubeSize: 180, holdMs: 300, fullscreen: true, showStats: true, chartWindow: 50 };
type ConfigPanel = "search" | "filters" | "practice" | "timer" | "display";
type ConfigKind = "analysis" | "practice" | "timer";
type Activity = "analysis" | "generate" | "practice" | "review";
const CONFIG_PANELS = [{ id: "search", label: "two.main.search", kind: "analysis" }, { id: "filters", label: "two.main.filters", kind: "analysis" }, { id: "practice", label: "two.main.practice", kind: "practice" }, { id: "timer", label: "two.main.timer", kind: "timer" }, { id: "display", label: "two.main.display", kind: "timer" }] as const;
const SORTS = ["recommended", "moves", "base", "ergonomics"];

type MainMessageKey = keyof typeof twoSolverMainZhCN;
const COLOR_KEYS: Record<string, MainMessageKey> = { U: "two.main.color.U", R: "two.main.color.R", F: "two.main.color.F", D: "two.main.color.D", L: "two.main.color.L", B: "two.main.color.B" };
type MessageValue = { key: MainMessageKey; params?: Record<string, string | number | MessageValue> } | { text: string } | { record: PracticeRecord; precision: Display["precision"]; currentSettings: boolean };
const message = (key: MainMessageKey, params?: Record<string, string | number | MessageValue>): MessageValue => ({ key, params });
const errorMessage = (error: unknown, fallback: MainMessageKey): MessageValue => error instanceof Error ? { text: error.message } : message(fallback);

type ConditionalSample = { kind: "conditional"; method: string; base: string; moves: string; cancelled: number; attempt: number; attempts: number };

// Migrate only the historical sampling schema, never arbitrary UI or source text.
function readSampling(value: string): ConditionalSample | "random" | null {
  if (["random", "随机练习", "Random practice"].includes(value)) return "random";
  const legacy = /^条件抽样：(.+?)；做底深度 (\d+|不限)；总步数上限 (\d+|不限)；消步 ≥ (\d+)；第 (\d+)\/(\d+) 次命中$/.exec(value);
  if (legacy) return { kind: "conditional", method: legacy[1] === "任意所选方法" ? "" : legacy[1], base: legacy[2] === "不限" ? "" : legacy[2], moves: legacy[3] === "不限" ? "" : legacy[3], cancelled: Number(legacy[4]), attempt: Number(legacy[5]), attempts: Number(legacy[6]) };
  try {
    const sample: unknown = JSON.parse(value);
    if (!sample || typeof sample !== "object") return null;
    const s = sample as Partial<ConditionalSample>;
    if (s.kind === "conditional" && typeof s.method === "string" && typeof s.base === "string" && typeof s.moves === "string"
      && [s.cancelled, s.attempt, s.attempts].every(n => typeof n === "number" && Number.isFinite(n) && n >= 0)) return s as ConditionalSample;
  } catch { /* Preserve unrecognized historical source text. */ }
  return null;
}

function cloneOptions(value: SearchOptions): SearchOptions {
  return { ...value, methods: [...value.methods], colors: [...value.colors], familyDepths: { ...DEFAULT_FAMILY_DEPTHS, ...value.familyDepths } };
}

function optionsKey(value: SearchOptions) {
  return JSON.stringify({ ...value, methods: [...value.methods].sort(), colors: [...value.colors].sort(),
    familyDepths: Object.fromEntries(Object.keys(DEFAULT_FAMILY_DEPTHS).map(f => [f, value.familyDepths?.[f as MethodFamily] ?? DEFAULT_FAMILY_DEPTHS[f as MethodFamily]])) });
}

function ScramblePreview({ scramble, size }: { scramble: string; size: 180 | 240 }) {
  const { t } = useI18n();
  let setup: string | null = null;
  if (scramble.trim()) {
    try {
      setup = parseMoves(scramble).join(" ");
    } catch { /* Invalid notation is explained without mounting the native renderer. */ }
  }
  return <div className={styles.scramblePreview}>
    {setup !== null ? <SolverCube setup={setup} alg="" label={t("two.main.preview3d")} height={size} /> : <span className={styles.small}>{scramble.trim() ? t("two.main.previewInvalid") : t("two.main.waitingScramble")}</span>}
  </div>;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const id = useId();
  return <label className={styles.field}><span id={id}>{label}</span>{isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-labelledby"?: string }>, { "aria-labelledby": id }) : children}{hint && <small>{hint}</small>}</label>;
}

function matchesSample(solution: Solution, sample: Sampling) {
  return (!sample.method || solution.method === sample.method)
    && (sample.base === "" || solution.baseMoves === Number(sample.base))
    && (sample.moves === "" || solution.moves <= Number(sample.moves))
    && solution.cancelled >= sample.cancelled;
}

function ResultNotice({ snapshot }: { snapshot: Snapshot }) {
  const { locale, t, tf } = useI18n();
  const { result, options } = snapshot;
  const number = new Intl.NumberFormat(locale);
  const seconds = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(result.elapsedMs / 1000);
  const reason = tf(`two.main.reason.${result.reason}`, { count: number.format(options.maxSolutions) });
  return <details className={styles.resultNotice}>
    <summary>{t("two.main.searchDetails")} <span>{tf(`two.main.result.${result.reason === "complete" ? result.complete ? "complete" : "partial" : result.reason}`, { count: number.format(options.maxSolutions) })} · {seconds}s</span></summary>
    <p>{reason} {t("two.main.notOptimal")}</p>
    <p>{tf("two.main.result.metrics", { nodes: number.format(result.nodes), seconds, depth: number.format(result.depthReached), moves: options.moveSet === "ruf" ? "R U F" : t("two.main.allFaces"), overlap: number.format(options.maxOverlap ?? 1) })}</p>
    <p>{tf("two.main.result.families", { limits: [...new Set(options.methods.map(familyOf))].map(f => `${f} ${number.format(options.familyDepths?.[f] ?? options.maxDepth)}`).join(" · ") })}</p>
    <p>{tf("two.main.result.data", { loaded: number.format(result.data.loaded), rejected: number.format(result.data.rejected) })}</p>
  </details>;
}

export default function TwoSolverView() {
  const { locale, setLocale, t, tf } = useI18n();
  const [draftLocale, setDraftLocale] = useState<Locale>(locale);
  const number = new Intl.NumberFormat(locale);
  function renderMessage(value: MessageValue | null): string {
    if (!value) return "";
    if ("text" in value) return localizeEngineText(value.text, locale);
    if ("record" in value) return tf("two.main.historyReview", { time: formatTime(adjustedTime(value.record), value.precision), date: new Date(value.record.date).toLocaleString(locale), settings: value.currentSettings ? t("two.main.currentSettings") : "" });
    return value.params ? tf(value.key, Object.fromEntries(Object.entries(value.params).map(([key, param]) => [key, typeof param === "object" ? renderMessage(param) : typeof param === "number" ? number.format(param) : param]))) : t(value.key);
  }
  function displaySampling(value: string): string {
    const sample = readSampling(value);
    if (sample === "random") return t("two.main.sampling.random");
    if (!sample) return value;
    return renderMessage(message("two.main.sampling.conditional", { method: sample.method || message("two.main.anyMethod"), base: sample.base ? Number(sample.base) : message("two.main.unlimited"), moves: sample.moves ? Number(sample.moves) : message("two.main.unlimited"), cancelled: sample.cancelled, attempt: sample.attempt, attempts: sample.attempts }));
  }
  const solver = useTwoSolver();
  const [tab, setTab] = useState<"analysis" | "practice">("analysis");
  const [scramble, setScramble] = useState(EXAMPLE);
  const [options, setOptions] = useState<SearchOptions>(INITIAL_OPTIONS);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [settingsError, setSettingsError] = useState<MessageValue | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [configKind, setConfigKind] = useState<ConfigKind>("analysis");
  const [configPanel, setConfigPanel] = useState<ConfigPanel>("search");
  const [visibleCount, setVisibleCount] = useState(20);
  const [shown, setShown] = useState<Snapshot | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [inspection, setInspection] = useState(true);
  const [sampling, setSampling] = useState<Sampling>(INITIAL_SAMPLING);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [sort, setSort] = useState("recommended");
  const [display, setDisplay] = useState<Display>(INITIAL_DISPLAY);
  const [uiHydrated, setUiHydrated] = useState(false);
  const [draftOptions, setDraftOptions] = useState<SearchOptions>(() => cloneOptions(INITIAL_OPTIONS));
  const [draftFilters, setDraftFilters] = useState<Filters>(INITIAL_FILTERS);
  const [draftSort, setDraftSort] = useState("recommended");
  const [draftSampling, setDraftSampling] = useState<Sampling>(INITIAL_SAMPLING);
  const [draftInspection, setDraftInspection] = useState(true);
  const [draftDisplay, setDraftDisplay] = useState<Display>(INITIAL_DISPLAY);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reviewSnapshot, setReviewSnapshot] = useState<Snapshot | null>(null);
  const [reviewEditorOpen, setReviewEditorOpen] = useState(false);
  const [reviewScramble, setReviewScramble] = useState("");
  const [reviewLabel, setReviewLabel] = useState<MessageValue | null>(null);
  const reviewRequest = useRef<{ scramble: string; options: SearchOptions; label: MessageValue } | null>(null);
  const configButton = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [retryActivity, setRetryActivity] = useState<Activity>("practice");
  const [status, setStatus] = useState<MessageValue | null>(null);
  const [uiError, setUiError] = useState<MessageValue | null>(null);
  const [failed, setFailed] = useState(false);
  const operation = useRef(0);
  const running = useRef(false);
  const cancelRef = useRef(solver.cancel);
  const autoToken = useRef<number | null>(null);
  const analyzeRef = useRef<() => Promise<void>>(async () => {});
  const nextQuestionRef = useRef<(start?: boolean) => Promise<void>>(async () => {});
  const initialPracticeAttempted = useRef(false);
  const pendingStartRef = useRef<string | null>(null);
  const timer = usePracticeTimer(question, inspection, tab === "practice" && !pending && !settingsOpen && uiHydrated, display.holdMs,
    () => { void nextQuestionRef.current(true); },
    () => { setReviewSnapshot(null); setReviewEditorOpen(false); setRevealed(false); });
  const locked = !settingsHydrated || !uiHydrated || pending || solver.busy || timer.isTiming;
  const controlsLocked = !settingsHydrated || !uiHydrated || timer.isTiming || (pending && activity !== "analysis");
  const invalidSelection = options.methods.length === 0 || options.colors.length === 0;

  useEffect(() => { cancelRef.current = solver.cancel; }, [solver.cancel]);
  useEffect(() => () => { operation.current++; running.current = false; cancelRef.current(); }, []);
  useEffect(() => { setVisibleCount(20); }, [shown, question, reviewSnapshot, filters, sort]);
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
      if (stored !== null) {
        if (typeof stored !== "object" || Array.isArray(stored)) throw new Error();
        const value = stored as Partial<SearchOptions>;
        if (!Array.isArray(value.methods) || !value.methods.every((id) => METHODS.some((method) => method.id === id))
          || !Array.isArray(value.colors) || !value.colors.every((id) => COLORS.some((color) => color.id === id))
          || !Number.isInteger(value.maxDepth) || value.maxDepth! < 0 || value.maxDepth! > 6
          || !["ruf", "all"].includes(value.moveSet || "")) throw new Error();
        const familyDepths = { ...DEFAULT_FAMILY_DEPTHS } as FamilyDepths;
        if (value.familyDepths !== undefined) {
          if (!value.familyDepths || typeof value.familyDepths !== "object" || Object.keys(familyDepths).some(f => !Number.isInteger(value.familyDepths![f as MethodFamily]) || value.familyDepths![f as MethodFamily] < 0 || value.familyDepths![f as MethodFamily] > 6)) throw new Error();
          Object.assign(familyDepths, value.familyDepths);
        }
        if (value.maxOverlap !== undefined && (!Number.isInteger(value.maxOverlap) || value.maxOverlap < 0 || value.maxOverlap > 6)) throw new Error();
        setOptions({ ...INITIAL_OPTIONS, methods: [...new Set(value.methods)], colors: [...new Set(value.colors)],
          maxDepth: Math.max(...Object.values(familyDepths)), familyDepths, maxOverlap: value.maxOverlap ?? 1,
          forbidTransitionRotations: typeof value.forbidTransitionRotations === "boolean" ? value.forbidTransitionRotations : true, moveSet: value.moveSet!,
          maxSolutions: SOLUTION_LIMITS.includes(value.maxSolutions ?? 0) ? value.maxSolutions! : INITIAL_OPTIONS.maxSolutions,
          timeLimitMs: TIME_LIMITS.includes(value.timeLimitMs ?? 0) ? value.timeLimitMs! : INITIAL_OPTIONS.timeLimitMs });
      }
    } catch { setSettingsError(message("two.main.settings.readSearch")); }
    setSettingsHydrated(true);
  }, []);
  useEffect(() => {
    if (!settingsHydrated) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(options));
    } catch { setSettingsError(message("two.main.settings.saveSearch")); }
  }, [options, settingsHydrated]);
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(UI_KEY) || "null");
      if (stored !== null) {
        if (typeof stored !== "object" || Array.isArray(stored)) throw new Error();
        const value = stored as { version?: number; scoreVersion?: string; scramble?: string; display?: Partial<Display>; filters?: Partial<Filters>; sort?: string; sampling?: Partial<Sampling>; inspection?: boolean };
        if (value.version !== 1) throw new Error();
        if (typeof value.scramble === "string" && value.scramble.length <= 4000) setScramble(value.scramble);
        const d = value.display;
        if (d && typeof d === "object") setDisplay({
          timerFont: Number.isInteger(d.timerFont) && d.timerFont! >= 80 && d.timerFont! <= 200 ? d.timerFont! : 120,
          precision: [0, 1, 2, 3].includes(d.precision ?? -1) ? d.precision! : 2,
          runningDisplay: ["live", "seconds", "hidden"].includes(d.runningDisplay ?? "") ? d.runningDisplay! : "live",
          focus: typeof d.focus === "boolean" ? d.focus : true,
          showCube: typeof d.showCube === "boolean" ? d.showCube : true,
          cubeSize: d.cubeSize === 240 ? 240 : 180,
          holdMs: [0, 300, 550].includes(d.holdMs ?? -1) ? d.holdMs! : 300,
          fullscreen: typeof d.fullscreen === "boolean" ? d.fullscreen : true,
          showStats: typeof d.showStats === "boolean" ? d.showStats : true,
          chartWindow: [20, 50, 100, 200].includes(d.chartWindow ?? -1) ? d.chartWindow! : 50,
        });
        if (value.filters && typeof value.filters === "object") {
          const f = { ...INITIAL_FILTERS };
          for (const key of Object.keys(f) as (keyof Filters)[]) {
            const item = value.filters[key];
            if (typeof item === "string") f[key] = item;
          }
          const threshold = Number(f.ergonomics);
          if (value.scoreVersion !== SCORE_VERSION || (f.ergonomics !== "" && (!Number.isInteger(threshold)
            || threshold < 1 || threshold > 100 || String(threshold) !== f.ergonomics))) f.ergonomics = "";
          setFilters(f);
        }
        if (SORTS.includes(value.sort ?? "")) setSort(value.sort!);
        if (typeof value.inspection === "boolean") setInspection(value.inspection);
        const s = value.sampling;
        if (s && typeof s === "object") setSampling({
          special: s.special === true,
          method: METHODS.some(m => m.id === s.method) ? s.method! : "",
          base: typeof s.base === "string" && /^[0-6]?$/.test(s.base) ? s.base : "",
          moves: typeof s.moves === "string" && (s.moves === "" || (/^\d+$/.test(s.moves) && Number(s.moves) <= 100)) ? s.moves : "",
          cancelled: Number.isInteger(s.cancelled) && s.cancelled! >= 0 && s.cancelled! <= 100 ? s.cancelled! : 0,
          attempts: Number.isInteger(s.attempts) && s.attempts! >= 1 && s.attempts! <= 100 ? s.attempts! : 20,
        });
      }
    } catch { setSettingsError(message("two.main.settings.readUi")); }
    setUiHydrated(true);
  }, []);
  useEffect(() => {
    if (!uiHydrated) return;
    try { localStorage.setItem(UI_KEY, JSON.stringify({ version: 1, scoreVersion: SCORE_VERSION, scramble, display, filters, sort, sampling, inspection })); }
    catch { setSettingsError(message("two.main.settings.saveUi")); }
  }, [uiHydrated, scramble, display, filters, sort, sampling, inspection]);
  useEffect(() => { analyzeRef.current = analyze; });
  useEffect(() => { nextQuestionRef.current = nextQuestion; });
  useEffect(() => {
    if (tab !== "practice" || !settingsHydrated || !uiHydrated || question || initialPracticeAttempted.current || pending || solver.busy || settingsOpen) return;
    // Deferring keeps Strict Mode's setup/cleanup probe from consuming the attempt.
    const timeout = window.setTimeout(() => {
      if (initialPracticeAttempted.current || running.current) return;
      initialPracticeAttempted.current = true;
      void nextQuestionRef.current();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [tab, settingsHydrated, uiHydrated, question, pending, solver.busy, settingsOpen]);
  useEffect(() => {
    if (tab !== "practice") return;
    const currentOperation = operation;
    return () => {
      initialPracticeAttempted.current = false;
      pendingStartRef.current = null;
      if (running.current) {
        currentOperation.current++;
        running.current = false;
        cancelRef.current();
        setPending(false);
        setActivity(null);
      }
    };
  }, [tab]);
  useEffect(() => {
    if (timer.phase === "stopped" && question && timer.history.some(record => record.id === question.id)) setRevealed(true);
    if (timer.isTiming) {
      setRevealed(false);
      setReviewSnapshot(null);
      setReviewEditorOpen(false);
      setStatus(null);
    }
  }, [timer.phase, timer.isTiming, timer.history, question]);
  useEffect(() => {
    if (tab !== "practice" || pending || settingsOpen || !uiHydrated || !timer.hydrated || timer.phase !== "idle" || !question || pendingStartRef.current !== question.id) return;
    pendingStartRef.current = null;
    timer.action();
  }, [tab, pending, settingsOpen, uiHydrated, question, timer]);
  const practiceFullscreen = tab === "practice" && display.fullscreen;
  useEffect(() => {
    if (!practiceFullscreen) return;
    const overflow = document.body.style.overflow;
    const attribute = document.body.getAttribute("data-two-practice-active");
    const headers = Array.from(document.querySelectorAll<HTMLElement>("[data-app-header]"));
    const previous = headers.map(header => ({ header, inert: header.inert, hidden: header.getAttribute("aria-hidden"), visibility: header.style.visibility }));
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-two-practice-active", "true");
    previous.forEach(({ header }) => { header.inert = true; header.setAttribute("aria-hidden", "true"); header.style.visibility = "hidden"; });
    return () => {
      document.body.style.overflow = overflow;
      if (attribute === null) document.body.removeAttribute("data-two-practice-active");
      else document.body.setAttribute("data-two-practice-active", attribute);
      previous.forEach(({ header, inert, hidden, visibility }) => {
        header.inert = inert;
        header.style.visibility = visibility;
        if (hidden === null) header.removeAttribute("aria-hidden"); else header.setAttribute("aria-hidden", hidden);
      });
    };
  }, [practiceFullscreen]);
  useEffect(() => {
    if (tab !== "analysis" || !settingsHydrated || !uiHydrated) return;
    const currentOperation = operation;
    setShown(null);
    const timeout = window.setTimeout(() => {
      if (scramble.trim() && options.methods.length && options.colors.length) void analyzeRef.current();
    }, 400);
    return () => {
      window.clearTimeout(timeout);
      // Only cancel the analysis started by this effect, never a practice or
      // random-generator request sharing the same worker hook.
      if (autoToken.current !== null && currentOperation.current === autoToken.current) {
        currentOperation.current++;
        autoToken.current = null;
        running.current = false;
        cancelRef.current();
        setPending(false);
        setActivity(null);
      }
    };
  }, [tab, settingsHydrated, uiHydrated, scramble, options]);

  function startOperation(kind: Activity) {
    if (!settingsHydrated || running.current || solver.busy || timer.isTimingNow()) return null;
    const token = ++operation.current;
    running.current = true;
    setPending(true);
    setActivity(kind);
    setRetryActivity(kind);
    setFailed(false);
    setUiError(null);
    return token;
  }

  function finishOperation(token: number) {
    if (operation.current !== token) return;
    running.current = false;
    setPending(false);
    setActivity(null);
    if (autoToken.current === token) autoToken.current = null;
  }

  function stop() {
    pendingStartRef.current = null;
    operation.current++;
    running.current = false;
    solver.cancel();
    setPending(false);
    setActivity(null);
    autoToken.current = null;
    setFailed(false);
    setStatus(message("two.main.status.cancelled"));
  }

  async function analyze() {
    if (!scramble.trim() || invalidSelection) return;
    const token = startOperation("analysis");
    if (token === null) return;
    autoToken.current = token;
    const submitted = scramble.trim();
    const snapshotOptions = cloneOptions(options);
    setShown(null);
    setStatus(message("two.main.status.searching"));
    try {
      const result = await solver.solve(submitted, snapshotOptions);
      if (operation.current !== token) return;
      if (result) {
        setShown({ scramble: submitted, options: snapshotOptions, result });
        setStatus(message("two.main.status.analyzed"));
      } else { setFailed(true); setStatus(null); }
    } catch (error) { if (operation.current === token) setUiError(errorMessage(error, "two.main.error.analysis")); }
    finally { finishOperation(token); }
  }

  async function generateScramble() {
    const token = startOperation("generate");
    if (token === null) return;
    setShown(null);
    setStatus(message("two.main.status.generating"));
    try {
      const generated = await solver.generate();
      if (operation.current !== token) return;
      if (generated) { setScramble(generated); setStatus(message("two.main.status.generated")); }
      else { setFailed(true); setStatus(null); }
    } catch (error) { if (operation.current === token) setUiError(errorMessage(error, "two.main.error.generate")); }
    finally { finishOperation(token); }
  }

  async function nextQuestion(start = false) {
    initialPracticeAttempted.current = true;
    if (invalidSelection) { setUiError(message("two.main.error.selection")); return; }
    if (sampling.special && sampling.method && !options.methods.includes(sampling.method as MethodId)) {
      setUiError(message("two.main.error.sampleMethod")); return;
    }
    const token = startOperation("practice");
    if (token === null) return;
    const sample = { ...sampling };
    pendingStartRef.current = null;
    setReviewSnapshot(null);
    setReviewEditorOpen(false);
    const snapshotOptions = cloneOptions(options);
    const attempts = sample.special ? Math.min(100, Math.max(1, sample.attempts)) : 1;
    try {
      for (let attempt = 1; attempt <= attempts; attempt++) {
        if (operation.current !== token) return;
        setStatus(message("two.main.status.sampleGenerate", { kind: message(sample.special ? "two.main.conditional" : "two.main.preparingPractice"), attempt, attempts }));
        const generated = await solver.generate();
        if (operation.current !== token) return;
        if (!generated) { setFailed(true); setStatus(null); return; }
        setStatus(message("two.main.status.sampleSearch", { kind: message(sample.special ? "two.main.conditional" : "two.main.preparingPractice"), attempt, attempts }));
        const result = await solver.solve(generated, snapshotOptions);
        if (operation.current !== token) return;
        if (!result) { setFailed(true); setStatus(null); return; }
        if (!sample.special || result.solutions.some((solution) => matchesSample(solution, sample))) {
          // One atomic question snapshot keeps the timer, scramble, and solutions together.
          const id = crypto.randomUUID();
          pendingStartRef.current = start ? id : null;
          setQuestion({ id, scramble: generated, result, options: snapshotOptions, searchOptions: snapshotOptions,
            sampling: sample.special ? JSON.stringify({ kind: "conditional", method: sample.method, base: sample.base, moves: sample.moves, cancelled: sample.cancelled, attempt, attempts } satisfies ConditionalSample) : "random" });
          setRevealed(false);
          setStatus(message("two.main.status.practiceReady"));
          return;
        }
      }
      setFailed(true);
      setUiError(message("two.main.error.noSample", { attempts }));
      setStatus(null);
    } catch (error) { if (operation.current === token) setUiError(errorMessage(error, "two.main.error.practice")); }
    finally { finishOperation(token); }
  }

  function toggleMethod(method: MethodId) {
    setDraftOptions((value) => ({ ...value, methods: value.methods.includes(method) ? value.methods.filter((id) => id !== method) : [...value.methods, method] }));
  }
  function setFamilyDepth(family: MethodFamily, depth: number) {
    setDraftOptions(value => {
      const familyDepths = { ...DEFAULT_FAMILY_DEPTHS, ...value.familyDepths, [family]: depth };
      return { ...value, familyDepths, maxDepth: Math.max(...Object.values(familyDepths)) };
    });
  }

  function repeatQuestion() {
    if (!question || locked || timer.isTimingNow()) return;
    setQuestion({ ...question, id: crypto.randomUUID() });
    pendingStartRef.current = null;
    setReviewSnapshot(null);
    setReviewEditorOpen(false);
    setRevealed(false);
    setStatus(message("two.main.status.repeated"));
    setUiError(null);
    setFailed(false);
  }

  async function review(value: string, savedOptions = options, label: MessageValue = message("two.main.customReview")) {
    if (locked || timer.isTimingNow()) return;
    reviewRequest.current = { scramble: value, options: cloneOptions(savedOptions), label };
    setRetryActivity("review");
    let submitted: string;
    try {
      submitted = parseMoves(value.trim()).join(" ");
      if (!submitted) { setUiError(message("two.main.error.emptyReview")); return; }
    } catch (error) { setUiError(errorMessage(error, "two.main.error.notation")); return; }
    const token = startOperation("review");
    if (token === null) return;
    const snapshotOptions = cloneOptions(savedOptions);
    reviewRequest.current = { scramble: submitted, options: snapshotOptions, label };
    setStatus(message("two.main.status.reviewSearching"));
    try {
      const result = await solver.solve(submitted, snapshotOptions);
      if (operation.current !== token) return;
      if (!result) { setFailed(true); setStatus(null); return; }
      setReviewSnapshot({ scramble: submitted, options: snapshotOptions, result });
      setReviewScramble(submitted);
      setReviewLabel(label);
      setReviewEditorOpen(false);
      setStatus(message("two.main.status.reviewReady"));
    } catch (error) { if (operation.current === token) setUiError(errorMessage(error, "two.main.error.review")); }
    finally { finishOperation(token); }
  }

  function reviewRecord(record: PracticeRecord) {
    const savedOptions = (record as PracticeRecord & { searchOptions?: SearchOptions }).searchOptions;
    void review(record.scramble, savedOptions ?? options, { record, precision: display.precision, currentSettings: !savedOptions });
  }

  function returnToPractice() {
    setReviewSnapshot(null);
    setReviewEditorOpen(false);
    setUiError(null);
    setFailed(false);
    setStatus(message(question ? "two.main.status.returned" : "two.main.waitingPractice"));
  }

  function changeTab(mode: "analysis" | "practice") {
    if (mode === tab || timer.isTimingNow()) return;
    if (running.current) stop();
    setTab(mode);
    setStatus(null);
    setUiError(null);
    setFailed(false);
  }

  function retry() {
    if (tab === "analysis") { void (retryActivity === "generate" ? generateScramble() : analyze()); return; }
    if (retryActivity === "review" && reviewRequest.current) {
      const request = reviewRequest.current;
      void review(request.scramble, request.options, request.label);
    } else void nextQuestion();
  }

  function filter(key: keyof Filters, value: string) { setDraftFilters((current) => ({ ...current, [key]: value })); }
  function openSettings(panel: ConfigPanel = "search") {
    if (controlsLocked || timer.isTimingNow()) return;
    setDraftOptions(cloneOptions(options));
    setDraftFilters({ ...filters });
    setDraftSort(sort);
    setDraftSampling({ ...sampling });
    setDraftInspection(inspection);
    setDraftDisplay({ ...display });
    setDraftLocale(locale);
    setConfigKind(panel === "practice" ? "practice" : panel === "timer" || panel === "display" ? "timer" : "analysis");
    setConfigPanel(panel);
    setSettingsOpen(true);
  }
  function invalidateAnalysis() {
    if (autoToken.current === null || operation.current !== autoToken.current) return;
    operation.current++;
    autoToken.current = null;
    running.current = false;
    cancelRef.current();
    setPending(false);
    setActivity(null);
  }
  function applySettings() {
    if (timer.isTimingNow() || (configKind === "analysis" && (!draftOptions.methods.length || !draftOptions.colors.length))) return;
    if (configKind === "analysis" && optionsKey(options) !== optionsKey(draftOptions)) {
      invalidateAnalysis();
      setOptions(cloneOptions(draftOptions));
      setShown(null);
      setStatus(null);
      setUiError(null);
      setFailed(false);
    }
    if (configKind === "analysis" && JSON.stringify(filters) !== JSON.stringify(draftFilters)) setFilters({ ...draftFilters });
    if (configKind === "analysis" && sort !== draftSort) setSort(draftSort);
    if (configKind === "practice" && JSON.stringify(sampling) !== JSON.stringify(draftSampling)) setSampling({ ...draftSampling });
    if (configKind === "timer" && inspection !== draftInspection) setInspection(draftInspection);
    if (configKind !== "analysis" && JSON.stringify(display) !== JSON.stringify(draftDisplay)) setDisplay({ ...draftDisplay });
    if (configKind === "timer" && draftLocale !== locale) setLocale(draftLocale);
    setSettingsOpen(false);
  }
  function resetPanel() {
    if (configPanel === "search") setDraftOptions(cloneOptions(INITIAL_OPTIONS));
    if (configPanel === "filters") { setDraftFilters({ ...INITIAL_FILTERS }); setDraftSort("recommended"); }
    if (configPanel === "practice") { setDraftSampling({ ...INITIAL_SAMPLING }); setDraftDisplay(value => ({ ...value, showCube: INITIAL_DISPLAY.showCube, cubeSize: INITIAL_DISPLAY.cubeSize })); }
    if (configPanel === "timer") { setDraftInspection(true); setDraftDisplay(value => ({ ...value, holdMs: INITIAL_DISPLAY.holdMs })); }
    if (configPanel === "display") setDraftDisplay(value => ({ ...INITIAL_DISPLAY, holdMs: value.holdMs, showCube: value.showCube, cubeSize: value.cubeSize }));
  }
  const snapshot = tab === "analysis" ? shown : reviewSnapshot ?? (revealed ? question : null);
  const solutions = snapshot?.result.solutions || [];
  const filtered = solutions.filter((solution) => {
    const text = `${solution.caseName} ${solution.group} ${solution.algorithm} ${solution.execution}`.toLowerCase();
    return (!filters.method || solution.method === filters.method) && (!filters.color || solution.color === filters.color)
      && (filters.base === "" || solution.baseMoves <= Number(filters.base))
      && (filters.moves === "" || solution.moves <= Number(filters.moves))
      && (filters.ergonomics === "" || Math.round(solution.ergonomics.score) >= Number(filters.ergonomics))
      && (filters.cancelled === "" || solution.cancelled >= Number(filters.cancelled))
      && (filters.regrips === "" || solution.ergonomics.regrips <= Number(filters.regrips))
      && (!filters.group || solution.group === filters.group)
      && text.includes(filters.text.trim().toLowerCase());
  }).sort((a, b) => {
    if (sort === "moves") return a.moves - b.moves || b.ergonomics.score - a.ergonomics.score;
    if (sort === "base") return a.baseMoves - b.baseMoves || a.moves - b.moves;
    if (sort === "ergonomics") return b.ergonomics.score - a.ergonomics.score || a.moves - b.moves;
    return 0;
  });
  const last = timer.history.find((record) => record.id === question?.id);
  const previousRecord = timer.history.find(record => record.id !== question?.id) ?? timer.history[0];
  const practiceScramble = reviewSnapshot?.scramble ?? question?.scramble;
  const families = [...new Set(METHODS.map((method) => method.family))];

  const activeFilters = Object.values(filters).filter(value => value.trim() !== "").length;
  const draftInvalid = configKind === "analysis" && (!draftOptions.methods.length || !draftOptions.colors.length);
  const configPanels = CONFIG_PANELS.filter(panel => panel.kind === configKind);
  const focusTiming = tab === "practice" && timer.isTiming && display.focus;
  const timerText = timer.phase === "inspection" ? Math.max(0, 15 - timer.clock / 1000).toFixed(1)
    : timer.phase === "running" && display.runningDisplay === "hidden" ? t("two.main.solving")
    : timer.phase === "stopped" && last ? formatTime(adjustedTime(last), display.precision)
    : formatTime(timer.clock, timer.phase === "running" && display.runningDisplay === "seconds" ? 0 : display.precision);

  return <main className={`${styles.workbench} ${practiceFullscreen ? styles.practiceFullscreen : ""} ${focusTiming ? styles.focusTiming : ""}`} data-settings-open={settingsOpen} style={{ "--timer-font": `${display.timerFont}px` } as CSSProperties}>
    <header className={styles.toolbar}>
      <h1>{t("two.main.title")}</h1>
      <div className={styles.tabs} role="tablist" aria-label={t("two.main.mode")}>
        {(["analysis", "practice"] as const).map(mode => <button type="button" key={mode} role="tab" id={`${mode}-tab`} aria-selected={tab === mode} aria-controls={`${mode}-panel`} tabIndex={tab === mode ? 0 : -1} disabled={!settingsHydrated || !uiHydrated || timer.isTiming} onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? "analysis" : event.key === "End" ? "practice" : mode === "analysis" ? "practice" : "analysis";
          changeTab(next);
          document.getElementById(`${next}-tab`)?.focus();
        }} onClick={() => changeTab(mode)} className={tab === mode ? styles.activeTab : ""}>{mode === "analysis" ? t("two.main.analysis") : t("two.main.practice")}</button>)}
      </div>
      <div className={styles.toolbarActions}>
        {tab === "practice" && <button type="button" className={styles.textButton} disabled={timer.isTiming} onClick={() => setDisplay(value => ({ ...value, fullscreen: !value.fullscreen }))}>{practiceFullscreen ? t("two.main.exitFocus") : t("two.main.enterFocus")}</button>}
        <button ref={configButton} type="button" className={styles.configButton} disabled={controlsLocked} aria-haspopup="dialog" aria-expanded={settingsOpen && configKind === "analysis"} onClick={() => openSettings()}>{tab === "practice" ? t("two.main.solutionSettings") : t("two.main.analysisSettings")}</button>
        {tab === "practice" && <><button type="button" className={styles.configButton} disabled={controlsLocked} aria-haspopup="dialog" aria-expanded={settingsOpen && configKind === "practice"} onClick={() => openSettings("practice")}>{t("two.main.practiceSettings")}</button><button type="button" className={styles.configButton} disabled={controlsLocked} aria-haspopup="dialog" aria-expanded={settingsOpen && configKind === "timer"} onClick={() => openSettings("timer")}>{t("two.main.timingSettings")}</button></>}
      </div>
    </header>

    <div role="tabpanel" id={`${tab}-panel`} aria-labelledby={`${tab}-tab`} className={styles.mainColumn}>
      <div className={styles.practiceScramble} data-sticky-scramble aria-label={tab === "analysis" ? t("two.main.currentScramble") : reviewSnapshot ? t("two.main.reviewScramble") : t("two.main.currentPracticeScramble")}><span className={styles.small}>{tab === "practice" && reviewSnapshot ? t("two.main.reviewing") : t("two.main.currentScramble")}</span><code>{tab === "analysis" ? scramble.trim() || t("two.main.waitingScramble") : practiceScramble || (pending ? t("two.main.preparingScramble") : t("two.main.waitingPractice"))}</code></div>
      {tab === "analysis" ? <section className={styles.scramblePanel} style={{ "--cube-size": `${display.cubeSize}px` } as CSSProperties} aria-label={t("two.main.scrambleAnalysis")}>
        <div className={styles.scrambleEditor}>
          <div className={styles.sectionHeading}><label className={styles.scrambleLabel} htmlFor="two-scramble">{t("two.main.scramble")}</label><button type="button" className={styles.button} disabled={locked} onClick={() => void generateScramble()}>{t("two.main.randomScramble")}</button></div>
          <textarea id="two-scramble" rows={2} className={styles.scrambleInput} value={scramble} disabled={controlsLocked} spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder="R U R' F2…" onChange={event => {
            invalidateAnalysis(); setScramble(event.target.value); setShown(null); setStatus(null); setUiError(null); setFailed(false);
          }} />
          <span className={styles.inputHint}>{t("two.main.autoAnalyze")}</span>
        </div>
        {display.showCube && <ScramblePreview scramble={scramble} size={display.cubeSize} />}
      </section> : <section className={styles.practice} aria-label={t("two.main.timedPractice")}>
        <div className={styles.practiceStage} style={{ "--cube-size": `${display.cubeSize}px` } as CSSProperties}>
          <div className={styles.timer} data-phase={timer.phase} data-held={timer.held} data-armed={timer.armed}>
            <span className={styles.timerPhase}>{timer.armed ? t("two.main.releaseStart") : timer.held ? t("two.main.keepHolding") : timer.phase === "inspection" ? t("two.main.inspecting") : timer.phase === "running" ? t("two.main.solving") : reviewSnapshot ? t("two.main.reviewContinue") : timer.phase === "stopped" ? t("two.main.recordedRevealed") : question ? t("two.main.ready") : t("two.main.waitingScramble")}</span>
            <div className={styles.timerDigits} data-hidden={timer.phase === "running" && display.runningDisplay === "hidden"} aria-label={tf(timer.phase === "inspection" ? "two.main.inspectionRemaining" : "two.main.elapsed", { time: timerText })}>{timerText}</div>
            {timer.phase === "inspection" && <span className={timer.clock >= 15000 ? styles.warning : styles.small}>{timer.clock >= 17000 ? t("two.main.inspectionDnf") : timer.clock >= 15000 ? t("two.main.inspectionPlusTwo") : t("two.main.inspection15")}</span>}
            <button type="button" className={timer.isTiming ? styles.stopTimer : styles.timerButton} disabled={pending || solver.busy || settingsOpen || !timer.hydrated || !uiHydrated || invalidSelection && !question} onClick={timer.action}>{timer.phase === "running" ? t("two.main.stopTimer") : timer.phase === "inspection" ? t("two.main.startSolve") : timer.phase === "stopped" ? t("two.main.nextStart") : !question ? t("two.main.retryPractice") : inspection ? t("two.main.startInspection") : t("two.main.startTimer")}</button>
            <span className={styles.timerHint}>{tf("two.main.timerHint", { start: display.holdMs ? tf("two.main.holdSpace", { ms: number.format(display.holdMs) }) : t("two.main.releaseSpace") })}</span>
          </div>
          {practiceScramble && display.showCube && <div className={styles.practiceCube}><ScramblePreview scramble={practiceScramble} size={display.cubeSize} /></div>}
        </div>
        <div className={styles.practiceActions}>
          <button type="button" className={styles.button} disabled={locked || invalidSelection} onClick={() => void nextQuestion()}>{t("two.main.next")}</button>
          <button type="button" className={styles.button} disabled={!question || locked} onClick={repeatQuestion}>{t("two.main.repeat")}</button>
          <button type="button" className={styles.button} disabled={!previousRecord || locked} onClick={() => previousRecord && reviewRecord(previousRecord)}>{t("two.main.previous")}</button>
          <button type="button" className={styles.button} disabled={locked} aria-expanded={reviewEditorOpen} aria-controls="two-review-editor" onClick={() => setReviewEditorOpen(value => !value)}>{t("two.main.customReview")}</button>
          {(reviewSnapshot || reviewEditorOpen) && <button type="button" className={styles.button} disabled={locked} onClick={returnToPractice}>{t("two.main.returnPractice")}</button>}
          {last && <label className={styles.penaltyControl}>{t("two.main.penalty")}<select aria-label={t("two.main.currentPenalty")} value={last.penalty} disabled={timer.isTiming} onChange={event => timer.setPenalty(last.id, event.target.value as Penalty)}><option value="none">{t("two.main.noPenalty")}</option><option value="+2">{t("two.main.plusTwo")}</option><option value="DNF">DNF</option></select></label>}
          <button type="button" className={`${styles.button} ${styles.historyToggle}`} disabled={timer.isTiming} aria-expanded={historyOpen} aria-controls="two-practice-history" onClick={() => setHistoryOpen(value => !value)}>{tf("two.main.records", { count: number.format(timer.history.length) })}</button>
        </div>
        {reviewEditorOpen && <form id="two-review-editor" className={styles.reviewEditor} onSubmit={event => { event.preventDefault(); void review(reviewScramble); }}>
          <Field label={t("two.main.reviewScramble")} hint={t("two.main.reviewHint")}><input autoFocus type="text" value={reviewScramble} disabled={locked} spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder={t("two.main.reviewPlaceholder")} onChange={event => setReviewScramble(event.target.value)} /></Field>
          <button type="submit" className={styles.primaryButton} disabled={locked || !reviewScramble.trim()}>{t("two.main.reviewScramble")}</button>
          <button type="button" className={styles.button} disabled={locked} onClick={() => setReviewEditorOpen(false)}>{t("two.main.cancelEdit")}</button>
        </form>}
        {reviewSnapshot && <div className={styles.reviewBanner} role="status"><span>{renderMessage(reviewLabel)}</span><span>{t("two.main.reviewBanner")}</span></div>}
      </section>}

      {(pending || status || uiError || failed || settingsError || invalidSelection) && <div className={styles.statusPanel} data-error={Boolean(uiError || failed || settingsError || invalidSelection)}>
        {(pending || status) && <div className={styles.statusRow}><div role="status" aria-live="polite">{pending && <span className={styles.spinner} aria-hidden="true" />}<span>{renderMessage(status)}{pending && solver.progress ? ` · ${solver.progress}` : ""}</span></div>{pending && <button type="button" className={styles.textButton} onClick={stop}>{t("two.main.cancel")}</button>}</div>}
        {(uiError || failed) && <div className={styles.error} role="alert"><span>{uiError ? renderMessage(uiError) : solver.error || t("two.main.error.noResult")}</span><button type="button" className={styles.textButton} disabled={locked} onClick={retry}>{t("two.main.retry")}</button><button type="button" className={styles.textButton} disabled={controlsLocked} onClick={() => openSettings("search")}>{t("two.main.adjustSearch")}</button></div>}
        {settingsError && <p className={styles.warning} role="alert">{renderMessage(settingsError)}</p>}
        {invalidSelection && <p className={styles.warning} role="alert">{t("two.main.error.configSelection")}<button type="button" className={styles.textButton} disabled={controlsLocked} onClick={() => openSettings("search")}>{t("two.main.openSettings")}</button></p>}
      </div>}

      {tab === "practice" && timer.storageError && <p className={styles.warning} role="alert">{timer.storageError}</p>}
      {tab === "practice" && display.showStats && !timer.isTiming && <div className={styles.practiceStats}><PracticeStats records={timer.history} precision={display.precision} onReview={reviewRecord} windowSize={display.chartWindow} /></div>}
      {tab === "practice" && historyOpen && <section id="two-practice-history" className={styles.historyPanel} aria-label={t("two.main.practiceHistory")}>
        <div className={styles.sectionHeading}><h2>{t("two.main.practiceRecords")}</h2><span className={styles.small}>{t("two.main.recentDevice")}</span></div>
        {timer.history.length === 0 ? <p className={styles.emptyHistory}>{t("two.main.emptyHistory")}</p> : <div className={styles.historyList}>{timer.history.map((record, index) => <details key={record.id} className={styles.historyRow}>
          <summary><span className={styles.muted}>#{number.format(timer.history.length - index)}</span><strong>{formatTime(adjustedTime(record), display.precision)}{record.penalty === "+2" ? " (+2)" : ""}</strong><span className={styles.small}>{new Date(record.date).toLocaleString(locale)}</span></summary>
          <p><code>{record.scramble}</code></p><p className={styles.small}>{displaySampling(record.sampling)}</p><p className={styles.small}>{tf("two.main.recordDetails", { time: formatTime(record.elapsedMs, display.precision), seconds: new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(record.inspectionMs / 1000), penalty: record.inspectionPenalty === "none" ? t("two.main.none") : record.inspectionPenalty === "+2" ? t("two.main.plusTwo") : "DNF" })}</p>
          <button type="button" className={styles.button} disabled={locked} onClick={() => reviewRecord(record)}>{t("two.main.reviewThis")}</button>
          <Field label={t("two.main.resultPenalty")}><select value={record.penalty} disabled={timer.isTiming} onChange={event => timer.setPenalty(record.id, event.target.value as Penalty)}><option value="none">{t("two.main.noPenalty")}</option><option value="+2">{t("two.main.plusTwo")}</option><option value="DNF">{t("two.main.dnf")}</option></select></Field>
        </details>)}</div>}
      </section>}

      {snapshot ? <section className={styles.results} aria-label={t("two.main.solutionList")}>
        <div className={styles.resultsHeading}><h2>{t("two.main.solutions")} <span>{number.format(filtered.length)}</span></h2><div className={styles.inline}>{activeFilters > 0 && <span className={styles.filterCount}>{tf("two.main.filterCount", { count: number.format(activeFilters) })}</span>}<button type="button" className={styles.button} disabled={controlsLocked} onClick={() => openSettings("filters")}>{t("two.main.filterSort")}</button></div></div>
        <ResultNotice snapshot={snapshot} />
        {filtered.length ? <><SolutionCards key={snapshot.scramble} solutions={filtered.slice(0, visibleCount)} scramble={snapshot.scramble} />{visibleCount < filtered.length && <button type="button" className={styles.loadMore} onClick={() => setVisibleCount(value => value + 20)}>{tf("two.main.loadMore", { count: number.format(Math.min(visibleCount, filtered.length)), total: number.format(filtered.length) })}</button>}</> : <div className={styles.emptyState}><h3>{solutions.length ? t("two.main.noFiltered") : t("two.main.noSolutions")}</h3><p>{solutions.length ? t("two.main.relaxFilters") : t("two.main.expandSearch")}</p><button type="button" className={styles.button} disabled={controlsLocked} onClick={() => openSettings(solutions.length ? "filters" : "search")}>{solutions.length ? t("two.main.adjustFilters") : t("two.main.adjustSearch")}</button></div>}
      </section> : tab === "analysis" && !pending && !failed && !uiError && <p className={styles.emptyPrompt}>{scramble.trim() ? t("two.main.waitingAnalysis") : t("two.main.enterScramble")}</p>}
    </div>

    <Dialog.Root open={settingsOpen} onOpenChange={event => { if (!event.open) setSettingsOpen(false); }} size="lg" placement="center" scrollBehavior="inside" lazyMount unmountOnExit finalFocusEl={() => configButton.current}>
      <Portal><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content className={styles.configDialog}>
        <Dialog.Header className={styles.dialogHeader}><Dialog.Title>{configKind === "analysis" ? t("two.main.analysisSettings") : configKind === "practice" ? t("two.main.practiceSettings") : t("two.main.timerSettings")}</Dialog.Title><Dialog.CloseTrigger asChild><CloseButton size="sm" aria-label={t("two.main.closeSettings")} /></Dialog.CloseTrigger></Dialog.Header>
        <div className={styles.configTabs} role="tablist" aria-label={t("two.main.settingsCategories")}>{configPanels.map((panel, index) => <button type="button" role="tab" id={`config-${panel.id}-tab`} aria-selected={configPanel === panel.id} aria-controls={`config-${panel.id}-panel`} tabIndex={configPanel === panel.id ? 0 : -1} key={panel.id} className={configPanel === panel.id ? styles.activeTab : ""} onClick={() => setConfigPanel(panel.id)} onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = configPanels[event.key === "Home" ? 0 : event.key === "End" ? configPanels.length - 1 : (index + (event.key === "ArrowRight" ? 1 : configPanels.length - 1)) % configPanels.length];
          setConfigPanel(next.id); document.getElementById(`config-${next.id}-tab`)?.focus();
        }}>{t(panel.label)}</button>)}</div>
        <Dialog.Body className={styles.dialogBody}>
          <div role="tabpanel" id={`config-${configPanel}-panel`} aria-labelledby={`config-${configPanel}-tab`}>
            {configPanel === "search" && <>
              <fieldset className={styles.fieldset} disabled={timer.isTiming}><legend>{t("two.main.method")} <span className={styles.muted}>{tf("two.main.selected", { count: number.format(draftOptions.methods.length) })}</span></legend>
                <div className={styles.scopeActions}><button type="button" onClick={() => setDraftOptions(value => ({ ...value, methods: [...DEFAULT_METHODS] }))}>{t("two.main.commonEg")}</button><button type="button" onClick={() => setDraftOptions(value => ({ ...value, methods: METHODS.map(method => method.id) }))}>{t("two.main.selectAll")}</button><button type="button" onClick={() => setDraftOptions(value => ({ ...value, methods: [] }))}>{t("two.main.clear")}</button></div>
                {families.map(family => <div key={family} className={styles.methodFamily}><span className={styles.familyName}>{family}</span><div className={styles.chips}>{METHODS.filter(method => method.family === family).map(method => <label className={styles.chip} key={method.id} title={t(`two.main.methodDescription.${method.id}`)}><input type="checkbox" checked={draftOptions.methods.includes(method.id)} onChange={() => toggleMethod(method.id)} /><span>{method.label}</span></label>)}</div></div>)}
              </fieldset>
              <fieldset className={styles.fieldset} disabled={timer.isTiming}><legend>{t("two.main.color")}</legend><div className={styles.colors}>{COLORS.map(color => <label className={styles.colorChoice} key={color.id}><input type="checkbox" checked={draftOptions.colors.includes(color.id)} onChange={() => setDraftOptions(value => ({ ...value, colors: value.colors.includes(color.id) ? value.colors.filter(id => id !== color.id) : [...value.colors, color.id] }))} /><span className={styles.swatch} style={{ background: color.hex }} /><span>{t(COLOR_KEYS[color.id])}</span></label>)}</div></fieldset>
              <fieldset className={styles.fieldset} disabled={timer.isTiming}><legend>{t("two.main.baseSearch")}</legend><div className={styles.segment}>{(["ruf", "all"] as const).map(moveSet => <label key={moveSet}><input type="radio" name="base-moves" checked={draftOptions.moveSet === moveSet} onChange={() => setDraftOptions(value => ({ ...value, moveSet }))} /><span>{moveSet === "ruf" ? "R U F" : t("two.main.faceTurns")}</span></label>)}</div>
                <div className={styles.configGrid}>{(Object.keys(DEFAULT_FAMILY_DEPTHS) as MethodFamily[]).map(f => <Field key={f} label={tf("two.main.familyDepth", { family: f })}><select value={draftOptions.familyDepths?.[f] ?? DEFAULT_FAMILY_DEPTHS[f]} onChange={event => setFamilyDepth(f, Number(event.target.value))}>{[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{tf("two.main.steps", { count: number.format(n) })}</option>)}</select></Field>)}
                  <Field label={t("two.main.maxOverlap")} hint={t("two.main.overlapHint")}><select value={draftOptions.maxOverlap ?? 1} onChange={event => setDraftOptions(value => ({ ...value, maxOverlap: Number(event.target.value) }))}>{[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n === 0 ? t("two.main.off") : tf("two.main.actions", { count: number.format(n) })}</option>)}</select></Field>
                </div>
                <label className={styles.checkbox}><input type="checkbox" checked={draftOptions.forbidTransitionRotations !== false} onChange={event => setDraftOptions(value => ({ ...value, forbidTransitionRotations: event.target.checked }))} />{t("two.main.forbidTransitionRotations")}</label>
                <p className={styles.configHint}>{t("two.main.forbidTransitionRotationsHint")}</p>
              </fieldset>
              <fieldset className={styles.fieldset} disabled={timer.isTiming}><legend>{t("two.main.budget")}</legend><div className={styles.configGrid}>
                <Field label={t("two.main.solutionLimit")} hint={t("two.main.solutionLimitHint")}><select value={draftOptions.maxSolutions} onChange={event => setDraftOptions(value => ({ ...value, maxSolutions: Number(event.target.value) }))}>{SOLUTION_LIMITS.map(n => <option key={n} value={n}>{number.format(n)}</option>)}</select></Field>
                <Field label={t("two.main.timeLimit")}><select value={draftOptions.timeLimitMs} onChange={event => setDraftOptions(value => ({ ...value, timeLimitMs: Number(event.target.value) }))}>{TIME_LIMITS.map(n => <option key={n} value={n}>{tf("two.main.seconds", { count: number.format(n / 1000) })}</option>)}</select></Field>
              </div><p className={styles.configHint}>{t("two.main.budgetHint")}</p></fieldset>
            </>}

            {configPanel === "filters" && <><p className={styles.configIntro}>{t("two.main.filtersHint")}</p><div className={styles.configGrid}>
              <Field label={t("two.main.method")}><select value={draftFilters.method} onChange={event => filter("method", event.target.value)}><option value="">{t("two.main.allMethods")}</option>{METHODS.map(method => <option key={method.id} value={method.id}>{method.label}</option>)}</select></Field>
              <Field label={t("two.main.color")}><select value={draftFilters.color} onChange={event => filter("color", event.target.value)}><option value="">{t("two.main.allColors")}</option>{COLORS.map(color => <option key={color.id} value={color.id}>{t(COLOR_KEYS[color.id])}</option>)}</select></Field>
              <Field label={t("two.main.group")}><select value={draftFilters.group} onChange={event => filter("group", event.target.value)}><option value="">{t("two.main.allGroups")}</option>{[...new Set([...solutions.map(solution => solution.group), draftFilters.group].filter(Boolean))].sort().map(group => <option key={group} value={group}>{group}</option>)}</select></Field>
              <Field label={t("two.main.sort")}><select value={draftSort} onChange={event => setDraftSort(event.target.value)}><option value="recommended">{t("two.main.sortRecommended")}</option><option value="moves">{t("two.main.sortMoves")}</option><option value="base">{t("two.main.sortBase")}</option><option value="ergonomics">{t("two.main.sortErgonomics")}</option></select></Field>
              {([["base", t("two.main.filterBase")], ["moves", t("two.main.filterMoves")], ["ergonomics", t("two.main.filterErgonomics")], ["cancelled", t("two.main.filterCancelled")], ["regrips", t("two.main.filterRegrips")]] as const).map(([key, label]) => <Field key={key} label={key === "ergonomics" && !/[%％]/.test(label) ? `${label} (%)` : label}><input type="number" min={key === "ergonomics" ? 1 : 0} max={key === "ergonomics" ? 100 : undefined} step={1} placeholder={t("two.main.unlimited")} value={draftFilters[key]} onChange={event => filter(key, event.target.value === "" ? "" : String(key === "ergonomics" ? Math.max(1, Math.min(100, Math.trunc(Number(event.target.value)))) : Math.max(0, Math.trunc(Number(event.target.value)))))} /></Field>)}
              <Field label={t("two.main.findCase")}><input type="search" value={draftFilters.text} placeholder={t("two.main.findPlaceholder")} onChange={event => filter("text", event.target.value)} /></Field>
            </div></>}

            {configPanel === "timer" && <fieldset className={styles.fieldset} disabled={timer.isTiming}>
              <legend>{t("two.main.timing")}</legend><label className={styles.checkbox}><input type="checkbox" checked={draftInspection} onChange={event => setDraftInspection(event.target.checked)} />{t("two.main.enableInspection")}</label><p className={styles.configHint}>{t("two.main.inspectionHint")}</p>
              <div className={styles.configGrid}><Field label={t("two.main.holdDuration")}><select value={draftDisplay.holdMs} onChange={event => setDraftDisplay(value => ({ ...value, holdMs: Number(event.target.value) as Display["holdMs"] }))}>{[0, 300, 550].map(n => <option key={n} value={n}>{n === 0 ? t("two.main.immediate") : tf("two.main.milliseconds", { count: number.format(n) })}</option>)}</select></Field></div>
              <p className={styles.configHint}>{t("two.main.nextHint")}</p>
            </fieldset>}

            {configPanel === "practice" && <fieldset className={styles.fieldset} disabled={timer.isTiming}>
              <legend>{t("two.main.questionPreview")}</legend><p className={styles.configIntro}>{t("two.main.practiceIntro")}</p>
              <label className={styles.checkbox}><input type="checkbox" checked={draftSampling.special} onChange={event => setDraftSampling(value => ({ ...value, special: event.target.checked }))} />{t("two.main.sampleByCondition")}</label>
              <p className={styles.configHint}>{t("two.main.sampleHint")}</p>
              <fieldset className={styles.samplingFields} disabled={!draftSampling.special}><div className={styles.configGrid}>
                <Field label={t("two.main.targetMethod")}><select value={draftSampling.method} onChange={event => setDraftSampling(value => ({ ...value, method: event.target.value }))}><option value="">{t("two.main.anyMethod")}</option>{METHODS.map(method => <option key={method.id} value={method.id}>{method.label}</option>)}</select></Field>
                <Field label={t("two.main.exactDepth")}><select value={draftSampling.base} onChange={event => setDraftSampling(value => ({ ...value, base: event.target.value }))}><option value="">{t("two.main.unlimited")}</option>{[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{number.format(n)}</option>)}</select></Field>
                <Field label={t("two.main.filterMoves")}><input type="number" min={0} max={100} step={1} value={draftSampling.moves} placeholder={t("two.main.unlimited")} onChange={event => setDraftSampling(value => ({ ...value, moves: event.target.value === "" ? "" : String(Math.max(0, Math.min(100, Math.trunc(Number(event.target.value))))) }))} /></Field>
                <Field label={t("two.main.filterCancelled")}><input type="number" min={0} max={100} step={1} value={draftSampling.cancelled} onChange={event => setDraftSampling(value => ({ ...value, cancelled: Math.max(0, Math.min(100, Math.trunc(Number(event.target.value)))) }))} /></Field>
                <Field label={t("two.main.maxAttempts")} hint={t("two.main.attemptsHint")}><input type="number" min={1} max={100} step={1} value={draftSampling.attempts} onChange={event => setDraftSampling(value => ({ ...value, attempts: Math.max(1, Math.min(100, Math.trunc(Number(event.target.value)))) }))} /></Field>
              </div></fieldset>
              <div className={styles.configDivider} /><h3 className={styles.configSubheading}>{t("two.main.scramblePreview")}</h3><label className={styles.checkbox}><input type="checkbox" checked={draftDisplay.showCube} onChange={event => setDraftDisplay(value => ({ ...value, showCube: event.target.checked }))} />{t("two.main.showCube")}</label>
              <div className={styles.configGrid}><Field label={t("two.main.previewSize")}><select disabled={!draftDisplay.showCube} value={draftDisplay.cubeSize} onChange={event => setDraftDisplay(value => ({ ...value, cubeSize: Number(event.target.value) as Display["cubeSize"] }))}><option value={180}>{t("two.main.compactPreview")}</option><option value={240}>{t("two.main.standardPreview")}</option></select></Field></div>
            </fieldset>}

            {configPanel === "display" && <fieldset className={styles.fieldset} disabled={timer.isTiming}><legend>{t("two.main.timerDisplay")}</legend><div className={styles.configGrid}>
              <Field label={t("two.main.language")}><select value={draftLocale} onChange={event => setDraftLocale(event.target.value as Locale)}>{SUPPORTED_LOCALES.map(item => <option key={item.key} value={item.key}>{t(item.labelKey)}</option>)}</select></Field>
              <Field label={tf("two.main.timerFont", { size: number.format(draftDisplay.timerFont) })}><input type="range" min={80} max={200} step={1} value={draftDisplay.timerFont} onChange={event => setDraftDisplay(value => ({ ...value, timerFont: Number(event.target.value) }))} /></Field>
              <Field label={t("two.main.decimalPlaces")}><select value={draftDisplay.precision} onChange={event => setDraftDisplay(value => ({ ...value, precision: Number(event.target.value) as Display["precision"] }))}>{[0, 1, 2, 3].map(n => <option key={n} value={n}>{tf("two.main.digits", { count: number.format(n) })}</option>)}</select></Field>
              <Field label={t("two.main.runningDisplay")}><select value={draftDisplay.runningDisplay} onChange={event => setDraftDisplay(value => ({ ...value, runningDisplay: event.target.value as Display["runningDisplay"] }))}><option value="live">{t("two.main.liveTimer")}</option><option value="seconds">{t("two.main.wholeSeconds")}</option><option value="hidden">{t("two.main.hideTime")}</option></select></Field>
            </div><label className={styles.checkbox}><input type="checkbox" checked={draftDisplay.focus} onChange={event => setDraftDisplay(value => ({ ...value, focus: event.target.checked }))} />{t("two.main.hideInterface")}</label>
              <label className={styles.checkbox}><input type="checkbox" checked={draftDisplay.fullscreen} onChange={event => setDraftDisplay(value => ({ ...value, fullscreen: event.target.checked }))} />{t("two.main.fillWindow")}</label>
              <div className={styles.configDivider} /><h3 className={styles.configSubheading}>{t("two.main.resultsChart")}</h3><label className={styles.checkbox}><input type="checkbox" checked={draftDisplay.showStats} onChange={event => setDraftDisplay(value => ({ ...value, showStats: event.target.checked }))} />{t("two.main.showStats")}</label>
              <div className={styles.configGrid}><Field label={t("two.main.chartRange")}><select disabled={!draftDisplay.showStats} value={draftDisplay.chartWindow} onChange={event => setDraftDisplay(value => ({ ...value, chartWindow: Number(event.target.value) as Display["chartWindow"] }))}>{[20, 50, 100, 200].map(n => <option key={n} value={n}>{tf("two.main.latest", { count: number.format(n) })}</option>)}</select></Field></div>
            </fieldset>}
          </div>
        </Dialog.Body>
        <Dialog.Footer className={styles.dialogFooter}>
          {draftInvalid && <p className={styles.draftWarning} role="alert">{t("two.main.error.draftSelection")}</p>}
          <div className={styles.footerActions}><button type="button" className={styles.textButton} onClick={resetPanel}>{t("two.main.resetPanel")}</button><span className={styles.footerSpacer} /><button type="button" className={styles.button} onClick={() => setSettingsOpen(false)}>{t("two.main.cancel")}</button><button type="button" className={styles.primaryButton} disabled={draftInvalid || timer.isTiming} onClick={applySettings}>{t("two.main.apply")}</button></div>
        </Dialog.Footer>
      </Dialog.Content></Dialog.Positioner></Portal>
    </Dialog.Root>
  </main>;
}
