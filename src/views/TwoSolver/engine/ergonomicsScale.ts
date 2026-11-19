// Keep the version import lightweight for persisted UI filter thresholds.
export const SCORE_VERSION = "two-tool-0e5dd1b-ergonomics-v2";

// Fixed normalized per-turn cost anchors, calibrated against ALL21 and real
// depth-four executions. Never derive this scale from the current candidates.
const ANCHORS = [
  [0.4, 100],
  [0.58, 99],
  [0.62, 95],
  [0.71, 80],
  [0.81, 60],
  [0.92, 35],
  [1.11, 10],
  [1.23, 3],
  [1.75, 1],
] as const;

export function ergonomicsPercentage(normalizedCost: number): number {
  if (normalizedCost <= ANCHORS[0][0]) return 100;
  for (let i = 1; i < ANCHORS.length; i++) {
    const [rightCost, rightScore] = ANCHORS[i];
    if (normalizedCost <= rightCost) {
      const [leftCost, leftScore] = ANCHORS[i - 1];
      return leftScore + (rightScore - leftScore) * (normalizedCost - leftCost) / (rightCost - leftCost);
    }
  }
  return 1;
}
