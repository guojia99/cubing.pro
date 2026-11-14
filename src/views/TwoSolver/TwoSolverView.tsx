"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { parseMoves } from "./engine/state";
import { METHODS, DEFAULT_METHODS, DEFAULT_FAMILY_DEPTHS, COLORS, familyOf, type FamilyDepths, type MethodFamily, type MethodId, type SearchOptions, type SearchResult, type Solution } from "./engine/types";
import { useTwoSolver } from "./useTwoSolver";
import SolutionCards from "./SolutionCards";
import SolverCube from "./SolverCube";
import PracticeStats from "./PracticeStats";
import { adjustedTime, formatTime, usePracticeTimer, type PracticeQuestion, type PracticeRecord, type Penalty } from "./uiPractice";
import styles from "./TwoSolver.module.css";

const EXAMPLE = "R U R' F2 U' R2 F U2 R'";
const INITIAL_OPTIONS: SearchOptions = {
  methods: [...DEFAULT_METHODS], colors: COLORS.map((color) => color.id), maxDepth: 5,
  moveSet: "ruf", maxSolutions: 20, timeLimitMs: 8000,
  familyDepths: { ...DEFAULT_FAMILY_DEPTHS }, maxOverlap: 1,
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
const CONFIG_PANELS = [{ id: "search", label: "搜索", kind: "analysis" }, { id: "filters", label: "筛选", kind: "analysis" }, { id: "practice", label: "练习", kind: "practice" }, { id: "timer", label: "计时器", kind: "timer" }, { id: "display", label: "显示", kind: "timer" }] as const;
const SORTS = ["recommended", "moves", "base", "ergonomics"];

function cloneOptions(value: SearchOptions): SearchOptions {
  return { ...value, methods: [...value.methods], colors: [...value.colors], familyDepths: { ...DEFAULT_FAMILY_DEPTHS, ...value.familyDepths } };
}

function optionsKey(value: SearchOptions) {
  return JSON.stringify({ ...value, methods: [...value.methods].sort(), colors: [...value.colors].sort(),
    familyDepths: Object.fromEntries(Object.keys(DEFAULT_FAMILY_DEPTHS).map(f => [f, value.familyDepths?.[f as MethodFamily] ?? DEFAULT_FAMILY_DEPTHS[f as MethodFamily]])) });
}

function ScramblePreview({ scramble, size }: { scramble: string; size: 180 | 240 }) {
  let setup: string | null = null;
  if (scramble.trim()) {
    try {
      setup = parseMoves(scramble).join(" ");
    } catch { /* Invalid notation is explained without mounting the native renderer. */ }
  }
  return <div className={styles.scramblePreview}>
    {setup !== null ? <SolverCube setup={setup} alg="" label="打乱状态 3D" height={size} /> : <span className={styles.small}>{scramble.trim() ? "检查转动记号后可预览" : "等待打乱"}</span>}
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
  const { result, options } = snapshot;
  const reason = { complete: "已完成所选范围内的搜索。", time: "已达到时间上限，当前为部分结果，可在配置中增加搜索时限。", limit: `已遍历所选深度，仅保留排名靠前的 ${options.maxSolutions} 条解法。`, cancelled: "搜索已停止，当前仅为部分结果。" }[result.reason];
  return <details className={styles.resultNotice}>
    <summary>搜索详情 <span>{result.reason === "time" ? "时间上限 · 部分结果" : result.reason === "cancelled" ? "已停止 · 部分结果" : result.reason === "limit" ? `已遍历 · 保留前 ${options.maxSolutions} 条` : result.complete ? "所选范围完成" : "部分结果"} · {(result.elapsedMs / 1000).toFixed(2)}s</span></summary>
    <p>{reason} 不保证全局最优。</p>
    <p>{result.nodes.toLocaleString()} 个节点 · 耗时 {(result.elapsedMs / 1000).toFixed(2)} 秒 · 已达深度 {result.depthReached} · {options.moveSet === "ruf" ? "R U F" : "六面"} 做底搜索 · 最多重叠 {options.maxOverlap ?? 1} 个动作</p>
    <p>各体系上限：{[...new Set(options.methods.map(familyOf))].map(f => `${f} ${options.familyDepths?.[f] ?? options.maxDepth}`).join(" · ")}</p>
    <p>公式源数据校验：通过 {result.data.loaded.toLocaleString()} 条，拒绝 {result.data.rejected.toLocaleString()} 条。仅使用通过校验的数据生成解法。</p>
  </details>;
}

export default function TwoSolverView() {
  const solver = useTwoSolver();
  const [tab, setTab] = useState<"analysis" | "practice">("analysis");
  const [scramble, setScramble] = useState(EXAMPLE);
  const [options, setOptions] = useState<SearchOptions>(INITIAL_OPTIONS);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [settingsError, setSettingsError] = useState("");
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
  const [reviewLabel, setReviewLabel] = useState("");
  const reviewRequest = useRef<{ scramble: string; options: SearchOptions; label: string } | null>(null);
  const configButton = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [retryActivity, setRetryActivity] = useState<Activity>("practice");
  const [status, setStatus] = useState("");
  const [uiError, setUiError] = useState<string | null>(null);
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
          maxDepth: Math.max(...Object.values(familyDepths)), familyDepths, maxOverlap: value.maxOverlap ?? 1, moveSet: value.moveSet!,
          maxSolutions: SOLUTION_LIMITS.includes(value.maxSolutions ?? 0) ? value.maxSolutions! : INITIAL_OPTIONS.maxSolutions,
          timeLimitMs: TIME_LIMITS.includes(value.timeLimitMs ?? 0) ? value.timeLimitMs! : INITIAL_OPTIONS.timeLimitMs });
      }
    } catch { setSettingsError("无法读取已保存的搜索设置，已使用默认设置。"); }
    setSettingsHydrated(true);
  }, []);
  useEffect(() => {
    if (!settingsHydrated) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(options));
    } catch { setSettingsError("无法保存搜索设置，当前页面仍可正常使用。"); }
  }, [options, settingsHydrated]);
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(UI_KEY) || "null");
      if (stored !== null) {
        if (typeof stored !== "object" || Array.isArray(stored)) throw new Error();
        const value = stored as { version?: number; display?: Partial<Display>; filters?: Partial<Filters>; sort?: string; sampling?: Partial<Sampling>; inspection?: boolean };
        if (value.version !== 1) throw new Error();
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
    } catch { setSettingsError("无法读取界面设置，已使用默认值；可在配置中重新应用。"); }
    setUiHydrated(true);
  }, []);
  useEffect(() => {
    if (!uiHydrated) return;
    try { localStorage.setItem(UI_KEY, JSON.stringify({ version: 1, display, filters, sort, sampling, inspection })); }
    catch { setSettingsError("无法保存界面设置，当前页面仍可使用；请检查浏览器存储权限。"); }
  }, [uiHydrated, display, filters, sort, sampling, inspection]);
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
      setStatus("");
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
    if (tab !== "analysis" || !settingsHydrated) return;
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
  }, [tab, settingsHydrated, scramble, options]);

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
    setStatus("已取消，本次未采用新结果。");
  }

  async function analyze() {
    if (!scramble.trim() || invalidSelection) return;
    const token = startOperation("analysis");
    if (token === null) return;
    autoToken.current = token;
    const submitted = scramble.trim();
    const snapshotOptions = cloneOptions(options);
    setShown(null);
    setStatus("正在搜索所选方法与底色…");
    try {
      const result = await solver.solve(submitted, snapshotOptions);
      if (operation.current !== token) return;
      if (result) {
        setShown({ scramble: submitted, options: snapshotOptions, result });
        setStatus("分析完成。");
      } else { setFailed(true); setStatus(""); }
    } catch (error) { if (operation.current === token) setUiError(error instanceof Error ? error.message : "分析失败，请重试。"); }
    finally { finishOperation(token); }
  }

  async function generateScramble() {
    const token = startOperation("generate");
    if (token === null) return;
    setShown(null);
    setStatus("正在生成并校验随机打乱…");
    try {
      const generated = await solver.generate();
      if (operation.current !== token) return;
      if (generated) { setScramble(generated); setStatus("打乱已就绪，正在自动分析…"); }
      else { setFailed(true); setStatus(""); }
    } catch (error) { if (operation.current === token) setUiError(error instanceof Error ? error.message : "生成打乱失败。"); }
    finally { finishOperation(token); }
  }

  async function nextQuestion(start = false) {
    initialPracticeAttempted.current = true;
    if (invalidSelection) { setUiError("请先选择至少一种方法和一种底色。"); return; }
    if (sampling.special && sampling.method && !options.methods.includes(sampling.method as MethodId)) {
      setUiError("请先在搜索范围中勾选目标方法，再进行条件抽样。"); return;
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
        setStatus(`${sample.special ? "条件抽样" : "准备练习"} · 第 ${attempt} / ${attempts} 次 · 正在生成打乱`);
        const generated = await solver.generate();
        if (operation.current !== token) return;
        if (!generated) { setFailed(true); setStatus(""); return; }
        setStatus(`${sample.special ? "条件抽样" : "准备练习"} · 第 ${attempt} / ${attempts} 次 · 正在搜索`);
        const result = await solver.solve(generated, snapshotOptions);
        if (operation.current !== token) return;
        if (!result) { setFailed(true); setStatus(""); return; }
        if (!sample.special || result.solutions.some((solution) => matchesSample(solution, sample))) {
          // One atomic question snapshot keeps the timer, scramble, and solutions together.
          const id = crypto.randomUUID();
          pendingStartRef.current = start ? id : null;
          setQuestion({ id, scramble: generated, result, options: snapshotOptions, searchOptions: snapshotOptions,
            sampling: sample.special ? `条件抽样：${sample.method || "任意所选方法"}；做底深度 ${sample.base || "不限"}；总步数上限 ${sample.moves || "不限"}；消步 ≥ ${sample.cancelled}；第 ${attempt}/${attempts} 次命中` : "随机练习" });
          setRevealed(false);
          setStatus("练习已就绪");
          return;
        }
      }
      setFailed(true);
      setUiError(`${attempts} 次尝试内未找到符合条件的解法。可放宽条件或增加搜索预算；这不代表该条件无解。`);
      setStatus("");
    } catch (error) { if (operation.current === token) setUiError(error instanceof Error ? error.message : "生成练习失败。"); }
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
    setStatus("已重置当前题目，可以重新练习；原成绩仍保留在历史中。");
    setUiError(null);
    setFailed(false);
  }

  async function review(value: string, savedOptions = options, label = "自定义复盘") {
    if (locked || timer.isTimingNow()) return;
    reviewRequest.current = { scramble: value, options: cloneOptions(savedOptions), label };
    setRetryActivity("review");
    let submitted: string;
    try {
      submitted = parseMoves(value.trim()).join(" ");
      if (!submitted) throw new Error("请输入需要复盘的打乱。");
    } catch (error) { setUiError(error instanceof Error ? error.message : "请检查打乱记号。"); return; }
    const token = startOperation("review");
    if (token === null) return;
    const snapshotOptions = cloneOptions(savedOptions);
    reviewRequest.current = { scramble: submitted, options: snapshotOptions, label };
    setStatus("正在搜索复盘打乱，当前练习保持不变…");
    try {
      const result = await solver.solve(submitted, snapshotOptions);
      if (operation.current !== token) return;
      if (!result) { setFailed(true); setStatus(""); return; }
      setReviewSnapshot({ scramble: submitted, options: snapshotOptions, result });
      setReviewScramble(submitted);
      setReviewLabel(label);
      setReviewEditorOpen(false);
      setStatus("复盘已就绪；空格继续当前练习，复盘不会生成成绩。");
    } catch (error) { if (operation.current === token) setUiError(error instanceof Error ? error.message : "复盘搜索失败，请重试。"); }
    finally { finishOperation(token); }
  }

  function reviewRecord(record: PracticeRecord) {
    const savedOptions = (record as PracticeRecord & { searchOptions?: SearchOptions }).searchOptions;
    void review(record.scramble, savedOptions ?? options, `历史复盘 · ${formatTime(adjustedTime(record), display.precision)} · ${new Date(record.date).toLocaleString("zh-CN")}${savedOptions ? "" : " · 按当前搜索设置"}`);
  }

  function returnToPractice() {
    setReviewSnapshot(null);
    setReviewEditorOpen(false);
    setUiError(null);
    setFailed(false);
    setStatus(question ? "已返回当前练习" : "等待练习打乱");
  }

  function changeTab(mode: "analysis" | "practice") {
    if (mode === tab || timer.isTimingNow()) return;
    if (running.current) stop();
    setTab(mode);
    setStatus("");
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
      setStatus("");
      setUiError(null);
      setFailed(false);
    }
    if (configKind === "analysis" && JSON.stringify(filters) !== JSON.stringify(draftFilters)) setFilters({ ...draftFilters });
    if (configKind === "analysis" && sort !== draftSort) setSort(draftSort);
    if (configKind === "practice" && JSON.stringify(sampling) !== JSON.stringify(draftSampling)) setSampling({ ...draftSampling });
    if (configKind === "timer" && inspection !== draftInspection) setInspection(draftInspection);
    if (configKind !== "analysis" && JSON.stringify(display) !== JSON.stringify(draftDisplay)) setDisplay({ ...draftDisplay });
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
    : timer.phase === "running" && display.runningDisplay === "hidden" ? "还原中"
    : timer.phase === "stopped" && last ? formatTime(adjustedTime(last), display.precision)
    : formatTime(timer.clock, timer.phase === "running" && display.runningDisplay === "seconds" ? 0 : display.precision);

  return <main className={`${styles.workbench} ${practiceFullscreen ? styles.practiceFullscreen : ""} ${focusTiming ? styles.focusTiming : ""}`} data-settings-open={settingsOpen} style={{ "--timer-font": `${display.timerFont}px` } as CSSProperties}>
    <header className={styles.toolbar}>
      <h1>二阶</h1>
      <div className={styles.tabs} role="tablist" aria-label="求解模式">
        {(["analysis", "practice"] as const).map(mode => <button type="button" key={mode} role="tab" id={`${mode}-tab`} aria-selected={tab === mode} aria-controls={`${mode}-panel`} tabIndex={tab === mode ? 0 : -1} disabled={!settingsHydrated || !uiHydrated || timer.isTiming} onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? "analysis" : event.key === "End" ? "practice" : mode === "analysis" ? "practice" : "analysis";
          changeTab(next);
          document.getElementById(`${next}-tab`)?.focus();
        }} onClick={() => changeTab(mode)} className={tab === mode ? styles.activeTab : ""}>{mode === "analysis" ? "分析" : "练习"}</button>)}
      </div>
      <div className={styles.toolbarActions}>
        {tab === "practice" && <button type="button" className={styles.textButton} disabled={timer.isTiming} onClick={() => setDisplay(value => ({ ...value, fullscreen: !value.fullscreen }))}>{practiceFullscreen ? "退出专注" : "进入专注"}</button>}
        <button ref={configButton} type="button" className={styles.configButton} disabled={controlsLocked} aria-haspopup="dialog" aria-expanded={settingsOpen && configKind === "analysis"} onClick={() => openSettings()}>{tab === "practice" ? "解法设置" : "分析配置"}</button>
        {tab === "practice" && <><button type="button" className={styles.configButton} disabled={controlsLocked} aria-haspopup="dialog" aria-expanded={settingsOpen && configKind === "practice"} onClick={() => openSettings("practice")}>练习设置</button><button type="button" className={styles.configButton} disabled={controlsLocked} aria-haspopup="dialog" aria-expanded={settingsOpen && configKind === "timer"} onClick={() => openSettings("timer")}>计时设置</button></>}
      </div>
    </header>

    <div role="tabpanel" id={`${tab}-panel`} aria-labelledby={`${tab}-tab`} className={styles.mainColumn}>
      {tab === "practice" && <div className={styles.practiceScramble} data-sticky-scramble aria-label={reviewSnapshot ? "复盘打乱" : "当前练习打乱"}><span className={styles.small}>{reviewSnapshot ? "复盘中" : "当前打乱"}</span><code>{practiceScramble || (pending ? "正在准备练习打乱…" : "等待练习打乱")}</code></div>}
      {tab === "analysis" ? <section className={styles.scramblePanel} style={{ "--cube-size": `${display.cubeSize}px` } as CSSProperties} aria-label="打乱分析">
        <div className={styles.scrambleEditor}>
          <div className={styles.sectionHeading}><label className={styles.scrambleLabel} htmlFor="two-scramble">打乱</label><button type="button" className={styles.button} disabled={locked} onClick={() => void generateScramble()}>随机打乱</button></div>
          <textarea id="two-scramble" rows={2} className={styles.scrambleInput} value={scramble} disabled={controlsLocked} spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder="R U R' F2…" onChange={event => {
            invalidateAnalysis(); setScramble(event.target.value); setShown(null); setStatus(""); setUiError(null); setFailed(false);
          }} />
          <span className={styles.inputHint}>输入后自动分析</span>
        </div>
        {display.showCube && <ScramblePreview scramble={scramble} size={display.cubeSize} />}
      </section> : <section className={styles.practice} aria-label="计时练习">
        <div className={styles.practiceStage} style={{ "--cube-size": `${display.cubeSize}px` } as CSSProperties}>
          <div className={styles.timer} data-phase={timer.phase} data-held={timer.held} data-armed={timer.armed}>
            <span className={styles.timerPhase}>{timer.armed ? "松开开始" : timer.held ? "保持按住" : timer.phase === "inspection" ? "观察中" : timer.phase === "running" ? "还原中" : reviewSnapshot ? "复盘中 · 空格继续练习" : timer.phase === "stopped" ? "已记录 · 当前题解法已揭晓" : question ? "准备就绪" : "等待打乱"}</span>
            <div className={styles.timerDigits} data-hidden={timer.phase === "running" && display.runningDisplay === "hidden"} aria-label={timer.phase === "inspection" ? `观察剩余 ${timerText} 秒` : `用时 ${timerText}`}>{timerText}</div>
            {timer.phase === "inspection" && <span className={timer.clock >= 15000 ? styles.warning : styles.small}>{timer.clock >= 17000 ? "观察超时：DNF" : timer.clock >= 15000 ? "观察超时：+2 秒" : "15 秒观察"}</span>}
            <button type="button" className={timer.isTiming ? styles.stopTimer : styles.timerButton} disabled={pending || solver.busy || settingsOpen || !timer.hydrated || !uiHydrated || invalidSelection && !question} onClick={timer.action}>{timer.phase === "running" ? "停止计时" : timer.phase === "inspection" ? "开始还原" : timer.phase === "stopped" ? "下一题并开始" : !question ? "重试准备练习" : inspection ? "开始观察" : "开始计时"}</button>
            <span className={styles.timerHint}>{display.holdMs ? `空格按住 ${display.holdMs}ms，松开开始` : "空格松开开始"} · 按下停止并揭晓 · 再次空格进入下一题</span>
          </div>
          {practiceScramble && display.showCube && <div className={styles.practiceCube}><ScramblePreview scramble={practiceScramble} size={display.cubeSize} /></div>}
        </div>
        <div className={styles.practiceActions}>
          <button type="button" className={styles.button} disabled={locked || invalidSelection} onClick={() => void nextQuestion()}>下一条</button>
          <button type="button" className={styles.button} disabled={!question || locked} onClick={repeatQuestion}>重练</button>
          <button type="button" className={styles.button} disabled={!previousRecord || locked} onClick={() => previousRecord && reviewRecord(previousRecord)}>上一条</button>
          <button type="button" className={styles.button} disabled={locked} aria-expanded={reviewEditorOpen} aria-controls="two-review-editor" onClick={() => setReviewEditorOpen(value => !value)}>自定义复盘</button>
          {(reviewSnapshot || reviewEditorOpen) && <button type="button" className={styles.button} disabled={locked} onClick={returnToPractice}>返回当前练习</button>}
          {last && <label className={styles.penaltyControl}>判罚<select aria-label="当前成绩判罚" value={last.penalty} disabled={timer.isTiming} onChange={event => timer.setPenalty(last.id, event.target.value as Penalty)}><option value="none">无罚时</option><option value="+2">+2 秒</option><option value="DNF">DNF</option></select></label>}
          <button type="button" className={`${styles.button} ${styles.historyToggle}`} disabled={timer.isTiming} aria-expanded={historyOpen} aria-controls="two-practice-history" onClick={() => setHistoryOpen(value => !value)}>记录 {timer.history.length}</button>
        </div>
        {reviewEditorOpen && <form id="two-review-editor" className={styles.reviewEditor} onSubmit={event => { event.preventDefault(); void review(reviewScramble); }}>
          <Field label="复盘打乱" hint="编辑时空格用于输入；离开输入框后，空格继续当前练习。复盘不会记录成绩。"><input autoFocus type="text" value={reviewScramble} disabled={locked} spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder="输入历史或自定义打乱，如 R U R' F2" onChange={event => setReviewScramble(event.target.value)} /></Field>
          <button type="submit" className={styles.primaryButton} disabled={locked || !reviewScramble.trim()}>复盘打乱</button>
          <button type="button" className={styles.button} disabled={locked} onClick={() => setReviewEditorOpen(false)}>取消编辑</button>
        </form>}
        {reviewSnapshot && <div className={styles.reviewBanner} role="status"><span>{reviewLabel}</span><span>当前练习已保留 · 空格继续练习 · 复盘不计成绩</span></div>}
      </section>}

      {(pending || status || uiError || failed || settingsError || invalidSelection) && <div className={styles.statusPanel} data-error={Boolean(uiError || failed || settingsError || invalidSelection)}>
        {(pending || status) && <div className={styles.statusRow}><div role="status" aria-live="polite">{pending && <span className={styles.spinner} aria-hidden="true" />}<span>{status}{pending && solver.progress ? ` · ${solver.progress}` : ""}</span></div>{pending && <button type="button" className={styles.textButton} onClick={stop}>取消</button>}</div>}
        {(uiError || failed) && <div className={styles.error} role="alert"><span>{uiError || solver.error || "本次操作未返回结果，请检查打乱记号，或增加搜索预算后重试。"}</span><button type="button" className={styles.textButton} disabled={locked} onClick={retry}>重试</button><button type="button" className={styles.textButton} disabled={controlsLocked} onClick={() => openSettings("search")}>调整搜索</button></div>}
        {settingsError && <p className={styles.warning} role="alert">{settingsError}</p>}
        {invalidSelection && <p className={styles.warning} role="alert">请在配置中至少选择一种方法和一种底色。<button type="button" className={styles.textButton} disabled={controlsLocked} onClick={() => openSettings("search")}>打开配置</button></p>}
      </div>}

      {tab === "practice" && timer.storageError && <p className={styles.warning} role="alert">{timer.storageError}</p>}
      {tab === "practice" && display.showStats && !timer.isTiming && <div className={styles.practiceStats}><PracticeStats records={timer.history} precision={display.precision} onReview={reviewRecord} windowSize={display.chartWindow} /></div>}
      {tab === "practice" && historyOpen && <section id="two-practice-history" className={styles.historyPanel} aria-label="练习历史">
        <div className={styles.sectionHeading}><h2>练习记录</h2><span className={styles.small}>最近 200 次 · 此设备</span></div>
        {timer.history.length === 0 ? <p className={styles.emptyHistory}>完成一次计时后在此显示。</p> : <div className={styles.historyList}>{timer.history.map((record, index) => <details key={record.id} className={styles.historyRow}>
          <summary><span className={styles.muted}>#{timer.history.length - index}</span><strong>{formatTime(adjustedTime(record), display.precision)}{record.penalty === "+2" ? " (+2)" : ""}</strong><span className={styles.small}>{new Date(record.date).toLocaleDateString("zh-CN")}</span></summary>
          <p><code>{record.scramble}</code></p><p className={styles.small}>{record.sampling}</p><p className={styles.small}>原始用时 {formatTime(record.elapsedMs, display.precision)} · 观察 {(record.inspectionMs / 1000).toFixed(2)} 秒 · 观察判罚 {record.inspectionPenalty === "none" ? "无" : record.inspectionPenalty === "+2" ? "+2 秒" : "DNF"}</p>
          <button type="button" className={styles.button} disabled={locked} onClick={() => reviewRecord(record)}>复盘此打乱</button>
          <Field label="成绩判罚"><select value={record.penalty} disabled={timer.isTiming} onChange={event => timer.setPenalty(record.id, event.target.value as Penalty)}><option value="none">无罚时</option><option value="+2">+2 秒</option><option value="DNF">DNF（未完成）</option></select></Field>
        </details>)}</div>}
      </section>}

      {snapshot ? <section className={styles.results} aria-label="解法列表">
        <div className={styles.resultsHeading}><h2>解法 <span>{filtered.length}</span></h2><div className={styles.inline}>{activeFilters > 0 && <span className={styles.filterCount}>{activeFilters} 项筛选</span>}<button type="button" className={styles.button} disabled={controlsLocked} onClick={() => openSettings("filters")}>筛选与排序</button></div></div>
        <ResultNotice snapshot={snapshot} />
        {filtered.length ? <><SolutionCards key={snapshot.scramble} solutions={filtered.slice(0, visibleCount)} scramble={snapshot.scramble} />{visibleCount < filtered.length && <button type="button" className={styles.loadMore} onClick={() => setVisibleCount(value => value + 20)}>显示更多 · {Math.min(visibleCount, filtered.length)} / {filtered.length}</button>}</> : <div className={styles.emptyState}><h3>{solutions.length ? "没有符合筛选的解法" : "本次未找到解法"}</h3><p>{solutions.length ? "在配置中放宽筛选条件，查看已有结果。" : "尝试增加方法、底色、做底深度或搜索时限；未找到不代表无解。"}</p><button type="button" className={styles.button} disabled={controlsLocked} onClick={() => openSettings(solutions.length ? "filters" : "search")}>{solutions.length ? "调整筛选" : "调整搜索"}</button></div>}
      </section> : tab === "analysis" && !pending && !failed && !uiError && <p className={styles.emptyPrompt}>{scramble.trim() ? "等待自动分析" : "输入打乱，或生成随机打乱。"}</p>}
    </div>

    <Dialog.Root open={settingsOpen} onOpenChange={event => { if (!event.open) setSettingsOpen(false); }} size="lg" placement="center" scrollBehavior="inside" lazyMount unmountOnExit finalFocusEl={() => configButton.current}>
      <Portal><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content className={styles.configDialog}>
        <Dialog.Header className={styles.dialogHeader}><Dialog.Title>{configKind === "analysis" ? "分析配置" : configKind === "practice" ? "练习设置" : "计时器设置"}</Dialog.Title><Dialog.CloseTrigger asChild><CloseButton size="sm" aria-label="取消并关闭配置" /></Dialog.CloseTrigger></Dialog.Header>
        <div className={styles.configTabs} role="tablist" aria-label="配置分类">{configPanels.map((panel, index) => <button type="button" role="tab" id={`config-${panel.id}-tab`} aria-selected={configPanel === panel.id} aria-controls={`config-${panel.id}-panel`} tabIndex={configPanel === panel.id ? 0 : -1} key={panel.id} className={configPanel === panel.id ? styles.activeTab : ""} onClick={() => setConfigPanel(panel.id)} onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = configPanels[event.key === "Home" ? 0 : event.key === "End" ? configPanels.length - 1 : (index + (event.key === "ArrowRight" ? 1 : configPanels.length - 1)) % configPanels.length];
          setConfigPanel(next.id); document.getElementById(`config-${next.id}-tab`)?.focus();
        }}>{panel.label}</button>)}</div>
        <Dialog.Body className={styles.dialogBody}>
          <div role="tabpanel" id={`config-${configPanel}-panel`} aria-labelledby={`config-${configPanel}-tab`}>
            {configPanel === "search" && <>
              <fieldset className={styles.fieldset} disabled={timer.isTiming}><legend>方法 <span className={styles.muted}>已选 {draftOptions.methods.length}</span></legend>
                <div className={styles.scopeActions}><button type="button" onClick={() => setDraftOptions(value => ({ ...value, methods: [...DEFAULT_METHODS] }))}>常用 EG</button><button type="button" onClick={() => setDraftOptions(value => ({ ...value, methods: METHODS.map(method => method.id) }))}>全选</button><button type="button" onClick={() => setDraftOptions(value => ({ ...value, methods: [] }))}>清空</button></div>
                {families.map(family => <div key={family} className={styles.methodFamily}><span className={styles.familyName}>{family}</span><div className={styles.chips}>{METHODS.filter(method => method.family === family).map(method => <label className={styles.chip} key={method.id} title={method.description}><input type="checkbox" checked={draftOptions.methods.includes(method.id)} onChange={() => toggleMethod(method.id)} /><span>{method.label}</span></label>)}</div></div>)}
              </fieldset>
              <fieldset className={styles.fieldset} disabled={timer.isTiming}><legend>底色</legend><div className={styles.colors}>{COLORS.map(color => <label className={styles.colorChoice} key={color.id}><input type="checkbox" checked={draftOptions.colors.includes(color.id)} onChange={() => setDraftOptions(value => ({ ...value, colors: value.colors.includes(color.id) ? value.colors.filter(id => id !== color.id) : [...value.colors, color.id] }))} /><span className={styles.swatch} style={{ background: color.hex }} /><span>{color.label}</span></label>)}</div></fieldset>
              <fieldset className={styles.fieldset} disabled={timer.isTiming}><legend>做底搜索</legend><div className={styles.segment}>{(["ruf", "all"] as const).map(moveSet => <label key={moveSet}><input type="radio" name="base-moves" checked={draftOptions.moveSet === moveSet} onChange={() => setDraftOptions(value => ({ ...value, moveSet }))} /><span>{moveSet === "ruf" ? "R U F" : "六面转动"}</span></label>)}</div>
                <div className={styles.configGrid}>{(Object.keys(DEFAULT_FAMILY_DEPTHS) as MethodFamily[]).map(f => <Field key={f} label={`${f} 做底上限`}><select value={draftOptions.familyDepths?.[f] ?? DEFAULT_FAMILY_DEPTHS[f]} onChange={event => setFamilyDepth(f, Number(event.target.value))}>{[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} 步</option>)}</select></Field>)}
                  <Field label="消步最大重叠数" hint="两段交界处最多合并的动作数"><select value={draftOptions.maxOverlap ?? 1} onChange={event => setDraftOptions(value => ({ ...value, maxOverlap: Number(event.target.value) }))}>{[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n === 0 ? "关闭" : `${n} 个动作`}</option>)}</select></Field>
                </div>
              </fieldset>
              <fieldset className={styles.fieldset} disabled={timer.isTiming}><legend>搜索预算</legend><div className={styles.configGrid}>
                <Field label="解法数量上限" hint="遍历所选范围，按引擎排名保留"><select value={draftOptions.maxSolutions} onChange={event => setDraftOptions(value => ({ ...value, maxSolutions: Number(event.target.value) }))}>{SOLUTION_LIMITS.map(n => <option key={n} value={n}>{n}</option>)}</select></Field>
                <Field label="单次搜索时限"><select value={draftOptions.timeLimitMs} onChange={event => setDraftOptions(value => ({ ...value, timeLimitMs: Number(event.target.value) }))}>{TIME_LIMITS.map(n => <option key={n} value={n}>{n / 1000} 秒</option>)}</select></Field>
              </div><p className={styles.configHint}>深度仅指做底步数。达到时限时返回部分结果，搜索详情保留诊断信息。</p></fieldset>
            </>}

            {configPanel === "filters" && <><p className={styles.configIntro}>仅筛选已返回的解法，应用后不重新搜索。</p><div className={styles.configGrid}>
              <Field label="方法"><select value={draftFilters.method} onChange={event => filter("method", event.target.value)}><option value="">全部方法</option>{METHODS.map(method => <option key={method.id} value={method.id}>{method.label}</option>)}</select></Field>
              <Field label="底色"><select value={draftFilters.color} onChange={event => filter("color", event.target.value)}><option value="">全部底色</option>{COLORS.map(color => <option key={color.id} value={color.id}>{color.label}</option>)}</select></Field>
              <Field label="分组"><select value={draftFilters.group} onChange={event => filter("group", event.target.value)}><option value="">全部分组</option>{[...new Set([...solutions.map(solution => solution.group), draftFilters.group].filter(Boolean))].sort().map(group => <option key={group} value={group}>{group}</option>)}</select></Field>
              <Field label="排序"><select value={draftSort} onChange={event => setDraftSort(event.target.value)}><option value="recommended">推荐顺序（引擎排名）</option><option value="moves">总步数最少</option><option value="base">做底最短</option><option value="ergonomics">顺手度最高</option></select></Field>
              {([["base", "做底深度上限"], ["moves", "总步数上限"], ["ergonomics", "最低顺手度（整数）"], ["cancelled", "最少消步数"], ["regrips", "预计换手次数上限"]] as const).map(([key, label]) => <Field key={key} label={label}><input type="number" min={0} step={1} placeholder="不限" value={draftFilters[key]} onChange={event => filter(key, event.target.value === "" ? "" : String(Math.max(0, Math.trunc(Number(event.target.value)))))} /></Field>)}
              <Field label="查找情形或公式"><input type="search" value={draftFilters.text} placeholder="情形、分组、转动记号…" onChange={event => filter("text", event.target.value)} /></Field>
            </div></>}

            {configPanel === "timer" && <fieldset className={styles.fieldset} disabled={timer.isTiming}>
              <legend>计时</legend><label className={styles.checkbox}><input type="checkbox" checked={draftInspection} onChange={event => setDraftInspection(event.target.checked)} />启用 15 秒观察</label><p className={styles.configHint}>观察满 15 秒 +2，满 17 秒 DNF。</p>
              <div className={styles.configGrid}><Field label="起表按住时长"><select value={draftDisplay.holdMs} onChange={event => setDraftDisplay(value => ({ ...value, holdMs: Number(event.target.value) as Display["holdMs"] }))}>{[0, 300, 550].map(n => <option key={n} value={n}>{n === 0 ? "立即" : `${n} 毫秒`}</option>)}</select></Field></div>
              <p className={styles.configHint}>停表自动显示同一打乱的解法；下一次按住并松开空格，准备下一题并开始观察或计时。</p>
            </fieldset>}

            {configPanel === "practice" && <fieldset className={styles.fieldset} disabled={timer.isTiming}>
              <legend>出题与预览</legend><p className={styles.configIntro}>进入练习自动准备打乱。设置仅用于之后的新题，当前题目保持不变。</p>
              <label className={styles.checkbox}><input type="checkbox" checked={draftSampling.special} onChange={event => setDraftSampling(value => ({ ...value, special: event.target.checked }))} />按条件抽样</label>
              <p className={styles.configHint}>返回解法中至少有一条满足以下全部条件时采用打乱；有限抽样并非等概率。</p>
              <fieldset className={styles.samplingFields} disabled={!draftSampling.special}><div className={styles.configGrid}>
                <Field label="目标方法"><select value={draftSampling.method} onChange={event => setDraftSampling(value => ({ ...value, method: event.target.value }))}><option value="">任意所选方法</option>{METHODS.map(method => <option key={method.id} value={method.id}>{method.label}</option>)}</select></Field>
                <Field label="指定做底深度"><select value={draftSampling.base} onChange={event => setDraftSampling(value => ({ ...value, base: event.target.value }))}><option value="">不限</option>{[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}</select></Field>
                <Field label="总步数上限"><input type="number" min={0} max={100} step={1} value={draftSampling.moves} placeholder="不限" onChange={event => setDraftSampling(value => ({ ...value, moves: event.target.value === "" ? "" : String(Math.max(0, Math.min(100, Math.trunc(Number(event.target.value))))) }))} /></Field>
                <Field label="最少消步数"><input type="number" min={0} max={100} step={1} value={draftSampling.cancelled} onChange={event => setDraftSampling(value => ({ ...value, cancelled: Math.max(0, Math.min(100, Math.trunc(Number(event.target.value)))) }))} /></Field>
                <Field label="最多尝试次数" hint="1–100 次，每次使用完整搜索预算"><input type="number" min={1} max={100} step={1} value={draftSampling.attempts} onChange={event => setDraftSampling(value => ({ ...value, attempts: Math.max(1, Math.min(100, Math.trunc(Number(event.target.value)))) }))} /></Field>
              </div></fieldset>
              <div className={styles.configDivider} /><h3 className={styles.configSubheading}>打乱预览</h3><label className={styles.checkbox}><input type="checkbox" checked={draftDisplay.showCube} onChange={event => setDraftDisplay(value => ({ ...value, showCube: event.target.checked }))} />显示 3D 魔方</label>
              <div className={styles.configGrid}><Field label="预览大小"><select disabled={!draftDisplay.showCube} value={draftDisplay.cubeSize} onChange={event => setDraftDisplay(value => ({ ...value, cubeSize: Number(event.target.value) as Display["cubeSize"] }))}><option value={180}>紧凑 · 180px</option><option value={240}>标准 · 240px</option></select></Field></div>
            </fieldset>}

            {configPanel === "display" && <fieldset className={styles.fieldset} disabled={timer.isTiming}><legend>计时显示</legend><div className={styles.configGrid}>
              <Field label={`计时字号 · ${draftDisplay.timerFont}px`}><input type="range" min={80} max={200} step={1} value={draftDisplay.timerFont} onChange={event => setDraftDisplay(value => ({ ...value, timerFont: Number(event.target.value) }))} /></Field>
              <Field label="小数位数"><select value={draftDisplay.precision} onChange={event => setDraftDisplay(value => ({ ...value, precision: Number(event.target.value) as Display["precision"] }))}>{[0, 1, 2, 3].map(n => <option key={n} value={n}>{n} 位</option>)}</select></Field>
              <Field label="还原中显示"><select value={draftDisplay.runningDisplay} onChange={event => setDraftDisplay(value => ({ ...value, runningDisplay: event.target.value as Display["runningDisplay"] }))}><option value="live">实时计时</option><option value="seconds">仅整数秒</option><option value="hidden">隐藏用时</option></select></Field>
            </div><label className={styles.checkbox}><input type="checkbox" checked={draftDisplay.focus} onChange={event => setDraftDisplay(value => ({ ...value, focus: event.target.checked }))} />计时时隐藏无关界面</label>
              <label className={styles.checkbox}><input type="checkbox" checked={draftDisplay.fullscreen} onChange={event => setDraftDisplay(value => ({ ...value, fullscreen: event.target.checked }))} />练习铺满浏览器窗口</label>
              <div className={styles.configDivider} /><h3 className={styles.configSubheading}>成绩曲线</h3><label className={styles.checkbox}><input type="checkbox" checked={draftDisplay.showStats} onChange={event => setDraftDisplay(value => ({ ...value, showStats: event.target.checked }))} />显示统计与曲线</label>
              <div className={styles.configGrid}><Field label="曲线显示范围"><select disabled={!draftDisplay.showStats} value={draftDisplay.chartWindow} onChange={event => setDraftDisplay(value => ({ ...value, chartWindow: Number(event.target.value) as Display["chartWindow"] }))}>{[20, 50, 100, 200].map(n => <option key={n} value={n}>最近 {n} 次</option>)}</select></Field></div>
            </fieldset>}
          </div>
        </Dialog.Body>
        <Dialog.Footer className={styles.dialogFooter}>
          {draftInvalid && <p className={styles.draftWarning} role="alert">请至少选择一种方法和一种底色。</p>}
          <div className={styles.footerActions}><button type="button" className={styles.textButton} onClick={resetPanel}>重置本页</button><span className={styles.footerSpacer} /><button type="button" className={styles.button} onClick={() => setSettingsOpen(false)}>取消</button><button type="button" className={styles.primaryButton} disabled={draftInvalid || timer.isTiming} onClick={applySettings}>应用</button></div>
        </Dialog.Footer>
      </Dialog.Content></Dialog.Positioner></Portal>
    </Dialog.Root>
  </main>;
}
