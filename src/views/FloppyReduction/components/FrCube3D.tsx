"use client";

import { useEffect, useRef } from "react";

import type { TwistyPlayer } from "cubing/twisty";

import type { AxisKey } from "@/views/FloppyReduction/fr";

/** cubing.js 棱块索引：0=UF 1=UR 2=UB 3=UL 4=DF 5=DR 6=DB 7=DL 8=FR 9=FL 10=BR 11=BL */
const E_SLICE_EDGES: Record<AxisKey, number[]> = {
  ud: [8, 9, 10, 11], // 中层（赤道）棱
  fb: [1, 3, 5, 7], // 与 F/B 轴垂直的中层棱
  rl: [0, 2, 4, 6], // 与 R/L 轴垂直的中层棱
};

type FaceletMeshMask =
  | "regular"
  | "dim"
  | "oriented"
  | "ignored"
  | "invisible"
  | "mystery";
type PieceMask = { facelets: FaceletMeshMask[] };
type AxisStickeringMask = { orbits: Record<string, { pieces: PieceMask[] }> };

const EDGE_REGULAR: PieceMask = { facelets: ["regular", "regular"] };
const EDGE_DIM: PieceMask = { facelets: ["dim", "dim"] };
const EDGE_HIDDEN: PieceMask = { facelets: ["invisible", "invisible"] };
const CORNER_HIDDEN: PieceMask = {
  facelets: ["invisible", "invisible", "invisible"],
};

/** 强调对象：axis=按轴淡化中层棱；corners=只看角（隐藏所有棱）；edges=只看棱（隐藏所有角） */
export type FrCubeEmphasis = "axis" | "corners" | "edges";

/**
 * 构造 stickering：
 * - axis/edges：淡化该轴忽略的中层棱，突出 FR 关注的 8 棱；
 * - corners：隐藏所有棱，只显示角；
 * - edges：隐藏所有角，只显示棱。
 * 显式给出每个棱的状态，避免与上一次的 mask 叠加。
 */
function buildMask(axis: AxisKey, emphasis: FrCubeEmphasis): AxisStickeringMask {
  const dim = new Set(E_SLICE_EDGES[axis]);
  const orbits: AxisStickeringMask["orbits"] = {
    EDGES: {
      pieces: Array.from({ length: 12 }, (_, i): PieceMask =>
        emphasis === "corners"
          ? EDGE_HIDDEN
          : dim.has(i)
            ? EDGE_DIM
            : EDGE_REGULAR,
      ),
    },
  };
  if (emphasis === "edges") {
    orbits.CORNERS = {
      pieces: Array.from({ length: 8 }, (): PieceMask => CORNER_HIDDEN),
    };
  }
  return { orbits };
}

/** 把所选轴转到竖直方向的整方旋转（追加在打乱之后） */
const SETUP_ROTATION: Record<AxisKey, string> = {
  ud: "",
  fb: "x", // F 面转到顶部
  rl: "z'", // R 面转到顶部
};

/** 解法在旋转后视角下的换面映射（按 rot⁻¹ 重标定，使演示步骤对应原始面） */
const FACE_RELABEL: Record<AxisKey, Record<string, string>> = {
  ud: {},
  fb: { U: "F", F: "D", D: "B", B: "U", R: "R", L: "L" }, // x'
  rl: { U: "R", R: "D", D: "L", L: "U", F: "F", B: "B" }, // z
};

function relabelSolution(solution: string[], axis: AxisKey): string {
  const map = FACE_RELABEL[axis];
  return solution
    .map((mv) => {
      const face = mv[0];
      const rest = mv.slice(1);
      return `${map[face] ?? face}${rest}`;
    })
    .join(" ");
}

export interface FrCube3DProps {
  /** 打乱（HTR 态）作为初始状态 */
  scramble: string;
  /** 可选的 FR 参考解，作为可播放的算法 */
  solution?: string[] | null;
  /** 实时预览：将步序并入初始 setup，不触发播放动画 */
  previewMoves?: string[] | null;
  /** 高亮的轴 */
  axisKey: AxisKey;
  height?: number;
  /** 是否显示背面小窗（缩略图模式下关闭） */
  showBackView?: boolean;
  /** 强调对象 */
  emphasis?: FrCubeEmphasis;
  /** 显示播放控制条（需配合 solution） */
  showControls?: boolean;
}

export function FrCube3D({
  scramble,
  solution,
  previewMoves,
  axisKey,
  height = 320,
  showBackView = true,
  emphasis = "axis",
  showControls = false,
}: FrCube3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<TwistyPlayer | null>(null);
  const playbackContentKeyRef = useRef("");

  // 仅在客户端创建播放器
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;

    void import("cubing/twisty").then(({ TwistyPlayer }) => {
      if (cancelled || !el) return;
      const player = new TwistyPlayer({
        puzzle: "3x3x3",
        background: "none",
        hintFacelets: "none",
        backView: showBackView ? "top-right" : "none",
        controlPanel: showControls && solution?.length ? "bottom-row" : "none",
        visualization: "3D",
      });
      player.style.width = "100%";
      player.style.height = "100%";
      player.style.maxWidth = "100%";
      el.innerHTML = "";
      el.appendChild(player);
      playerRef.current = player;
      // 立即同步当前 props
      applyProps(player);
    });

    return () => {
      cancelled = true;
      playerRef.current = null;
      if (el) el.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyProps(player: TwistyPlayer) {
    try {
      const rot = SETUP_ROTATION[axisKey];
      const previewStr =
        previewMoves && previewMoves.length
          ? relabelSolution(previewMoves, axisKey)
          : "";
      const setupParts = [scramble || "", rot, previewStr].filter(Boolean);
      player.experimentalSetupAlg = setupParts.join(" ");

      const algStr =
        !previewStr && solution && solution.length
          ? relabelSolution(solution, axisKey)
          : "";
      const playbackContentKey = `${axisKey}|${scramble}|${algStr}`;
      const shouldResetPlayback =
        Boolean(algStr) && playbackContentKey !== playbackContentKeyRef.current;
      playbackContentKeyRef.current = playbackContentKey;

      player.controlPanel =
        showControls && algStr ? "bottom-row" : "none";
      player.alg = "";
      if (algStr) {
        requestAnimationFrame(() => {
          player.alg = algStr;
          if (shouldResetPlayback) {
            requestAnimationFrame(() => {
              player.jumpToStart();
              player.pause();
            });
          }
        });
      } else {
        playbackContentKeyRef.current = "";
      }
      player.experimentalStickeringMaskOrbits = buildMask(axisKey, emphasis);
    } catch {
      // ignore transient setter errors during load
    }
  }

  // 同步 props 变化
  useEffect(() => {
    const player = playerRef.current;
    if (player) applyProps(player);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scramble, axisKey, solution, previewMoves, emphasis, showControls]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    />
  );
}

export default FrCube3D;
