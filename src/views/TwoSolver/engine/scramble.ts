import { type CubeModel, SOLVED, amount, isRotation, parseMoves, token } from "./state";

/** Rewrite the supplied state using RUF, up to a final physical cube rotation. */
export function toRufScramble(model: CubeModel, scramble: string): string {
  const input = parseMoves(scramble);
  const out: string[] = [];
  let frame: string[] = [];
  const opposite: Record<string, [string, string]> = {
    D: ["U", "y"], L: ["R", "x"], B: ["F", "z"],
  };
  // Our algebraic rewrite maintains original prefix = out * frame. No state
  // sampling, color relabeling, or solving is involved in this conversion.
  for (const move of input) {
    if (isRotation(move)) {
      frame.push(move);
      continue;
    }
    const mapped = model.conjugate([move], frame)[0];
    const replacement = opposite[mapped[0]];
    let next = mapped;
    if (replacement) {
      const [face, axis] = replacement;
      next = token(face, amount(mapped));
      // On a 2x2, D = U y', L = R x', B = F z'. The residual
      // rotation belongs on the left of the existing pending frame.
      frame = [token(axis, -amount(mapped)), ...frame];
    }
    if (out.at(-1)?.[0] === next[0]) {
      const combined = token(next[0], amount(out.pop()!) + amount(next));
      if (combined) out.push(combined);
    } else out.push(next);
  }
  if (!model.equal(
    model.applySequence(SOLVED, input),
    model.applySequence(SOLVED, [...out, ...frame]),
  )) throw new Error("RUF scramble conversion changed the physical state");
  return out.join(" ");
}
