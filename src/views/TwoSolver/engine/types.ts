export type MethodId = "CLL" | "EG1" | "EG2" | "LEG1" | "TCLL+" | "TCLL-" | `LS${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | "CBL" | "EGLS1" | "EGLS2" | "TEG1" | "TEG2" | "FH";
export const METHODS: { id: MethodId; label: string; family: string; api: string; description: string }[] = [
  { id: "CLL", label: "CLL", family: "EG", api: "CLL", description: "同色面，下层排列完整" },
  { id: "EG1", label: "EG1", family: "EG", api: "EG1", description: "同色面，背面 bar" },
  { id: "EG2", label: "EG2", family: "EG", api: "EG2", description: "同色面，下层无 bar" },
  { id: "LEG1", label: "LEG1", family: "EG", api: "LEG", description: "同色面，左侧 bar" },
  ...(["TCLL+", "TCLL-"] as const).map(id => ({ id, label: id, family: "TCLL", api: id, description: "下层排列完整，一个角扭转" })),
  ...Array.from({ length: 9 }, (_, i) => ({ id: `LS${i + 1}` as MethodId, label: `LS${i + 1}`, family: "LS", api: `LS${i + 1}`, description: "三张贴纸朝下，第四个目标角在上层" })),
  { id: "CBL", label: "CBL", family: "CBL", api: "CBL", description: "四个目标色角块在下层，朝向不限" },
  { id: "EGLS1", label: "EGLS1", family: "EGLS", api: "EGLS1", description: "Last Slot，补角后为 EG1 型排列" },
  { id: "EGLS2", label: "EGLS2", family: "EGLS", api: "EGLS2", description: "Last Slot，补角后为 EG2 型排列" },
  { id: "TEG1", label: "TEG1", family: "TEG", api: "TEG1", description: "单角扭转，EG1 型下层排列" },
  { id: "TEG2", label: "TEG2", family: "TEG", api: "TEG2", description: "单角扭转，EG2 型下层排列" },
  { id: "FH", label: "FH", family: "FH", api: "FH", description: "相邻两张同色朝下并组成侧面 bar" },
];
export const DEFAULT_METHODS: MethodId[] = ["CLL", "EG1", "EG2", "LEG1"];
export const DEFAULT_FAMILY_DEPTHS = { EG: 5, TCLL: 4, LS: 4, EGLS: 3, FH: 3, CBL: 2, TEG: 3 } as const;
export type MethodFamily = keyof typeof DEFAULT_FAMILY_DEPTHS;
export type FamilyDepths = Record<MethodFamily, number>;
export const familyOf = (method: MethodId): MethodFamily => METHODS.find(m => m.id === method)!.family as MethodFamily;
export const COLORS = [
  { id: "U", label: "白", hex: "#f4f4f5" }, { id: "R", label: "红", hex: "#ed5058" },
  { id: "F", label: "绿", hex: "#23b68a" }, { id: "D", label: "黄", hex: "#f5ce45" },
  { id: "L", label: "橙", hex: "#f38c36" }, { id: "B", label: "蓝", hex: "#448de4" },
];
export interface SearchOptions {
  methods: MethodId[]; colors: string[]; maxDepth: number; moveSet: "ruf" | "all";
  maxSolutions: number; timeLimitMs: number;
  familyDepths?: FamilyDepths; maxOverlap?: number;
}
export interface Ergonomics {
  score: number; cost: number; regrips: number; rotations: number;
  confidence: "reference" | "estimated"; notes: string[];
}
export interface Solution {
  id: string; method: MethodId; caseName: string; group: string; color: string;
  orientation: string; base: string; preAuf: string; algorithm: string; postAuf: string;
  original: string; execution: string; baseMoves: number; moves: number; originalMoves: number;
  cancelled: number; ergonomics: Ergonomics; sourceApi: string;
  boundary?: { left: string; right: string; leftMarked: boolean[]; rightMarked: boolean[]; overlap: number };
}
export interface SearchResult {
  solutions: Solution[]; nodes: number; elapsedMs: number; complete: boolean;
  reason: "complete" | "time" | "limit" | "cancelled";
  data: { loaded: number; rejected: number }; depthReached: number;
}
export interface FormulaRecord { name: string; group: string; algs: string[] }
export interface MethodData { method: MethodId; records: FormulaRecord[] }
