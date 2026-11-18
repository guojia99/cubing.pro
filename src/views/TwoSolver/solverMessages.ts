import { twoSolverEngineZhCN } from "../../i18n/messages/two-solver-engine";
import { translate, type Locale } from "@/i18n";
import { applyPlural } from "@/i18n/plurals";
import { formatMessage } from "@/i18n/formatMessage";
import { getIntlLocale } from "@/i18n/locales";
import { translateWcaPuzzleExtra as extra, type WcaPuzzleExtraKey } from "@/i18n/messages/wca-puzzle-extra";

type EngineMessageKey = keyof typeof twoSolverEngineZhCN;
type DynamicMessage = readonly [pattern: RegExp, key: EngineMessageKey, params: readonly string[]];

// Bounded adapter for the current Chinese wire phrases, not a generic translator.
// Sources: engine/state.ts (parser), search.ts (validation/counters), library.ts
// (indexing), ergonomics.ts (notes), solver.worker.ts (loading/errors), and the
// hook/practice state. cancellation.ts and scramble.ts currently throw English.
// Keep these anchored patterns in sync with those sources without changing the
// worker protocol, result objects, or search timing. Unknown diagnostic text
// passes through verbatim; known native errors are translated below.
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

const nativeMessages: Record<string, WcaPuzzleExtraKey> = {
  "Invalid transition rotation setting": "wcaPuzzleExtra.transitionInvalid",
  "Invalid whole-cube rotation": "wcaPuzzleExtra.rotationInvalid",
  "Invalid rotation conjugation": "wcaPuzzleExtra.rotationInvalid",
  "RUF scramble conversion changed the physical state": "wcaPuzzleExtra.stateMismatch",
  "Stage normalization changed the exact transformation": "wcaPuzzleExtra.stateMismatch",
  "Boundary reduction changed the exact transformation": "wcaPuzzleExtra.stateMismatch",
};

export function localizeEngineText(text: string, locale: Locale): string {
  if (!text) return text;
  // Error.toString() prefixes also occur in diagnostics; retain the full prefix.
  const prefix = text.match(/^(?:(?:Error|RangeError|SyntaxError|TypeError|AbortError):[ \t]*)+/)?.[0] ?? "";
  const message = text.slice(prefix.length);
  if (Object.hasOwn(nativeMessages, message)) return prefix + extra(locale, nativeMessages[message]);
  const unknownMove = /^Unknown move (.+)$/.exec(message);
  if (unknownMove) return prefix + extra(locale, "wcaPuzzleExtra.unsupportedMove", { puzzle: "2×2×2", move: unknownMove[1] });
  const exact = exactMessages.get(message);
  if (exact) return prefix + translate(locale, exact);
  for (const [pattern, key, names] of dynamicMessages) {
    const match = pattern.exec(message);
    if (!match) continue;
    const params = Object.fromEntries(names.map((name, i) => [name, match[i + 1]]));
    const quantities: Record<string, string | number> = { ...params };
    // Only protocol counters select grammar; move strings and method IDs remain literal.
    if (Object.hasOwn(params, "count")) quantities.count = Number(params.count);
    if (params.nodes) {
      const digits = params.nodes.normalize("NFKC")
        .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x660))
        .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x6f0))
        .replace(/[.,'’\s٬٫]/g, "");
      if (/^\d+$/.test(digits)) {
        params.nodes = new Intl.NumberFormat(getIntlLocale(locale)).format(BigInt(digits));
        const nodes = Number(digits);
        if (Number.isSafeInteger(nodes)) quantities.nodes = nodes;
      }
    }
    // One pass with a callback keeps formulas, dollar signs, and braces literal.
    // Translate only at display time; retain the original worker message.
    const template = applyPlural(locale, key, translate(locale, key), quantities);
    return prefix + formatMessage(locale, key, template, params);
  }
  return text;
}
