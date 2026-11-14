import type { Solution } from "./engine/types";

/** Match the retained source, never the rotated/cancelled execution formula. */
export function formulaLibraryLink(solution: Solution): string | null {
  const source = solution.source;
  if (!source || !source.set || !source.group || !source.name || !source.rawAlg) return null;
  const query = new URLSearchParams({ set: source.set, group: source.group, case: source.name, alg: source.rawAlg });
  return `/algs/222/${encodeURIComponent(solution.sourceApi)}/?${query.toString()}`;
}
