import { type CubeModel, type State, FACES } from "./state";
import type { MethodId } from "./types";

const LOWER = [4, 5, 6, 7];
const SIDES = [
  { face: "F", a: 4, j: 1, b: 5, k: 2 }, { face: "R", a: 4, j: 2, b: 7, k: 1 },
  { face: "B", a: 6, j: 1, b: 7, k: 2 }, { face: "L", a: 5, j: 1, b: 6, k: 2 },
];
export interface Structure {
  color: string; lower: number; down: number; twists: number[];
  bars: string[]; residualBars: string[]; pairedDownBar: boolean;
  lsId?: number; insertionBars?: number;
}
export function describe(model: CubeModel, state: State, color: string): Structure {
  const stickers = model.stickers(state);
  const twists = LOWER.map(i => stickers[i].indexOf(color));
  const lower = twists.filter(q => q >= 0).length;
  const down = twists.filter(q => q === 0).length;
  const bars = SIDES.filter(s => stickers[s.a][s.j] === stickers[s.b][s.k]);
  const untwisted = LOWER.map(i => {
    const faces = FACES[Math.floor(state[i] / 3)], index = faces.indexOf(color);
    return index < 0 ? [] : [0, 1, 2].map(j => faces[(index + j) % 3]);
  });
  const residualBars = lower === 4 ? SIDES.filter(s => untwisted[s.a - 4][s.j] === untwisted[s.b - 4][s.k]).map(s => s.face) : [];
  let lsId: number | undefined, insertionBars: number | undefined;
  if (lower === 3 && down === 3) {
    const missing = LOWER.find(i => !stickers[i].includes(color))!;
    const incoming = [0, 1, 2, 3].find(i => stickers[i].includes(color))!;
    const faces = FACES[Math.floor(state[incoming] / 3)], c = faces.indexOf(color);
    const completed = stickers.map(row => [...row]);
    completed[missing] = [0, 1, 2].map(j => faces[(c + j) % 3]);
    insertionBars = SIDES.filter(s => completed[s.a][s.j] === completed[s.b][s.k]).length;
    // Normalize the missing slot to DRF, then normalize colors using the DBR
    // reference. Ordinary LS requires the other THREE corners to be solved,
    // not merely to have the target sticker down (EGLS permits other orders).
    for (let y = 0; y < 4; y++) {
      const aligned = y ? model.apply(state, y === 1 ? "y" : y === 2 ? "y2" : "y'") : state;
      const side = model.stickers(aligned);
      if (side[4].includes(color)) continue;
      const map = model.normalizers[aligned[7]];
      const normalized = Array.from(aligned, v => map[v]);
      if (![5, 6, 7].every(i => normalized[i] === i * 3)) continue;
      const index = normalized.findIndex(v => Math.floor(v / 3) === 4);
      const a = normalized[index] % 3, b = normalized[4] % 3;
      lsId = [0, 2, 1].indexOf(a) * 3 + b + 1;
      break;
    }
  }
  return { color, lower, down, twists, bars: bars.map(s => s.face), residualBars,
    pairedDownBar: bars.some(s => stickers[s.a][0] === color && stickers[s.b][0] === color), lsId, insertionBars };
}

/** Geometry is a candidate predicate, not proof that the library covers a case. */
export function matchesStructure(method: MethodId, info: Structure): boolean {
  const { lower, down, residualBars: bars, twists } = info;
  if (method === "CBL") return lower === 4;
  if (method === "FH") {
    const nonzero = twists.filter(q => q > 0);
    return lower === 4 && down === 2 && info.pairedDownBar && nonzero[0] === nonzero[1];
  }
  if (["CLL", "EG1", "EG2", "LEG1"].includes(method)) {
    if (down !== 4) return false;
    return method === "CLL" ? bars.length === 4 : method === "EG2" ? bars.length === 0
      : bars.length === 1 && bars[0] === (method === "LEG1" ? "L" : "B");
  }
  if (method.startsWith("TCLL") || method.startsWith("TEG")) {
    if (lower !== 4 || down !== 3) return false;
    if (method === "TEG1") return bars.length === 1;
    if (method === "TEG2") return bars.length === 0;
    return bars.length === 4 && twists.includes(method === "TCLL+" ? 1 : 2);
  }
  if (lower !== 3 || down !== 3) return false;
  if (method === "EGLS1") return info.insertionBars === 1;
  if (method === "EGLS2") return info.insertionBars === 0;
  return info.lsId === Number(method.slice(2));
}
