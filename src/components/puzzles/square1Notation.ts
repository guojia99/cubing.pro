/**
 * Independently implemented parser; notation facts checked against ALLG-ImageGen:
 * https://raw.githubusercontent.com/mihlefeld/ALLG-ImageGen/dbd5a7fd8f3bee827d25056aa93c457bdf91f453/cubevis/scripts/diverse/sq1/karnotation.py
 * See move_map, ud_combinations and end_of_string_map. No Python code is used.
 * Longest aliases win. Compact digits are two signed coordinates in [-6, 6],
 * not a decimal turn: 10 means (1,0), with an implicit slash except at EOF.
 */
type Token = { text: string; automatic?: boolean; finalNumeric?: boolean };

const aliases = new Map<string, string>();

// Single-turn facts, including the source's whitespace-suffixed u/d aliases.
for (const [name, top, bottom] of [
  ["U", 3, 0], ["D", 0, 3], ["u", 2, -1], ["d", -1, 2],
  ["E", 3, -3], ["e", 3, 3], ["F", 4, 1], ["f", 1, 4],
  ["M", 1, 1], ["m", 2, 2], ["u2", 5, -1], ["d2", -1, 5],
  ["T", 2, -4], ["t", 4, -2], ["K", 5, 2], ["k", 2, 5],
] as const) {
  aliases.set(name, `${top},${bottom}/`);
  aliases.set(`${name}'`, `${-top},${-bottom}/`);
}

// These are alternating turns, not generic powers of their first letter.
for (const [name, top, bottom, count] of [
  ["W", 3, 0, 2], ["B", 0, 3, 2], ["w", 2, -1, 2], ["b", -1, 2, 2],
  ["F2", 4, 1, 2], ["f2", 1, 4, 2],
  ["U3", 3, 0, 3], ["D3", 0, 3, 3], ["u3", 2, -1, 3], ["d3", -1, 2, 3],
  ["U4", 3, 0, 4], ["u4", 2, -1, 4], ["d4", -1, 2, 4],
  ["F3", 4, 1, 3], ["f3", 1, 4, 3],
] as const) {
  for (const inverse of [false, true]) {
    const turns = Array.from({ length: count }, (_, i) => {
      const sign = (i % 2 ? -1 : 1) * (inverse ? -1 : 1);
      return `${sign * top},${sign * bottom}`;
    });
    // The source's unprimed u4 has no final slash. Its last d3 entry wins.
    aliases.set(name + (inverse ? "'" : ""), turns.join("/") + (name === "u4" && !inverse ? "" : "/"));
  }
}

for (const [name, turns] of [
  ["U2", "6,0/"], ["U2'", "-6,0/"], ["D2", "0,6/"], ["D2'", "0,-6/"],
  ["\u0246", "3,0/0,-3/"], ["\u0246'", "-3,0/0,3/"],
  ["\u0247", "3,0/0,3/"], ["\u0247'", "-3,0/0,-3/"],
  ["UU", "3,0/3,0/"], ["UU'", "-3,0/-3,0/"], ["DD'", "0,-3/0,-3/"],
  ["NN nN", "/3,-3/-3,3/1,0/3,-3/-3,3/"],
  ["3Adj", "/3,0/-1,-1/-2,1/"], ["30Adj", "/3,0/-1,-1/-2,1/"],
  ["d' 3Adj", "1,-2/3,0/-1,-1/-2,1/"], ["u' 3Adj", "-2,1/3,0/-1,-1/-2,1/"],
  ["03Adj", "/0,3/-1,-1/1,-2/"], ["-3Adj", "/-3,0/1,1/2,-1/"],
  ["0-3Adj", "/0,-3/1,1/-1,2/"], ["-30Adj", "0,-1/-3,0/1,1/2,-1/"],
  ["M' -30Adj", "-1,-1/-3,0/1,1/2,-1/"], ["31 03Adj", "3,1/0,3/-1,-1/1,-2/"],
  ["U 03Adj", "3,0/0,3/-1,-1/1,-2/"], ["E' -30Adj", "-3,3/-3,0/1,1/2,-1/"],
  ["-32 -30Adj", "-3,2/-3,0/1,1/2,-1/"],
  ["RR", "/2,-1/-2,4/5,-1/-2,1/"], ["rr", "/-2,1/5,-1/-2,4/2,-1/"],
  ["pJ", "/-2,1/2,2/0,-3/"], ["fpJ", "/2,-1/-2,-2/0,3/"],
  ["AA", "/0,-3/2,2/0,-3/-2,4/"], ["aa", "/1,-2/2,2/1,-2/-4,2/"],
  ["TT", "/5,-1/-3,0/-2,-2/0,3/"], ["FF", "/-3,0/2,2/-3,0/1,1/3,-3/"],
  ["0-1 FF", "0,-1/0,3/-2,-2/0,3/-1,-1/3,-3/"],
  ["ObOpp", "1,0/-1,-1/3,0/1,1/3,0/-1,-1/0,1"],
  ["OaOpp", "1,0/-1,-1/-3,0/1,1/-3,0/-1,-1/0,1"],
  ["bjj OaOpp", "/-3,0/3,3/0,-3/0,1/-1,-1/-3,0/1,1/-3,0/-1,-1/0,1"],
] as const) aliases.set(name, turns);

// Case variants in this table are explicit aliases, not case folding.
for (const [names, turns] of [
  ["JJ jJ Jj jj", "/0,-3/3,3/-3,0/"],
  ["bJJ bjJ bJj bjj", "/-3,0/3,3/0,-3/"],
  ["JN jN Jn jn", "/0,-3/0,3/0,-3/0,3/"],
  ["NJ nJ Nj nj", "/3,0/-3,0/3,0/-3,0/"],
  ["NN nN Nn nn", "/3,-3/-3,3/"], ["-NN -Nn -nN -nn", "/-3,3/3,-3/"],
  ["JR jR", "/-3,-3/2,-1/-2,1/3,3/"], ["Jr jr", "/-3,-3/1,-2/-1,2/3,3/"],
  ["RJ Rj", "/3,3/1,-2/-1,2/-3,-3/"], ["rJ rj", "/3,3/2,-1/-2,1/-3,-3/"],
  ["bRJ bRj", "/-3,-3/-2,1/2,-1/3,3/"], ["brJ brj", "/-3,-3/-1,2/1,-2/3,3/"],
  ["bJJ+E2 bjJ+E2 bJj+E2 bjj+E2", "/-3,0/3,3/0,3/0,6/0,6"],
] as const) {
  for (const name of names.split(" ")) aliases.set(name, turns);
}

// The upstream U/D-combination pass precedes its individual alias pass.
for (const [up, top] of [["U", 3], ["U'", -3], ["U2", 6], ["U2'", 6]] as const) {
  for (const [down, bottom] of [["D", 3], ["D'", -3], ["D2", 6], ["D2'", 6]] as const) {
    aliases.set(up + down, `${top},${bottom}/`);
  }
}

const aliasMatchers = [...aliases].sort(([a], [b]) => b.length - a.length).map(([name, turns]) => ({
  pattern: new RegExp("^" + name.split(" ").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+")),
  turns,
}));
const MAX_INPUT = 24000;
const MAX_MOVES = 4000;
const MAX_DEPTH = 32;

// Pinned ALLG sources (same revision as above):
// karnotation.py's PBL importer converts only the body, fixes its final
// cubeshape adjustment, then prepends the Angle column to BOTH spellings.
// convert_obl_doc.py likewise preserves a prefix outside body conversion;
// that alone does NOT prove every OBL prefix is safe to ignore.
// images.py clean_alg explicitly removes uppercase SQ1 Angle prefixes before
// SquareOneColorizer.inverse constructs the diagram from the standard body.
// Thus these observed CPEP/PBL direction labels describe the source view, not
// additional moves. Playback uses the body's own standard grip and inverse.
// Keep this finite: do not infer arbitrary directions, OBL [x2]/[E2]/[U],
// commutators or inline bracket groups from the generator's broad regex.
const angleAnnotations = new Set([
  "", "B", "B B", "B BL", "B BR", "B F", "B FB", "B FL", "B FR", "B L", "B LR", "B R",
  "BL", "BL B", "BL BR", "BL F", "BL FB", "BL FL", "BL FR", "BL L", "BL R",
  "BR", "BR B", "BR BL", "BR F", "BR FL", "BR FR", "BR L", "BR LR", "BR R", "BR RL",
  "F", "F B", "F BL", "F BR", "F F", "F FB", "F FL", "F FR", "F L", "F LR", "F R",
  "FB", "FB B", "FB BL", "FB F", "FB FB", "FB FL", "FB FR", "FB L", "FB R",
  "FL", "FL B", "FL BL", "FL BR", "FL F", "FL FB", "FL FL", "FL FR", "FL L", "FL LR", "FL R",
  "FR", "FR B", "FR BL", "FR BR", "FR F", "FR FB", "FR FL", "FR FR", "FR L", "FR LR", "FR R", "FR RL",
  "L", "L B", "L BL", "L BR", "L F", "L FB", "L FL", "L FR", "L L", "L LR", "L R",
  "LR", "LR B", "LR BR", "LR F", "LR FL", "LR FR", "LR L", "LR LR", "LR R",
  "R", "R B", "R BL", "R BR", "R F", "R FB", "R FL", "R FR", "R L", "R LR", "R R", "RL RL",
]);

/**
 * Separate one verified leading CPEP/PBL Angle label for visible UI display.
 * `annotation` includes its original brackets/spacing (including `[]`);
 * `formula` retains the body verbatim except for whitespace before its start.
 * Without a prefix the input is returned unchanged. Unknown leading brackets
 * throw; no claim is made about physical legality or a backend setup pairing.
 * UI should label this as the source starting view and state that the diagram
 * and animation use the formula body's standard grip, not apply it as moves.
 */
export function splitSquare1Annotation(text: string): { annotation: string; formula: string } {
  if (text.length > MAX_INPUT) throw new Error(`Square-1 notation exceeds ${MAX_INPUT} characters`);
  const prefix = /^\s*(\[([^\[\]\r\n]*)\])[^\S\r\n]*/.exec(text);
  if (!prefix) return { annotation: "", formula: text };
  const angle = prefix[2].trim().replace(/[^\S\r\n]+/g, " ");
  if (!angleAnnotations.has(angle)) {
    throw new Error(`Square-1 notation: unverified Angle annotation ${JSON.stringify(prefix[1])}`);
  }
  return { annotation: prefix[1], formula: text.slice(prefix[0].length) };
}

/**
 * Preserve valid standard tuples/bare pairs and slashes verbatim; expand known
 * Karnaukh aliases to tuples. Parenthesized repetition is bounded and strict.
 * Skip only verified leading Angle metadata; use splitSquare1Annotation to
 * display it. Throws on unknown annotations/tokens, unsafe integers or size.
 * This is notation conversion only; the puzzle model must validate slice cuts.
 */
export function normalizeSquare1Notation(text: string): string {
  const { formula } = splitSquare1Annotation(text);
  const source = formula.replace(/[\u2019\u2018\u2032]/g, "'");
  const sourceOffset = text.length - formula.length;
  let position = 0;
  let changed = false;
  const fail = (message: string, at = position): never => {
    throw new Error(`Square-1 notation at character ${sourceOffset + at + 1}: ${message}`);
  };
  const checkSize = (tokens: Token[]) => {
    // Each tuple expands to two cubing.js leaf moves, even when one is zero.
    const moves = tokens.reduce((sum, token) => sum + (token.text === "/" ? 1 : 2), 0);
    if (moves > MAX_MOVES) fail(`expansion exceeds ${MAX_MOVES} moves`);
    return moves;
  };
  const expandAlias = (turns: string): Token[] => {
    const tokens: Token[] = [];
    for (const part of turns.split(/(\/)/)) {
      if (part) tokens.push(part === "/" ? { text: "/", automatic: true } : { text: `(${part})` });
    }
    return tokens;
  };
  const sequence = (depth: number): Token[] => {
    if (depth > MAX_DEPTH) fail(`parentheses exceed ${MAX_DEPTH} levels`);
    const tokens: Token[] = [];
    let moves = 0;
    const append = (items: Token[]) => {
      moves += checkSize(items);
      if (moves > MAX_MOVES) fail(`expansion exceeds ${MAX_MOVES} moves`);
      tokens.push(...items);
    };
    while (position < source.length) {
      const rest = source.slice(position);
      const whitespace = /^\s+/.exec(rest);
      if (whitespace) {
        position += whitespace[0].length;
        continue;
      }
      if (rest[0] === ")") {
        if (!depth) fail("unexpected closing parenthesis");
        break;
      }
      if (rest[0] === "[" || rest[0] === "]") {
        fail("unverified or misplaced bracket annotation; only one verified leading Angle label is supported");
      }
      const pair = /^(?:\(\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*\)|([+-]?\d+)\s*,\s*([+-]?\d+))/.exec(rest);
      if (pair) {
        const top = pair[1] ?? pair[3];
        const bottom = pair[2] ?? pair[4];
        if (![top, bottom].every((value) => Number.isSafeInteger(Number(value)))) fail("tuple coordinates must be safe integers");
        position += pair[0].length;
        const repeat = pair[1] === undefined ? null : /^\d+/.exec(source.slice(position));
        const count = repeat ? Number(repeat[0]) : 1;
        if (!Number.isSafeInteger(count) || count < 1 || count * 2 > MAX_MOVES) {
          fail(`repetition must be positive and expand to at most ${MAX_MOVES} moves`);
        }
        for (let i = 0; i < count; i++) append([{ text: pair[1] === undefined ? `(${top},${bottom})` : pair[0] }]);
        position += repeat?.[0].length ?? 0;
        changed ||= repeat !== null;
        continue;
      }
      if (rest[0] === "/" || rest[0] === "\\") {
        append([{ text: "/" }]);
        changed ||= rest[0] === "\\";
        position++;
        continue;
      }
      // These two literals have exceptional source mappings, not ordinary
      // repetition semantics. Accept the compact spelling (e'U)3 as well.
      const special = /^\(\s*e'\s*([UD])\s*\)3(?!\d)/.exec(rest);
      if (special) {
        append(expandAlias(special[1] === "U"
          ? "/-3,-3/3,0/-3,-3/3,0/-3,-3/3,0"
          : "-3,-3/0,3/-3,-3/0,3/-3,-3/"));
        position += special[0].length;
        changed = true;
        continue;
      }
      if (rest[0] === "(") {
        const start = position++;
        const group = sequence(depth + 1);
        if (source[position] !== ")") fail("unclosed parenthesis", start);
        if (!group.length) fail("empty group", start);
        position++;
        const repeat = /^\d+/.exec(source.slice(position));
        const count = repeat ? Number(repeat[0]) : 1;
        if (!Number.isSafeInteger(count) || count < 1 || count > MAX_MOVES || checkSize(group) * count > MAX_MOVES) {
          fail(`repetition must be positive and expand to at most ${MAX_MOVES} moves`);
        }
        position += repeat?.[0].length ?? 0;
        for (let i = 0; i < count; i++) append(group);
        changed = true;
        continue;
      }
      const alias = aliasMatchers.map((entry) => ({ ...entry, match: entry.pattern.exec(rest) })).find((entry) => entry.match);
      if (alias?.match) {
        append(expandAlias(alias.turns));
        position += alias.match[0].length;
        changed = true;
        continue;
      }
      // Real CPEP/PBL bodies include -61, and their generated standard
      // counterparts contain (6,1). A signed half-turn has the same action
      // modulo 12; it is not a 61-unit turn or an Angle-dependent offset.
      const compact = /^(-[1-6]|[0-6])(-[1-6]|[0-6])/.exec(rest);
      if (compact) {
        append([{ text: `(${compact[1]},${compact[2]})` }, { text: "/", automatic: true, finalNumeric: true }]);
        position += compact[0].length;
        changed = true;
        continue;
      }
      fail(`unknown or malformed token ${JSON.stringify(rest.slice(0, 24))}`);
    }
    return tokens;
  };
  const tokens = sequence(0);
  if (!changed) return formula;
  if (tokens[tokens.length - 1]?.finalNumeric) tokens.pop();
  const result: Token[] = [];
  for (const token of tokens) {
    const previous = result[result.length - 1];
    // Coalesce only alias/implicit slash boundaries; never erase explicit //.
    if (token.text === "/" && previous?.text === "/") {
      if (token.automatic) continue;
      if (previous.automatic) result.pop();
    }
    result.push(token);
  }
  return result.map((token) => token.text).join(" ");
}
