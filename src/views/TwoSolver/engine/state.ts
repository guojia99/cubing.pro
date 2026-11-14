import { Alg } from "cubing/alg";
import { cube2x2x2 } from "cubing/puzzles";

// KPuzzle corner/sticker ordering; a code stores piece * 3 + orientation.
export const FACES = ["URF", "UBR", "ULB", "UFL", "DFR", "DLF", "DBL", "DRB"];
export type State = Uint8Array;
export const SOLVED = Uint8Array.from([0, 3, 6, 9, 12, 15, 18, 21]);
export const FACE_NAMES = "URFDLB";
export const isRotation = (move: string) => /^[xyz]/.test(move);
export const moveCount = (tokens: readonly string[]) => tokens.filter(t => !isRotation(t)).length;
export const token = (face: string, amount: number): string => {
  const n = ((amount % 4) + 4) % 4;
  return n ? face + (n === 2 ? "2" : n === 3 ? "'" : "") : "";
};
export const amount = (t: string): number => t.endsWith("2") ? 2 : t.endsWith("'") ? 3 : 1;
export const invert = (tokens: readonly string[]): string[] => [...tokens].reverse().map(t => token(t[0], -amount(t)));

/** Strict, bounded grammar. Parenthesized AUF is executed, never discarded. */
export function parseMoves(text: string): string[] {
  if (text.length > 4000) throw new Error("序列过长（最多 4000 个字符）");
  const normalized = text.replace(/[’′‘]/g, "'").replace(/([URFDLBxyzrufdlb](?:w)?)(\d+'?|'\d+|')?/g,
    (_match, face: string, suffix = "") => ` ${face}${suffix.startsWith("'") && suffix.length > 1 ? suffix.slice(1) + "'" : suffix} `).trim();
  const alg = new Alg(normalized);
  // Validate compact AST before expanding repeated groups.
  function budget(sequence: Alg, depth: number): number {
    if (depth > 12) throw new Error("括号嵌套过深");
    let count = 0;
    for (const node of sequence.childAlgNodes()) {
      const n = node as unknown as { alg?: Alg; amount?: number; A?: Alg; B?: Alg };
      if (n.alg) count += Math.max(1, budget(n.alg, depth + 1)) * Math.abs(n.amount ?? 1);
      else if (n.A && n.B) count += 2 * (budget(n.A, depth + 1) + budget(n.B, depth + 1));
      else count++;
      if (!Number.isSafeInteger(count) || count > 200) throw new Error("序列展开不能超过 200 步");
    }
    return count;
  }
  budget(alg, 0);
  const tokens: string[] = [];
  const wide: Record<string, string> = { R: "x", L: "x'", U: "y", D: "y'", F: "z", B: "z'" };
  for (const m of alg.experimentalLeafMoves()) {
    if (!Number.isSafeInteger(m.amount) || m.amount === 0) throw new Error("动作转数须为非零安全整数");
    const family = m.quantum.family;
    if (!/^(?:[URFDLBxyz]|[URFDLB]w|[rufdlb])$/.test(family)) throw new Error(`二阶不支持动作 ${m}`);
    let face = family;
    let power = m.amount;
    if (family.length > 1 || /^[rufdlb]$/.test(family)) {
      const r = wide[family[0].toUpperCase()];
      face = r[0];
      power *= r.endsWith("'") ? -1 : 1;
    }
    const t = token(face, power);
    if (t) tokens.push(t);
  }
  if (moveCount(tokens) > 100) throw new Error("层转动不能超过 100 步");
  return tokens;
}

export class CubeModel {
  moves = new Map<string, { p: number[]; o: number[] }>();
  rotations: { tokens: string[]; state: State }[] = [];
  normalizers: number[][] = [];
  colorNormalizers: string[][] = [];
  rotationFaces = new Map<string, Record<string, string>>();
  static async create(): Promise<CubeModel> {
    const model = new CubeModel();
    const kp = await cube2x2x2.kpuzzle();
    for (const f of "URFDLBxyz") for (const n of [1, 2, 3]) {
      const name = token(f, n);
      const tr = kp.moveToTransformation(name).transformationData.CORNERS;
      model.moves.set(name, { p: tr.permutation, o: tr.orientationDelta });
    }
    const queue: { tokens: string[]; state: State }[] = [{ tokens: [], state: SOLVED }];
    const seen = new Set([model.rawKey(SOLVED)]);
    for (let i = 0; i < queue.length; i++) for (const f of ["x", "x2", "x'", "y", "y2", "y'", "z", "z2", "z'"]) {
      const s = model.apply(queue[i].state, f);
      const key = model.rawKey(s);
      if (!seen.has(key)) { seen.add(key); queue.push({ tokens: [...queue[i].tokens, f], state: s }); }
    }
    model.rotations = queue;
    for (const rotation of queue) {
      const map: number[] = [];
      const colorMap: string[] = [];
      for (let p = 0; p < 8; p++) {
        const r = rotation.state[p];
        for (let o = 0; o < 3; o++) map[p * 3 + o] = Math.floor(r / 3) * 3 + (r % 3 + o) % 3;
        for (let j = 0; j < 3; j++) colorMap[FACE_NAMES.indexOf(FACES[p][j])] = FACES[Math.floor(r / 3)][(j - r % 3 + 3) % 3];
      }
      // Every sticker code has exactly one color rotation that fixes corner 7.
      const input = map.indexOf(21);
      model.normalizers[input] = map;
      model.colorNormalizers[input] = colorMap;
      const faces: Record<string, string> = {};
      for (const f of "URFDLB") {
        const conjugate = model.applySequence(SOLVED, [...rotation.tokens, f, ...invert(rotation.tokens)]);
        const match = [..."URFDLB"].find(g => model.equal(conjugate, model.apply(SOLVED, g)));
        if (!match) throw new Error("Invalid rotation conjugation");
        faces[f] = match;
      }
      model.rotationFaces.set(String(model.rawKey(rotation.state)), faces);
    }
    return model;
  }
  apply(state: State, move: string): State {
    const tr = this.moves.get(move);
    if (!tr) throw new Error(`Unknown move ${move}`);
    const out = new Uint8Array(8);
    for (let i = 0; i < 8; i++) { const v = state[tr.p[i]]; out[i] = Math.floor(v / 3) * 3 + (v % 3 + tr.o[i]) % 3; }
    return out;
  }
  applySequence(state: State, tokens: readonly string[]): State {
    for (const t of tokens) state = this.apply(state, t);
    return state;
  }
  equal(a: State, b: State): boolean { return a.every((v, i) => v === b[i]); }
  rawKey(state: State): number { let key = 0; for (const v of state) key = key * 24 + v; return key; }
  key(state: State): number { const map = this.normalizers[state[7]]; let key = 0; for (const v of state) key = key * 24 + map[v]; return key; }
  solved(state: State): boolean { return this.key(state) === this.key(SOLVED); }
  stickers(state: State): string[][] { return Array.from(state, v => [0, 1, 2].map(j => FACES[Math.floor(v / 3)][(j - v % 3 + 3) % 3])); }
  mask(state: State, color: string): number {
    let mask = 0;
    for (let i = 0; i < 8; i++) {
      const v = state[i], j = FACES[Math.floor(v / 3)].indexOf(color);
      if (j >= 0) mask |= 1 << (i * 3 + (j + v % 3) % 3);
    }
    return mask;
  }
  /** Rotate a formula's frame without changing its physical transformation. */
  conjugate(tokens: readonly string[], rotation: readonly string[]): string[] {
    const frame = this.applySequence(SOLVED, rotation);
    const faces = this.rotationFaces.get(String(this.rawKey(frame)))!;
    return tokens.map(t => faces[t[0]] ? token(faces[t[0]], amount(t)) : t);
  }
}

let cached: Promise<CubeModel> | undefined;
export const getModel = () => cached ??= CubeModel.create();
