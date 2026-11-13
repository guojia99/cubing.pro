"use client";

import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import type { Alg, Move } from "cubing/alg";
import type { KPuzzle, KPattern } from "cubing/kpuzzle";
import type * as THREE from "three";

import { useI18n } from "@/contexts/I18nProvider";

type Props = {
  setup: string;
  alg: string;
  colors: Record<string, string>;
  height: number;
};

type Step = { u: number; d: number; slash: number; label: string; moves: Move[] };
type Timeline = { steps: Step[]; states: KPattern[] };
type Point = [number, number];
type Player = {
  seek: (position: number) => void;
  toggle: () => void;
  resetView: () => void;
};

const DEG = Math.PI / 180;
const LIMIT = 4000;
const DEFAULT_COLORS = {
  U: "#ffffff", D: "#ffdd00", F: "#00a651",
  B: "#2266ff", L: "#ff8800", R: "#e53935",
};

// Slot frames, corner pairing and the equator cut follow Square1_3D by
// bryanlundberg and the cubing.js contributors (GPL-3.0-or-later):
// https://github.com/cubing/cubing.js/pull/431
// https://patch-diff.githubusercontent.com/raw/cubing/cubing.js/pull/431.diff
// This is a standalone player, not a fork of cubing's rendering pipeline.
const CORNERS = [0, 3, 6, 9, 13, 16, 19, 22];
const EDGES = [2, 5, 8, 11, 12, 15, 18, 21];
const nextSlot = (slot: number) => Math.floor(slot / 12) * 12 + (slot + 1) % 12;
const inSlice = (slot: number) => slot >= 6 && slot < 18;
const azimuth = (slot: number) => 180 + (slot < 12 ? 30 * slot + 120 : 90 - 30 * (slot - 12));

function parseSteps(source: string, AlgClass: typeof Alg): Step[] {
  const steps: Step[] = [];
  let pending: Move | null = null;
  let count = 0;
  const push = (moves: Move[]) => {
    const u = moves.find((m) => m.quantum.family === "U_SQ_")?.amount ?? 0;
    const d = moves.find((m) => m.quantum.family === "D_SQ_")?.amount ?? 0;
    const slash = moves.find((m) => m.quantum.family === "_SLASH_")?.amount ?? 0;
    steps.push({ u, d, slash, label: slash ? (slash < 0 ? "/'" : "/") : `(${u}, ${d})`, moves });
  };
  // Lazy expansion is bounded, including repetitions/commutators, so imported
  // formulas cannot allocate an unbounded list of snapshots.
  for (const move of new AlgClass(source).experimentalLeafMoves()) {
    if (++count > LIMIT) throw new Error(`Formula exceeds ${LIMIT} moves.`);
    const family = move.quantum.family;
    if (!["U_SQ_", "D_SQ_", "_SLASH_"].includes(family) ||
        move.quantum.innerLayer != null || move.quantum.outerLayer != null) {
      throw new Error(`Unsupported Square-1 move: ${move.toString()}`);
    }
    if (family === "U_SQ_") {
      if (pending) push([pending]);
      pending = move;
    } else {
      if (pending && family === "D_SQ_") {
        push([pending, move]);
        pending = null;
      } else {
        if (pending) push([pending]);
        pending = null;
        push([move]);
      }
    }
  }
  if (pending) push([pending]);
  return steps;
}

function applyStep(pattern: KPattern, step: Step, context: string): KPattern {
  if (step.slash !== 0) {
    const slots = new Array<number>(24);
    pattern.patternData.WEDGES.pieces.forEach((piece, slot) => { slots[piece] = slot; });
    for (const high of CORNERS) {
      if (inSlice(slots[high]) !== inSlice(slots[nextSlot(high)])) {
        throw new Error(`${context}: illegal slice / would split a corner.`);
      }
    }
  }
  for (const move of step.moves) pattern = pattern.applyMove(move);
  return pattern;
}

function createTimeline(kpuzzle: KPuzzle, setup: string, alg: string, AlgClass: typeof Alg): Timeline {
  let pattern = kpuzzle.defaultPattern();
  parseSteps(setup, AlgClass).forEach((step, i) => {
    pattern = applyStep(pattern, step, `setup ${i + 1} ${step.label}`);
  });
  const steps = parseSteps(alg, AlgClass);
  const states = [pattern];
  steps.forEach((step, i) => {
    pattern = applyStep(pattern, step, `alg ${i + 1} ${step.label}`);
    states.push(pattern);
  });
  return { steps, states };
}

function createPuzzle(T: typeof THREE, palette: typeof DEFAULT_COLORS) {
  const root = new T.Group();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const body = new T.MeshBasicMaterial({ color: "#171d24", side: T.DoubleSide });
  materials.add(body);
  const faceMaterials = new Map<string, THREE.MeshBasicMaterial>();
  const material = (color: string) => {
    let result = faceMaterials.get(color);
    if (!result) {
      result = new T.MeshBasicMaterial({ color, side: T.DoubleSide });
      faceMaterials.set(color, result);
      materials.add(result);
    }
    return result;
  };
  const sideColor = (phi: number) => {
    const face = ["F", "L", "B", "R"] as const;
    return palette[face[((Math.round(phi / 90) % 4) + 4) % 4]];
  };
  const polar = (phi: number, face: number): Point => {
    const r = 1 / Math.cos((phi - face) * DEG);
    return [-r * Math.sin(phi * DEG), r * Math.cos(phi * DEG)];
  };
  const squarePoint = (phi: number) => polar(phi, Math.round(phi / 90) * 90);
  const geometry = (faces: THREE.Vector3[][]) => {
    const positions: number[] = [];
    for (const face of faces) {
      for (let i = 1; i < face.length - 1; i++) {
        for (const v of [face[0], face[i], face[i + 1]]) positions.push(v.x, v.y, v.z);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    g.computeBoundingSphere();
    geometries.add(g);
    return g;
  };
  const prism = (polygon: Point[], bottom: number, top: number, cap: string | null, sides: (string | null)[]) => {
    const group = new T.Group();
    const upper = polygon.map(([x, z]) => new T.Vector3(x, top, z));
    const lower = polygon.map(([x, z]) => new T.Vector3(x, bottom, z));
    const faces = [upper, lower];
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      faces.push([lower[i], lower[j], upper[j], upper[i]]);
    }
    group.add(new T.Mesh(geometry(faces), body));
    const sticker = (vertices: THREE.Vector3[], normal: THREE.Vector3, color: string) => {
      const center = new T.Vector3();
      vertices.forEach((v) => center.addScaledVector(v, 1 / vertices.length));
      const inset = vertices.map((v) => v.clone().sub(center).multiplyScalar(0.9).add(center).addScaledVector(normal, 0.004));
      group.add(new T.Mesh(geometry([inset]), material(color)));
    };
    if (cap) sticker(upper, new T.Vector3(0, 1, 0), cap);
    const center = new T.Vector3();
    upper.forEach((v) => center.addScaledVector(v, 1 / polygon.length));
    sides.forEach((color, i) => {
      if (!color) return;
      const j = (i + 1) % polygon.length;
      const normal = new T.Vector3(upper[j].z - upper[i].z, 0, upper[i].x - upper[j].x).normalize();
      const midpoint = upper[i].clone().add(upper[j]).multiplyScalar(0.5).sub(center);
      if (normal.dot(midpoint) < 0) normal.negate();
      sticker(faces[i + 2], normal, color);
    });
    root.add(group);
    return group;
  };

  const pieces = [...CORNERS, ...EDGES].map((home) => {
    const corner = CORNERS.includes(home);
    const polygon: Point[] = corner
      ? [[0, 0], polar(-15, -30), polar(15, -30), polar(45, 60)]
      : [[0, 0], polar(-15, 0), polar(15, 0)];
    return {
      home,
      mesh: prism(polygon, 0.258, 1, home < 12 ? palette.U : palette.D,
        corner ? [null, sideColor(azimuth(home)), sideColor(azimuth(nextSlot(home))), null]
          : [null, sideColor(azimuth(home)), null]),
    };
  });
  const equator = [0, 1].map((home) => {
    const start = 180 + (home === 0 ? 105 : 285);
    const bounds = [start];
    for (let phi = Math.ceil((start - 45) / 90) * 90 + 45; phi < start + 180; phi += 90) bounds.push(phi);
    bounds.push(start + 180);
    return prism(bounds.map(squarePoint), -0.25, 0.25, null,
      [...bounds.slice(0, -1).map((phi, i) => sideColor((phi + bounds[i + 1]) / 2)), null]);
  });

  const yAxis = new T.Vector3(0, 1, 0);
  const sliceAxis = new T.Vector3(-Math.sin(15 * DEG), 0, Math.cos(15 * DEG));
  const flipZ = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), Math.PI);
  const halfY = new T.Quaternion().setFromAxisAngle(yAxis, Math.PI);
  const halfSlice = new T.Quaternion().setFromAxisAngle(sliceAxis, Math.PI);
  const frames = Array.from({ length: 24 }, (_, slot) => {
    const q = new T.Quaternion().setFromAxisAngle(yAxis, -azimuth(slot) * DEG);
    if (slot >= 12) q.multiply(flipZ);
    return q;
  });
  const rotation = new T.Quaternion();
  const slots = new Array<number>(24);
  const place = (pattern: KPattern, step?: Step, fraction = 0) => {
    pattern.patternData.WEDGES.pieces.forEach((piece, slot) => { slots[piece] = slot; });
    // Rotate whole corner meshes, never independently animate their two wedges.
    for (const { home, mesh } of pieces) {
      const slot = slots[home];
      mesh.quaternion.copy(frames[slot]);
      if (!step) continue;
      if (step.slash && inSlice(slot)) {
        rotation.setFromAxisAngle(sliceAxis, step.slash * Math.PI * fraction);
      } else {
        rotation.setFromAxisAngle(yAxis, (slot < 12 ? -step.u : step.d) * 30 * DEG * fraction);
      }
      mesh.quaternion.premultiply(rotation);
    }
    const state = pattern.patternData.EQUATOR;
    for (let slot = 0; slot < 2; slot++) {
      const home = state.pieces[slot];
      const q = equator[home].quaternion.identity();
      if (home !== slot) q.multiply(halfY);
      if (((state.orientation[slot] % 6) + 6) % 6 >= 3) q.premultiply(halfSlice);
      if (slot === 1 && step?.slash) {
        q.premultiply(rotation.setFromAxisAngle(sliceAxis, step.slash * Math.PI * fraction));
      }
    }
  };
  return {
    root, place,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      root.clear();
    },
  };
}

export default function Square1Player({ setup, alg, colors, height }: Props) {
  const { locale } = useI18n();
  const zh = locale !== "en-US";
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const speed = useRef(1);
  const [rate, setRate] = useState(1);
  const [ui, setUi] = useState({ ready: false, playing: false, position: 0, count: 0, label: "" });
  const [error, setError] = useState("");
  const U = colors.U || DEFAULT_COLORS.U;
  const D = colors.D || DEFAULT_COLORS.D;
  const F = colors.F || DEFAULT_COLORS.F;
  const B = colors.B || DEFAULT_COLORS.B;
  const L = colors.L || DEFAULT_COLORS.L;
  const R = colors.R || DEFAULT_COLORS.R;

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let cancelled = false;
    let raf: number | null = null;
    let disposeScene = () => {};
    player.current = null;
    setError("");
    setUi({ ready: false, playing: false, position: 0, count: 0, label: "" });

    void (async () => {
      const [T, { OrbitControls }, { Alg: AlgClass }, { puzzles }] = await Promise.all([
        import("three"), import("three/addons/controls/OrbitControls.js"),
        import("cubing/alg"), import("cubing/puzzles"),
      ]);
      if (cancelled) return;
      const kpuzzle = await puzzles.square1.kpuzzle();
      if (cancelled) return;
      const timeline = createTimeline(kpuzzle, setup, alg, AlgClass);
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      // Install cleanup before allocating geometry or controls, including failures.
      const resources: {
        puzzle?: ReturnType<typeof createPuzzle>;
        controls?: InstanceType<typeof OrbitControls>;
        observer?: ResizeObserver;
      } = {};
      let removeListeners = () => {};
      disposeScene = () => {
        resources.observer?.disconnect();
        removeListeners();
        resources.controls?.dispose();
        resources.puzzle?.dispose();
        scene.clear();
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      };
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0, 0);
      renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
      renderer.domElement.setAttribute("role", "img");
      renderer.domElement.setAttribute("aria-label", "Interactive Square-1 3D puzzle");
      container.appendChild(renderer.domElement);
      const puzzle = createPuzzle(T, { U, D, F, B, L, R });
      resources.puzzle = puzzle;
      scene.add(puzzle.root);
      camera.position.set(4, 3.2, 5);
      const controls = new OrbitControls(camera, renderer.domElement);
      resources.controls = controls;
      controls.enablePan = false;
      controls.minDistance = 4.5;
      controls.maxDistance = 12;
      controls.target.set(0, 0, 0);
      controls.update();
      controls.saveState();

      let position = 0;
      let playing = false;
      let lastTime: number | null = null;
      let lastPublish = 0;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const publish = () => {
        if (cancelled) return;
        const index = Math.min(Math.floor(position), timeline.steps.length - 1);
        setUi({ ready: true, playing, position, count: timeline.steps.length,
          label: timeline.steps[index]?.label ?? "" });
      };
      const paint = () => {
        if (!puzzle) return;
        const index = Math.min(Math.floor(position), timeline.steps.length);
        const f = position - index;
        const eased = reducedMotion.matches ? 0 : f * f * (3 - 2 * f);
        puzzle.place(timeline.states[index], timeline.steps[index], eased);
        renderer.render(scene, camera);
      };
      const schedule = () => {
        if (!cancelled && raf === null) raf = requestAnimationFrame(frame);
      };
      const frame = (time: number) => {
        raf = null;
        if (cancelled) return;
        if (playing) {
          // Clamp background-tab gaps rather than skipping the entire formula.
          const elapsed = lastTime === null ? 0 : Math.min(time - lastTime, 80);
          position = Math.min(timeline.steps.length, position + elapsed * speed.current / 650);
          lastTime = time;
          if (position >= timeline.steps.length) playing = false;
          if (time - lastPublish > 40 || !playing) {
            publish();
            lastPublish = time;
          }
        }
        paint();
        if (playing) schedule();
      };
      controls.addEventListener("change", schedule);
      const contextLost = (event: Event) => {
        event.preventDefault();
        playing = false;
        if (raf !== null) cancelAnimationFrame(raf);
        raf = null;
        player.current = null;
        setUi((prev) => ({ ...prev, ready: false, playing: false }));
        setError("WebGL context lost. Remount the player to retry.");
      };
      renderer.domElement.addEventListener("webglcontextlost", contextLost);
      removeListeners = () => {
        controls?.removeEventListener("change", schedule);
        renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      };
      const resize = () => {
        if (cancelled) return;
        const width = Math.max(1, container.clientWidth);
        const h = Math.max(1, container.clientHeight);
        camera.aspect = width / h;
        // Fit even a shape-shifted puzzle in narrow portrait containers.
        camera.fov = Math.min(110, 2 * Math.atan(Math.tan(35 * DEG / 2) / Math.min(1, camera.aspect)) / DEG);
        camera.updateProjectionMatrix();
        renderer.setSize(width, h, false);
        schedule();
      };
      const observer = new ResizeObserver(resize);
      resources.observer = observer;
      observer.observe(container);
      player.current = {
        seek: (value) => {
          playing = false;
          lastTime = null;
          position = Math.max(0, Math.min(timeline.steps.length, value));
          publish();
          schedule();
        },
        toggle: () => {
          if (!timeline.steps.length) return;
          if (position >= timeline.steps.length) position = 0;
          playing = !playing;
          lastTime = null;
          publish();
          schedule();
        },
        resetView: () => { controls?.reset(); schedule(); },
      };
      resize();
      publish();
    })().catch((reason: unknown) => {
      if (cancelled) return;
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      player.current = null;
      disposeScene();
      disposeScene = () => {};
      setError(reason instanceof Error ? reason.message : String(reason));
      setUi((prev) => ({ ...prev, ready: false, playing: false }));
    });

    return () => {
      cancelled = true;
      player.current = null;
      if (raf !== null) cancelAnimationFrame(raf);
      disposeScene();
    };
  }, [setup, alg, U, D, F, B, L, R]);

  const seek = (value: number) => player.current?.seek(value);
  const disabled = !ui.ready || ui.count === 0;
  const viewportHeight = Number.isFinite(height) ? Math.max(120, height) : 300;

  return (
    <Box borderWidth="1px" borderColor="border.subtle" rounded="lg" overflow="hidden" bg="bg.subtle" minW="0">
      <Box position="relative" height={`${viewportHeight}px`}>
        <Box ref={host} position="absolute" inset="0" />
        {!ui.ready && !error ? (
          <Flex position="absolute" inset="0" align="center" justify="center" pointerEvents="none">
            <Text role="status" fontSize="sm" color="fg.muted">{zh ? "正在加载 3D..." : "Loading 3D..."}</Text>
          </Flex>
        ) : null}
        {error ? (
          <Flex position="absolute" inset="0" align="center" justify="center" p="4" overflowY="auto">
            <Text role="alert" fontSize="sm" color="fg.error" overflowWrap="anywhere">
              {zh ? "无法播放：" : "Cannot play: "}{error}
            </Text>
          </Flex>
        ) : null}
        <Text position="absolute" left="3" bottom="2" fontSize="xs" color="fg.muted" pointerEvents="none">
          {zh ? "拖动旋转 · 双指缩放" : "Drag to orbit · Pinch to zoom"}
        </Text>
      </Box>
      <Box p={{ base: "2", md: "3" }} borderTopWidth="1px" borderColor="border.subtle">
        <Flex align="center" gap="2" mb="2">
          <Box as="label" flex="1" minW="0">
            <Box as="span" srOnly>{zh ? "播放进度" : "Playback progress"}</Box>
            <input
              type="range" min={0} max={Math.max(1, ui.count)} step={0.001}
              value={ui.position} disabled={disabled}
              aria-label={zh ? "播放进度" : "Playback progress"}
              aria-valuetext={`${ui.position.toFixed(2)} / ${ui.count}`}
              onChange={(event) => seek(Number(event.target.value))}
              style={{ width: "100%", minHeight: 32, accentColor: "#0891b2", display: "block" }}
            />
          </Box>
          <Text fontSize="xs" color="fg.muted" whiteSpace="nowrap" fontVariantNumeric="tabular-nums">
            {Math.floor(ui.position)} / {ui.count}
          </Text>
        </Flex>
        <Flex gap="1.5" align="center" wrap="wrap">
          <Button size="sm" minH="10" variant="ghost" disabled={disabled || ui.position === 0}
            aria-label={zh ? "回到公式初态" : "Return to setup"} onClick={() => seek(0)}>
            {zh ? "初态" : "Start"}
          </Button>
          <Button size="sm" minH="10" variant="outline" disabled={disabled || ui.position === 0}
            aria-label={zh ? "上一步" : "Previous step"}
            onClick={() => seek(Math.max(0, Math.ceil(ui.position - 0.00001) - 1))}>
            {zh ? "上步" : "Back"}
          </Button>
          <Button size="sm" minH="10" colorPalette="cyan" disabled={disabled}
            aria-label={ui.playing ? (zh ? "暂停" : "Pause") : (zh ? "播放" : "Play")}
            aria-pressed={ui.playing} onClick={() => player.current?.toggle()}>
            {ui.playing ? (zh ? "暂停" : "Pause") : (zh ? "播放" : "Play")}
          </Button>
          <Button size="sm" minH="10" variant="outline" disabled={disabled || ui.position >= ui.count}
            aria-label={zh ? "下一步" : "Next step"}
            onClick={() => seek(Math.min(ui.count, Math.floor(ui.position + 0.00001) + 1))}>
            {zh ? "下步" : "Next"}
          </Button>
          <Box as="label" display="flex" alignItems="center" gap="1" fontSize="xs" minH="10">
            <Box as="span" srOnly>{zh ? "播放速度" : "Playback speed"}</Box>
            <select value={rate} aria-label={zh ? "播放速度" : "Playback speed"}
              onChange={(event) => { const value = Number(event.target.value); speed.current = value; setRate(value); }}
              style={{ minHeight: 40, maxWidth: 80, background: "transparent", color: "inherit", borderRadius: 4 }}>
              {[0.25, 0.5, 1, 1.5, 2, 3].map((value) => <option key={value} value={value}>{value}x</option>)}
            </select>
          </Box>
          <Button size="sm" minH="10" variant="ghost" disabled={!ui.ready} ms={{ base: "0", md: "auto" }}
            onClick={() => player.current?.resetView()}>
            {zh ? "复位视角" : "Reset view"}
          </Button>
        </Flex>
        <Text mt="2" fontSize="xs" fontFamily="mono" color="fg.muted" minH="4" aria-live="off">
          {ui.position === 0 ? (zh ? "初态 (setup)" : "Initial state (setup)")
            : ui.position === ui.count ? (zh ? "完成" : "Complete") : ui.label}
        </Text>
      </Box>
    </Box>
  );
}
