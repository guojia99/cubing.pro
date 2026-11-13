import { Alg } from "cubing/alg";
import type { PuzzleID } from "cubing/twisty";
import type { preparePuzzle } from "./model";
import { applyPuzzleAlg, parsePuzzleAlg } from "./model";
import { normalizeFtoNotation } from "./ftoNotation";

type Prepared = Awaited<ReturnType<typeof preparePuzzle>>;
type MegaAction = { token: string; action: ReturnType<Prepared["kpuzzle"]["identityTransformation"]> };
const megaActions = new WeakMap<Prepared["kpuzzle"], MegaAction[]>();

function megaminxActions(kpuzzle: Prepared["kpuzzle"]): MegaAction[] {
  const cached = megaActions.get(kpuzzle);
  if (cached) return cached;
  // sr's parser silently drops y. Spell every rotation using its supported
  // tokens: native ++ is two sr steps, and native Uv = U (D++)2.
  const axes = [
    { token: "U D++ D++ D++ D++", action: kpuzzle.moveToTransformation("Uv") },
    { token: "L R++ R++ R++ R++", action: kpuzzle.moveToTransformation("Lv") },
  ];
  const inverse = (token: string) => token.split(" ").filter(Boolean).reverse().flatMap(t => Array(4).fill(t)).join(" ");
  const rotations: MegaAction[] = [{ token: "", action: kpuzzle.identityTransformation() }];
  for (let i = 0; i < rotations.length; i++) for (const axis of axes) {
    const action = rotations[i].action.applyTransformation(axis.action);
    if (!rotations.some(candidate => candidate.action.isIdentical(action))) {
      if (rotations.length >= 60) throw new Error("Unexpected Megaminx rotation group");
      rotations.push({ token: `${rotations[i].token} ${axis.token}`.trim(), action });
    }
  }
  // Face turns, wide turns and inner slices generate their counterparts on
  // every axis by conjugation. Build once, then match each native move, never
  // solve each library formula or reinterpret mixed-case grips as face names.
  const seeds = [
    ...["U", "F", "R", "L", "BR", "BL"].map(token => ({ token, action: kpuzzle.moveToTransformation(token) })),
    { token: "D++", action: kpuzzle.moveToTransformation("D++").selfMultiply(3) },
    { token: "R++", action: kpuzzle.moveToTransformation("R++").selfMultiply(3) },
  ];
  const actions = [...rotations];
  for (const rotation of rotations) for (const seed of seeds) for (const amount of [1, 2, 3, 4]) {
    actions.push({
      token: [rotation.token, ...Array(amount).fill(seed.token), inverse(rotation.token)].filter(Boolean).join(" "),
      action: rotation.action.applyTransformation(seed.action.selfMultiply(amount)).applyTransformation(rotation.action.invert()),
    });
  }
  const down = actions.find(candidate => candidate.action.isIdentical(kpuzzle.moveToTransformation("D")));
  if (!down) throw new Error("Missing Megaminx opposite face action");
  // 2U = Uv U' D; D is the face opposite U (a rotated native face).
  const slice = { token: `${axes[0].token} U U U U ${down.token}`, action: kpuzzle.moveToTransformation("2U") };
  for (const rotation of rotations) for (const amount of [1, 2, 3, 4]) actions.push({
    token: [rotation.token, ...Array(amount).fill(slice.token), inverse(rotation.token)].filter(Boolean).join(" "),
    action: rotation.action.applyTransformation(slice.action.selfMultiply(amount)).applyTransformation(rotation.action.invert()),
  });
  megaActions.set(kpuzzle, actions);
  return actions;
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Render the native setup produced by preparePuzzle, never a library formula.
 * Unknown actions and inconsistent setup/pattern pairs reject instead of drawing
 * an upstream parser's partially consumed (often solved) state.
 */
export async function renderSpecialDiagram(
  puzzle: PuzzleID,
  state: Prepared,
  classId: string,
  colors: Record<string, string>,
  setName = "",
): Promise<string> {
  if (!["skewb", "square1", "fto", "pyraminx", "megaminx"].includes(puzzle)) {
    throw new Error(`Unsupported special diagram: ${puzzle}`);
  }
  // preparePuzzle's output is already native, including Sarah grips and the FTO
  // domain marker. Running library normalization again would change its action.
  const text = state.setup.replace(/^\s*\/\/ cubing-pro:native\r?\n/, "");
  if (text.length > 24000) throw new Error("Special diagram setup is too long");
  const alg = new Alg(text);
  // Reuse the bounded AST validator without reinterpreting special notation.
  parsePuzzleAlg(text, "3x3x3", "setup");
  const moves = [...alg.experimentalLeafMoves()];
  if (!applyPuzzleAlg(state.kpuzzle.defaultPattern(), alg, puzzle).isIdentical(state.pattern)) {
    throw new Error(`Special diagram setup/pattern mismatch: ${puzzle}`);
  }
  const fail = (move: unknown): never => { throw new Error(`Unsupported ${puzzle} diagram action: ${move}`); };

  if (puzzle === "square1") {
    const { renderSq1ScrambleSvg } = await import("@cuberoot/puzzle-render-core/sq1-svg");
    const { sq1StageHiddenStickerIds } = await import("@cuberoot/puzzle-render-core/support/sq1-stage-mask");
    const setup = moves.map(move => {
      if (move.quantum.toString() === "U_SQ_") return `(${move.amount % 12},0)`;
      if (move.quantum.toString() === "D_SQ_") return `(0,${move.amount % 12})`;
      if (move.quantum.toString() === "_SLASH_") return Math.abs(move.amount) % 2 ? "/" : "";
      return fail(move);
    }).join(" ");
    const stageOf = (value: string) => /(?:^|[^A-Z0-9])(CPEP|CSP|CS|CO|EO|CP|EP|OBL|PARITY)(?:$|[^A-Z0-9])/i.exec(value)?.[1].toUpperCase();
    const stage = stageOf(setName) ?? stageOf(classId);
    const ids = sq1StageHiddenStickerIds(stage ?? "");
    // Default upstream U=yellow / D=white. CS recognizes shape alone.
    const palette = stage === "CS" ? Object.fromEntries(["U", "D", "L", "B", "R", "F"].map(face => [face, "#dddddd"])) : colors;
    return renderSq1ScrambleSvg(setup, palette, {
      stickerIds: true,
      compactFaces: stage !== "CS" && stage !== "CSP",
      ...(ids ? { mask: { ids, color: "transparent" } } : {}),
    }, !["CS", "CSP", "PARITY"].includes(stage ?? "") && !ids);
  }

  if (puzzle === "fto") {
    const { renderFtoEifSvg } = await import("@cuberoot/puzzle-render-core/fto-eif-image");
    // Invert the already action-proved EIF -> native adapter by comparing full
    // transformations, not similar-looking face letters. Include both sides of
    // each slice and the face+slice-opposite-face whole-puzzle rotations.
    const candidates = ["U", "D", "F", "B", "R", "L", "Bl", "Br", "Us", "Fs", "Rs", "Ls"]
      .map(token => ({ token, native: normalizeFtoNotation(`{U,L} ${token}`) }));
    for (const [token, native] of [
      ["Uo", "U 2U D'"], ["Fo", "L 2L BR'"],
      ["Ro", "F 2F B'"], ["Lo", "BL 2BL R'"], ["Rt", "T"],
    ]) candidates.push({ token, native });
    // The vendored parser's T alias/comment says Ft'; its actual sticker action
    // disagrees. The 72-sticker proof pins native T to Rt instead.
    const actions = candidates.flatMap(({ token, native }) => [1, -1, 2, -2].map(amount => ({
      token: Array.from({ length: Math.abs(amount) }, () => amount < 0 ? `${token}'` : token).join(" "),
      action: state.kpuzzle.algToTransformation(new Alg(native)).selfMultiply(amount),
    })));
    const identity = state.kpuzzle.identityTransformation();
    const setup = moves.map(move => {
      const action = state.kpuzzle.moveToTransformation(move);
      if (action.isIdentical(identity)) return "";
      return actions.find(candidate => candidate.action.isIdentical(action))?.token ?? fail(move);
    }).join(" ");
    return renderFtoEifSvg(setup);
  }

  if (puzzle === "skewb") {
    const { renderSkewbPyramidSvgParametric, SkewbStateWCA } = await import("@cuberoot/shared/skewb-pyramid-svg");
    const setup = moves.map(move => {
      if (!/^(UL|UR|[RULBFDxyz])$/.test(move.quantum.toString())) return fail(move);
      const order = /^[xyz]$/.test(move.quantum.toString()) ? 4 : 3;
      const count = ((move.amount % order) + order) % order;
      return Array(count).fill(move.quantum.toString()).join(" ");
    }).join(" ");
    const upstream = new SkewbStateWCA();
    upstream.applyAlgorithm(setup);
    // The upstream renderer has no palette argument. Read its piece state for
    // each polygon in its documented order; never substitute literal hex codes.
    const indices = [[0,0],[2,0],[1,0],[5,0],[4,0],[1,1],[1,2],[1,4],[1,3],
      [0,3],[0,4],[0,2],[0,1],[2,1],[2,2],[2,4],[2,3],[5,1],[5,2],[5,4],[5,3],
      [4,1],[4,2],[4,4],[4,3]];
    const faces = ["U", "R", "F", "D", "L", "B"];
    const defaults = ["#d6b83f", "#388a61", "#c64d48", "#f2f0e8", "#426fa6", "#d17c3a"];
    let index = 0;
    const svg = renderSkewbPyramidSvgParametric(setup)
      .replace('<style>polygon{stroke:#000;stroke-width:0.5;stroke-linejoin:round}</style>', "")
      .replace(/(<polygon\s+)fill="[^"]*"/g, (_match, prefix: string) => {
        if (!indices[index]) throw new Error("Skewb polygon layout changed");
        const [face, sticker] = indices[index++];
        const color = upstream.image[face][sticker];
        return `${prefix}fill="${escapeAttribute(colors[faces[color]] ?? defaults[color])}" stroke="#000" stroke-width="0.5" stroke-linejoin="round"`;
      });
    if (index !== indices.length) throw new Error("Skewb polygon layout changed");
    return svg;
  }

  if (puzzle === "pyraminx") {
    const { renderPuzzleIsoSvg } = await import("@cuberoot/puzzle-render-core/iso-svg");
    const setup = moves.flatMap(move => {
      const family = move.quantum.toString();
      if (!/^(?:[ULRBulrb]|[ULRB]v|y|D)$/.test(family)) return fail(move);
      const amount = ((move.amount % 3) + 3) % 3;
      return amount ? [`${family}${amount === 2 ? "'" : ""}`] : [];
    }).join(" ");
    const svg = renderPuzzleIsoSvg("pyraminx", setup, undefined, 240);
    if (!svg) throw new Error("Pyraminx diagram renderer returned no SVG");
    return svg;
  }

  const { SVG, VisualizerType } = await import("@cuberoot/vendor-sr-puzzlegen");
  const actions = megaminxActions(state.kpuzzle);
  const lookup = new Map<string, string>();
  const setup = moves.map(move => {
    const key = move.toString();
    if (lookup.has(key)) return lookup.get(key)!;
    const action = state.kpuzzle.moveToTransformation(move);
    const token = actions.find(candidate => candidate.action.isIdentical(action))?.token ?? fail(move);
    lookup.set(key, token);
    return token;
  }).join(" ");
  if (typeof document === "undefined") throw new Error("Megaminx SVG requires a DOM document");
  const host = document.createElement("div");
  SVG(host, VisualizerType.MEGAMINX_TOP, { width: 240, height: 240, puzzle: { alg: setup } });
  const svg = host.querySelector("svg");
  if (!svg) throw new Error("Megaminx diagram renderer returned no SVG");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return svg.outerHTML;
}
