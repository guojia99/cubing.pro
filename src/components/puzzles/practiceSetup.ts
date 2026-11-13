const completed = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();
const CACHE_LIMIT = 256;

/** The persisted domain marker is metadata, not a move shown to a learner. */
export function displayPracticeScramble(scramble: string): string {
  return scramble.replace(/^\s*\/\/ cubing-pro:native\r?\n/, "");
}

export function hasPracticeScramble(scrambles: readonly string[] | undefined): boolean {
  return Boolean(scrambles?.some((scramble) => scramble.trim()));
}

/** Null entries already have backend setups and must never be parsed. */
export async function preparePracticeSetups(
  cube: string,
  classId: string,
  formulas: readonly (readonly string[] | null)[],
): Promise<string[][]> {
  if (!formulas.some((variants) => variants?.some((formula) => formula.trim()))) {
    return formulas.map(() => []);
  }
  const { resolvePuzzle, parsePuzzleAlg, inversePuzzleAlg } = await import("./model");
  const puzzle = resolvePuzzle(cube, classId);
  if (!puzzle) return formulas.map(() => []);

  return Promise.all(formulas.map(async (variants) => {
    const results = await Promise.all((variants ?? []).map((formula) => {
      if (!formula.trim()) return null;
      // Cache only setups, never library records or their mutable metadata.
      const key = JSON.stringify([cube, classId, puzzle, formula]);
      if (completed.has(key)) return completed.get(key)!;
      let result = pending.get(key);
      if (!result) {
        result = (async () => {
          // Comments/grouping alone parse successfully but are not a question.
          if (parsePuzzleAlg(formula, puzzle).experimentalLeafMoves().next().done) return null;
          const setup = await inversePuzzleAlg(formula, puzzle);
          return setup.trim() ? setup : null;
        })().then((setup) => {
          completed.set(key, setup);
          if (completed.size > CACHE_LIMIT) completed.delete(completed.keys().next().value!);
          return setup;
        }).catch(() => {
          // Retry transient module/puzzle loading failures on a later request.
          return null;
        }).finally(() => pending.delete(key));
        pending.set(key, result);
      }
      return result;
    }));
    return [...new Set(results.filter((setup): setup is string => setup !== null))];
  }));
}
