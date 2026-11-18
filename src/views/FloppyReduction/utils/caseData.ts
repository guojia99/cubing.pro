import type { TutorialExtraKey } from "@/i18n/messages/tutorial-extra";

export interface CaseItem {
  label: string;
  /** 该 case 的纯净示例 setup（UD 轴），由半转群搜索得到 */
  setup: string;
  descriptionKey: TutorialExtraKey;
}

export const cornerCases: CaseItem[] = [
  {
    label: "0",
    setup: "",
    descriptionKey: "tutorialExtra.fr.corner.0",
  },
  {
    label: "1",
    setup: "U2 R2 F2 R2 F2 U2 F2",
    descriptionKey: "tutorialExtra.fr.corner.1",
  },
  {
    label: "2RL",
    setup: "U2 R2 F2 R2 F2 U2",
    descriptionKey: "tutorialExtra.fr.corner.2RL",
  },
  {
    label: "2FB",
    setup: "U2 F2 R2 F2 R2 U2",
    descriptionKey: "tutorialExtra.fr.corner.2FB",
  },
];

export const edgeCases: CaseItem[] = [
  {
    label: "4-0",
    setup: "U2 R2 F2 R2 F2 U2 F2 U2",
    descriptionKey: "tutorialExtra.fr.edge.40",
  },
  {
    label: "3-1",
    setup: "U2 R2 U2 R2 F2 U2 F2 U2",
    descriptionKey: "tutorialExtra.fr.edge.31",
  },
  {
    label: "2-2o",
    setup: "U2 R2 L2 U2",
    descriptionKey: "tutorialExtra.fr.edge.22o",
  },
  {
    label: "2-2a",
    setup: "U2 R2 F2 R2 F2 R2 F2 U2",
    descriptionKey: "tutorialExtra.fr.edge.22a",
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
  descriptionKey: TutorialExtraKey;
}

export const tutorialCases: TutorialCaseItem[] = [
  {
    label: "4-0 / 1",
    alg: "U2",
    setup: algInverseSetup("U2"),
    tier: "simple",
    descriptionKey: "tutorialExtra.fr.case.40_1",
  },
  {
    label: "3-1 / 2FB",
    alg: "R2 U2",
    setup: algInverseSetup("R2 U2"),
    tier: "simple",
    descriptionKey: "tutorialExtra.fr.case.31_2FB",
  },
  {
    label: "2-2a / 2FB",
    alg: "F2 R2 U2",
    setup: algInverseSetup("F2 R2 U2"),
    tier: "simple",
    descriptionKey: "tutorialExtra.fr.case.22a_2FB",
  },
  {
    label: "2-2a / 2RL",
    alg: "R2 F2 U2",
    setup: algInverseSetup("R2 F2 U2"),
    tier: "simple",
    descriptionKey: "tutorialExtra.fr.case.22a_2RL",
  },
  {
    label: "2-2o / 1",
    alg: "R2 L2 U2",
    setup: algInverseSetup("R2 L2 U2"),
    tier: "simple",
    descriptionKey: "tutorialExtra.fr.case.22o_1",
  },
  {
    label: "3-1 / 1",
    alg: "F2 R2 F2 U2",
    setup: algInverseSetup("F2 R2 F2 U2"),
    tier: "hard",
    descriptionKey: "tutorialExtra.fr.case.31_1",
  },
  {
    label: "4-0 / 2FB",
    alg: "R2 F2 R2 F2 U2",
    setup: algInverseSetup("R2 F2 R2 F2 U2"),
    tier: "hard",
    descriptionKey: "tutorialExtra.fr.case.40_2FB",
  },
  {
    label: "4-0 / 2RL",
    alg: "F2 R2 F2 R2 U2",
    setup: algInverseSetup("F2 R2 F2 R2 U2"),
    tier: "hard",
    descriptionKey: "tutorialExtra.fr.case.40_2RL",
  },
  {
    label: "2-2o / 2FB",
    alg: "L2 F2 R2 F2 U2",
    setup: algInverseSetup("L2 F2 R2 F2 U2"),
    tier: "hard",
    descriptionKey: "tutorialExtra.fr.case.22o_2FB",
  },
  {
    label: "2-2o / 2RL",
    alg: "F2 L2 F2 R2 U2",
    setup: algInverseSetup("F2 L2 F2 R2 U2"),
    tier: "hard",
    descriptionKey: "tutorialExtra.fr.case.22o_2RL",
  },
  {
    label: "3-1 / 2RL",
    alg: "L2 F2 L2 F2 R2 U2",
    setup: algInverseSetup("L2 F2 L2 F2 R2 U2"),
    tier: "hard",
    descriptionKey: "tutorialExtra.fr.case.31_2RL",
  },
  {
    label: "2-2a / 1",
    alg: "F2 L2 F2 L2 F2 R2 U2",
    setup: algInverseSetup("F2 L2 F2 L2 F2 R2 U2"),
    tier: "hard",
    descriptionKey: "tutorialExtra.fr.case.22a_1",
  },
];

/** 4-0 / 0：先 U2 变 1 角形（特殊策略演示） */
export const TUTORIAL_SPECIAL_40_0: TutorialCaseItem = {
  label: "4-0 / 0",
  alg: "U2",
  setup: edgeCases.find((c) => c.label === "4-0")!.setup,
  tier: "special",
  descriptionKey: "tutorialExtra.fr.case.40_0",
};

export const tutorialSpecialNotes: TutorialExtraKey = "tutorialExtra.fr.specialNotes";

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
