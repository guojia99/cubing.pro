# TwoSolver

Frontend-only 2x2 solver at `/tools/solver/222/`, accessible from Tools. Default scope: CLL, EG1, EG2, LEG1; RUF base moves; six colors. Independent family base caps default to EG 5, TCLL 4, LS 4, EGLS 3, FH 3, CBL 2 and TEG 3. Only enabled families contribute to the actual search depth. Other methods are opt-in and lazy loaded.

## Runtime

- `engine/state.ts`: bounded notation parser and full eight-corner model, cross-checked against the pinned cubing KPuzzle.
- `engine/structure.ts`: distinct EG, TCLL, LS, CBL, EGLS, TEG and FH spatial predicates. CBL is four target-color corners in the lower layer, not necessarily four stickers facing down. FH requires the two adjacent down-facing target stickers to share a bar. TCLL and TEG distinguish untwisted lower permutation; LS subtype depends on both unfinished-corner orientations; EGLS uses conceptual-insertion permutation.
- `engine/library.ts`: actual formula inverses, all color frames and AUFs. Prefix `(U2)` executes as U2; rotations are explicit. No imported `scramble` field is treated as a setup. Formula variants are validated separately.
- `solver.worker.ts`: lazy method data/index cache and bounded search. Cancelling terminates the active worker; subsequent completed searches reuse a warm worker.
- `engine/cancellation.ts`: adjacent turn arithmetic and verified rotation conjugations expose cross-boundary cancellation. `maxOverlap` defaults to one paired layer-turn interaction at the base/finish boundary, not one saved HTM and not one extra base move. Zero disables boundary reduction; 0–6 is supported. Source-token provenance marks the original overlapping actions. The less-cancelled alternative is retained when it has lower estimated execution cost. Full-copy formatting cannot silently perform an additional boundary reduction beyond this budget.
- `engine/ergonomics.ts`: pinned two-tool triplet weights plus explicitly estimated startup, rotation and limited regrip supplements. Scores are not seconds and cannot prove a player's actual regrip count. Initial rotations are free; execution rotations are charged. B/D/L do not receive a blanket penalty inside formulas.
- `uiPractice.ts`: immutable question snapshots, keyboard/touch timer, optional inspection, editable +2/DNF, and 200 local records. Storage and source formula problems are visible in the UI.
- `TwoSolverView.tsx`: automatically analyzes on initial load and 400 ms after scramble/search-scope changes. New inputs cancel obsolete analysis; manual cancellation stays stopped until inputs change. Practice questions retain their own immutable snapshots. The search-scope panel has independent contained scrolling on desktop and mobile.
- `SolverCube.tsx`: two independent bounded native 3D player slots for the always-visible scramble and selected solution. Both support camera dragging; the selected solution has playback/step controls and original-base/full-execution views. Players remain paused on updates and do not share NativeTwoByTwo's singleton ownership.
- `solutionFormat.ts` and `SolutionCards.tsx`: method-specific pastel backgrounds, five stage colors, explicit overlap parentheses, compact executable full copy and original annotated-stage copy with stage/cumulative HTM. Annotations label raw versus reduced counts; parentheses retain original actions exactly once. Both copies preserve AUF, frame and solved state. Notation shortening is local algebra, not a claim of globally shortest solutions.

Ordinary practice uses random-state scrambles and the exact >=4-HTM acceptance check. Conditional practice requires one retained solution to meet every selected condition. Limits can miss a qualifying solution; no-hit does not mean impossible. Settings and history are device-local and do not require login.

## Verification

```sh
npm run test:two-solver
npx tsc --noEmit --incremental false
npx eslint src/views/TwoSolver scripts/prepare-two-scrambler.mjs scripts/sync-two-solver-data.mjs
# Against a running Next dev or production server:
TWO_SOLVER_URL=http://127.0.0.1:3128/tools/solver/222/ npm run test:two-solver:browser
TWO_SOLVER_URL=http://127.0.0.1:3128/tools/solver/222/ npm run test:two-solver:presentation
```

The catalog suite validates every indexed target against an independent sticker oracle, checks all 21 methods, tests AUF/grip and method-boundary regressions, and independently replays returned execution. Browser tests use actual workers/data/random generator/native rendering, with only unrelated account API traffic isolated.

All required static assets are included under `public/two-solver`. No sibling backend is needed for build or runtime. After intentionally upgrading the pinned cubing dependency, regenerate the browser graph with `npm run two-solver:prepare` and run both browser and engine suites. To refresh from an existing sibling Algs snapshot, use `npm run two-solver:sync`. Attribution and scoring assumptions are in `SOURCES.md`.
