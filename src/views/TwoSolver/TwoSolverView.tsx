"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { parseMoves } from "./engine/state";
import { METHODS, DEFAULT_METHODS, DEFAULT_FAMILY_DEPTHS, COLORS, familyOf, type FamilyDepths, type MethodFamily, type MethodId, type SearchOptions, type SearchResult, type Solution } from "./engine/types";
import { useTwoSolver } from "./useTwoSolver";
import SolutionCards from "./SolutionCards";
import SolverCube from "./SolverCube";
import { adjustedTime, formatTime, usePracticeTimer, type PracticeQuestion, type Penalty } from "./uiPractice";
import styles from "./TwoSolver.module.css";

const EXAMPLE = "R U R' F2 U' R2 F U2 R'";
const INITIAL_OPTIONS: SearchOptions = {
  methods: [...DEFAULT_METHODS], colors: COLORS.map((color) => color.id), maxDepth: 5,
  moveSet: "ruf", maxSolutions: 500, timeLimitMs: 8000,
  familyDepths: { ...DEFAULT_FAMILY_DEPTHS }, maxOverlap: 1,
};
const SETTINGS_KEY = "cubing.pro.two-solver.settings.v1";
type Snapshot = Readonly<{ scramble: string; options: SearchOptions; result: SearchResult }>;
type Question = PracticeQuestion & Snapshot;
type Filters = { method: string; color: string; base: string; moves: string; ergonomics: string; cancelled: string; regrips: string; text: string; group: string };
const INITIAL_FILTERS: Filters = { method: "", color: "", base: "", moves: "", ergonomics: "", cancelled: "", regrips: "", text: "", group: "" };
type Sampling = { special: boolean; method: string; base: string; moves: string; cancelled: number; attempts: number };

function ScramblePreview({ scramble }: { scramble: string }) {
  let setup: string | null = null;
  if (scramble.trim()) {
    try {
      setup = parseMoves(scramble).join(" ");
    } catch { /* Invalid notation is explained without mounting the native renderer. */ }
  }
  return <div className={styles.scramblePreview}>
    <p className={styles.small}>打乱状态 · 3D · 拖动可从不同角度观察</p>
    {setup !== null ? <SolverCube setup={setup} alg="" label="打乱状态 3D" height={240} /> : <p className={styles.warning}>{scramble.trim() ? "无法预览：请检查二阶转动记号或缩短打乱。" : "输入打乱后自动显示 3D 状态。"}</p>}
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
  const reason = { complete: "已完成所选范围内的搜索。", time: "已达到时间上限，可能仍有其他解法。", limit: "已遍历所选深度，仅保留排名靠前的解法。", cancelled: "搜索已停止，当前仅为部分结果。" }[result.reason];
  return <div className={styles.resultNotice}>
    <p><strong>{result.complete ? "所选范围搜索完成" : "有限范围搜索"}</strong> · {reason} 不保证全局最优。</p>
    <p>{result.nodes.toLocaleString()} 个节点 · 耗时 {(result.elapsedMs / 1000).toFixed(2)} 秒 · 已达深度 {result.depthReached} · {options.moveSet === "ruf" ? "R U F" : "六面"} 做底搜索 · 最多重叠 {options.maxOverlap ?? 1} 个动作</p>
    <p>各体系上限：{[...new Set(options.methods.map(familyOf))].map(f => `${f} ${options.familyDepths?.[f] ?? options.maxDepth}`).join(" · ")}</p>
    <p>公式源数据校验：通过 {result.data.loaded.toLocaleString()} 条，拒绝 {result.data.rejected.toLocaleString()} 条。仅使用通过校验的数据生成解法。</p>
  </div>;
}

export default function TwoSolverView() {
  const solver = useTwoSolver();
  const [tab, setTab] = useState<"analysis" | "practice">("analysis");
  const [scramble, setScramble] = useState(EXAMPLE);
  const [options, setOptions] = useState<SearchOptions>(INITIAL_OPTIONS);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);
  const [shown, setShown] = useState<Snapshot | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [inspection, setInspection] = useState(true);
  const [sampling, setSampling] = useState<Sampling>({ special: false, method: "", base: "", moves: "", cancelled: 0, attempts: 20 });
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [sort, setSort] = useState("recommended");
  const [pending, setPending] = useState(false);
  const [activity, setActivity] = useState<"analysis" | "generate" | "practice" | null>(null);
  const [status, setStatus] = useState("");
  const [uiError, setUiError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const operation = useRef(0);
  const running = useRef(false);
  const cancelRef = useRef(solver.cancel);
  const autoToken = useRef<number | null>(null);
  const analyzeRef = useRef<() => Promise<void>>(async () => {});
  const timer = usePracticeTimer(question, inspection, tab === "practice" && !pending && !revealed);
  const locked = !settingsHydrated || pending || solver.busy || timer.isTiming;
  const controlsLocked = !settingsHydrated || timer.isTiming || (pending && activity !== "analysis");
  const invalidSelection = options.methods.length === 0 || options.colors.length === 0;

  useEffect(() => { cancelRef.current = solver.cancel; }, [solver.cancel]);
  useEffect(() => () => { operation.current++; running.current = false; cancelRef.current(); }, []);
  useEffect(() => { setVisibleCount(30); }, [shown, question, filters, sort]);
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
          maxDepth: Math.max(...Object.values(familyDepths)), familyDepths, maxOverlap: value.maxOverlap ?? 1, moveSet: value.moveSet! });
      }
    } catch { setSettingsError("无法读取已保存的搜索设置，已使用默认设置。"); }
    setSettingsHydrated(true);
  }, []);
  useEffect(() => {
    if (!settingsHydrated) return;
    try {
      const { methods, colors, maxDepth, moveSet, familyDepths, maxOverlap } = options;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ methods, colors, maxDepth, moveSet, familyDepths, maxOverlap }));
    } catch { setSettingsError("无法保存搜索设置，当前页面仍可正常使用。"); }
  }, [options, settingsHydrated]);
  useEffect(() => { analyzeRef.current = analyze; });
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

  function startOperation(kind: "analysis" | "generate" | "practice") {
    if (!settingsHydrated || running.current || solver.busy || timer.isTimingNow()) return null;
    const token = ++operation.current;
    running.current = true;
    setPending(true);
    setActivity(kind);
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
    const snapshotOptions = { ...options, methods: [...options.methods], colors: [...options.colors] };
    setShown(null);
    setStatus("正在搜索所选方法与底色…");
    try {
      const result = await solver.solve(submitted, snapshotOptions);
      if (operation.current !== token) return;
      if (result) {
        setShown({ scramble: submitted, options: snapshotOptions, result });
        setFilters(INITIAL_FILTERS);
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

  async function nextQuestion() {
    if (invalidSelection) return;
    if (sampling.special && sampling.method && !options.methods.includes(sampling.method as MethodId)) {
      setUiError("请先在搜索范围中勾选目标方法，再进行条件抽样。"); return;
    }
    const token = startOperation("practice");
    if (token === null) return;
    const sample = { ...sampling };
    setRevealed(false);
    setQuestion(null);
    const snapshotOptions = { ...options, methods: [...options.methods], colors: [...options.colors] };
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
          setQuestion({ id: crypto.randomUUID(), scramble: generated, result, options: snapshotOptions,
            sampling: sample.special ? `条件抽样：${sample.method || "任意所选方法"}；做底深度 ${sample.base || "不限"}；总步数上限 ${sample.moves || "不限"}；消步 ≥ ${sample.cancelled}；第 ${attempt}/${attempts} 次命中` : "随机练习" });
          setRevealed(false);
          setFilters(INITIAL_FILTERS);
          setStatus("练习打乱已就绪，解法将在点击「查看解法」后显示。");
          return;
        }
      }
      setStatus(`${attempts} 次尝试内未找到符合条件的解法。可放宽条件或增加搜索预算；这不代表该条件无解。`);
    } catch (error) { if (operation.current === token) setUiError(error instanceof Error ? error.message : "生成练习失败。"); }
    finally { finishOperation(token); }
  }

  function toggleMethod(method: MethodId) {
    setOptions((value) => ({ ...value, methods: value.methods.includes(method) ? value.methods.filter((id) => id !== method) : [...value.methods, method] }));
  }
  function setFamilyDepth(family: MethodFamily, depth: number) {
    setOptions(value => {
      const familyDepths = { ...DEFAULT_FAMILY_DEPTHS, ...value.familyDepths, [family]: depth };
      return { ...value, familyDepths, maxDepth: Math.max(...Object.values(familyDepths)) };
    });
  }

  function repeatQuestion() {
    if (!question || locked || timer.isTimingNow()) return;
    setQuestion({ ...question, id: crypto.randomUUID() });
    setRevealed(false);
    setFilters(INITIAL_FILTERS);
    setStatus("已重置当前题目，可以重新练习；原成绩仍保留在历史中。");
    setUiError(null);
    setFailed(false);
  }

  function filter(key: keyof Filters, value: string) { setFilters((current) => ({ ...current, [key]: value })); }
  const snapshot = tab === "analysis" ? shown : revealed ? question : null;
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
  const times = timer.history.map(adjustedTime);
  const best = times.length ? Math.min(...times) : null;
  const mean = times.length ? times.reduce((sum, time) => sum + time, 0) / times.length : null;
  const last = timer.history.find((record) => record.id === question?.id);
  const families = [...new Set(METHODS.map((method) => method.family))];

  return <main className={styles.workbench}>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>Cubing Pro / 2 × 2 lab</p><h1>从做底出发，<span>找到更顺手的解法。</span></h1><p className={styles.subtitle}>探索做底思路，比较完整解法，让每一次练习更有方向。</p></div>
      <div className={styles.cubeMark} aria-hidden="true">{Array.from({ length: 4 }, (_, i) => <span key={i} />)}</div>
    </header>
    <div className={styles.topBar}>
      <div className={styles.tabs} role="tablist" aria-label="求解模式">
        {(["analysis", "practice"] as const).map((mode) => <button key={mode} role="tab" id={`${mode}-tab`} aria-selected={tab === mode} aria-controls={`${mode}-panel`} tabIndex={tab === mode ? 0 : -1} disabled={controlsLocked} onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? "analysis" : event.key === "End" ? "practice" : mode === "analysis" ? "practice" : "analysis";
          setTab(next); setStatus(""); setUiError(null); setFailed(false);
          document.getElementById(`${next}-tab`)?.focus();
        }} onClick={() => { setTab(mode); setStatus(""); setUiError(null); setFailed(false); }} className={tab === mode ? styles.activeTab : ""}>{mode === "analysis" ? "01  解法分析" : "02  计时练习"}</button>)}
      </div>
      <span className={styles.small}>多方法比较 · 有限范围搜索</span>
    </div>
    <div className={styles.workspace}>
      <aside className={styles.sidebar} aria-label="搜索设置">
        <button className={styles.mobileSettings} aria-expanded={settingsOpen} aria-controls="two-solver-settings" onClick={() => setSettingsOpen(!settingsOpen)}>搜索设置 <span>{options.methods.length} 种方法 · {options.moveSet === "ruf" ? "RUF" : "六面"} · {options.maxDepth} 步 {settingsOpen ? "收起 −" : "展开 +"}</span></button>
        <div id="two-solver-settings" role="region" aria-label="搜索范围滚动区域" tabIndex={0} className={settingsOpen ? styles.settingsContent : `${styles.settingsContent} ${styles.mobileClosed}`}>
        <section className={styles.panel}>
          <div className={styles.sectionHeading}><h2>搜索范围</h2><span className={styles.tag}>2×2</span></div>
          <fieldset className={styles.fieldset} disabled={controlsLocked}>
            <legend>方法 <span className={styles.muted}>/ 已选 {options.methods.length} 种</span></legend>
            <div className={styles.scopeActions}><button type="button" onClick={() => setOptions((value) => ({ ...value, methods: [...DEFAULT_METHODS] }))}>常用四种</button><button type="button" onClick={() => setOptions((value) => ({ ...value, methods: METHODS.map((method) => method.id) }))}>全选</button><button type="button" onClick={() => setOptions((value) => ({ ...value, methods: [] }))}>清空</button></div>
            {families.map((family) => <div key={family} className={styles.methodFamily}><span className={styles.familyName}>{family}</span><div className={styles.chips}>{METHODS.filter((method) => method.family === family).map((method) => <label className={styles.chip} key={method.id} title={method.description}><input type="checkbox" checked={options.methods.includes(method.id)} onChange={() => toggleMethod(method.id)} /><span>{method.label}</span></label>)}</div></div>)}
          </fieldset>
          <fieldset className={styles.fieldset} disabled={controlsLocked}><legend>底色</legend><div className={styles.colors}>{COLORS.map((color) => <label className={styles.colorChoice} key={color.id} title={color.label}><input type="checkbox" checked={options.colors.includes(color.id)} onChange={() => setOptions((value) => ({ ...value, colors: value.colors.includes(color.id) ? value.colors.filter((id) => id !== color.id) : [...value.colors, color.id] }))} /><span className={styles.swatch} style={{ background: color.hex }} /><span>{color.label}</span></label>)}</div></fieldset>
          <fieldset className={styles.fieldset} disabled={controlsLocked}><legend>做底搜索</legend><div className={styles.segment}>{(["ruf", "all"] as const).map((moveSet) => <label key={moveSet}><input type="radio" name="base-moves" checked={options.moveSet === moveSet} onChange={() => setOptions((value) => ({ ...value, moveSet }))} /><span>{moveSet === "ruf" ? "R U F" : "六面转动"}</span></label>)}</div>
            <div className={styles.familyDepthGrid}>{(Object.keys(DEFAULT_FAMILY_DEPTHS) as MethodFamily[]).map(f => <Field key={f} label={`${f} 做底上限`}><select value={options.familyDepths?.[f] ?? DEFAULT_FAMILY_DEPTHS[f]} onChange={event => setFamilyDepth(f, Number(event.target.value))}>{[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} 步</option>)}</select></Field>)}</div>
            <Field label="消步最大重叠数" hint="两段交界处最多合并几个动作；不增加做底上限。"><select value={options.maxOverlap ?? 1} onChange={event => setOptions(value => ({ ...value, maxOverlap: Number(event.target.value) }))}>{[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n === 0 ? "关闭" : `${n} 个动作`}</option>)}</select></Field>
          </fieldset>
          <details className={styles.details}><summary>搜索预算</summary><fieldset className={styles.budgetFields} disabled={controlsLocked}>
            <Field label="解法数量上限"><select value={options.maxSolutions} onChange={(event) => setOptions((value) => ({ ...value, maxSolutions: Number(event.target.value) }))}>{[25, 50, 100, 250, 500].map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
            <Field label="单次搜索时限"><select value={options.timeLimitMs} onChange={(event) => setOptions((value) => ({ ...value, timeLimitMs: Number(event.target.value) }))}>{[3000, 8000, 15000, 30000].map((n) => <option key={n} value={n}>{n / 1000} 秒</option>)}</select></Field>
          </fieldset><p className={styles.small}>预算用于控制等待时间；达到上限后，可能遗漏更短或更顺手的解法。</p></details>
          {invalidSelection && <p className={styles.warning}>请至少选择一种方法和一种底色。</p>}
          {settingsError && <p className={styles.warning} role="alert">{settingsError}</p>}
        </section>
        <p className={styles.sidebarNote}>深度仅指做底步数；总步数与顺手度按消步后的执行序列计算。方法、底色、深度与转动范围会自动保存在此设备。</p>
        </div>
      </aside>
      <div className={styles.mainColumn}>
        <section className={styles.panel} role="tabpanel" id={`${tab}-panel`} aria-labelledby={`${tab}-tab`}>
          {tab === "analysis" ? <>
            <div className={styles.sectionHeading}><h2>从这条打乱开始</h2><span className={styles.eyebrow}>01 / 打乱</span></div>
            <div>
              <label className={styles.scrambleLabel} htmlFor="two-scramble">打乱公式</label>
              <textarea id="two-scramble" className={styles.scrambleInput} value={scramble} disabled={controlsLocked} spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder="R U R' F2…" onChange={(event) => { setScramble(event.target.value); setShown(null); setStatus(""); setUiError(null); setFailed(false); }} />
              <div className={styles.scrambleActions}><span className={styles.small}>输入打乱或调整搜索范围后自动分析 · 停止输入 0.4 秒后开始</span><div className={styles.inline}><button type="button" className={styles.button} disabled={locked} onClick={() => void generateScramble()}>↻ 随机打乱</button></div></div>
            </div>
            <ScramblePreview scramble={scramble} />
          </> : <>
            <div className={styles.sectionHeading}><h2>计时练习</h2><span className={styles.tag}>本地记录</span></div>
            <p className={styles.small}>生成打乱，在实体魔方上完成还原，再查看解法进行比较。</p>
            <details className={styles.sampling}><summary>抽样与观察设置</summary>
              <fieldset className={styles.fieldset} disabled={locked}>
                <label className={styles.checkbox}><input type="checkbox" checked={inspection} onChange={(event) => setInspection(event.target.checked)} />启用 15 秒观察</label>
                <p className={styles.small}>观察满 15 秒罚时 +2，满 17 秒记为 DNF。仅用于日常练习，不替代正式比赛计时器。</p>
                <label className={styles.checkbox}><input type="checkbox" checked={sampling.special} onChange={(event) => setSampling((value) => ({ ...value, special: event.target.checked }))} />按条件抽样</label>
                <p className={styles.small}>仅在返回解法中至少有一条同时满足所有条件时采用打乱。抽样次数有限，符合条件的情形并非等概率出现。</p>
                {sampling.special && <div className={styles.samplingGrid}>
                  <Field label="目标方法"><select value={sampling.method} onChange={(event) => setSampling((value) => ({ ...value, method: event.target.value }))}><option value="">任意所选方法</option>{METHODS.map((method) => <option key={method.id} value={method.id}>{method.label}</option>)}</select></Field>
                  <Field label="指定做底深度"><select value={sampling.base} onChange={(event) => setSampling((value) => ({ ...value, base: event.target.value }))}><option value="">不限深度</option>{[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
                  <Field label="总步数上限"><input type="number" min={0} max={100} step={1} value={sampling.moves} placeholder="不限" onChange={(event) => setSampling((value) => ({ ...value, moves: event.target.value === "" ? "" : String(Math.max(0, Math.min(100, Math.trunc(Number(event.target.value))))) }))} /></Field>
                  <Field label="最少消步数"><input type="number" min={0} max={100} step={1} value={sampling.cancelled} onChange={(event) => setSampling((value) => ({ ...value, cancelled: Math.max(0, Math.min(100, Math.trunc(Number(event.target.value)))) }))} /></Field>
                  <Field label="最多尝试次数" hint="1–100 次；每次均使用完整搜索预算。"><input type="number" min={1} max={100} step={1} value={sampling.attempts} onChange={(event) => setSampling((value) => ({ ...value, attempts: Math.max(1, Math.min(100, Math.trunc(Number(event.target.value)))) }))} /></Field>
                </div>}
              </fieldset>
            </details>
            <div className={styles.practiceScramble}><span className={styles.eyebrow}>当前打乱</span><code>{question?.scramble || "点击「生成练习」，开始下一次还原。"}</code>{question && <p className={styles.small}>{question.sampling}</p>}</div>
            {question && <ScramblePreview scramble={question.scramble} />}
            <div className={styles.timer} data-phase={timer.phase}>
              <span className={styles.eyebrow}>{timer.phase === "inspection" ? "观察中" : timer.phase === "running" ? "还原中" : timer.phase === "stopped" ? "已记录" : "准备就绪"}</span>
              <div className={styles.timerDigits}>{timer.phase === "inspection" ? Math.max(0, 15 - timer.clock / 1000).toFixed(1) : timer.phase === "stopped" && last ? formatTime(adjustedTime(last)) : formatTime(timer.clock)}</div>
              {timer.phase === "inspection" && <span className={timer.clock >= 15000 ? styles.warning : styles.small}>{timer.clock >= 17000 ? "观察超时：DNF" : timer.clock >= 15000 ? "观察超时：+2 秒" : "请在 15 秒前开始还原"}</span>}
              <button className={timer.isTiming ? styles.stopTimer : styles.timerButton} disabled={!question || pending || solver.busy || revealed || timer.phase === "stopped" || !timer.hydrated} onClick={timer.action}>{timer.phase === "running" ? "停止计时" : timer.phase === "inspection" ? "开始还原" : timer.phase === "stopped" ? "成绩已记录" : inspection ? "开始观察" : "开始计时"}</button>
              <p className={styles.small}>空格键：松开开始观察或计时，按下停止计时；也可点击按钮。</p>
            </div>
            <div className={styles.practiceActions}><button className={styles.button} disabled={!question || locked || revealed} onClick={() => { if (!timer.isTimingNow()) setRevealed(true); }}>{revealed ? "解法已显示" : "查看解法"}</button><button className={styles.button} disabled={!question || locked} onClick={repeatQuestion}>重新练习</button><button className={styles.primaryButton} disabled={locked || invalidSelection} onClick={() => void nextQuestion()}>{question ? "下一条打乱" : "生成练习"} <span aria-hidden="true">→</span></button></div>
          </>}
        </section>
        {(pending || status || uiError || failed) && <div className={styles.statusPanel}>
          {(pending || status) && <div className={styles.statusRow}><div role="status" aria-live="polite">{pending && <span className={styles.spinner} aria-hidden="true" />}<span>{status}{pending && tab === "analysis" && solver.progress ? ` · ${solver.progress}` : ""}</span></div>{pending && <button className={styles.button} onClick={stop}>取消</button>}</div>}
          {pending && <div className={styles.progressTrack} role="progressbar" aria-label="求解任务进行中"><span /></div>}
          {(uiError || failed) && <p className={styles.error} role="alert">{uiError || solver.error || "本次操作未返回结果，请重试或调整搜索范围。"}</p>}
        </div>}
        {tab === "practice" && <section className={styles.panel} aria-label="练习历史">
          <div className={styles.sectionHeading}><h2>练习记录</h2><span className={styles.small}>最近 200 次 · 仅此设备</span></div>
          <div className={styles.sessionStats}><div><span>还原次数</span><strong>{timer.history.length}</strong></div><div><span>最佳成绩</span><strong>{best === null ? "—" : formatTime(best)}</strong></div><div><span>算术平均</span><strong>{mean === null ? "—" : formatTime(mean)}</strong></div></div>
          <p className={styles.small}>平均值包含罚时；任意一次 DNF 会使平均值为 DNF。可逐条调整成绩判罚。</p>
          {timer.storageError && <p className={styles.warning} role="alert">{timer.storageError}</p>}
          {timer.history.length === 0 ? <p className={styles.emptyHistory}>完成第一次计时后，成绩会显示在这里。</p> : <div className={styles.historyList}>{timer.history.map((record, index) => <details key={record.id} className={styles.historyRow}><summary><span className={styles.muted}>#{timer.history.length - index}</span><strong>{formatTime(adjustedTime(record))}{record.penalty === "+2" ? " (+2)" : ""}</strong><span className={styles.small}>{new Date(record.date).toLocaleDateString("zh-CN")}</span></summary><p><code>{record.scramble}</code></p><p className={styles.small}>{record.sampling}</p><p className={styles.small}>原始用时 {formatTime(record.elapsedMs)} · 观察 {(record.inspectionMs / 1000).toFixed(2)} 秒 · 观察判罚 {record.inspectionPenalty === "none" ? "无" : record.inspectionPenalty === "+2" ? "+2 秒" : "DNF"}</p><Field label="成绩判罚"><select value={record.penalty} onChange={(event) => timer.setPenalty(record.id, event.target.value as Penalty)}><option value="none">无罚时</option><option value="+2">+2 秒</option><option value="DNF">DNF（未完成）</option></select></Field></details>)}</div>}
        </section>}
        {snapshot ? <section className={styles.results} aria-label="解法列表">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>02 / 比较执行</p><h2>解法工作台 <span className={styles.muted}>{filtered.length} / {solutions.length}</span></h2></div></div>
          <p className={styles.small}>打乱 <code>{snapshot.scramble}</code> · {snapshot.options.methods.join("、")} · {snapshot.options.colors.length} 种底色</p>
          <ResultNotice snapshot={snapshot} />
          <details className={styles.filterPanel} open><summary>筛选与排序当前解法</summary><div className={styles.filterGrid}>
            <Field label="方法"><select value={filters.method} onChange={(event) => filter("method", event.target.value)}><option value="">全部方法</option>{METHODS.map((method) => <option key={method.id} value={method.id}>{method.label}</option>)}</select></Field>
            <Field label="底色"><select value={filters.color} onChange={(event) => filter("color", event.target.value)}><option value="">全部底色</option>{COLORS.map((color) => <option key={color.id} value={color.id}>{color.label}</option>)}</select></Field>
            <Field label="分组"><select value={filters.group} onChange={(event) => filter("group", event.target.value)}><option value="">全部分组</option>{[...new Set(solutions.map((solution) => solution.group).filter(Boolean))].sort().map((group) => <option key={group} value={group}>{group}</option>)}</select></Field>
            <Field label="排序"><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">推荐顺序（引擎排序）</option><option value="moves">总步数最少</option><option value="base">做底最短</option><option value="ergonomics">顺手度最高</option></select></Field>
            {([["base", "做底深度上限"], ["moves", "总步数上限"], ["ergonomics", "最低顺手度（整数）"], ["cancelled", "最少消步数"], ["regrips", "预计换手次数上限"]] as const).map(([key, label]) => <Field key={key} label={label}><input type="number" min={0} step={1} placeholder="不限" value={filters[key]} onChange={(event) => filter(key, event.target.value === "" ? "" : String(Math.max(0, Math.trunc(Number(event.target.value)))))} /></Field>)}
            <Field label="查找情形或公式"><input type="search" value={filters.text} placeholder="情形、分组、转动记号…" onChange={(event) => filter("text", event.target.value)} /></Field>
          </div><div className={styles.filterFooter}><span className={styles.small}>仅筛选本次返回的解法；顺手度按显示的整数分数筛选。</span><button className={styles.textButton} onClick={() => { setFilters(INITIAL_FILTERS); setSort("recommended"); }}>重置筛选</button></div></details>
          {filtered.length ? <><SolutionCards key={snapshot.scramble} solutions={filtered.slice(0, visibleCount)} scramble={snapshot.scramble} />{visibleCount < filtered.length && <button className={styles.loadMore} onClick={() => setVisibleCount(value => value + 30)}>显示更多解法 · 已展示 {Math.min(visibleCount, filtered.length)} / {filtered.length}</button>}</> : <div className={styles.emptyState}><span className={styles.eyebrow}>暂无可显示的解法</span><h3>{solutions.length ? "没有解法符合当前筛选条件。" : "本次搜索未返回解法。"}</h3><p>{solutions.length ? "放宽或重置筛选条件，继续比较已有解法。" : "可增加方法、底色、做底深度或搜索预算；未找到结果不代表无解。"}</p>{solutions.length > 0 && <button className={styles.button} onClick={() => setFilters(INITIAL_FILTERS)}>重置筛选</button>}</div>}
        </section> : tab === "analysis" ? <div className={styles.emptyState}><div className={styles.emptyDiagram} aria-hidden="true"><span>做底</span><i>→</i><span>识别情形</span><i>→</i><span>完整执行</span></div><h2>好解法，从好的做底思路开始。</h2><p>输入打乱后自动比较不同方法、消步与顺手度。</p><span className={styles.small}>修改搜索范围后会自动重新分析。</span></div> : question && <div className={styles.hiddenSolutions}><span aria-hidden="true">◇</span><h3>先保留自己的解题思路。</h3><p>点击「查看解法」后，才会显示所有解法详情。</p></div>}
      </div>
    </div>
  </main>;
}
