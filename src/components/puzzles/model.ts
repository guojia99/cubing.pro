import { Alg, Commutator, Conjugate, Grouping, Move } from "cubing/alg";
import type { KPattern } from "cubing/kpuzzle";
import { cube2x2x2, puzzles } from "cubing/puzzles";
import type { PuzzleID } from "cubing/twisty";
import { normalizeLibraryNotation, normalizeLibrarySetup } from "./libraryNotation";
import { normalizeSquare1Notation, splitSquare1Annotation } from "./square1Notation";
import { usesTwoByTwo3D } from "@/views/Algs/utils/twoByTwoCategories";

const NATIVE_SETUP_PREFIX = "// cubing-pro:native\n";

function serializeSetup(alg: Alg, puzzle: PuzzleID): string {
  const text = alg.toString();
  return puzzle === "fto" && text.trim() ? NATIVE_SETUP_PREFIX + text : text;
}

export function resolvePuzzle(cube: string, classId = ""): PuzzleID | null {
  const id = cube.toLowerCase().replace(/[\s_-]/g, "");
  const cubes: Record<string, PuzzleID> = {
    "222": "2x2x2", "2x2": "2x2x2", "2x2x2": "2x2x2",
    "333": "3x3x3", "3x3": "3x3x3", "3x3x3": "3x3x3",
    "333oh": "3x3x3", "3x3oh": "3x3x3", "3x3x3oh": "3x3x3",
    "444": "4x4x4", "4x4": "4x4x4", "4x4x4": "4x4x4",
    "555": "5x5x5", "5x5": "5x5x5", "5x5x5": "5x5x5",
    "666": "6x6x6", "6x6": "6x6x6", "6x6x6": "6x6x6",
    "777": "7x7x7", "7x7": "7x7x7", "7x7x7": "7x7x7",
    minx: "megaminx", megaminx: "megaminx", skewb: "skewb",
    sq1: "square1", square1: "square1", pyram: "pyraminx", pyraminx: "pyraminx", fto: "fto",
  };
  if (cubes[id]) return cubes[id];
  if (id === "special") {
    if (/pyraminx|金字塔/i.test(classId)) return "pyraminx";
    if (/fto/i.test(classId)) return "fto";
  }
  // These are library categories, not puzzle IDs. Never infer order from moves.
  if (id === "bigcube") {
    const category = classId.trim();
    const order = /^([4-7])\s*[x×]\s*\1(?:\s*[x×]\s*\1)?\s+(?:OLLP|PLLP|L2E|L2C|LCE)$/i.exec(category);
    if (order) return `${order[1]}x${order[1]}x${order[1]}` as PuzzleID;
    // The backend's 5x5-LCE-Trainer is published without an order prefix.
    if (/^LCE$/i.test(category)) return "5x5x5";
    if (/^PLLP$/i.test(classId.trim())) return "4x4x4";
    if (/^L2E$/i.test(classId.trim())) return "5x5x5";
  }
  return null;
}

export function isCubePuzzle(puzzle: PuzzleID): boolean {
  return /^[2-7]x[2-7]x[2-7]$/.test(puzzle);
}

export function puzzleLoader(puzzle: PuzzleID) {
  return puzzle === "2x2x2" ? cube2x2x2 : puzzles[puzzle];
}

/** Normalize known library notation only; malformed text must not be discarded. */
export function parsePuzzleAlg(source: string, puzzle: PuzzleID, domain: "formula" | "setup" = "formula"): Alg {
  if (source.length > 24000) throw new Error("Formula is too long");
  // Persist the domain in the scramble string itself, including history records.
  // Unmarked backend setups and raw Skewb formulas retain their own notation.
  const native = domain === "setup" && puzzle === "fto" && /^\s*\/\/ cubing-pro:native\r?\n/.exec(source);
  let text = native ? source.slice(native[0].length)
    : domain === "setup" ? normalizeLibrarySetup(source, puzzle) : normalizeLibraryNotation(source, puzzle);
  if (puzzle === "square1") text = normalizeSquare1Notation(text);
  if (text.length > 24000) throw new Error("Formula is too long");
  if (puzzle === "square1") {
    // Existing CS records omit parentheses: /3,0/-1,1.
    text = text.replace(/\(\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*\)|([+-]?\d+)\s*,\s*([+-]?\d+)/g,
      (_match, a, b, c, d) => ` (${a ?? c}, ${b ?? d}) `).replace(/\//g, " / ");
  }
  // U2' is common in the imported library. It is a valid inverse half-turn.
  const alg = new Alg(text);
  // Inspect the compact AST before any expansion: leafMoves skips pauses and
  // comments, and even repeated empty groups can otherwise monopolize a thread.
  const budget = (sequence: Alg, depth: number): number => {
    if (depth > 32) throw new Error("Formula exceeds 32 nesting levels");
    let count = 0;
    for (const node of sequence.childAlgNodes()) {
      let cost = 1;
      if (node instanceof Grouping) {
        if (!Number.isSafeInteger(node.amount)) throw new Error("Formula repetition must be a safe integer");
        cost = Math.max(1, budget(node.alg, depth + 1)) * Math.abs(node.amount);
      } else if (node instanceof Commutator || node instanceof Conjugate) {
        const a = Math.max(1, budget(node.A, depth + 1));
        const b = Math.max(1, budget(node.B, depth + 1));
        cost = 2 * a + (node instanceof Commutator ? 2 : 1) * b;
      } else if (node instanceof Move) {
        if (!Number.isSafeInteger(node.amount)) throw new Error("Formula move amount must be a safe integer");
        if (puzzle === "square1" && !["U_SQ_", "D_SQ_", "_SLASH_"].includes(node.quantum.family)) {
          throw new Error(`Unsupported Square-1 move: ${node}`);
        }
      }
      count += cost;
      if (!Number.isSafeInteger(count) || count > 4000) throw new Error("Formula expansion exceeds 4000 leaves");
    }
    return count;
  };
  budget(alg, 0);
  return alg;
}

/** Reject slices through a joined corner; KPuzzle alone permits nonphysical cuts. */
export function applyPuzzleAlg(pattern: KPattern, alg: Alg, puzzle: PuzzleID): KPattern {
  for (const move of alg.experimentalLeafMoves()) {
    if (puzzle === "square1" && move.quantum.family === "_SLASH_" && Math.abs(move.amount) % 2 === 1) {
      const slots: number[] = [];
      pattern.patternData.WEDGES.pieces.forEach((piece, slot) => { slots[piece] = slot; });
      for (const first of [0, 3, 6, 9, 13, 16, 19, 22]) {
        const next = Math.floor(first / 12) * 12 + (first + 1) % 12;
        const cut = (slot: number) => slot >= 6 && slot < 18;
        if (cut(slots[first]) !== cut(slots[next])) throw new Error("Illegal Square-1 slice");
      }
    }
    pattern = pattern.applyMove(move);
  }
  return pattern;
}

export async function preparePuzzle(puzzle: PuzzleID, formula: string, scramble: string, source: "formula" | "scramble", identity = false) {
  const kpuzzle = await puzzleLoader(puzzle).kpuzzle();
  if (!identity && !formula.trim() && !scramble.trim()) throw new Error("No formula or setup available");
  const fromSetup = () => {
    const setup = parsePuzzleAlg(scramble, puzzle, "setup");
    return { setup, pattern: applyPuzzleAlg(kpuzzle.defaultPattern(), setup, puzzle) };
  };
  let solution = new Alg();
  let warning: string | undefined;
  let annotation: string | undefined;
  let state: ReturnType<typeof fromSetup>;
  try {
    solution = formula.trim() ? parsePuzzleAlg(formula, puzzle) : new Alg();
    if (puzzle === "square1") annotation = splitSquare1Annotation(formula).annotation || undefined;
    if ((source === "scramble" && (scramble.trim() || identity)) || !formula.trim()) state = fromSetup();
    else {
      const setup = solution.invert();
      state = { setup, pattern: applyPuzzleAlg(kpuzzle.defaultPattern(), setup, puzzle) };
    }
    // Playback must be legal from the exact displayed state, including SQ1 cuts.
    applyPuzzleAlg(state.pattern, solution, puzzle);
  } catch (error) {
    if (!scramble.trim()) throw error;
    state = fromSetup();
    solution = new Alg();
    warning = error instanceof Error ? error.message : String(error);
  }
  return { kpuzzle, pattern: state.pattern, setup: serializeSetup(state.setup, puzzle), alg: solution.toString(), warning, annotation };
}

export async function inversePuzzleAlg(formula: string, puzzle: PuzzleID): Promise<string> {
  const alg = parsePuzzleAlg(formula, puzzle);
  const kpuzzle = await puzzleLoader(puzzle).kpuzzle();
  applyPuzzleAlg(kpuzzle.defaultPattern(), alg.invert(), puzzle);
  return serializeSetup(alg.invert(), puzzle);
}

export function resolveStickering(classId: string, setName: string, groupName: string): string | undefined {
  const text = `${classId} ${setName} ${groupName}`.toUpperCase();
  for (const [token, stickering] of [
    ["ZBLS", "ZBLS"], ["ZBLL", "ZBLL"], ["CMLL", "CMLL"], ["COLL", "COLL"],
    ["F2L", "F2L"], ["OLL", "OLL"], ["PLL", "PLL"], ["L3T", "experimental-fto-l3t"],
    ["CLL", "CLL"], ["PBL", "PBL"], ["OBL", "OBL"],
  ]) {
    if (new RegExp(`(?:^|[^A-Z0-9])${token}(?:$|[^A-Z0-9])`).test(text)) return stickering;
  }
  return undefined;
}

export function prefersLastLayer(puzzle: PuzzleID, classId: string, setName: string, groupName: string): boolean {
  if (puzzle === "2x2x2") return !isTwoLayerPBL(puzzle, classId, setName, groupName);
  return ["3x3x3", "4x4x4", "megaminx"].includes(puzzle) &&
    !/(?:^|[^A-Z0-9])(F2L|ZBLS|PBL|L2E)(?:$|[^A-Z0-9])/i.test(`${classId} ${setName} ${groupName}`);
}

export function isTwoLayerPBL(puzzle: PuzzleID, classId: string, setName: string, groupName: string): boolean {
  return puzzle === "2x2x2" && usesTwoByTwo3D(classId, setName, groupName);
}
