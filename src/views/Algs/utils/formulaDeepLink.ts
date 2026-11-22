import type { AlgClassDetail } from "@/services/cubing-pro/algs/algs";
import type { FormulaItem } from "../types";

export interface FormulaDeepLinkTarget {
  set: string;
  group: string;
  name: string;
  rawAlg: string;
}

export type ParsedFormulaDeepLink =
  | { kind: "none" }
  | { kind: "invalid" }
  | { kind: "solution"; solutionId: string }
  | { kind: "target"; target: FormulaDeepLinkTarget };

export type ResolvedFormulaDeepLink =
  | { kind: "missing" | "ambiguous" }
  | { kind: "found"; item: FormulaItem; items: FormulaItem[]; index: number; libraryIndex: number };

export function parseFormulaDeepLink(search: string): ParsedFormulaDeepLink {
  if (search.length > 16000) return { kind: "invalid" };
  const params = new URLSearchParams(search);
  const keys = ["set", "group", "case", "alg"] as const;
  const hasSolutionId = params.has("solutionId");
  const hasTuple = keys.some((key) => params.has(key));
  if (!hasSolutionId && !hasTuple) return { kind: "none" };
  // URLSearchParams silently repairs malformed escapes; reject those links instead.
  try {
    decodeURIComponent(search.replace(/\+/g, " "));
  } catch {
    return { kind: "invalid" };
  }
  if (hasSolutionId) {
    const ids = params.getAll("solutionId");
    if (ids.length !== 1 || !/^[0-9a-f]{16}$/.test(ids[0])) return { kind: "invalid" };
    return { kind: "solution", solutionId: ids[0] };
  }
  const values = keys.map((key) => params.getAll(key));
  if (values.some((entries, index) => entries.length !== 1
    || !entries[0].trim()
    || entries[0].length > (index === 3 ? 3999 : 512)
    || /[\u0000-\u001f\u007f]/u.test(entries[0]))) {
    return { kind: "invalid" };
  }
  const [[set], [group], [name], [rawAlg]] = values;
  return { kind: "target", target: { set, group, name, rawAlg } };
}

/** Resolve a solution ID or exact source tuple across the full dataset. */
export function resolveFormulaDeepLink(
  data: AlgClassDetail,
  target: FormulaDeepLinkTarget | { solutionId: string },
): ResolvedFormulaDeepLink {
  const items: FormulaItem[] = [];
  const matches: { index: number; libraryIndex: number }[] = [];
  const byId = "solutionId" in target;
  for (const set of data.sets) {
    for (const group of set.groups) {
      for (const alg of group.algs) {
        const item = { alg, setName: set.name, groupName: group.name };
        const index = items.push(item) - 1;
        if (!byId && (set.name !== target.set || group.name !== target.group || alg.name !== target.name)) continue;
        alg.algs.forEach((formula, libraryIndex) => {
          const match = byId
            ? formula !== "" && alg.solutionIds?.[libraryIndex] === target.solutionId
            : formula === target.rawAlg;
          if (match) matches.push({ index, libraryIndex });
        });
      }
    }
  }
  if (matches.length === 0) return { kind: "missing" };
  if (matches.length !== 1) return { kind: "ambiguous" };
  const { index, libraryIndex } = matches[0];
  return { kind: "found", item: items[index], items, index, libraryIndex };
}
