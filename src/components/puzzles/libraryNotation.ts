/**
 * Independently implemented notation adapter; no cuberoot.me code is copied.
 * Notation sources (rules, not a license grant):
 * https://raw.githubusercontent.com/mihlefeld/ALLG-ImageGen/dbd5a7fd8f3bee827d25056aa93c457bdf91f453/cubevis/cube.py
 * https://raw.githubusercontent.com/mihlefeld/ALLG-ImageGen/dbd5a7fd8f3bee827d25056aa93c457bdf91f453/cubevis/scripts/images.py
 * https://raw.githubusercontent.com/mihlefeld/ALLG-ImageGen/dbd5a7fd8f3bee827d25056aa93c457bdf91f453/cubevis/scripts/jsons.py
 * Pinned ALLG solver submodule: single BL/BR versus distinct wide bl/br:
 * https://raw.githubusercontent.com/trangium/trangium.github.io/210a5d8997a8979ee3da92ab8a141e8ebc56041d/BatchSolver2/src/presets.js
 * Corner-name reference only (its Sarah macros differ from this library):
 * https://raw.githubusercontent.com/RuiminYan/cuberoot.me/main/core/packages/shared/src/skewb_notation.ts
 * EIF spelling reference only, NOT a CIF/EIF conversion implementation:
 * https://raw.githubusercontent.com/RuiminYan/cuberoot.me/main/core/packages/shared/src/fto_notation.ts
 *
 * ALLG cube.py permutations verify the macros below, including Pyraminx H/S.
 * FTO action rules, attribution and CIF/EIF proofs are in ftoNotation.ts.
 * Bl/Br denote the single BL/BR faces, never BLw/BRw.
 */

import { normalizeFtoNotation } from "./ftoNotation";
import { MOVE_RE, stripGripMarks } from "@cuberoot/shared/alg-notation";

const SKEWB_CORNERS: Readonly<Record<string, string>> = {
  F: "F", L: "UL", R: "UR", B: "U",
  r: "R", l: "L", b: "B", f: "D", d: "D",
};

// Expand in ALLG's original corner domain BEFORE applying SKEWB_CORNERS.
const SKEWB_MACROS: Readonly<Record<string, string>> = {
  S: "R' F R F'", H: "F R' F' R",
  s: "r' R r R'", h: "R r' R' r",
};
const PYRAMINX_MACROS: Readonly<Record<string, string>> = {
  S: "R' L R L'", H: "L R' L' R",
};

function cleanText(text: string): string {
  if (text.length > 24000) throw new Error("Library notation exceeds 24000 characters");
  return text.trim().replace(/[\u2018\u2019\u2032]/g, "'").replace(/\u00a0/g, " ");
}

function puzzleKey(puzzle: string): string {
  const key = puzzle.toLowerCase().replace(/[\s_-]/g, "");
  return key === "pyram" ? "pyraminx" : key;
}

/** Separate cube tokens without flattening the AST or discarding unknown text. */
function normalizeCubeNotation(source: string): string {
  const text = source.replace(/\/\/[^\n]*|[↑↓·]/g, token => token.startsWith("//") ? token : stripGripMarks(token));
  const output: string[] = [];
  let needsSpace = false;
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    if (/^\s/.test(rest)) {
      output.push(text[i++]);
      needsSpace = false;
      continue;
    }
    if (rest.startsWith("//")) {
      const end = text.indexOf("\n", i);
      if (needsSpace) output.push(" ");
      // Comments are opaque: their letters and grouping marks are not moves.
      output.push(text.slice(i, end < 0 ? text.length : end));
      i = end < 0 ? text.length : end;
      needsSpace = false;
      continue;
    }
    const move = MOVE_RE.exec(rest);
    if (move) {
      let raw = move[0];
      let token = raw;
      // cubing 0.63 accepts R2', but not the library's equivalent R'2.
      if (!move[4] && move[5]) {
        const amount = /^\d+/.exec(rest.slice(raw.length));
        if (amount) {
          token = raw.slice(0, -1) + amount[0] + "'";
          raw += amount[0];
        }
      }
      if (needsSpace) output.push(" ");
      output.push(token);
      i += raw.length;
      needsSpace = true;
      continue;
    }
    const close = /^[)\]]\d*'?/.exec(rest);
    if (close) {
      // A closing delimiter and its repeat/inverse suffix form one token.
      output.push(close[0]);
      i += close[0].length;
      needsSpace = true;
      continue;
    }
    if ("([.".includes(text[i])) {
      if (needsSpace) output.push(" ");
      output.push(text[i]);
      needsSpace = text[i++] === ".";
      continue;
    }
    if (",:".includes(text[i])) {
      output.push(text[i++]);
      needsSpace = false;
      continue;
    }
    // Preserve the original parser/engine error, including its offending text.
    // Never extract valid move letters from an unknown word or annotation.
    return text;
  }
  return output.join("");
}

function translate(text: string, puzzle: string, setup: boolean): string {
  const output: string[] = [];
  let depth = 0;
  const fail = (token: string): never => {
    throw new Error(`Unsupported ${puzzle} library ${setup ? "setup" : "notation"}: ${token}`);
  };
  const append = (move: string) => {
    if (output.length >= 4000) throw new Error("Library notation exceeds 4000 moves");
    output.push(move);
  };

  // ALLG treats parentheses as visual grouping, without group exponents.
  // Brackets, alternatives, dots and comments are not silently discarded.
  for (const token of text.match(/\(|\)|[^\s()]+/g) ?? []) {
    if (token === "(") {
      depth++;
      continue;
    }
    if (token === ")") {
      if (--depth < 0) fail("unmatched )");
      continue;
    }
    const match = /^([A-Za-z]+)('*)(\d+)?('*)$/.exec(token);
    if (!match) return fail(token);
    const [, family, before, digits, after] = match;
    const count = digits === undefined ? 1 : Number(digits);
    if (!Number.isSafeInteger(count) || count < 1 || count > 4000) fail(token);
    // cube.py: every prime negates the amount; 2' is NOT a half-turn.
    const inverse = (before.length + after.length) % 2 === 1;
    const suffix = `${count === 1 ? "" : count}${inverse ? "'" : ""}`;

    const macros = setup ? undefined
      : puzzle === "skewb" ? SKEWB_MACROS
      : puzzle === "pyraminx" ? PYRAMINX_MACROS : undefined;
    const macro = macros && Object.prototype.hasOwnProperty.call(macros, family) ? macros[family] : undefined;
    if (macro) {
      let moves = macro.split(" ");
      if (inverse) moves = moves.reverse().map(move => move.endsWith("'") ? move.slice(0, -1) : `${move}'`);
      for (let i = 0; i < count; i++) {
        for (const move of moves) {
          const corner = move.replace(/'$/, "");
          const mapped = puzzle === "skewb" ? SKEWB_CORNERS[corner] : corner;
          append(mapped + (move.endsWith("'") ? "'" : ""));
        }
      }
      continue;
    }

    let mapped: string | undefined;
    if (puzzle === "skewb") {
      if (setup) {
        if (/^(?:UL|UR|[URBLFDxyz])$/.test(family)) mapped = family;
      } else if (Object.prototype.hasOwnProperty.call(SKEWB_CORNERS, family)) {
        mapped = SKEWB_CORNERS[family];
      } else if (/^[xyz]$/.test(family)) mapped = family;
    } else if (/^[URBLurbl]$/.test(family)) {
      mapped = family;
    }
    if (!mapped) return fail(token);
    append(mapped + suffix);
  }
  if (depth !== 0) fail("unmatched (");
  return output.join(" ");
}

/**
 * Convert raw ALLG formulas, not standard scrambles or already converted text.
 * Throws on unproved notation for Skewb, Pyraminx and FTO. Other puzzles pass
 * through after typography cleanup and still require the caller's parser.
 * Success establishes notation support, not that an algorithm solves a case.
 */
export function normalizeLibraryNotation(text: string, puzzle: string): string {
  const source = cleanText(text);
  const key = puzzleKey(puzzle);
  if (key === "fto") return normalizeFtoNotation(source);
  return ["skewb", "pyraminx", "fto"].includes(key) ? translate(source, key, false)
    : /^([2-7])x\1x\1$/.test(key) ? normalizeCubeNotation(source) : source;
}

/**
 * Normalize standard API setups independently of the raw formula domain.
 * In particular, Skewb U/R/L/B already use standard grips (ALLG jsons.py).
 * Only typography, visual groups and FTO Bl/Br spelling are normalized;
 * no macros, CIF/EIF grips, annotations or speculative repairs are accepted.
 * Callers may catch a formula error and display this setup without playback.
 */
export function normalizeLibrarySetup(text: string, puzzle: string): string {
  const source = cleanText(text);
  const key = puzzleKey(puzzle);
  if (key === "fto") return normalizeFtoNotation(source, true);
  return ["skewb", "pyraminx", "fto"].includes(key) ? translate(source, key, true)
    : /^([2-7])x\1x\1$/.test(key) ? normalizeCubeNotation(source) : source;
}
