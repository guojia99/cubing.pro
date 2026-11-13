/**
 * Independent implementation by Cubing Pro contributors, from action rules.
 * No upstream parser, sticker engine or algorithm collection is copied.
 * ALLG-ImageGen / mihlefeld, pinned dbd5a7fd8f3bee827d25056aa93c457bdf91f453:
 * cubevis/scripts/images.py: clean_alg_fto (relative grips and CIF/EIF switch),
 * clean_alg (visual brackets); cubevis/cube.py: FTORotations and FTO actions.
 * https://github.com/mihlefeld/ALLG-ImageGen/tree/dbd5a7fd8f3bee827d25056aa93c457bdf91f453/cubevis
 * RuiminYan, pinned 68c0592cd3ce582b161b4c6bf5ad2eeb30449a81:
 * core/packages/shared/src/fto_notation.ts: LowCubes EIF slice/H/S actions.
 * Original source URL is retained in vendor/puzzle-drawing/SOURCES.md.
 *
 * Action proof: all 72 oriented stickers admit an equivariant bijection to
 * cubing 0.63.3 FTO KPuzzle under all eight CIF (and eight EIF) face generators.
 * Under that bijection, wide = face + 2face, xr/xl/y/z/t = Rv/Lv/Uv/Fv/T.
 * CIF H = R B' R' B, S = R' L R L'; EIF H/S use independently proved actions.
 * Upper/lowercase are significant: Bl = BL, but bl is a wide move in ALLG.
 */

const CIF: Readonly<Record<string, string>> = {
  U: "W", D: "Y", R: "R", L: "P", F: "G", B: "B", BL: "O", BR: "Z",
};
const EIF: Readonly<Record<string, string>> = {
  U: "W", D: "Y", R: "G", L: "O", F: "P", B: "Z", BL: "B", BR: "R",
};
const COLOR_FACE = Object.fromEntries(Object.entries(CIF).map(([face, color]) => [color, face]));
const ROTATIONS: Readonly<Record<string, { native: string; cycles: readonly string[] }>> = {
  xr: { native: "Rv", cycles: ["WZG", "PBY"] },
  xl: { native: "Lv", cycles: ["WGO", "BRY"] },
  y: { native: "Uv", cycles: ["RPB", "GOZ"] },
  z: { native: "Fv", cycles: ["WZO", "RYP"] },
  t: { native: "T", cycles: ["PWRG", "OBZY"] },
};
const TOP: Readonly<Record<string, string>> = {
  W: "", Y: "t xl", R: "t'", P: "t", G: "xr", B: "xr' t", O: "xl", Z: "xr'",
};
const MACROS: Readonly<Record<string, string>> = {
  H: "R B' R' B", Z: "R B' R' B", S: "R' L R L'",
};
const EIF_MACROS: Readonly<Record<string, string>> = {
  H: "F U' F' U", S: "Fv F' U F U' Fv'",
};

/** Input is typography-cleaned by libraryNotation; the entire string is consumed. */
export function normalizeFtoNotation(text: string, setup = false): string {
  const output: string[] = [];
  const groups: string[] = [];
  let cif = true;
  let offset = 0;
  const fail = (reason: string): never => {
    throw new Error(`Unsupported fto library ${setup ? "setup" : "notation"} at ${offset}: ${reason}`);
  };
  const emit = (moves: string, count = 1) => {
    const tokens = moves.split(" ").filter(Boolean);
    if (output.length + tokens.length * Math.abs(count) > 4000) fail("exceeds 4000 moves");
    const sequence = count < 0
      ? tokens.reverse().map(token => token.endsWith("'") ? token.slice(0, -1) : `${token}'`)
      : tokens;
    for (let i = 0; i < Math.abs(count); i++) output.push(...sequence);
  };
  const rotateColors = (state: Record<string, string>, sequence: string) => {
    for (const token of sequence.split(" ").filter(Boolean)) {
      const inverse = token.endsWith("'");
      const rotation = ROTATIONS[inverse ? token.slice(0, -1) : token];
      for (const cycle of rotation.cycles) {
        const before = { ...state };
        for (let i = 0; i < cycle.length; i++) {
          state[cycle[(i + (inverse ? cycle.length - 1 : 1)) % cycle.length]] = before[cycle[i]];
        }
      }
    }
  };

  while (offset < text.length) {
    if (/\s/.test(text[offset])) { offset++; continue; }
    const rest = text.slice(offset);
    if (rest[0] === "{") {
      if (setup) fail("CIF/EIF regrips are not standard API setups");
      const grip = /^\{\s*(U|D|F|B|R|L|BL|BR|Bl|Br)\s*,\s*(U|D|F|B|R|L|BL|BR|Bl|Br)\s*\}/.exec(rest);
      if (!grip) return fail("malformed {top,front}");
      const top = grip[1].toUpperCase(), front = grip[2].toUpperCase();
      const names = cif ? CIF : EIF;
      const topColor = names[top], frontColor = names[front];
      const orbit: string[] = cif ? ["R", "L", "B", "D"] : ["R", "L", "B", "U"];
      const sameOrbit: boolean = orbit.includes(top) === orbit.includes(front);
      const nextCif: boolean = (cif ? !sameOrbit : sameOrbit) ? !cif : cif;
      const state = Object.fromEntries(Object.keys(COLOR_FACE).map(color => [color, color]));
      let sequence = TOP[topColor];
      rotateColors(state, sequence);
      const checkingColor = nextCif ? "G" : "P";
      let turns = 0;
      while (state[checkingColor] !== frontColor && turns < 2) {
        rotateColors(state, "y");
        turns++;
      }
      if (state.W !== topColor || state[checkingColor] !== frontColor) fail(`impossible grip ${grip[0]}`);
      if (turns) sequence += `${sequence ? " " : ""}${turns === 1 ? "y" : "y'"}`;
      for (const token of sequence.split(" ").filter(Boolean)) {
        const inverse = token.endsWith("'");
        emit(ROTATIONS[inverse ? token.slice(0, -1) : token].native, inverse ? -1 : 1);
      }
      cif = nextCif;
      offset += grip[0].length;
      continue;
    }
    if (rest[0] === "(" || rest[0] === "[") {
      groups.push(rest[0]);
      offset++;
      continue;
    }
    if (rest[0] === ")" || rest[0] === "]") {
      if (groups.pop() !== (rest[0] === ")" ? "(" : "[")) fail(`unmatched ${rest[0]}`);
      offset++;
      continue;
    }
    // ALLG only establishes visual [U]/[U'] grouping. It does not define M,
    // comma commutators or colon conjugates; never strip those into an action.
    const move = /^([A-Za-z]+)('*)(\d+)?('*)(?=$|[\s()[\]{}])/.exec(rest);
    if (!move) return fail(rest.split(/\s/)[0]);
    let family = move[1];
    const amount = move[3] === undefined ? 1 : Number(move[3]);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 4000) fail(move[0]);
    const count = (move[2].length + move[4].length) % 2 ? -amount : amount;
    const macros = cif ? MACROS : EIF_MACROS;
    const macro = !setup && Object.hasOwn(macros, family) ? macros[family] : undefined;
    if (macro) {
      emit(macro, count);
    } else if (!setup && cif && Object.hasOwn(ROTATIONS, family)) {
      emit(ROTATIONS[family].native, count);
    } else {
      let wide = false;
      let slice = false;
      if (/^(?:u|d|f|b|r|l|bl|br)$/.test(family)) {
        wide = true;
        family = family.toUpperCase();
      } else {
        if (family.endsWith("w")) { wide = true; family = family.slice(0, -1); }
        else if (family.endsWith("s")) { slice = true; family = family.slice(0, -1); }
        if (family === "Bl" || family === "Br") family = family.toUpperCase();
      }
      const names = cif ? CIF : EIF;
      if (!Object.hasOwn(names, family) || (setup && (wide || slice))) fail(move[0]);
      if (slice && !["U", "F", "R", "L"].includes(family)) fail(move[0]);
      const face = COLOR_FACE[names[family]];
      emit(slice ? `2${face}` : wide ? `${face} 2${face}` : face, count);
    }
    offset += move[0].length;
  }
  if (groups.length) fail(`unmatched ${groups.at(-1)}`);
  return output.join(" ");
}
