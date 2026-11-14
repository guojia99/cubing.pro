# Solver Sources and Implementation

## Search and Formula Data

- Search reference: WACWCA/two-tool `public/worker.js` at commit `0e5dd1b849be031af7b698113a4eeb48bbdd0fa4` (https://github.com/WACWCA/two-tool). The owner confirmed authorization to use the source. Credit is retained here and in the adapted modules.
- `engine/search.ts` adapts two-tool's single-color sticker projection / reverse-target search into a multi-source projection-distance bound with bounded full-state enumeration. `engine/cancellation.ts` adapts its AUF/rotation/base-algorithm boundary cancellation using verified conjugations instead of textual rewrites. This is a typed adaptation, not an unmodified upstream engine.
- Formula snapshot: https://2x2db.vercel.app/database, from the existing local Algs snapshot dated 2026-11-13. All 8,684 source variants in the 21 requested sets are preserved in `public/two-solver/data`; no backend data is changed. `scripts/sync-two-solver-data.mjs` reproduces the snapshot from the sibling backend if present. It is a maintainer command, not required for deployment.
- Runtime indexing validates actual inverse states under AUF and 24 cube frames. Unsupported notation and formulas that do not meet declared spatial predicates are excluded from the solver only, without modifying Algs. Every returned complete solution is replayed through the full corner model after cancellation.
- States retain all eight corner permutations and twists. A color-frame normalization of the fixed DBR corner is used for lookup only; actual inspection, color, formula rotations and execution remain explicit.
- Search depth is HTM base depth. RUF restricts only the base; B/D/L inside a library formula are permitted. Results have a time budget and retained-result cap and do not claim global optimality. Ranking spans all initial grips and searched depths, rather than stopping at the first cap of formula variants. Color/method filters apply to retained results.

## Random-State Scrambles

- Generator: installed, pinned `cubing` 0.63.3, `randomScrambleForEvent("222")`. License: `MPL-2.0 OR GPL-3.0-or-later`; upstream source https://github.com/cubing/cubing.js/tree/v0.63.3 . The browser ESM graph is generated without source changes by `scripts/prepare-two-scrambler.mjs` using esbuild, with notices preserved. These committed assets avoid Next's transformation of the internal worker URL into a local filesystem path.
- No random-move fallback is used. An independent exact reverse table additionally rejects every state solvable in three or fewer HTM, modulo whole-cube rotations. The test suite enumerates six-face states to verify the RUF-derived table.
- Conditional training rejection-samples that state stream using found solutions, so it is explicitly labeled conditional and does not claim globally uniform sampling or an official competition scramble workflow.

## Ergonomics Sources

- Upstream: WACWCA/two-tool, commit `0e5dd1b849be031af7b698113a4eeb48bbdd0fa4`.
- Data: https://raw.githubusercontent.com/WACWCA/two-tool/0e5dd1b849be031af7b698113a4eeb48bbdd0fa4/src/util/algSorterData.js
- Weighting: https://raw.githubusercontent.com/WACWCA/two-tool/0e5dd1b849be031af7b698113a4eeb48bbdd0fa4/src/util/algSorter.js
- Retrieved through `curl` stdout. The user explicitly authorized use of two-tool code.
- `engine/twoToolData.ts` vendors every one of the 324 DATA records, preserving all keys and numeric values, including `F R F: 0.265`. Only TypeScript typing, freezing, formatting, and attribution are added.

## Weighting and Local Assumptions

For each uninterrupted run of at least three layer turns, each token receives the average of all reference triplets covering it, divided by three. Summing these contributions reproduces upstream `getScoreOfArray` for covered runs, including endpoint weighting. A fully covered run without any local supplements has `confidence: 'reference'`. This means reference-backed ranking, not measured timing or validated personal finger tricks.

The following are local heuristics, not upstream measurements. Any use changes confidence to `estimated`. Let M be the arithmetic mean of all 324 reference weights, and m = M/3.

- All x/y/z rotations before the first layer turn are inspection orientation and free. They do not remap subsequent tokens. Internal and trailing rotations each cost m (1.5m for a half rotation), count once in `rotations`, and split reference context into separate runs. Rotations are never silently removed from execution cost.
- One- and two-turn runs cost m per layer turn, plus M/12 per half turn and M/6 per adjacent same-face pair. Empty execution costs zero and scores 100. Short or empty execution is estimated because there is no reference triplet.
- Missing triplets use M, plus M/12 per half turn and M/6 per adjacent same-face pair within the triplet, under the same overlapping weighting. Upstream's unconditional 0.6 fallback is deliberately replaced with this neutral contextual fallback. B/D/L face names never receive a blanket penalty. Reference coverage is limited to R/U/F with distinct adjacent faces; no face substitution is claimed to be measured.
- An initial F, F2, or F' adds M/2 once for startup grip. Interior F moves receive no startup supplement. This assumption can slightly favor a U x' entry into a suitable remainder despite the internal rotation cost. There is no global equivalence, rewrite, or special discount for U x'; relative ranking still depends on the rest of the algorithm.
- `regrips` is an ESTIMATED count: one per explicit execution rotation plus one per literal adjacent `F2 R'` pair within a run. The pair adds M/6 cost once per occurrence, beyond its existing triplet contribution. This intentionally small heuristic does not model hands, grip states, or an inferred optimal grip path. A zero count does not establish that no regrip is needed.

`cost` is the total dimensionless length-sensitive ranking cost (lower is better). `score = 100 / (1 + (cost / layerTurns) / m)` is continuous normalized smoothness from 0 to 100 (higher is better), with empty execution defined as 100. It measures average cost per layer turn rather than total algorithm length; rotations still contribute to its numerator. Neither output is seconds, TPS, probability, or measured human speed. Inputs must already be canonical tokens, with exactly one optional `2` or apostrophe suffix; malformed tokens throw `RangeError`. Inputs are never mutated.

`SCORE_VERSION` identifies the data pin and local scoring revision. Bump it whenever ranking semantics or data change. Returned explanations are Chinese and limited to four notes.
