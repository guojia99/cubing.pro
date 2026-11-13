import type { PuzzleID } from "cubing/twisty";
import { AllFaces, CubeData, parseAlgorithm, renderCubeSVG } from "@cuberoot/visualcube";
import { buildSimpleOptions, renderFromSimpleQuery } from "@cuberoot/visualcube/svg";
import { parsePuzzleAlg, puzzleLoader } from "./model";
import type { preparePuzzle } from "./model";

type Prepared = Awaited<ReturnType<typeof preparePuzzle>>;
type Slot = { orbit: string; piece: number; orientation: number; face: string; x: number; y: number };
const faces = "URFDLB";
const layouts = new Map<PuzzleID, Promise<Slot[]>>();
type ProvenAction = {
  token: string;
  turns: ReturnType<typeof parseAlgorithm>;
  action: ReturnType<Prepared["kpuzzle"]["moveToTransformation"]>;
};
const provenActions = new Map<PuzzleID, Map<string, ProvenAction>>();
const actionCacheLimit = 256;

// Read only bundled native templates, never the DOM or another diagram. Their
// sticker IDs carry the KPuzzle orbit/position/orientation; coordinates carry
// the face-local row order. Hint copies and duplicate center orientations are
// excluded, with complete 6N^2 coverage required before using the map.
function nativeLayout(puzzle: PuzzleID, size: number): Promise<Slot[]> {
  let pending = layouts.get(puzzle);
  if (!pending) {
    pending = puzzleLoader(puzzle).svg().then(svg => {
      const home: Record<string, string> = {
        white: "U", red: "R", limegreen: "F", yellow: "D", orange: "L", "#26f": "B",
        "#ffffff": "U", "#ff0000": "R", "#44ee00": "F", "#ffff00": "D", "#ff8800": "L", "#2266ff": "B",
      };
      const slots: Slot[] = [];
      let face = "";
      for (const match of svg.matchAll(/<title>([URFDLB])<\/title>|<(?:use|polygon)\b[^>]*>/g)) {
        if (match[1]) { face = match[1]; continue; }
        const tag = match[0];
        const id = /(?:^|\s)id="([\w]+)-l(\d+)-o(\d+)"/.exec(tag);
        if (!id || (id[1].startsWith("CENTERS") && Number(id[3]) !== 0)) continue;
        const translation = /transform="translate\(([-\d.]+)[,\s]+([-\d.]+)\)"/.exec(tag);
        const points = /points="([^"]+)"/.exec(tag)?.[1].trim().split(/[\s,]+/).map(Number);
        const color = /fill:\s*([^";\s]+)/.exec(tag)?.[1];
        const stickerFace = translation ? home[color ?? ""] : face;
        if (!stickerFace || (!translation && (!points || points.length !== 8))) {
          throw new Error(`Unknown native cube sticker layout: ${puzzle}`);
        }
        slots.push({ orbit: id[1], piece: Number(id[2]), orientation: Number(id[3]), face: stickerFace,
          x: translation ? Number(translation[1]) : (points![0] + points![2] + points![4] + points![6]) / 4,
          y: translation ? Number(translation[2]) : (points![1] + points![3] + points![5] + points![7]) / 4 });
      }
      const ordered = [...faces].flatMap(face => {
        const grid = slots.filter(slot => slot.face === face);
        if (grid.length !== size * size) throw new Error(`Incomplete native cube face: ${puzzle}/${face}`);
        // Polygon coordinates contain floating-point noise. Quantize only the
        // sort key, not the template or its geometry.
        return grid.sort((a, b) => Math.round(a.y * 1e6) - Math.round(b.y * 1e6) || a.x - b.x);
      });
      if (ordered.length !== 6 * size * size) throw new Error(`Incomplete native cube layout: ${puzzle}`);
      return ordered;
    });
    layouts.set(puzzle, pending);
    void pending.catch(() => { if (layouts.get(puzzle) === pending) layouts.delete(puzzle); });
  }
  return pending;
}

/** Offline NxN thumbnails. The prepared native setup/pattern is authoritative;
 * view/mask choices never invert, rotate, or otherwise replace that state.
 * Two-layer PBL is handled by the parent's native 3D renderer before this call.
 */
export async function renderCubeDiagram(
  puzzle: PuzzleID,
  state: Awaited<ReturnType<typeof preparePuzzle>>,
  classId: string,
  setName: string,
  groupName: string,
  colors: Record<string, string>,
): Promise<string> {
  const size = Number(puzzle[0]);
  if (size < 2 || size > 7 || puzzle !== `${size}x${size}x${size}`) {
    throw new Error(`Unsupported cube diagram: ${puzzle}`);
  }
  // This parser bounds the AST before leaf expansion (including comments,
  // repetitions, commutators and conjugates). Cube setups need no retranslation.
  const alg = parsePuzzleAlg(state.setup, puzzle, "setup");
  const layout = await nativeLayout(puzzle, size);
  const home = new Map(layout.map(slot => [`${slot.orbit}/${slot.piece}/${slot.orientation}`, slot.face]));
  const nativeFacelets = (pattern: Prepared["pattern"]) => layout.map(slot => {
    const data = pattern.patternData[slot.orbit];
    const orbit = state.kpuzzle.lookupOrbitDefinition(slot.orbit);
    if (!data) throw new Error(`Native cube orbit mismatch: ${puzzle}`);
    const count = slot.orbit.startsWith("CENTERS") ? 1 : orbit.numOrientations;
    const orientation = ((slot.orientation - data.orientation[slot.piece]) % count + count) % count;
    const face = home.get(`${slot.orbit}/${data.pieces[slot.piece]}/${orientation}`);
    if (!face) throw new Error(`Unknown native cube facelet: ${puzzle}/${slot.orbit}`);
    return face;
  });
  const solved = state.kpuzzle.defaultPattern();
  const vendor = new CubeData(size, Object.fromEntries(AllFaces.map((face, index) =>
    [face, Array<string>(size * size).fill(faces[index])])));
  const setup: string[] = [];
  let cache = provenActions.get(puzzle);
  if (!cache) {
    cache = new Map();
    provenActions.set(puzzle, cache);
  }
  for (const move of alg.experimentalLeafMoves()) {
    // Preserve the native amount in the canonical key: PG's x0 is not x4.
    const key = move.toString();
    const cached = cache.get(key);
    if (cached) {
      cached.turns.forEach(turn => vendor.turn(turn));
      setup.push(cached.token);
      continue;
    }
    const amount = ((move.amount % 4) + 4) % 4;
    let token = amount ? move.modified({ amount }).toString() : "";
    const q = move.quantum;
    // Native odd-order slices turn only the central layer; vendor M/E/S turn
    // every inner layer. Explicit depth notation still requires proof below.
    if (size > 3 && size % 2 === 1 && /^[MES]$/.test(q.family) && q.innerLayer === null && q.outerLayer === null) {
      const face = { M: "L", E: "D", S: "F" }[q.family]!;
      token = amount ? `${(size + 1) / 2}${face}${amount === 1 ? "" : amount}` : "";
    }
    if (size > 2 && /^[mes]$/.test(q.family) && q.innerLayer === null && q.outerLayer === null) {
      const face = { m: "L", e: "D", s: "F" }[q.family]!;
      token = amount ? `2-${size - 1}${face}w${amount === 1 ? "" : amount}` : "";
    }
    // CubeData's full-width face turn omits the opposite face rotation. Use
    // the equivalent rotation/complement, and prove it against native below.
    if (q.innerLayer === size && /^[URFDLB](?:w)?$|^[urfdlb]$/.test(q.family)) {
      const face = q.family[0].toUpperCase();
      const rotation = { R: "x", L: "x'", U: "y", D: "y'", F: "z", B: "z'" }[face]!;
      const lower = q.outerLayer ?? (q.family.length === 1 && q.family === face ? size : 1);
      const complement = lower > 1 ? `${lower - 1 === 1 ? face : `${lower - 1}${face}w`}'` : "";
      token = Array.from({ length: amount }, () => `${rotation} ${complement}`.trim()).join(" ");
    }
    const turns = parseAlgorithm(token);
    const action = state.kpuzzle.moveToTransformation(move);
    const single = solved.applyTransformation(action);
    const proof = new CubeData(size, Object.fromEntries(AllFaces.map((face, index) =>
      [face, Array<string>(size * size).fill(faces[index])])));
    turns.forEach(turn => proof.turn(turn));
    if (AllFaces.flatMap(face => proof.faces[face]).join("") !== nativeFacelets(single).join("")) {
      throw new Error(`Native/vendor cube action mismatch: ${puzzle} ${move}`);
    }
    // Only successful proofs enter this bounded, synchronous cache.
    if (cache.size >= actionCacheLimit) cache.delete(cache.keys().next().value!);
    cache.set(key, { token, turns, action });
    turns.forEach(turn => vendor.turn(turn));
    setup.push(token);
  }
  // Always evaluate the entire bounded AST, even when every action is cached.
  const native = solved.applyAlg(alg);
  if (!native.isIdentical(state.pattern)) throw new Error(`Cube diagram setup/pattern mismatch: ${puzzle}`);
  if (AllFaces.flatMap(face => vendor.faces[face]).join("") !== nativeFacelets(state.pattern).join("")) {
    throw new Error(`Native/vendor cube state mismatch: ${puzzle}`);
  }

  const category = `${classId} ${setName} ${groupName}`;
  const has = (token: string) => new RegExp(`(?:^|[^A-Z0-9])${token}(?:$|[^A-Z0-9])`, "i").test(category);
  let view = size === 2 ? "plan" : "pll";
  let mask: string | undefined;
  let hideGreySides = false;
  if (size > 3 && (has("L2E") || has("LCE"))) view = "iso";
  if (size > 3 && has("L2C")) { mask = "center"; hideGreySides = true; }
  if (size > 3 && has("OLLP")) { view = "oll"; hideGreySides = true; }
  if (size === 3) {
    if (has("ZBLS")) { view = "iso"; mask = "vh"; }
    else if (has("ZBLL")) mask = "coll";
    else if (has("CMLL") || has("COLL")) { mask = has("CMLL") ? "cmll" : "coll"; hideGreySides = true; }
    else if (has("WV") || has("VLS") || has("SV")) { mask = "wv"; hideGreySides = true; }
    else if (has("F2L")) view = "f2l";
    else if (has("OLL")) { view = "oll"; hideGreySides = true; }
  }
  const palette = [...faces].map(face => colors[face]);
  if (palette.some(color => !color || !/^#[\da-f]{6}$/i.test(color))) {
    throw new Error("Cube diagram requires six local #RRGGBB face colors (URFDLB)");
  }
  const query = { setup: setup.join(" "), cubeSize: size, size: 240, view, mask,
    ngs: hideGreySides, sch: palette.join(",") };
  // Explicit local palette overrides the source site's holding scheme, including
  // OLL's yellow/grey default. Native piece-following masks run before setup.
  if (!mask) return renderFromSimpleQuery(query);
  return renderCubeSVG(buildSimpleOptions(query));
}
