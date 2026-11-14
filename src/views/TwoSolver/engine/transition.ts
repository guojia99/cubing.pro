import { compactNotation } from "./cancellation";
import { type CubeModel, isRotation } from "./state";

/** Initial inspection is separate. A finish's opening U turns are AUF, so a
 * rotation after those turns is still a transition rotation, not an alg body.
 * Do not rewrite it away by moving it into inspection or changing the base.
 */
export function rotationFreeTransition(model: CubeModel, algorithm: readonly string[]): string[] | null {
  const compact = compactNotation(model, [...algorithm]);
  for (const move of compact) {
    if (isRotation(move)) return null;
    if (move[0] !== "U") break;
  }
  return compact;
}
