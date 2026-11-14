import { DATA } from "./twoToolData";

// Weighting adapted from WACWCA/two-tool src/util/algSorter.js,
// commit 0e5dd1b849be031af7b698113a4eeb48bbdd0fa4; see ../SOURCES.md.
export const SCORE_VERSION = "two-tool-0e5dd1b-ergonomics-v1";

const weights = Object.values(DATA);
const MEAN_TRIPLET = weights.reduce((sum, value) => sum + value, 0) / weights.length;
const MOVE_COST = MEAN_TRIPLET / 3;

/** Dimensionless ranking estimates, not execution times or measured regrips. */
export function evaluateErgonomics(tokens: string[]): {
  score: number;
  cost: number;
  regrips: number;
  rotations: number;
  confidence: "reference" | "estimated";
  notes: string[];
} {
  if (tokens.some((token) => !/^[RUFDBLxyz](?:2|')?$/.test(token))) {
    throw new RangeError("Expected canonical face turns or x/y/z rotations.");
  }
  const start = tokens.findIndex((token) => /^[RUFDBL]/.test(token));
  const execution = start < 0 ? [] : tokens.slice(start);
  const runs: string[][] = [[]];
  let rotations = 0;
  let cost = 0;
  let layerTurns = 0;
  let estimated = execution.length === 0;
  let pairRegrips = 0;

  for (const token of execution) {
    if (/^[xyz]/.test(token)) {
      rotations++;
      // A rotation interrupts the finger-trick context. Never invent a
      // reference triplet across that boundary or rewrite U x' as F.
      cost += MOVE_COST * (token.endsWith("2") ? 1.5 : 1);
      runs.push([]);
      estimated = true;
    } else {
      runs[runs.length - 1].push(token);
      layerTurns++;
    }
  }

  for (const run of runs) {
    for (let i = 1; i < run.length; i++) {
      // Deliberately small heuristic set; actual hand choice is unknown.
      if (run[i - 1] === "F2" && run[i] === "R'") pairRegrips++;
    }
    if (run.length < 3) {
      if (run.length) estimated = true;
      cost += run.length * MOVE_COST;
      for (let i = 0; i < run.length; i++) {
        if (run[i].endsWith("2")) cost += MEAN_TRIPLET / 12;
        if (i > 0 && run[i][0] === run[i - 1][0]) cost += MEAN_TRIPLET / 6;
      }
      continue;
    }

    const triplets: number[] = [];
    for (let i = 0; i <= run.length - 3; i++) {
      const value = DATA[run.slice(i, i + 3).join(" ")];
      if (value !== undefined) {
        triplets.push(value);
      } else {
        estimated = true;
        // Neutral table-scale fallback, with contextual repeated-face and
        // half-turn supplements only. No surcharge for B, D, or L identities.
        let fallback = MEAN_TRIPLET;
        for (let j = i; j < i + 3; j++) {
          if (run[j].endsWith("2")) fallback += MEAN_TRIPLET / 12;
          if (j > i && run[j][0] === run[j - 1][0]) fallback += MEAN_TRIPLET / 6;
        }
        triplets.push(fallback);
      }
    }
    // Exactly two-tool's per-token average of covering triplets / 3,
    // including its endpoint weights (not simply sum(triplets) / 3).
    for (let i = 0; i < run.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - 2); j <= Math.min(i, triplets.length - 1); j++) {
        sum += triplets[j] / 3;
        count++;
      }
      cost += sum / count;
    }
  }

  const frontStart = execution[0]?.[0] === "F";
  if (frontStart) {
    // Local startup assumption, half a mean reference triplet. Not an
    // additional penalty for every F turn inside an algorithm.
    cost += MEAN_TRIPLET / 2;
    estimated = true;
  }
  if (pairRegrips) {
    cost += pairRegrips * MEAN_TRIPLET / 6;
    estimated = true;
  }

  const notes = [estimated
    ? "含启发式估计；成本为相对排序权重，不代表实测用时。"
    : "采用 two-tool 三连参考权重；不代表个人实测速度。"];
  if (frontStart) notes.push("F 起手增加参考三连均值一半的启动成本，属于握姿启发式。");
  if (rotations) notes.push(`内部转体 ${rotations} 次，分别计费并估计换手；三连上下文在此断开。`);
  if (pairRegrips) notes.push(`F2 R' 出现 ${pairRegrips} 次，启发式估计可能换手，实际取决于指法。`);
  if (estimated && notes.length < 4 && !frontStart && !rotations && !pairRegrips) {
    notes.push(layerTurns ? "短片段或缺失三连使用参考均值及局部动作估计；不按 B/D/L 面名加罚。" : "无层转动作；前置转体不计成本。");
  }
  return {
    // Normalize by layer-turn count: smoothness is separate from total cost.
    score: layerTurns ? 100 / (1 + cost / layerTurns / MOVE_COST) : 100,
    cost,
    regrips: rotations + pairRegrips,
    rotations,
    confidence: estimated ? "estimated" : "reference",
    notes,
  };
}
