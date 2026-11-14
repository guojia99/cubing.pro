"use client";

import Link from "next/link";
import { CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { COLORS, METHODS, type Solution } from "./engine/types";
import { formatAnnotatedSolution, formatFullSolution, formatSolutionStages } from "./solutionFormat";
import SolverCube from "./SolverCube";
import styles from "./SolutionCards.module.css";

const METHOD_HUES = [205, 218, 231, 244, 275, 291, 128, 139, 150, 161, 172, 183, 194, 105, 116, 35, 57, 73, 310, 326, 15];

export default function SolutionCards({ solutions, scramble }: { solutions: Solution[]; scramble: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [stage, setStage] = useState<"base" | "full">("full");
  const [copyStatus, setCopyStatus] = useState("");
  const [playerPanel, setPlayerPanel] = useState<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openingScroll = useRef<{ x: number; y: number } | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const selected = solutions.find((solution) => solution.id === active);
  const selectedId = selected?.id;

  useEffect(() => {
    if (!selectedId) return;
    const containFocus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const dialog = dialogRef.current;
      const id = dialog?.querySelector("[data-solver-cube]")?.getAttribute("aria-owns");
      const player = id ? document.getElementById(id) : null;
      // Native controls live in a connected body-level tree; permit that tree
      // while retaining modal focus containment for all background controls.
      if (!dialog || dialog.contains(target) || player?.contains(target)) return;
      // Run before Chakra's document capture handler: its last focus target can
      // be the non-focusable host of a closed-shadow native player control.
      event.stopImmediatePropagation();
      dialog.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    };
    window.addEventListener("focusin", containFocus, true);
    return () => window.removeEventListener("focusin", containFocus, true);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    // Overflow locking clips the fixed native player against the scrolled body's
    // bounds. Freeze the page instead, keeping the connected tree visible.
    const body = document.body;
    const scrollX = openingScroll.current?.x ?? window.scrollX, scrollY = openingScroll.current?.y ?? window.scrollY;
    openingScroll.current = null;
    const properties = ["position", "top", "left", "width", "overflow"] as const;
    const previous = properties.map(property => [property, body.style.getPropertyValue(property), body.style.getPropertyPriority(property)]);
    body.style.position = "fixed";
    body.style.top = `${-scrollY}px`;
    body.style.left = `${-scrollX}px`;
    body.style.width = "100%";
    body.style.overflow = "visible";
    return () => {
      for (const [property, value, priority] of previous) {
        if (value) body.style.setProperty(property, value, priority);
        else body.style.removeProperty(property);
      }
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
      trigger.current?.focus({ preventScroll: true });
      // Modal focus restoration runs after effect cleanup. Restore once more
      // after it settles so the trigger cannot nudge the page on close.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!document.querySelector('[role="dialog"][data-state="open"]')) window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
      }));
      const settled = window.setTimeout(() => {
        window.removeEventListener("wheel", cancelRestore);
        window.removeEventListener("touchstart", cancelRestore);
        window.removeEventListener("pointerdown", cancelRestore);
        window.removeEventListener("keydown", cancelRestore);
        if (!document.querySelector('[role="dialog"][data-state="open"]')) window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
      }, 180);
      function cancelRestore() { window.clearTimeout(settled); window.removeEventListener("wheel", cancelRestore); window.removeEventListener("touchstart", cancelRestore); window.removeEventListener("pointerdown", cancelRestore); window.removeEventListener("keydown", cancelRestore); }
      window.addEventListener("wheel", cancelRestore, { once: true, passive: true });
      window.addEventListener("touchstart", cancelRestore, { once: true, passive: true });
      window.addEventListener("pointerdown", cancelRestore, { once: true, passive: true });
      window.addEventListener("keydown", cancelRestore, { once: true });
    };
  }, [selectedId]);

  useEffect(() => {
    const panel = playerPanel;
    if (!selectedId || !panel) return;
    // The native tree stays connected outside the portal. Chakra follows expanded
    // aria-controls relationships when trapping focus in portalled controls.
    const connect = () => {
      const id = panel.querySelector("[data-solver-cube]")?.getAttribute("aria-owns");
      const controller = panel.querySelector('[aria-pressed="true"]');
      if (id && controller) {
        controller.setAttribute("aria-controls", id);
        controller.setAttribute("aria-expanded", "true");
        // Keep Chakra's outside-tree walk from hiding the closed-shadow player.
        const player = document.getElementById(id)?.querySelector("twisty-player");
        player?.setAttribute("aria-live", "off");
        player?.removeAttribute("aria-hidden");
      }
    };
    const observer = new MutationObserver(connect);
    observer.observe(panel, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-owns"] });
    connect();
    return () => {
      observer.disconnect();
      panel.querySelectorAll("[aria-controls]").forEach(element => {
        element.removeAttribute("aria-controls");
        element.removeAttribute("aria-expanded");
      });
    };
  }, [playerPanel, selectedId, stage]);

  function playerRoot() {
    const id = dialogRef.current?.querySelector("[data-solver-cube]")?.getAttribute("aria-owns");
    return (id ? document.getElementById(id) : null) || dialogRef.current;
  }

  async function copy(solution: Solution, annotated = false) {
    try {
      await navigator.clipboard.writeText(annotated ? formatAnnotatedSolution(solution) : formatFullSolution(solution));
      setCopyStatus(`已复制 ${solution.method} ${solution.caseName} 的${annotated ? "分段注释" : "完整解法"}。`);
    } catch { setCopyStatus("无法访问剪贴板，请选中下方完整解法手动复制。"); }
  }

  return <>
    <div className={styles.solutionList}>
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
          <div className={styles.identity}>
            <div className={styles.methodLine}><span className={styles.rank}>{String(index + 1).padStart(2, "0")}</span>
              <h3>{solution.method}</h3>
              <span className={styles.colorDot} style={{ background: color?.hex }} role="img" aria-label={`${color?.label || solution.color}色底`} title={`${color?.label || solution.color}色底`} />
            </div>
            <p className={styles.caseName} title={[solution.group, solution.caseName].filter(Boolean).join(" · ")}>{solution.caseName}</p>
          </div>
          <div className={styles.moveCount} title="消步后总步数，不计朝向与转体"><strong>{solution.moves}</strong><span>步</span></div>
        </header>
        <div className={styles.completeAlg}><code data-full-solution title="完整解法 · 已消步 · 含朝向">{full || "无需转动"}</code></div>
        <dl className={styles.steps}>
          {stages.map(({ id, label, parts }) =>
            <div key={id} data-stage={id}><dt title={label}>{id === "preAuf" || id === "postAuf" ? "AUF" : label}<span className={styles.srOnly}>{id === "preAuf" ? "（前置）" : id === "postAuf" ? "（后置）" : ""}</span></dt><dd><code>{parts.length ? parts.map((part, i) =>
              <span key={i}>{i > 0 ? " " : ""}<span data-cancelled={part.cancelled ? "true" : undefined} title={part.cancelled ? "消步重叠：原始分段中的动作仍执行一次" : undefined}>{part.cancelled ? `(${part.text})` : part.text}</span></span>) : "—"}</code></dd></div>)}
        </dl>
        <div className={styles.solutionMetrics}>
          <span>做底 <strong>{solution.baseMoves}</strong> 步</span>
          <span>消步 <strong>{solution.cancelled}</strong> 步</span>
          <span>顺手度 <strong>{solution.ergonomics.score.toFixed(0)}</strong></span>
        </div>
        <details className={styles.details}>
          <summary>分段详情</summary>
          <code className={styles.annotatedAlg}>{formatAnnotatedSolution(solution)}</code>
          <p className={styles.small}>预计换手 {solution.ergonomics.regrips} 次 · 转体 {solution.ergonomics.rotations} 次 · 成本 {solution.ergonomics.cost.toFixed(2)} · {solution.ergonomics.confidence === "reference" ? "参考数据评分" : "估算评分"}</p>
          {notes.length > 0 && <ul className={styles.notes}>{notes.map((note, i) => <li key={i}>{note}</li>)}</ul>}
        </details>
        <footer className={styles.cardActions}>
          <button type="button" className={styles.button} aria-label="复制完整解法" title="复制完整解法" onClick={() => void copy(solution)}>复制</button>
          <button type="button" className={styles.button} aria-label="复制分段注释" title="复制分段注释" onClick={() => void copy(solution, true)}>注释</button>
          <button type="button" className={styles.button} aria-label="3D 解析" aria-haspopup="dialog" onMouseDown={event => event.preventDefault()} onClick={event => { trigger.current = event.currentTarget; openingScroll.current = { x: window.scrollX, y: window.scrollY }; setActive(solution.id); setStage("full"); }}>3D</button>
          <Link className={styles.textLink} aria-label={`查看 ${solution.method} 公式库`} href={`/algs/222/${encodeURIComponent(method?.api || solution.sourceApi)}`}>Algs ↗</Link>
        </footer>
      </article>;
    })}
    </div>
    <p className={styles.copyStatus} role="status">{copyStatus}</p>
    <Dialog.Root open={!!selected} onOpenChange={event => { if (!event.open) setActive(null); }}
      size={{ mdDown: "full", md: "md" }} placement="center" scrollBehavior="inside" preventScroll={false} restoreFocus={false} lazyMount unmountOnExit
      persistentElements={[playerRoot]}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content ref={dialogRef} className={styles.dialog}>
            <Dialog.Header>
              <Dialog.Title>{selected?.method} · 3D 解析</Dialog.Title>
              <Dialog.CloseTrigger asChild><CloseButton size="sm" aria-label="关闭 3D 解析" /></Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              {selected && <div ref={setPlayerPanel} className={styles.playerPanel}>
                <Dialog.Description className={styles.small}>{selected.caseName} · {selected.moves} 步</Dialog.Description>
                <div className={styles.solver3DStages} role="group" aria-label="3D 解析阶段">
                  <button type="button" className={styles.button} aria-pressed={stage === "base"} onClick={() => setStage("base")}>做底完成</button>
                  <button type="button" className={styles.button} aria-pressed={stage === "full"} onClick={() => setStage("full")}>完整解法</button>
                </div>
                <SolverCube setup={stage === "base" ? [scramble, selected.orientation, selected.base].filter(Boolean).join(" ") : scramble}
                  alg={stage === "base" ? "" : formatFullSolution(selected)} height={300} label="解法 3D 解析" />
                <p className={styles.small}>{stage === "base" ? "朝向与原始做底后的状态，不含前置 AUF。" : "拖动旋转视角，使用播放、单步或进度条查看解法。"}</p>
                <code className={styles.playerAlg}>{stage === "base" ? [selected.orientation, selected.base].filter(Boolean).join(" ") || "无需转动" : formatFullSolution(selected) || "无需转动"}</code>
              </div>}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  </>;
}
