import { twoSolverEngineEnUS, twoSolverEngineZhCN } from "../../i18n/messages/two-solver-engine";

type EngineMessageKey = keyof typeof twoSolverEngineZhCN;
type DynamicMessage = readonly [pattern: RegExp, key: EngineMessageKey, params: readonly string[]];

// Bounded adapter for the current Chinese wire phrases, not a generic translator.
// Sources: engine/state.ts (parser), search.ts (validation/counters), library.ts
// (indexing), ergonomics.ts (notes), solver.worker.ts (loading/errors), and the
// hook/practice state. cancellation.ts and scramble.ts currently throw English.
// Keep these anchored patterns in sync with those sources without changing the
// worker protocol, result objects, or search timing. Native English errors and
// unknown text pass through verbatim so diagnostic details are never discarded.
const dynamicMessages: readonly DynamicMessage[] = [
  [/^(\d+) 条已验证解法$/, "two.engine.progress.verified", ["count"]],
  [/^加载 (\S+) 公式$/, "two.engine.progress.loading", ["method"]],
  [/^建立 (\S+) 完整状态索引$/, "two.engine.progress.indexing", ["method"]],
  [/^做底深度 (\d+)\/(\d+) · ([\p{Nd}.,'’\s٬٫]+) 节点 · (\d+) 条解法$/u, "two.engine.progress.searching", ["depth", "maxDepth", "nodes", "count"]],
  [/^(\S+) 公式加载失败 \((\d+)\)$/, "two.engine.worker.loadFailed", ["method", "status"]],
  [/^(\S+) 公式数据格式错误$/, "two.engine.worker.invalidData", ["method"]],
  [/^二阶不支持动作 ([\s\S]+)$/, "two.engine.parser.unsupported", ["move"]],
  [/^内部转体 (\d+) 次，分别计费并估计换手；三连上下文在此断开。$/, "two.engine.ergonomics.rotations", ["count"]],
  [/^F2 R' 出现 (\d+) 次，启发式估计可能换手，实际取决于指法。$/, "two.engine.ergonomics.regrips", ["count"]],
];

const exactMessages = new Map<string, EngineMessageKey>(
  (Object.keys(twoSolverEngineZhCN) as EngineMessageKey[])
    .filter(key => !twoSolverEngineZhCN[key].includes("{"))
    .map(key => [twoSolverEngineZhCN[key], key]),
);

export function localizeEngineText(text: string, locale: "zh-CN" | "en-US"): string {
  if (locale === "zh-CN" || !text) return text;
  // Error.toString() prefixes also occur in diagnostics; retain the full prefix.
  const prefix = text.match(/^(?:(?:Error|RangeError|SyntaxError|TypeError|AbortError):[ \t]*)+/)?.[0] ?? "";
  const message = text.slice(prefix.length);
  const exact = exactMessages.get(message);
  if (exact) return prefix + twoSolverEngineEnUS[exact];
  for (const [pattern, key, names] of dynamicMessages) {
    const match = pattern.exec(message);
    if (!match) continue;
    const params = Object.fromEntries(names.map((name, i) => [name, match[i + 1]]));
    // One pass with a callback keeps formulas, dollar signs, and braces literal.
    // Import catalogs directly: the site i18n root imports this catalog itself.
    return prefix + twoSolverEngineEnUS[key].replace(/\{(\w+)\}/g, (placeholder, name: string) => params[name] ?? placeholder);
  }
  return text;
}
