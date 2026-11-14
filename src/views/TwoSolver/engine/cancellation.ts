import { type CubeModel, SOLVED, amount, invert, isRotation, token } from "./state";

function adjacent(tokens: readonly string[]): string[] {
  const out: string[] = [];
  for (const t of tokens) {
    const last = out.at(-1);
    if (last?.[0] === t[0]) {
      out.pop();
      const combined = token(t[0], amount(last) + amount(t));
      if (combined) out.push(combined);
    } else out.push(t);
  }
  return out;
}

/** two-tool boundary cancellation, generalized with verified conjugations. */
export function simplify(model: CubeModel, tokens: readonly string[]): string[] {
  let out = adjacent(tokens);
  // Move a rotation over ONE preceding layer turn. Accept only reductions;
  // this exposes cancellation across AUF/rotation without rewriting whole algs.
  for (let pass = 0; pass < 8; pass++) {
    let improved = false;
    for (let i = 1; i < out.length; i++) {
      if (!isRotation(out[i]) || isRotation(out[i - 1])) continue;
      const r = out[i];
      const mapped = model.conjugate([out[i - 1]], invert([r]))[0];
      const candidate = adjacent([...out.slice(0, i - 1), r, mapped, ...out.slice(i + 1)]);
      if (candidate.length < out.length && model.equal(model.applySequence(SOLVED, out), model.applySequence(SOLVED, candidate))) {
        out = candidate; improved = true; break;
      }
    }
    if (!improved) break;
  }
  return out;
}

function compactRotations(model: CubeModel, moves: readonly string[]): string[] {
  const state = model.applySequence(SOLVED, moves);
  const rotation = model.rotations.find(r => model.equal(r.state, state));
  if (!rotation) throw new Error("Invalid whole-cube rotation");
  return [...rotation.tokens];
}

type TaggedMove = { move: string; sources: number[] };

/** Local reductions retain the left turn's position and the exact rotation frame. */
function normalizeStage(model: CubeModel, tokens: readonly string[]) {
  const out: TaggedMove[] = tokens.map((move, index) => ({ move, sources: [index] }));
  const marked = tokens.map(() => false);
  const opposite: Record<string, string> = { U: "D", D: "U", R: "L", L: "R", F: "B", B: "F" };
  const replace = (start: number, count: number, replacement: TaggedMove[]) => {
    const before = out.slice(start, start + count);
    if (!model.equal(model.applySequence(SOLVED, before.map(t => t.move)),
      model.applySequence(SOLVED, replacement.map(t => t.move)))) {
      throw new Error("Stage normalization changed the exact transformation");
    }
    for (const item of before) for (const index of item.sources) marked[index] = true;
    out.splice(start, count, ...replacement);
  };
  for (;;) {
    let changed = false;
    for (let i = 0; i < out.length; i++) {
      if (isRotation(out[i].move)) {
        let end = i + 1;
        while (end < out.length && isRotation(out[end].move)) end++;
        const run = out.slice(i, end);
        const compact = compactRotations(model, run.map(t => t.move));
        if (compact.length < run.length) {
          const sources = run.flatMap(t => t.sources);
          replace(i, run.length, compact.map(move => ({ move, sources })));
          changed = true;
          break;
        }
        i = end - 1;
        continue;
      }
      const first = out[i], face = first.move[0];
      let end = i + 1;
      while (end < out.length) {
        if (isRotation(out[end].move)) {
          let stop = end + 1;
          while (stop < out.length && isRotation(out[stop].move)) stop++;
          const rotations = out.slice(end, stop).map(t => t.move);
          // Test the complete frame, not just the rotation token's axis.
          if (model.conjugate([first.move], invert(rotations))[0] !== first.move) break;
          end = stop;
        } else if (out[end].move[0] === opposite[face]) end++;
        else break;
      }
      if (end < out.length && out[end].move[0] === face) {
        const combined = token(face, amount(first.move) + amount(out[end].move));
        const sources = [...first.sources, ...out[end].sources];
        replace(i, end - i + 1, [
          ...(combined ? [{ move: combined, sources }] : []), ...out.slice(i + 1, end),
        ]);
        changed = true;
        break;
      }
    }
    if (!changed) return { items: out, marked };
  }
}

/** Local notation only: never conjugate layer turns or discard the final frame. */
export function compactNotation(model: CubeModel, tokens: string[]): string[] {
  return normalizeStage(model, tokens).items.map(t => t.move);
}

/**
 * Reduce only the stage join. Each cross-stage layer-turn merge (including
 * an inverse pair) costs one overlap; rotations cost none. `saved` is HTM
 * layer turns removed, not overlap or the number of removed rotation tokens.
 */
export function cancelBoundary(model: CubeModel, left: string[], right: string[], maxOverlap: number = 1): {
  execution: string[]; leftMarked: boolean[]; rightMarked: boolean[]; overlap: number; saved: number;
} {
  type Tagged = { move: string; sources: number[] };
  const original = [...left, ...right];
  const marked = original.map(() => false);
  const out: Tagged[] = original.map((move, index) => ({ move, sources: [index] }));
  let overlap = 0;
  const crosses = (a: Tagged[], b: Tagged[]) => {
    const first = a.flatMap(t => t.sources), second = b.flatMap(t => t.sources);
    return (first.some(i => i < left.length) && second.some(i => i >= left.length)) ||
      (second.some(i => i < left.length) && first.some(i => i >= left.length));
  };
  const tagRotations = (items: Tagged[]): Tagged[] => {
    const sources = items.flatMap(t => t.sources);
    return compactRotations(model, items.map(t => t.move)).map(move => ({ move, sources }));
  };
  const replace = (start: number, count: number, replacement: Tagged[], participants: Tagged[]) => {
    const before = out.slice(start, start + count).map(t => t.move);
    if (!model.equal(model.applySequence(SOLVED, before), model.applySequence(SOLVED, replacement.map(t => t.move)))) {
      throw new Error("Boundary reduction changed the exact transformation");
    }
    for (const item of participants) for (const index of item.sources) marked[index] = true;
    out.splice(start, count, ...replacement);
  };
  if (maxOverlap > 0) for (;;) {
    let changed = false;
    for (let i = 0; i < out.length; i++) {
      if (isRotation(out[i].move)) {
        let end = i + 1;
        while (end < out.length && isRotation(out[end].move)) end++;
        const run = out.slice(i, end);
        if (crosses(run, run)) {
          const compact = tagRotations(run);
          if (compact.length < run.length) {
            replace(i, run.length, compact, run);
            changed = true;
            break;
          }
        }
        // A boundary rotation can cross one neighboring turn only when it
        // meets another rotation and actually shortens the notation.
        if (end < out.length && end + 1 < out.length && isRotation(out[end + 1].move)) {
          let stop = end + 2;
          while (stop < out.length && isRotation(out[stop].move)) stop++;
          const after = out.slice(end + 1, stop);
          if (crosses(run, after)) {
            const rotations = tagRotations([...run, ...after]);
            if (rotations.length < run.length + after.length) {
              const mapped = model.conjugate([out[end].move], invert(after.map(t => t.move)))[0];
              const participants = [...run, ...after, ...(mapped !== out[end].move ? [out[end]] : [])];
              replace(i, stop - i, [...rotations, { ...out[end], move: mapped }], participants);
              changed = true;
              break;
            }
          }
        }
        continue;
      }
      if (overlap >= maxOverlap) continue;
      let end = i + 1;
      while (end < out.length && isRotation(out[end].move)) end++;
      if (end === out.length || !crosses([out[i]], [out[end]])) continue;
      const gap = out.slice(i + 1, end);
      const mapped = model.conjugate([out[i].move], invert(gap.map(t => t.move)))[0];
      if (mapped[0] !== out[end].move[0]) continue;
      const combined = token(mapped[0], amount(mapped) + amount(out[end].move));
      const sources = [...out[i].sources, ...out[end].sources];
      const replacement = [...tagRotations(gap), ...(combined ? [{ move: combined, sources }] : [])];
      replace(i, end - i + 1, replacement, out.slice(i, end + 1));
      overlap++;
      changed = true;
      break;
    }
    if (!changed) break;
  }
  const execution = out.map(t => t.move);
  return {
    execution, leftMarked: marked.slice(0, left.length), rightMarked: marked.slice(left.length), overlap,
    saved: original.filter(t => !isRotation(t)).length - execution.filter(t => !isRotation(t)).length,
  };
}

/** Normalize each stage independently, then spend overlap only at the join. */
export function cancelStages(model: CubeModel, left: string[], right: string[], maxOverlap: number = 1): ReturnType<typeof cancelBoundary> {
  const l = normalizeStage(model, left), r = normalizeStage(model, right);
  const result = cancelBoundary(model, l.items.map(t => t.move), r.items.map(t => t.move), maxOverlap);
  for (const [stage, flags] of [[l, result.leftMarked], [r, result.rightMarked]] as const) {
    for (let i = 0; i < flags.length; i++) if (flags[i]) {
      for (const index of stage.items[i].sources) stage.marked[index] = true;
    }
  }
  return {
    ...result, leftMarked: l.marked, rightMarked: r.marked,
    saved: [...left, ...right].filter(t => !isRotation(t)).length - result.execution.filter(t => !isRotation(t)).length,
  };
}

/** Move only leading whole-cube rotations into inspection, preserving the rest. */
export function splitInspection(model: CubeModel, orientation: readonly string[], execution: readonly string[]) {
  let i = 0;
  while (i < execution.length && isRotation(execution[i])) i++;
  const state = model.applySequence(SOLVED, [...orientation, ...execution.slice(0, i)]);
  const rotation = model.rotations.find(r => model.equal(r.state, state));
  return { orientation: rotation?.tokens ?? [...orientation, ...execution.slice(0, i)], execution: execution.slice(i) };
}
