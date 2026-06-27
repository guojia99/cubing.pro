import {
  type AxisIndex,
  type CubeState,
  type Face,
  applyPerm,
  CORNER_CUBIES,
  EDGE_CUBIES,
  HALF_TURN,
  SOLVED,
} from "./cube";
import { isFrShape } from "./analysis";

const ALL_FACES: Face[] = ["U", "D", "R", "L", "F", "B"];

/** 各轴对应的“轴向面”（即该轴自身的两个面） */
const AXIS_FACES: Record<AxisIndex, Face[]> = {
  0: ["R", "L"],
  1: ["U", "D"],
  2: ["F", "B"],
};

function sideFaces(axis: AxisIndex): Face[] {
  const af = AXIS_FACES[axis];
  return ALL_FACES.filter((f) => !af.includes(f));
}

/** 精简状态键：全部角块贴纸 + 该轴顶/底层棱块贴纸（忽略中层棱） */
function reducedKey(state: CubeState, axis: AxisIndex): string {
  const parts: string[] = [];
  for (const cc of CORNER_CUBIES)
    for (const si of cc.stickers) parts.push(state[si]);
  for (const ec of EDGE_CUBIES) {
    if (ec.coord[axis] !== 0)
      for (const si of ec.stickers) parts.push(state[si]);
  }
  return parts.join("");
}

const goalCache = new Map<AxisIndex, Set<string>>();

/** 真 FR 目标集：从还原态仅用该轴 4 个侧面半转可达的所有精简状态 */
function goalSet(axis: AxisIndex): Set<string> {
  const cached = goalCache.get(axis);
  if (cached) return cached;

  const set = new Set<string>();
  const seen = new Set<string>();
  const start = reducedKey(SOLVED, axis);
  set.add(start);
  seen.add(start);
  let frontier: CubeState[] = [SOLVED];
  const sides = sideFaces(axis);
  while (frontier.length) {
    const next: CubeState[] = [];
    for (const s of frontier) {
      for (const m of sides) {
        const ns = applyPerm(s, HALF_TURN[m]);
        const k = reducedKey(ns, axis);
        if (!seen.has(k)) {
          seen.add(k);
          set.add(k);
          next.push(ns);
        }
      }
    }
    frontier = next;
  }
  goalCache.set(axis, set);
  return set;
}

/** 该状态是否已是真 FR（仅用 4 个侧面半转即可还原该轴） */
export function isTrueFr(state: CubeState, axis: AxisIndex): boolean {
  return goalSet(axis).has(reducedKey(state, axis));
}

interface SearchNode {
  state: CubeState;
  path: Face[];
}

/**
 * 在半转群内 BFS，找到把指定轴做到真 FR 的最短半转序列。
 * 返回如 ["R2","F2","U2"]；已是真 FR 返回 []；不可达（非 HTR）返回 null。
 */
export function solveAxis(
  start: CubeState,
  axis: AxisIndex,
  maxDepth = 14,
): string[] | null {
  const goals = goalSet(axis);
  const startKey = reducedKey(start, axis);
  if (goals.has(startKey)) return [];

  const seen = new Set<string>([startKey]);
  let frontier: SearchNode[] = [{ state: start, path: [] }];
  for (let depth = 0; depth < maxDepth; depth++) {
    const next: SearchNode[] = [];
    for (const node of frontier) {
      const last = node.path[node.path.length - 1];
      for (const m of ALL_FACES) {
        if (m === last) continue; // 同面半转连做无意义
        const ns = applyPerm(node.state, HALF_TURN[m]);
        const k = reducedKey(ns, axis);
        if (goals.has(k)) return [...node.path, m].map((f) => `${f}2`);
        if (!seen.has(k)) {
          seen.add(k);
          next.push({ state: ns, path: [...node.path, m] });
        }
      }
    }
    if (next.length === 0) break;
    frontier = next;
  }
  return null;
}

/**
 * 找到把该轴做到 FR「形态」（0 坏棱 + 0 角形，可能为假 FR）的最短半转序列。
 * 用于演示「按形态收尾可能得到假 FR」的步骤分解。
 */
export function solveAxisShape(
  start: CubeState,
  axis: AxisIndex,
  maxDepth = 14,
): string[] | null {
  if (isFrShape(start, axis)) return [];
  const seen = new Set<string>([reducedKey(start, axis)]);
  let frontier: SearchNode[] = [{ state: start, path: [] }];
  for (let depth = 0; depth < maxDepth; depth++) {
    const next: SearchNode[] = [];
    for (const node of frontier) {
      const last = node.path[node.path.length - 1];
      for (const m of ALL_FACES) {
        if (m === last) continue;
        const ns = applyPerm(node.state, HALF_TURN[m]);
        if (isFrShape(ns, axis)) return [...node.path, m].map((f) => `${f}2`);
        const k = reducedKey(ns, axis);
        if (!seen.has(k)) {
          seen.add(k);
          next.push({ state: ns, path: [...node.path, m] });
        }
      }
    }
    if (next.length === 0) break;
    frontier = next;
  }
  return null;
}
