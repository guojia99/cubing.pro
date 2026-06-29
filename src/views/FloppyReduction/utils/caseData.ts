export interface CaseItem {
  label: string;
  /** 该 case 的纯净示例 setup（UD 轴），由半转群搜索得到 */
  setup: string;
  zh: string;
  en: string;
}

export const cornerCases: CaseItem[] = [
  {
    label: "0",
    setup: "",
    zh: "每组角块上下成柱：顶/底层正对，已是 FR 角形，无需调整。",
    en: "Each pair forms a pillar (top/bottom aligned). Already the FR corner shape.",
  },
  {
    label: "1",
    setup: "U2 R2 F2 R2 F2 U2 F2",
    zh: "上下分离但未对齐，做一个轴向半转（U2/D2）即可对成柱。",
    en: "Split top/bottom but not aligned; one axis half-turn (U2/D2) makes the pillars.",
  },
  {
    label: "2RL",
    setup: "U2 R2 F2 R2 F2 U2",
    zh: "一组角同处一层并落在 R/L 面上（如 UFR-UBR）。最灵活，两轴半转都不改变它。",
    en: "A pair sits in one layer on an R/L face (e.g. UFR-UBR). The most flexible case.",
  },
  {
    label: "2FB",
    setup: "U2 F2 R2 F2 R2 U2",
    zh: "一组角同处一层并落在 F/B 面上（如 UFL-UFR）。同样很灵活。",
    en: "A pair sits in one layer on an F/B face (e.g. UFL-UFR). Also very flexible.",
  },
];

export const edgeCases: CaseItem[] = [
  {
    label: "4-0",
    setup: "U2 R2 F2 R2 F2 U2 F2 U2",
    zh: "4 个坏棱全在一层。直接 U2 即可解决。",
    en: "All 4 bad edges in one layer. A single U2 fixes it.",
  },
  {
    label: "3-1",
    setup: "U2 R2 U2 R2 F2 U2 F2 U2",
    zh: "3 个坏棱在一层、1 个在另一层。最常见的基础 case（FR trigger）。",
    en: "3 bad in one layer, 1 in the other. The basic FR-trigger case.",
  },
  {
    label: "2-2o",
    setup: "U2 R2 L2 U2",
    zh: "每层 2 个坏棱，且层内两棱在对面（如 UF-UB）。",
    en: "2 bad per layer, opposite each other within the layer (e.g. UF-UB).",
  },
  {
    label: "2-2a",
    setup: "U2 R2 F2 R2 F2 R2 F2 U2",
    zh: "每层 2 个坏棱，且层内两棱相邻（如 UL-UB）。",
    en: "2 bad per layer, adjacent within the layer (e.g. UL-UB).",
  },
];

export const algTable: { c: string; alg: string }[] = [
  { c: "4-0 / 1", alg: "U2" },
  { c: "3-1 / 2FB", alg: "R2 U2" },
  { c: "2-2a / 2FB", alg: "F2 R2 U2" },
  { c: "2-2a / 2RL", alg: "R2 F2 U2" },
  { c: "2-2o / 1", alg: "R2 L2 U2" },
  { c: "3-1 / 1", alg: "F2 R2 F2 U2" },
  { c: "4-0 / 2FB", alg: "R2 F2 R2 F2 U2" },
  { c: "2-2o / 2FB", alg: "L2 F2 R2 F2 U2" },
  { c: "2-2o / 2RL", alg: "F2 L2 F2 R2 U2" },
  { c: "3-1 / 2RL", alg: "L2 F2 L2 F2 R2 U2" },
];

/** 简单 case 子集（教程用） */
export const simpleAlgTable = algTable.slice(0, 5);

/** 纯 R2 L2 F2 B2 打乱，展示真 FR 态（混乱有限） */
export const FR_LIMITED_SCRAMBLE = "R2 L2 F2 B2";

/** 3-1 / 2FB（FR trigger）起始态 */
export const FR_TRIGGER_SETUP = edgeCases.find((c) => c.label === "3-1")!.setup;

/** 假 FR 示例（形态满足但奇偶不对） */
export const FALSE_FR_SETUP = "F R2 F2 R2 F2 R2 F";

/** 2-2a / 2 态，可插入 U2/D2 补奇偶 */
export const PARITY_INSERT_SETUP = edgeCases.find((c) => c.label === "2-2a")!.setup;

export const FR_TUTORIAL_URL =
  "https://www.bilibili.com/opus/1009758579532496920";
