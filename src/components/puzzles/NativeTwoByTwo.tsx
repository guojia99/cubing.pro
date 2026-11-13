"use client";

import { useEffect, useRef, useState } from "react";
import type { TwistyPlayer } from "cubing/twisty";
import type { Material, Mesh } from "three";
import { createNativeQueue } from "./nativeQueue";

export type NativeTwoByTwoProps = {
  setup: string;
  alg: string;
  colors: Record<string, string>;
  height: number;
  interactive?: boolean;
};

const FACES = ["U", "F", "R", "B", "L", "D"] as const;
const DEFAULT_COLORS = ["#ffdd00", "#e53935", "#00a651", "#ff8800", "#2266ff", "#ffffff"];
type Vantage = Awaited<ReturnType<TwistyPlayer["experimentalCurrentVantages"]>> extends Iterable<infer T> ? T : never;
type PuzzleObject = Awaited<ReturnType<TwistyPlayer["experimentalCurrentThreeJSPuzzleObject"]>>;
type Request = { setup: string; alg: string; palette: string };

const images = new Map<string, string>();
let interactiveOwner: symbol | undefined;
let interactiveRequest = 0;

type Slot = {
  root: HTMLDivElement;
  player: TwistyPlayer;
  object: PuzzleObject;
  vantage: Vantage;
  paint: () => void;
  restore: () => void;
  palette: string;
};

type Pool = {
  root?: HTMLDivElement;
  player?: TwistyPlayer;
  slot?: Slot;
  object?: PuzzleObject;
  slotPromise?: Promise<Slot>;
  canvas?: HTMLCanvasElement;
  vantage?: Vantage;
  wrapper?: Awaited<ReturnType<NonNullable<Vantage["scene"]>["experimentalTwisty3DPuzzleWrapper"]>>;
  lost?: boolean;
  restored?: Promise<void>;
  onRestore?: () => void;
  rebuildPuzzle?: boolean;
  release?: () => void;
  fail?: (error: Error) => void;
};
const thumbnailPool: Pool = {};
const interactivePool: Pool = {};

function resetPool(pool: Pool) {
  pool.release?.();
  pool.release = undefined;
  pool.fail = undefined;
  pool.slot?.restore();
  pool.vantage?.experimentalNextRenderFinishedCallback(() => {});
  pool.slot = undefined;
  pool.slotPromise = undefined;
  if (pool.root && pool.player) park({ root: pool.root, player: pool.player });
}

const thumbnailQueue = createNativeQueue<Request & { key: string }, string>(async (request, signal, wanted) => {
  await validate(request);
  signal.throwIfAborted();
  if (!wanted()) throw new DOMException("No thumbnail subscribers.", "AbortError");
  try {
    const slot = await createSlot(thumbnailPool, false, request, signal);
    signal.throwIfAborted();
    if (!wanted()) throw new DOMException("No thumbnail subscribers.", "AbortError");
    await configure(slot, request, signal);
    signal.throwIfAborted();
    if (!wanted()) throw new DOMException("No thumbnail subscribers.", "AbortError");
    const png = await capture(slot, signal);
    signal.throwIfAborted();
    if (wanted()) {
      images.set(request.key, png);
      if (images.size > 256) images.delete(images.keys().next().value!);
    }
    return png;
  } catch (error) {
    if (!signal.aborted && !(error instanceof DOMException && error.name === "AbortError")) thumbnailQueue.invalidate(error);
    throw error;
  }
}, () => resetPool(thumbnailPool));

const interactiveQueue = createNativeQueue<{
  run: (signal: AbortSignal) => Promise<void>;
}, void>(async ({ run }, signal) => {
  try { await run(signal); }
  catch (error) {
    if (!signal.aborted) interactiveQueue.invalidate(error);
    throw error;
  }
}, () => resetPool(interactivePool));

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function park(slot: Pick<Slot, "root" | "player">) {
  slot.player.pause();
  slot.root.inert = true;
  slot.root.setAttribute("aria-hidden", "true");
  slot.root.style.cssText = "position:fixed;left:-10000px;top:0;width:180px;height:180px;opacity:0;visibility:visible;pointer-events:none";
}

async function validate({ setup, alg }: Request) {
  const [{ Alg }, { puzzles }] = await Promise.all([import("cubing/alg"), import("cubing/puzzles")]);
  const kpuzzle = await puzzles["2x2x2"].kpuzzle();
  kpuzzle.defaultPattern().applyAlg(new Alg(setup)).applyAlg(new Alg(alg));
}

async function createSlot(pool: Pool, interactive: boolean, request: Request, signal: AbortSignal): Promise<Slot> {
  if (pool.slotPromise) return pool.slotPromise;
  const promise = initializeSlot(pool, interactive, request, signal);
  pool.slotPromise = promise;
  void promise.catch(() => {
    if (pool.slotPromise === promise) resetPool(pool);
  });
  return promise;
}

async function initializeSlot(pool: Pool, interactive: boolean, request: Request, signal: AbortSignal): Promise<Slot> {
  const { TwistyPlayer: Player } = await import("cubing/twisty");
  signal.throwIfAborted();
  // A failed attempt resets readiness, not the native tree: cubing 0.63.3
  // cannot dispose its ResizeObserver. Never allocate more than these two trees.
  if (!pool.root || !pool.player) {
    const root = document.createElement("div");
    root.dataset.nativeTwoByTwo = interactive ? "interactive" : "thumbnail";
    root.inert = true;
    root.setAttribute("aria-hidden", "true");
    // Intersect once to let the unmodified native player initialize, then park it.
    root.style.cssText = "position:fixed;left:0;top:0;width:180px;height:180px;opacity:0;visibility:visible;pointer-events:none";
    const player = new Player({
      puzzle: "2x2x2", visualization: "3D", experimentalSetupAlg: request.setup, alg: request.alg,
      background: "none", hintFacelets: "none", viewerLink: "none",
      controlPanel: interactive ? "bottom-row" : "none",
    });
    player.style.cssText = "display:block;width:100%;height:100%";
    player.contentWrapper.style.cssText = "width:100%;height:100%;min-width:0;min-height:0";
    root.appendChild(player);
    pool.root = root;
    pool.player = player;
    document.body.appendChild(root);
    window.addEventListener("pagehide", (event) => {
      if (event.persisted) { player.pause(); return; }
      resetPool(pool);
      void player.experimentalCurrentVantages().then(async (vantages) => {
        for (const current of vantages) {
          current.disconnect();
          current.scene?.disconnect();
          (await current.scene?.experimentalTwisty3DPuzzleWrapper())?.disconnect();
          try {
            const renderer = await current.renderer();
            renderer.dispose();
            renderer.forceContextLoss();
          } catch { /* The shared renderer remains library-owned. */ }
        }
        root.remove();
      }).catch(() => root.remove());
    });
  }
  const { root, player } = pool;
  let [vantage] = await player.experimentalCurrentVantages();
  signal.throwIfAborted();
  // experimentalCurrentVantages does not wait for the first intersection.
  while (!vantage) {
    // An earlier readiness failure may have parked before native intersection.
    root.style.left = "0px";
    await nextFrame();
    signal.throwIfAborted();
    [vantage] = await player.experimentalCurrentVantages();
    signal.throwIfAborted();
  }
  if (!vantage?.scene) throw new Error("Native 2x2x2 scene is unavailable.");
  pool.vantage = vantage;
  if (pool.rebuildPuzzle) {
    const scene = vantage.scene;
    const previous = await scene.experimentalTwisty3DPuzzleWrapper();
    signal.throwIfAborted();
    const model = player.experimentalModel;
    const [loader, strategy, threeScene] = await Promise.all([
      model.puzzleLoader.get(), model.visualizationStrategy.get(), scene.scene(),
    ]);
    signal.throwIfAborted();
    // Reset the native puzzle's cached rejection without reconnecting a vantage
    // (which would leak an observer/context). Keep all native controls/rendering.
    const Wrapper = previous.constructor as new (
      model: typeof player.experimentalModel, schedulable: typeof scene,
      puzzleLoader: typeof loader, visualizationStrategy: typeof strategy,
    ) => typeof previous;
    previous.disconnect();
    const replacement = new Wrapper(model, scene, loader, strategy);
    const disconnect = () => replacement.disconnect();
    signal.addEventListener("abort", disconnect, { once: true });
    const dispose = (object: PuzzleObject) => object.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose();
    });
    try {
      // Resolve before adopting: an expired initializer must never attach
      // its replacement to the shared scene after a newer generation takes over.
      const next = await replacement.twisty3DPuzzle();
      if (signal.aborted) { dispose(next); signal.throwIfAborted(); }
      // Native adoption also awaits the OLD puzzle for removal, which may itself
      // be rejected or hung. The new puzzle is already resolved; do not await old.
      void scene.setCurrentTwisty3DPuzzleWrapper(threeScene, replacement).catch(() => {});
      const cleanupOld = (old: PuzzleObject) => { threeScene.remove(old); dispose(old); };
      if (pool.object) cleanupOld(pool.object);
      else void previous.twisty3DPuzzle().then(cleanupOld, () => {});
    }
    catch (error) {
      replacement.disconnect();
      throw error;
    } finally {
      signal.removeEventListener("abort", disconnect);
    }
    signal.throwIfAborted();
    pool.rebuildPuzzle = false;
  }
  const wrapper = await vantage.scene.experimentalTwisty3DPuzzleWrapper();
  signal.throwIfAborted();
  pool.rebuildPuzzle = true;
  const object = await wrapper.twisty3DPuzzle();
  signal.throwIfAborted();
  pool.rebuildPuzzle = false;
  pool.object = object;
  if (pool.wrapper !== wrapper) {
    pool.wrapper = wrapper;
    wrapper.addEventListener("render-scheduled", () => pool.slot?.paint());
  }
  const { canvas } = await vantage.canvasInfo();
  signal.throwIfAborted();
  if (pool.canvas !== canvas) {
    // getExtension() returns null on a lost context. Retain the extension while
    // healthy, then request restoration after contextlost finishes dispatching.
    const loss = await vantage.renderer().then((renderer) => renderer.getContext().getExtension("WEBGL_lose_context")).catch(() => null);
    signal.throwIfAborted();
    pool.canvas = canvas;
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      pool.lost = true;
      pool.restored = new Promise<void>((resolve) => { pool.onRestore = resolve; });
      const error = new Error("Native 2x2x2 WebGL context lost. Retry to recover.");
      pool.fail?.(error);
      (interactive ? interactiveQueue : thumbnailQueue).invalidate(error);
      // Three restores its own renderer on this same canvas; no new context/tree.
      setTimeout(() => loss?.restoreContext(), 0);
    });
    canvas.addEventListener("webglcontextrestored", () => {
      pool.lost = false;
      pool.onRestore?.();
      pool.onRestore = undefined;
    });
  }
  if (pool.lost) await pool.restored;
  signal.throwIfAborted();
  await nextFrame();
  signal.throwIfAborted();
  const slot = { root, player, object, vantage, paint: () => {}, restore: () => {}, palette: "" };
  pool.slot = slot;
  park(slot);
  return slot;
}

async function recolor(slot: Slot, palette: string, signal: AbortSignal) {
  signal.throwIfAborted();
  if (slot.palette === palette) { slot.paint(); return; }
  const [{ Color }, { puzzles }] = await Promise.all([import("three"), import("cubing/puzzles")]);
  signal.throwIfAborted();
  const pg = await puzzles["2x2x2"].pg!();
  signal.throwIfAborted();
  const data = pg.get3d();
  const targets = JSON.parse(palette) as string[];
  const vector = (color: InstanceType<typeof Color>) =>
    `vec3(${color.convertLinearToSRGB().toArray().map((value) => value.toFixed(8)).join(",")})`;
  const tests = FACES.map((face, index) => {
    const faceIndex = data.faces.findIndex((entry) => entry.name === face);
    const source = data.stickers.find((entry) => entry.face === faceIndex)?.color;
    if (!source) throw new Error(`Missing native puzzle face: ${face}`);
    const target = targets[index];
    if (!CSS.supports("color", target) || /var\(|currentcolor/i.test(target)) {
      throw new Error(`Invalid ${face} face color: ${target}`);
    }
    // PG3D's normalized byte attributes and the native LinearSRGB output both
    // carry sRGB-encoded values. Encode replacements exactly the same way.
    return `if (all(lessThan(abs(nativeSourceRGB - ${vector(new Color(source))}), vec3(0.002)))) { diffuseColor.rgb = ${vector(new Color(target))}; }`;
  });
  const injection = `\nvec3 nativeSourceRGB = diffuseColor.rgb;\n${tests.join(" else ")}\n`;
  slot.restore();
  const clones = new Map<Material, Material>();
  const originals = new Map<Material, Material>();
  const meshes = new Set<Mesh>();
  const clone = (source: Material) => {
    if (originals.has(source)) return source;
    let material = clones.get(source);
    if (!material) {
      material = source.clone();
      material.onBeforeCompile = (shader, renderer) => {
        source.onBeforeCompile.call(material, shader, renderer);
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>", `#include <color_fragment>${injection}`,
        );
      };
      material.customProgramCacheKey = () => `${source.customProgramCacheKey()}:native-222:${injection}`;
      clones.set(source, material);
      originals.set(material, source);
    }
    return material;
  };
  slot.paint = () => slot.object.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    meshes.add(mesh);
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material);
  });
  slot.restore = () => {
    slot.paint = () => {};
    for (const mesh of meshes) {
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((material) => originals.get(material) ?? material)
        : originals.get(mesh.material) ?? mesh.material;
    }
    clones.forEach((material) => material.dispose());
    clones.clear();
    originals.clear();
    meshes.clear();
    slot.palette = "";
  };
  slot.palette = palette;
  slot.paint();
}

async function configure(slot: Slot, request: Request, signal: AbortSignal) {
  signal.throwIfAborted();
  slot.player.pause();
  slot.player.experimentalSetupAlg = request.setup;
  slot.player.alg = request.alg;
  slot.player.timestamp = "start";
  slot.player.tempoScale = 1;
  slot.player.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set("auto");
  // Await the actual model state, then apply it through PG3D's native API so a
  // queued screenshot cannot capture the preceding request's position.
  const position = await slot.player.experimentalModel.legacyPosition.get();
  signal.throwIfAborted();
  if (!("onPositionChange" in slot.object) || typeof slot.object.onPositionChange !== "function") {
    throw new Error("Native 2x2x2 position API is unavailable.");
  }
  slot.object.onPositionChange(position);
  await recolor(slot, request.palette, signal);
  signal.throwIfAborted();
  await nextFrame();
  signal.throwIfAborted();
}

async function capture(slot: Slot, signal: AbortSignal): Promise<string> {
  const { canvas } = await slot.vantage.canvasInfo();
  signal.throwIfAborted();
  const copy = document.createElement("canvas");
  const context = copy.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas screenshots are unavailable.");
  for (let attempt = 0; attempt < 4; attempt++) {
    await nextFrame();
    signal.throwIfAborted();
    slot.paint();
    // Read in the native completion callback: WebGL's drawing buffer may be
    // cleared by the browser as soon as this frame is composited.
    const png = await new Promise<string | undefined>((resolve, reject) => {
      slot.vantage.experimentalNextRenderFinishedCallback(() => {
        try {
          signal.throwIfAborted();
          if (!canvas.width || !canvas.height) { resolve(undefined); return; }
          copy.width = 180;
          copy.height = 180;
          context.drawImage(canvas, 0, 0, 180, 180);
          const { data } = context.getImageData(0, 0, copy.width, copy.height);
          let opaque = 0;
          for (let i = 3; i < data.length; i += 4) if (data[i] > 128) opaque++;
          resolve(opaque > 100 ? copy.toDataURL("image/png") : undefined);
        } catch (error) { reject(error); }
      });
      void slot.vantage.render().catch(reject);
    });
    signal.throwIfAborted();
    if (png) return png;
  }
  throw new Error("Native 2x2x2 screenshot is empty.");
}

function thumbnail(key: string, request: Request) {
  const cached = images.get(key);
  if (cached) {
    images.delete(key);
    images.set(key, cached);
    return { promise: Promise.resolve(cached), cancel: () => {} };
  }
  return thumbnailQueue.subscribe(key, { ...request, key });
}

export default function NativeTwoByTwo({ setup, alg, colors, height, interactive = false }: NativeTwoByTwoProps) {
  const host = useRef<HTMLDivElement>(null);
  const palette = JSON.stringify(FACES.map((face, index) => colors[face] || DEFAULT_COLORS[index]));
  const key = JSON.stringify([setup, alg, palette, interactive]);
  const [result, setResult] = useState<{ key: string; src?: string; error?: string }>();
  const current = result?.key === key ? result : undefined;
  const viewportHeight = Number.isFinite(height) ? Math.max(120, height) : 180;

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let cancelled = false;
    let release = () => {};
    const request = { setup, alg, palette };
    const fail = (error: unknown) => {
      if (!cancelled) setResult({ key, error: error instanceof Error ? error.message : String(error) });
    };
    if (!interactive) {
      const subscription = thumbnail(key, request);
      void subscription.promise.then((src) => {
        if (!cancelled) setResult({ key, src });
      }, fail);
      return () => { cancelled = true; subscription.cancel(); };
    }

    const owner = Symbol();
    // A single native interactive player is intentionally supported. Refuse a
    // second live owner rather than stealing its controls or allocating WebGL.
    if (interactiveOwner) {
      fail(new Error("Only one native 2x2x2 player can be interactive at a time."));
      return () => { cancelled = true; };
    }
    interactiveOwner = owner;
    // Unlike thumbnails, a remount owns a fresh closure even for identical props.
    const subscription = interactiveQueue.subscribe(String(++interactiveRequest), { run: async (signal) => {
      if (cancelled) return;
      await validate(request);
      signal.throwIfAborted();
      if (cancelled) return;
      const slot = await createSlot(interactivePool, true, request, signal);
      signal.throwIfAborted();
      if (cancelled) return;
      await configure(slot, request, signal);
      signal.throwIfAborted();
      if (cancelled) return;
      // Keep the native tree connected (cubing does not own its ResizeObserver).
      // Zag follows expanded aria-controls regions, including their shadow DOM.
      slot.root.id = "native-two-by-two-interactive";
      slot.root.setAttribute("role", "region");
      slot.root.setAttribute("aria-label", "2x2x2 player");
      container.setAttribute("aria-controls", slot.root.id);
      container.setAttribute("aria-expanded", "true");
      const dialog = container.closest<HTMLElement>('[role="dialog"]');
      // Native controls use closed shadow roots exposed by ManagedCustomElement.
      // Bridge only the two portal boundaries; leave ordinary tabbing to Zag.
      const tabStops = (root: Element): HTMLElement[] => {
        const stops: HTMLElement[] = [];
        const visit = (element: Element) => {
          if (!(element instanceof HTMLElement) || element.hidden || element.inert) return;
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility !== "visible") return;
          if (element.tabIndex >= 0 && !element.matches(":disabled") && element.getClientRects().length) stops.push(element);
          const shadow = element.shadowRoot ?? (element as HTMLElement & { shadow?: ShadowRoot }).shadow;
          for (const child of (shadow ?? element).children) visit(child);
        };
        for (const child of root.children) visit(child);
        return stops;
      };
      const bridgeTab = (event: KeyboardEvent) => {
        if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey || !dialog?.isConnected || slot.root.inert) return;
        const native = tabStops(slot.root);
        const adjacent = tabStops(dialog).filter((element) => !container.contains(element));
        if (!native.length || !adjacent.length) return;
        const before = adjacent.filter((element) => element.compareDocumentPosition(container) & Node.DOCUMENT_POSITION_FOLLOWING).at(-1);
        const after = adjacent.find((element) => element.compareDocumentPosition(container) & Node.DOCUMENT_POSITION_PRECEDING);
        let active = document.activeElement;
        while (active instanceof HTMLElement) {
          const shadow = active.shadowRoot ?? (active as HTMLElement & { shadow?: ShadowRoot }).shadow;
          if (!shadow?.activeElement) break;
          active = shadow.activeElement;
        }
        const inPlayer = event.currentTarget === slot.root;
        let destination: HTMLElement | undefined;
        if (inPlayer && active === native[event.shiftKey ? 0 : native.length - 1]) {
          destination = event.shiftKey ? before ?? adjacent.at(-1) : after ?? adjacent[0];
        } else if (!inPlayer && active === (event.shiftKey ? after : before)) {
          destination = native[event.shiftKey ? native.length - 1 : 0];
        }
        if (destination) {
          event.preventDefault();
          destination.focus({ preventScroll: true });
        }
      };
      slot.root.addEventListener("keydown", bridgeTab);
      dialog?.addEventListener("keydown", bridgeTab);
      let frame = 0;
      let previous = "";
      const align = () => {
        const rect = container.getBoundingClientRect();
        let left = Math.max(0, rect.left), top = Math.max(0, rect.top);
        let right = Math.min(document.documentElement.clientWidth, rect.right);
        let bottom = Math.min(window.innerHeight, rect.bottom);
        let visible = container.isConnected && rect.width > 0 && rect.height > 0;
        let layer = 1;
        for (let ancestor: HTMLElement | null = container; ancestor; ancestor = ancestor.parentElement) {
          const style = getComputedStyle(ancestor);
          const zIndex = Number.parseInt(style.zIndex, 10);
          if (Number.isFinite(zIndex)) layer = Math.max(layer, zIndex + 1);
          if (style.visibility !== "visible" || style.display === "none" || Number(style.opacity) === 0 || ancestor.hidden) visible = false;
          // Ignore the locked body above the fixed dialog portal.
          if (ancestor === dialog) break;
          if (ancestor === container) continue;
          const bounds = ancestor.getBoundingClientRect();
          if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
            left = Math.max(left, bounds.left + ancestor.clientLeft);
            right = Math.min(right, bounds.left + ancestor.clientLeft + ancestor.clientWidth);
          }
          if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
            top = Math.max(top, bounds.top + ancestor.clientTop);
            bottom = Math.min(bottom, bounds.top + ancestor.clientTop + ancestor.clientHeight);
          }
        }
        visible &&= right > left && bottom > top;
        const css = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;z-index:${layer};clip-path:inset(${Math.max(0, top - rect.top)}px ${Math.max(0, rect.right - right)}px ${Math.max(0, rect.bottom - bottom)}px ${Math.max(0, left - rect.left)}px);opacity:${visible ? 1 : 0};visibility:visible;pointer-events:${visible ? "auto" : "none"}`;
        if (css !== previous) { slot.root.style.cssText = css; previous = css; }
        slot.root.inert = !visible;
        if (!visible) slot.player.pause();
        frame = requestAnimationFrame(align);
      };
      slot.root.inert = false;
      slot.root.removeAttribute("aria-hidden");
      align();
      release = () => {
        cancelAnimationFrame(frame);
        slot.root.removeEventListener("keydown", bridgeTab);
        dialog?.removeEventListener("keydown", bridgeTab);
        container.removeAttribute("aria-controls");
        container.removeAttribute("aria-expanded");
        park(slot);
      };
      interactivePool.release = release;
      interactivePool.fail = fail;
      setResult({ key });
    } });
    void subscription.promise.catch((error) => {
      if (!cancelled) {
        fail(error);
      }
    });
    return () => {
      cancelled = true;
      subscription.cancel();
      release();
      if (interactivePool.release === release) {
        interactivePool.release = undefined;
        interactivePool.fail = undefined;
      }
      if (interactiveOwner === owner) interactiveOwner = undefined;
    };
  }, [setup, alg, palette, key, interactive]);

  return (
    <div ref={host} data-native-two-by-two-host={interactive ? "interactive" : "thumbnail"}
      aria-busy={!current} style={{ position: "relative", width: "100%", minWidth: 0, height: viewportHeight }}>
      {!interactive && current?.src ? (
        // This is a native canvas PNG, not an external/optimizable image URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current.src} alt="2x2x2" width={180} height={180} draggable={false}
          style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />
      ) : null}
      {!current || current.error ? (
        <span role={current?.error ? "alert" : "status"}
          style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 8, overflowWrap: "anywhere", fontSize: 12 }}>
          {current?.error || "Loading 2x2x2..."}
        </span>
      ) : null}
    </div>
  );
}
