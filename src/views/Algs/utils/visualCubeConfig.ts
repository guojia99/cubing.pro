import { normalizeVisualCubeId } from "./visualCubeCube";

/** sr-visualizer Masking 枚举对应的字符串值（避免 SSR 时加载 sr-visualizer） */
export type VisualCubeMask =
  | "fl"
  | "f2l"
  | "ll"
  | "cll"
  | "ell"
  | "oll"
  | "ocll"
  | "oell"
  | "coll"
  | "ocell"
  | "wv"
  | "vh"
  | "els"
  | "cls"
  | "cmll"
  | "cross"
  | "f2l_3"
  | "f2l_2"
  | "f2l_sm"
  | "f2l_1"
  | "f2b"
  | "line";

const MASK_RULES = [
  { token: "ZBLS", mask: "wv" },
  { token: "F2L", mask: "f2l" },
  { token: "OLL", mask: "oll" },
  { token: "COLL", mask: "coll" },
  { token: "CMLL", mask: "cmll" },
] as const satisfies readonly { token: string; mask: VisualCubeMask }[];

const MASK_RULES_SORTED = [...MASK_RULES].sort(
  (a, b) => b.token.length - a.token.length,
);

function haystackContainsToken(haystack: string, token: string): boolean {
  const upper = haystack.toUpperCase();
  const t = token.toUpperCase();
  let from = 0;
  while (from <= upper.length) {
    const i = upper.indexOf(t, from);
    if (i < 0) return false;
    const beforeOk = i === 0 || !/[A-Z0-9]/.test(upper[i - 1]!);
    const afterOk =
      i + t.length >= upper.length || !/[A-Z0-9]/.test(upper[i + t.length]!);
    if (beforeOk && afterOk) return true;
    from = i + 1;
  }
  return false;
}

/** 按 class / set / group 解析 VisualCube 遮罩 */
export function resolveVisualCubeMask(
  classId: string,
  setName: string,
  groupName: string,
): VisualCubeMask | undefined {
  const g = groupName.trim();
  if (g) {
    for (const { token, mask } of MASK_RULES_SORTED) {
      if (g.toUpperCase() === token) return mask;
    }
  }
  const haystack = `${classId} ${setName} ${groupName}`;
  for (const { token, mask } of MASK_RULES_SORTED) {
    if (haystackContainsToken(haystack, token)) return mask;
  }
  return undefined;
}

/**
 * 平面视图 plan：除下列外默认使用 plan。
 * default（不传 view）：222-PBL、333-F2L、333-ZBLS。
 */
export function resolveVisualCubeView(
  cube: string,
  classId: string,
  setName: string,
  groupName: string,
): "plan" | undefined {
  const id = normalizeVisualCubeId(cube);
  const haystack = `${classId} ${setName} ${groupName}`;
  if (id === "222" && haystackContainsToken(haystack, "PBL")) {
    return undefined;
  }
  if (
    id === "333" &&
    (haystackContainsToken(haystack, "F2L") ||
      haystackContainsToken(haystack, "ZBLS"))
  ) {
    return undefined;
  }
  return "plan";
}
