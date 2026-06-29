import type { AxisIndex } from "./cube";

export type AxisKey = "ud" | "fb" | "rl";

export const AXIS_LIST: { key: AxisKey; axis: AxisIndex; faces: string }[] = [
  { key: "ud", axis: 1, faces: "U/D" },
  { key: "fb", axis: 2, faces: "F/B" },
  { key: "rl", axis: 0, faces: "R/L" },
];

export const AXIS_INDEX: Record<AxisKey, AxisIndex> = {
  ud: 1,
  fb: 2,
  rl: 0,
};

/** 角形分类：0 / 1 / 2RL / 2FB / 2UD */
export type CornerLabel = "0" | "1" | "2RL" | "2FB" | "2UD";

/** 坏棱分类标签 */
export type EdgeLabel =
  | "0bad"
  | "2bad"
  | "4-0"
  | "3-1"
  | "2-2o"
  | "2-2a"
  | "6bad"
  | "8bad";

export interface AxisClassification {
  edgeLabel: EdgeLabel;
  cornerLabel: CornerLabel;
  badCount: number;
  badTop: number;
  badBottom: number;
}

/** 解法分解中的单步 */
export interface SolutionStep {
  /** 本步执行的半转（起始步为 null） */
  move: string | null;
  /** 执行后该轴的形态标签，如 "3-1 / 2RL" */
  caseLabel: string;
  /** 执行后是否已是真 FR */
  trueFr: boolean;
  /** 若当前形态是已知的基础 trigger，给出其收尾公式 */
  trigger?: string;
}

/** 基础 case（FR trigger）→ 收尾公式（UD 轴） */
export const FR_TRIGGERS: Record<string, string> = {
  "4-0 / 1": "U2",
  "3-1 / 2FB": "R2 U2",
  "2-2a / 2FB": "F2 R2 U2",
  "2-2a / 2RL": "R2 F2 U2",
  "2-2o / 1": "R2 L2 U2",
};

export interface AxisResult extends AxisClassification {
  axisKey: AxisKey;
  /** 求解器给出的最短真 FR 参考步骤（半转，如 ["R2","F2","U2"]） */
  solution: string[] | null;
  /** 做到 FR 形态（可能是假 FR）的最短步骤 */
  shapeSolution: string[] | null;
  /** 是否已经处于真 FR（solution 为空数组） */
  alreadyFr: boolean;
  /** 输入本身已是 FR 形态但为假 FR（需补轴向半转） */
  inputFalseFr: boolean;
  /** 按 shapeSolution 收尾会得到假 FR（需在中途插入轴向半转补奇偶） */
  shapeIsFalseFr: boolean;
  /** case 标签，如 "3-1/2RL" */
  caseLabel: string;
  /** 真 FR 解的逐步分解 */
  decomposition: SolutionStep[];
  /** 形态解（假 FR）的逐步分解（仅在 shapeIsFalseFr 时给出） */
  shapeDecomposition: SolutionStep[] | null;
}

export interface FrAnalysis {
  ok: boolean;
  errorToken?: string; // 解析失败的 token
  isHtr: boolean;
  scramble: string;
  axes: AxisResult[];
}
