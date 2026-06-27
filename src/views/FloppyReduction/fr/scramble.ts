import type { Face } from "./cube";

const FACES: Face[] = ["U", "D", "R", "L", "F", "B"];
/** 同轴对面，避免相邻两步落在同一轴造成冗余 */
const AXIS_OF: Record<Face, number> = { U: 1, D: 1, R: 0, L: 0, F: 2, B: 2 };

/**
 * 生成一个必然处于 HTR 态的打乱：对还原态施加随机半转序列。
 * 因为只用半转，结果一定属于半转群（HTR）。
 */
export function generateHtrScramble(length = 16): string {
  const tokens: string[] = [];
  let lastAxis = -1;
  for (let i = 0; i < length; i++) {
    let face: Face;
    do {
      face = FACES[Math.floor(Math.random() * FACES.length)];
    } while (AXIS_OF[face] === lastAxis);
    lastAxis = AXIS_OF[face];
    tokens.push(`${face}2`);
  }
  return tokens.join(" ");
}
