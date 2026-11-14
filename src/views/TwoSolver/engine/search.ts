import { evaluateErgonomics } from "./ergonomics";
import { cancelStages, compactNotation } from "./cancellation";
import { type Library, matchingColor } from "./library";
import { type CubeModel, type State, SOLVED, moveCount, parseMoves, token } from "./state";
import { DEFAULT_FAMILY_DEPTHS, familyOf, METHODS, type SearchOptions, type SearchResult, type Solution } from "./types";

export const depthFor = (options: SearchOptions, method: SearchOptions["methods"][number]) => options.familyDepths?.[familyOf(method)] ?? options.maxDepth;

const opposite: Record<string, string> = { U: "D", D: "U", R: "L", L: "R", F: "B", B: "F" };
export function validateOptions(options: SearchOptions): void {
  if (!options.methods.length || options.methods.some(m => !METHODS.some(x => x.id === m))) throw new Error("请选择有效的方法");
  if (!options.colors.length || options.colors.some(c => !"URFDLB".includes(c) || c.length !== 1)) throw new Error("请选择有效底色");
  if (!Number.isInteger(options.maxDepth) || options.maxDepth < 0 || options.maxDepth > 6) throw new Error("做底深度须在 0–6 之间");
  if (options.familyDepths && Object.keys(DEFAULT_FAMILY_DEPTHS).some(f => !Number.isInteger(options.familyDepths![f as keyof typeof DEFAULT_FAMILY_DEPTHS]) || options.familyDepths![f as keyof typeof DEFAULT_FAMILY_DEPTHS] < 0 || options.familyDepths![f as keyof typeof DEFAULT_FAMILY_DEPTHS] > 6)) throw new Error("各体系做底深度须在 0–6 之间");
  if (options.maxOverlap !== undefined && (!Number.isInteger(options.maxOverlap) || options.maxOverlap < 0 || options.maxOverlap > 6)) throw new Error("消步最大重叠数须在 0–6 之间");
  if (!["ruf", "all"].includes(options.moveSet)) throw new Error("无效的动作集合");
  if (!Number.isFinite(options.timeLimitMs) || options.timeLimitMs < 100 || options.timeLimitMs > 60000) throw new Error("无效的搜索时间上限");
  if (!Number.isInteger(options.maxSolutions) || options.maxSolutions < 1 || options.maxSolutions > 2000) throw new Error("无效的结果上限");
}

/** Exact single-color sticker projection (same search abstraction as two-tool).
 * Multi-source reverse BFS supplies an admissible bound for all target families.
 * Full 8-corner keys, not this projection, decide formula matches.
 */
function projectionDistances(model: CubeModel, targets: Set<number>, moves: string[]) {
  const maps = moves.map(m => {
    const tr = model.moves.get(m)!;
    const map = new Int32Array(24);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) map[tr.p[i] * 3 + j] = 1 << (i * 3 + (j + tr.o[i]) % 3);
    return map;
  });
  const distances = new Map<number, number>();
  const queue = [...targets];
  for (const m of queue) distances.set(m, 0);
  for (let i = 0; i < queue.length; i++) {
    const mask = queue[i], depth = distances.get(mask)!;
    for (const map of maps) {
      let remaining = mask, next = 0;
      while (remaining) { const bit = remaining & -remaining; next |= map[31 - Math.clz32(bit)]; remaining ^= bit; }
      if (!distances.has(next)) { distances.set(next, depth + 1); queue.push(next); }
    }
  }
  return distances;
}

export async function search(model: CubeModel, library: Library, scramble: string, options: SearchOptions,
  progress?: (text: string) => void): Promise<SearchResult> {
  validateOptions(options);
  const input = parseMoves(scramble);
  if (!moveCount(input)) throw new Error("请输入至少一个层转动");
  const initial = model.applySequence(SOLVED, input);
  const maxDepth = Math.max(...options.methods.map(m => depthFor(options, m)));
  const start = performance.now();
  const moves = [...(options.moveSet === "ruf" ? "RUF" : "RUFDLB")].flatMap(f => [1, 2, 3].map(n => token(f, n)));
  const distances = projectionDistances(model, library.masks, moves);
  const results = new Map<string, Solution>();
  const processed = new Set<string>();
  let nodes = 0, stopped: SearchResult["reason"] = "complete", depthReached = 0, truncated = false, candidateId = 0;
  const rank = (a: Solution, b: Solution) => a.ergonomics.cost - b.ergonomics.cost || a.moves - b.moves || a.baseMoves - b.baseMoves;
  const trim = () => {
    if (results.size <= options.maxSolutions) return;
    const keep = [...results.entries()].sort((a, b) => rank(a[1], b[1])).slice(0, options.maxSolutions);
    results.clear();
    for (const [key, value] of keep) results.set(key, value);
    truncated = true;
  };
  const deadline = start + options.timeLimitMs;
  const add = (state: State, orientation: string[], path: string[]) => {
    const candidates = library.index.get(model.key(state));
    if (!candidates) return;
    for (const c of candidates) {
      if (performance.now() >= deadline) { stopped = "time"; return; }
      if (!options.methods.includes(c.method)) continue;
      if (path.length > depthFor(options, c.method)) continue;
      const color = matchingColor(model, state, c.color);
      if (!options.colors.includes(color)) continue;
      const right = [...(c.preAuf ? [c.preAuf] : []), ...c.algorithm, ...(c.postAuf ? [c.postAuf] : [])];
      const original = [...path, ...right];
      const identity = `${c.method}:${color}:${orientation.join(" ")}:${original.join(" ")}`;
      if (processed.has(identity)) continue;
      processed.add(identity);
      // Independent exact state checks guard AUF, color normalization and all
      // cancellation transformations before a candidate can reach the UI.
      if (!model.solved(model.applySequence(initial, [...orientation, ...original]))) continue;
      const boundary = cancelStages(model, path, right, options.maxOverlap ?? 1);
      const internal = cancelStages(model, path, right, 0);
      const compact = boundary.execution;
      const baseScore = evaluateErgonomics(internal.execution), compactScore = evaluateErgonomics(compact);
      // Grip alternatives may omit cross-stage cancellation, but must not
      // reintroduce redundant turns inside a formula or AUF/rotation run.
      const alternatives = baseScore.cost + 0.015 < compactScore.cost ? [internal.execution, compact] : [compact];
      for (const executionTokens of alternatives) {
        const provenance = executionTokens === compact ? boundary : internal;
        const inspection = { orientation: compactNotation(model, orientation), execution: executionTokens };
        if (!model.solved(model.applySequence(initial, [...inspection.orientation, ...inspection.execution]))) continue;
        const key = `${c.method}:${color}:${inspection.orientation.join(" ")}:${inspection.execution.join(" ")}`;
        const solution: Solution = {
          id: `s${++candidateId}`, method: c.method, caseName: c.name, group: c.group, color,
          orientation: inspection.orientation.join(" "), base: path.join(" "), preAuf: c.preAuf,
          algorithm: c.algorithm.join(" "), postAuf: c.postAuf,
          original: [...orientation, ...original].join(" "), execution: inspection.execution.join(" "),
          baseMoves: path.length, moves: moveCount(inspection.execution), originalMoves: moveCount(original),
          cancelled: moveCount(original) - moveCount(inspection.execution),
          ergonomics: evaluateErgonomics(inspection.execution), sourceApi: c.sourceApi,
          boundary: { left: path.join(" "), right: right.join(" "),
            leftMarked: provenance.leftMarked, rightMarked: provenance.rightMarked,
            overlap: provenance.overlap },
        };
        const previous = results.get(key);
        if (!previous || solution.baseMoves < previous.baseMoves) results.set(key, solution);
        // Keep searching all grips/depths instead of filling the result cap with
        // the first color/formula variants encountered. Bound retained memory.
        if (results.size > options.maxSolutions * 2) trim();
      }
    }
  };
  const path: string[] = [];
  function dfs(state: State, orientation: string[], remaining: number, last: string): void {
    if (stopped !== "complete") return;
    nodes++;
    if ((nodes & 255) === 0 && performance.now() >= deadline) { stopped = "time"; return; }
    let bound = Infinity;
    for (const color of options.colors) bound = Math.min(bound, distances.get(model.mask(state, color)) ?? Infinity);
    if (bound > remaining) return;
    if (remaining === 0) { add(state, orientation, path); return; }
    for (const move of moves) {
      const f = move[0];
      if (f === last || (opposite[f] === last && f < last)) continue;
      path.push(move);
      dfs(model.apply(state, move), orientation, remaining - 1, f);
      path.pop();
      if (stopped !== "complete") return;
    }
  }
  // Iterative depths keep shallow solutions fair across all 24 initial grips.
  for (let depth = 0; depth <= maxDepth && stopped === "complete"; depth++) {
    for (const rotation of model.rotations) {
      dfs(model.applySequence(initial, rotation.tokens), rotation.tokens, depth, "");
      if (performance.now() >= deadline && stopped === "complete") stopped = "time";
      if (stopped !== "complete") break;
    }
    trim();
    depthReached = depth;
    progress?.(`做底深度 ${depth}/${maxDepth} · ${nodes.toLocaleString()} 节点 · ${results.size} 条解法`);
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  trim();
  const reason = stopped === "complete" && truncated ? "limit" : stopped;
  return { solutions: [...results.values()].sort(rank),
    nodes, elapsedMs: performance.now() - start, complete: reason === "complete", reason,
    data: { loaded: library.loaded, rejected: library.rejected }, depthReached };
}

let shortStates: Set<number> | undefined;
/** Reject states solvable in <=3 HTM, including all global orientations. */
export function isCompetitionDistance(model: CubeModel, scramble: string): boolean {
  if (!shortStates) {
    shortStates = new Set([model.key(SOLVED)]);
    const moves = [..."RUF"].flatMap(f => [1, 2, 3].map(n => token(f, n)));
    let frontier: State[] = [SOLVED];
    for (let depth = 1; depth <= 3; depth++) {
      const next: State[] = [];
      for (const state of frontier) for (const move of moves) {
        const child = model.apply(state, move), key = model.key(child);
        if (!shortStates.has(key)) { shortStates.add(key); next.push(child); }
      }
      frontier = next;
    }
  }
  return !shortStates.has(model.key(model.applySequence(SOLVED, parseMoves(scramble))));
}
