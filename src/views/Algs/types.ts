import type { AlgItem } from "@/services/cubing-pro/algs/algs";

export type FormulaPracticeMode =
  | "sequential"
  | "random"
  | "nonRepeatRandom"
  | "weightedRandom";

export interface FormulaItem {
  alg: AlgItem;
  setName: string;
  groupName: string;
}
