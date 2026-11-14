"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { COLORS, METHODS, type Solution } from "./engine/types";
import { formatAnnotatedSolution, formatFullSolution, formatSolutionStages } from "./solutionFormat";
import SolverCube from "./SolverCube";
import styles from "./TwoSolver.module.css";

const METHOD_HUES = [205, 218, 231, 244, 275, 291, 128, 139, 150, 161, 172, 183, 194, 105, 116, 35, 57, 73, 310, 326, 15];

export default function SolutionCards({ solutions, scramble }: { solutions: Solution[]; scramble: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [stage, setStage] = useState<{ id: string; mode: "base" | "full" }>();
  const [copyStatus, setCopyStatus] = useState("");
  const selected = solutions.find((solution) => solution.id === active) || solutions[0];

  async function copy(solution: Solution, annotated = false) {
    try {
      await navigator.clipboard.writeText(annotated ? formatAnnotatedSolution(solution) : formatFullSolution(solution));
      setCopyStatus(`已复制 ${solution.method} ${solution.caseName} 的${annotated ? "原始分段注释（未消步，含朝向）" : "完整解法（含朝向）"}。`);
    } catch { setCopyStatus("无法访问剪贴板，请选中下方完整解法手动复制。"); }
  }

  return <div className={styles.solutionList}>
    <p className={styles.srOnly} role="status">{copyStatus}</p>
    {solutions.map((solution, index) => {
      const color = COLORS.find((item) => item.id === solution.color);
      const method = METHODS.find((item) => item.id === solution.method);
      const stages = formatSolutionStages(solution);
      const full = formatFullSolution(solution);
      const methodIndex = METHODS.findIndex(item => item.id === solution.method);
      const notes = solution.ergonomics.notes.filter(note => note !== "顺手度仅供排序参考，实际执行感受取决于握姿与指法；步数不含前置朝向调整。"
        && note !== "采用 two-tool 三连参考权重；不代表个人实测速度。");
      return <article className={styles.solutionCard} key={solution.id} data-method={solution.method}
        style={{ "--method-tint": `hsl(${METHOD_HUES[methodIndex] ?? 205} 58% 76%)` } as CSSProperties}>
        <header className={styles.solutionHeader}>
          <div className={styles.inline}><span className={styles.rank}>{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{solution.method} <span className={styles.muted}>{solution.caseName}</span></h3>
              <p className={styles.small}>{solution.group || "未分组"} <span aria-hidden="true">·</span> <span className={styles.colorDot} style={{ background: color?.hex }} /> {color?.label || solution.color}色底</p></div></div>
          <div className={styles.moveCount}><strong>{solution.moves}</strong><span>步</span></div>
        </header>
        <p className={styles.stageLegend}>原始分段 · 括号标出消步重叠 <span>括号内动作仅执行一次</span></p>
        <dl className={styles.steps}>
          {stages.map(({ id, label, parts }) =>
            <div key={id} data-stage={id}><dt>{label}</dt><dd><code>{parts.length ? parts.map((part, i) =>
              <span key={i}>{i > 0 ? " " : ""}<span data-cancelled={part.cancelled ? "true" : undefined}>{part.cancelled ? `(${part.text})` : part.text}</span></span>) : "—"}</code></dd></div>)}
        </dl>
        <div className={styles.completeAlg}><span className={styles.eyebrow}>完整解法 · 已消步 · 含朝向</span><code>{full || "无需转动"}</code></div>
        <div className={styles.solutionMetrics}>
          <span>做底 <strong>{solution.baseMoves}</strong> 步</span>
          <span>消步 <strong>{solution.cancelled}</strong> 步</span>
          <span>顺手度 <strong>{solution.ergonomics.score.toFixed(0)}</strong></span>
        </div>
        <details className={styles.details}>
          <summary>原始分段与顺手度说明</summary>
          <p className={styles.small}>原始分段 · 未消步 {stages.at(-1)!.cumulative} 步 → 消步后 {solution.moves} 步 · 分段步数 / 原始累计步数（不计朝向与转体）</p>
          <code className={styles.annotatedAlg}>{formatAnnotatedSolution(solution)}</code>
          <p className={styles.small}>预计换手 {solution.ergonomics.regrips} 次 · 转体 {solution.ergonomics.rotations} 次 · 成本 {solution.ergonomics.cost.toFixed(2)} · {solution.ergonomics.confidence === "reference" ? "参考数据评分" : "估算评分"}</p>
          {notes.length > 0 && <ul className={styles.notes}>{notes.map((note, i) => <li key={i}>{note}</li>)}</ul>}
        </details>
        <footer className={styles.cardActions}>
          <button className={styles.button} onClick={() => void copy(solution)}>复制完整解法</button>
          <button className={styles.button} onClick={() => void copy(solution, true)}>复制分段注释</button>
          <button className={styles.button} aria-pressed={selected?.id === solution.id} onClick={() => { setActive(solution.id); setStage({ id: solution.id, mode: "full" }); }}>3D 解析</button>
          <Link className={styles.textLink} href={`/algs/222/${encodeURIComponent(method?.api || solution.sourceApi)}`}>查看公式库 ↗</Link>
        </footer>
        {selected?.id === solution.id && <div className={styles.solver3DPanel}>
          <div className={styles.solver3DStages} role="group" aria-label="3D 解析阶段">
            <button type="button" className={styles.button} aria-pressed={stage?.id === solution.id && stage.mode === "base"}
              onClick={() => setStage({ id: solution.id, mode: "base" })}>做底完成</button>
            <button type="button" className={styles.button} aria-pressed={stage?.id !== solution.id || stage.mode === "full"}
              onClick={() => setStage({ id: solution.id, mode: "full" })}>完整解法</button>
          </div>
          <p className={styles.solver3DCaption}>{stage?.id === solution.id && stage.mode === "base" ? "原始做底阶段" : "完整消步解法"}</p>
          <SolverCube setup={stage?.id === solution.id && stage.mode === "base" ? [scramble, solution.orientation, solution.base].filter(Boolean).join(" ") : scramble}
            alg={stage?.id === solution.id && stage.mode === "base" ? "" : full}
            height={300} label="解法 3D 解析" />
          <p className={styles.solver3DCaption}>{stage?.id === solution.id && stage.mode === "base"
            ? "显示执行朝向与原始做底后的状态（不含前置 AUF）；拖动魔方可旋转视角。"
            : "拖动魔方旋转视角；使用下方播放、单步按钮或进度条查看解法，不会自动播放。"}</p>
        </div>}
      </article>;
    })}
    {copyStatus && <p className={styles.small}>{copyStatus}</p>}
  </div>;
}
