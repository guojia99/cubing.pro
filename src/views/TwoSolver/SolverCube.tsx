"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { TwistyPlayer } from "cubing/twisty";
import type { Mesh } from "three";
import styles from "./TwoSolver.module.css";

export type SolverCubeProps = {
  setup: string;
  alg: string;
  height: number;
  label?: string;
};

type Vantage = Awaited<ReturnType<TwistyPlayer["experimentalCurrentVantages"]>> extends Iterable<infer T> ? T : never;
type Slot = {
  owner?: symbol;
  root?: HTMLDivElement;
  player?: TwistyPlayer;
  ready?: Promise<Vantage[]>;
  release?: () => void;
  destroy?: () => void;
};

// cubing 0.63.3 keeps a private ResizeObserver after disconnect(). Keep at most
// two connected trees across StrictMode, card switches and route remounts.
// These slots are independent of NativeTwoByTwo's singleton ownership.
const slots: Slot[] = [{}, {}];

function park(slot: Slot) {
  slot.player?.pause();
  if (slot.player) slot.player.experimentalDragInput = "none";
  if (!slot.root) return;
  slot.root.inert = true;
  slot.root.setAttribute("aria-hidden", "true");
  slot.root.style.cssText = "position:fixed;left:-10000px;top:0;width:240px;height:280px;opacity:0;pointer-events:none";
}

async function initialize(slot: Slot): Promise<Vantage[]> {
  const { TwistyPlayer: Player } = await import("cubing/twisty");
  const root = document.createElement("div");
  root.inert = true;
  root.setAttribute("aria-hidden", "true");
  root.dataset.solverCubeTree = "true";
  // Native scene initialization needs one actual intersection before parking.
  root.style.cssText = "position:fixed;left:0;top:0;width:240px;height:280px;opacity:0;pointer-events:none";
  const player = new Player({
    puzzle: "2x2x2", visualization: "3D", background: "none",
    viewerLink: "none", controlPanel: "none", hintFacelets: "none",
    backView: "none", experimentalSetupAnchor: "start", experimentalDragInput: "auto",
  });
  player.style.cssText = "display:block;width:100%;height:100%";
  player.contentWrapper.style.cssText = "width:100%;height:100%;min-width:0;min-height:0";
  player.experimentalSetFlashLevel("none");
  root.appendChild(player);
  slot.root = root;
  slot.player = player;
  document.body.appendChild(root);

  let destroyed = false;
  let vantages: Vantage[] = [];
  const dispose = async () => {
    player.pause();
    player.experimentalDragInput = "none";
    for (const vantage of vantages) {
      vantage.disconnect();
      vantage.scene?.disconnect();
      try {
        const wrapper = await vantage.scene?.experimentalTwisty3DPuzzleWrapper();
        wrapper?.disconnect();
        const object = await wrapper?.twisty3DPuzzle();
        object?.traverse((node) => {
          const mesh = node as Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose();
        });
      } catch { /* Initialization may have failed before creating the puzzle. */ }
      try {
        const renderer = await vantage.renderer();
        renderer.dispose();
        renderer.forceContextLoss();
      } catch { /* Shared renderers are library-owned, not this slot's resource. */ }
    }
    player.remove();
    root.remove();
  };
  const onPageHide = (event: PageTransitionEvent) => {
    if (event.persisted) { player.pause(); return; }
    slot.release?.();
    park(slot);
    slot.destroy?.();
  };
  slot.destroy = () => {
    if (destroyed) return;
    destroyed = true;
    window.removeEventListener("pagehide", onPageHide);
    void dispose();
  };
  window.addEventListener("pagehide", onPageHide);
  // Check cancellation on every wait; never allocate a replacement renderer.
  while (!destroyed) {
    vantages = Array.from(await player.experimentalCurrentVantages());
    if (vantages.length) break;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  if (destroyed) { await dispose(); throw new Error("播放器已卸载"); }
  await Promise.all(vantages.map(async (vantage) => {
    await vantage.canvasInfo();
    await (await vantage.scene?.experimentalTwisty3DPuzzleWrapper())?.twisty3DPuzzle();
  }));
  if (destroyed) { await dispose(); throw new Error("播放器已卸载"); }
  if (!slot.owner) park(slot);
  return vantages;
}

export default function SolverCube({ setup, alg, height, label = "二阶魔方 3D" }: SolverCubeProps) {
  const host = useRef<HTMLDivElement>(null);
  const playerId = useId();
  const key = JSON.stringify([setup, alg]);
  const [result, setResult] = useState<{ key: string; error?: string }>();
  const current = result?.key === key ? result : undefined;

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const slot = slots.find((item) => !item.owner);
    if (!slot) {
      setResult({ key, error: "3D 播放器正在使用中，请稍后重试。" });
      return;
    }
    const owner = Symbol();
    slot.owner = owner;
    let cancelled = false;
    let frame = 0;
    let removeListeners = () => {};
    const release = () => {
      cancelAnimationFrame(frame);
      removeListeners();
      park(slot);
    };
    slot.release = release;
    const fail = () => {
      if (!cancelled) {
        release();
        setResult({ key, error: "无法加载 3D 魔方，请检查公式或刷新页面重试。" });
      }
    };
    void (async () => {
      const [{ Alg }, { puzzles }] = await Promise.all([import("cubing/alg"), import("cubing/puzzles")]);
      const puzzle = await puzzles["2x2x2"].kpuzzle();
      puzzle.defaultPattern().applyAlg(new Alg(setup)).applyAlg(new Alg(alg));
      if (cancelled) return;
      const vantages = await (slot.ready ??= initialize(slot));
      if (cancelled) return;
      const { root, player } = slot;
      if (!root || !player) throw new Error("播放器不可用");
      player.pause();
      player.experimentalDragInput = "auto";
      player.experimentalSetupAlg = setup;
      player.alg = alg;
      player.experimentalSetupAnchor = "start";
      player.timestamp = "start";
      player.controlPanel = alg.trim() ? "bottom-row" : "none";
      const position = await player.experimentalModel.legacyPosition.get();
      if (cancelled) return;
      for (const vantage of vantages) {
        const wrapper = await vantage.scene?.experimentalTwisty3DPuzzleWrapper();
        const object = await wrapper?.twisty3DPuzzle();
        if (cancelled) return;
        object?.onPositionChange(position);
      }
      const canvases = await Promise.all(vantages.map((vantage) => vantage.canvasInfo()));
      if (cancelled) return;
      for (const { canvas } of canvases) canvas.addEventListener("webglcontextlost", fail);
      removeListeners = () => {
        for (const { canvas } of canvases) canvas.removeEventListener("webglcontextlost", fail);
      };
      // Keep the tree connected: reparenting a vantage installs another private
      // ResizeObserver. Follow the host's geometry and ancestor clipping instead.
      let previousCSS = "";
      const align = () => {
        const rect = container.getBoundingClientRect();
        let left = Math.max(0, rect.left), top = Math.max(0, rect.top);
        let right = Math.min(document.documentElement.clientWidth, rect.right);
        let bottom = Math.min(window.innerHeight, rect.bottom);
        let visible = container.isConnected && rect.width > 0 && rect.height > 0;
        const modal = [...document.querySelectorAll<HTMLElement>('[role="dialog"][data-state="open"]')].at(-1);
        if (modal && !modal.contains(container)) visible = false;
        let layer = 1;
        for (let parent: HTMLElement | null = container; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          const zIndex = Number.parseInt(style.zIndex, 10);
          if (Number.isFinite(zIndex)) layer = Math.max(layer, zIndex + 1);
          if (style.display === "none" || style.visibility !== "visible" || Number(style.opacity) === 0) visible = false;
          if (parent === container) continue;
          const bounds = parent.getBoundingClientRect();
          if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) { left = Math.max(left, bounds.left + parent.clientLeft); right = Math.min(right, bounds.left + parent.clientLeft + parent.clientWidth); }
          if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) { top = Math.max(top, bounds.top + parent.clientTop); bottom = Math.min(bottom, bounds.top + parent.clientTop + parent.clientHeight); }
        }
        visible &&= right > left && bottom > top;
        const css = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;z-index:${layer};clip-path:inset(${Math.max(0, top - rect.top)}px ${Math.max(0, rect.right - right)}px ${Math.max(0, rect.bottom - bottom)}px ${Math.max(0, left - rect.left)}px);opacity:${visible ? 1 : 0};pointer-events:${visible ? "auto" : "none"}`;
        if (previousCSS !== css) { root.style.cssText = css; previousCSS = css; }
        root.inert = !visible;
        root.setAttribute("aria-hidden", String(!visible));
        if (!visible) player.pause();
        frame = requestAnimationFrame(align);
      };
      root.setAttribute("role", "region");
      root.setAttribute("aria-label", label);
      root.id = playerId;
      root.dataset.solverCubePlayer = label;
      align();
      setResult({ key });
    })().catch(fail);
    return () => {
      cancelled = true;
      release();
      if (slot.owner === owner) { slot.owner = undefined; slot.release = undefined; }
    };
  }, [setup, alg, key, label, playerId]);

  return <div ref={host} className={styles.solverCube} role="region" aria-label={label}
    aria-busy={!current} aria-owns={current && !current.error ? playerId : undefined}
    data-solver-cube={label} data-setup={setup} data-alg={alg}
    style={{ height: Number.isFinite(height) ? Math.max(160, height) : 280 }}>
    {(!current || current.error) && <p className={styles.solverCubeStatus} role={current?.error ? "alert" : "status"}>
      {current?.error || "正在加载 3D 魔方…"}
    </p>}
  </div>;
}
