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
  { c: "4-0 / 2RL", alg: "F2 R2 F2 R2 U2" },
  { c: "2-2o / 2FB", alg: "L2 F2 R2 F2 U2" },
  { c: "2-2o / 2RL", alg: "F2 L2 F2 R2 U2" },
  { c: "3-1 / 2RL", alg: "L2 F2 L2 F2 R2 U2" },
  { c: "2-2a / 1", alg: "F2 L2 F2 L2 F2 R2 U2" },
];

/** 半转序列取逆（从还原态执行即为该 case 的起始态） */
export function algInverseSetup(alg: string): string {
  return alg
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reverse()
    .join(" ");
}

export interface TutorialCaseItem {
  label: string;
  alg: string;
  setup: string;
  tier: "simple" | "hard" | "special";
  zh: string;
  en: string;
}

export const tutorialCases: TutorialCaseItem[] = [
  {
    label: "4-0 / 1",
    alg: "U2",
    setup: algInverseSetup("U2"),
    tier: "simple",
    zh: "最简单的 case。",
    en: "The simplest case.",
  },
  {
    label: "3-1 / 2FB",
    alg: "R2 U2",
    setup: algInverseSetup("R2 U2"),
    tier: "simple",
    zh: "最基本的 case，称为 FR trigger；大部分 case 都可转化到此。",
    en: "The basic FR trigger; most cases reduce to this.",
  },
  {
    label: "2-2a / 2FB",
    alg: "F2 R2 U2",
    setup: algInverseSetup("F2 R2 U2"),
    tier: "simple",
    zh: "角在 F/B 面，做 F2 不改变角形，转化为 3-1 / 2FB。",
    en: "Corners on F/B; F2 keeps the corner shape and reduces to 3-1 / 2FB.",
  },
  {
    label: "2-2a / 2RL",
    alg: "R2 F2 U2",
    setup: algInverseSetup("R2 F2 U2"),
    tier: "simple",
    zh: "与上一个 case 同理（角在 R/L 面）。",
    en: "Same idea as above with corners on R/L.",
  },
  {
    label: "2-2o / 1",
    alg: "R2 L2 U2",
    setup: algInverseSetup("R2 L2 U2"),
    tier: "simple",
    zh: "R2 L2 将棱块调为 4-0，角块仍为 1 角形，再 U2 完成。",
    en: "R2 L2 makes edges 4-0 while corners stay at shape 1; finish with U2.",
  },
  {
    label: "3-1 / 1",
    alg: "F2 R2 F2 U2",
    setup: algInverseSetup("F2 R2 F2 U2"),
    tier: "hard",
    zh: "第一步 F2 将 1 角形转化为 2RL，棱变为 2-2。",
    en: "F2 turns corner shape 1 into 2RL and edges into 2-2.",
  },
  {
    label: "4-0 / 2FB",
    alg: "R2 F2 R2 F2 U2",
    setup: algInverseSetup("R2 F2 R2 F2 U2"),
    tier: "hard",
    zh: "前两步 R2 F2 将角形转化为 2RL，棱变为 2-2。",
    en: "R2 F2 turns corners to 2RL and edges to 2-2.",
  },
  {
    label: "4-0 / 2RL",
    alg: "F2 R2 F2 R2 U2",
    setup: algInverseSetup("F2 R2 F2 R2 U2"),
    tier: "hard",
    zh: "与上一个 case 同理。",
    en: "Same pattern as the previous case.",
  },
  {
    label: "2-2o / 2FB",
    alg: "L2 F2 R2 F2 U2",
    setup: algInverseSetup("L2 F2 R2 F2 U2"),
    tier: "hard",
    zh: "第一步 L2 转化为上一个 case。",
    en: "L2 first reduces to the previous case.",
  },
  {
    label: "2-2o / 2RL",
    alg: "F2 L2 F2 R2 U2",
    setup: algInverseSetup("F2 L2 F2 R2 U2"),
    tier: "hard",
    zh: "前两步 F2 L2 将角形转化为 2FB，棱变为 2-2。",
    en: "F2 L2 turns corners to 2FB and edges to 2-2.",
  },
  {
    label: "3-1 / 2RL",
    alg: "L2 F2 L2 F2 R2 U2",
    setup: algInverseSetup("L2 F2 L2 F2 R2 U2"),
    tier: "hard",
    zh: "前三步 L2 F2 L2 将 2RL 角形转化为 2FB，棱变为 2-2。",
    en: "L2 F2 L2 turns 2RL corners into 2FB and edges into 2-2.",
  },
  {
    label: "2-2a / 1",
    alg: "F2 L2 F2 L2 F2 R2 U2",
    setup: algInverseSetup("F2 L2 F2 L2 F2 R2 U2"),
    tier: "hard",
    zh: "第一步 F2 转化为上一个 case。",
    en: "F2 first reduces to the previous case.",
  },
];

/** 4-0 / 0：先 U2 变 1 角形（特殊策略演示） */
export const TUTORIAL_SPECIAL_40_0: TutorialCaseItem = {
  label: "4-0 / 0",
  alg: "U2",
  setup: edgeCases.find((c) => c.label === "4-0")!.setup,
  tier: "special",
  zh: "所有 4 坏棱 + 0 角形：先做一个 U2 变成 1 角形，此时坏棱数会变为 0 / 2 / 6 / 8。若变为 0 / 8，可做 R2 U2 或 F2 U2 转为 4 坏棱 + 2 角形；若变为 2 / 6，需选择不影响坏棱位置的 R2 / F2 将角形调为 2，再 U2 归一为 4 坏棱。",
  en: "All 4 bad edges + shape 0: do U2 first to reach shape 1; bad count becomes 0/2/6/8. From 0/8 use R2 U2 or F2 U2 to reach 4 bad + shape 2; from 2/6 pick R2/F2 that fixes corners without disturbing bad edges, then U2.",
};

export const tutorialSpecialNotes = {
  zh: "所有 0 / 2 / 6 / 8 坏棱：先转化为 4 坏棱，再参考上述 case。若直接落到简单 case 尚可接受。",
  en: "For 0/2/6/8 bad edges: reduce to 4 bad first, then use the cases above. Landing on a simple case directly is fine.",
};

/** 简单 case 子集（说明对话框用） */
export const simpleAlgTable = algTable.slice(0, 5);

/** 纯 R2 L2 F2 B2 打乱，展示真 FR 态（混乱有限） */
export const FR_LIMITED_SCRAMBLE = "R2 L2 F2 B2";

/** 3-1 / 2FB（FR trigger）起始态 */
export const FR_TRIGGER_SETUP = algInverseSetup("R2 U2");

/** 假 FR 示例（形态满足但奇偶不对） */
export const FALSE_FR_SETUP = "F R2 F2 R2 F2 R2 F";

/** 2-2a / 2 态，可插入 U2/D2 补奇偶 */
export const PARITY_INSERT_SETUP = edgeCases.find((c) => c.label === "2-2a")!.setup;

export const FR_TUTORIAL_URL =
  "https://www.bilibili.com/opus/1009758579532496920";
