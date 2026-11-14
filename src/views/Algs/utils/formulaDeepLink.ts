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
  | { kind: "target"; target: FormulaDeepLinkTarget };

export type ResolvedFormulaDeepLink =
  | { kind: "missing" | "ambiguous" }
  | { kind: "found"; item: FormulaItem; items: FormulaItem[]; index: number; libraryIndex: number };

export function parseFormulaDeepLink(search: string): ParsedFormulaDeepLink {
  if (search.length > 16000) return { kind: "invalid" };
  const params = new URLSearchParams(search);
  const keys = ["set", "group", "case", "alg"] as const;
  if (!keys.some((key) => params.has(key))) return { kind: "none" };
  // URLSearchParams silently repairs malformed escapes; reject those links instead.
  try {
    decodeURIComponent(search.replace(/\+/g, " "));
  } catch {
    return { kind: "invalid" };
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

/** Match retained source strings across the full dataset, never display/filter aliases. */
export function resolveFormulaDeepLink(
  data: AlgClassDetail,
  target: FormulaDeepLinkTarget,
): ResolvedFormulaDeepLink {
  const items: FormulaItem[] = [];
  const matches: { index: number; libraryIndex: number }[] = [];
  for (const set of data.sets) {
    for (const group of set.groups) {
      for (const alg of group.algs) {
        const item = { alg, setName: set.name, groupName: group.name };
        const index = items.push(item) - 1;
        if (set.name !== target.set || group.name !== target.group || alg.name !== target.name) continue;
        alg.algs.forEach((formula, libraryIndex) => {
          if (formula === target.rawAlg) matches.push({ index, libraryIndex });
        });
      }
    }
  }
  if (matches.length === 0) return { kind: "missing" };
  if (matches.length !== 1) return { kind: "ambiguous" };
  const { index, libraryIndex } = matches[0];
  return { kind: "found", item: items[index], items, index, libraryIndex };
}
