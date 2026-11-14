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
- The workbench has a compact toolbar and no settings sidebar. The top-right configuration dialog contains Search, Filters, Practice and Display tabs. Edits are drafts until Apply; Cancel/Escape discard drafts. Filter/display-only application does not invalidate a search. Default retained results and first-page size are 20; optional larger budgets paginate in groups of 20.
- Cards use 3/2/1 columns at desktop/tablet/mobile widths. Their 3D button opens an isolated stage-player dialog instead of expanding the grid. The scramble remains optionally visible in 3D; connected player trees hide behind configuration dialogs and do not intercept them.
- The timer centers large digits, supports configurable 0/300/550 ms keyboard arming (red hold, green ready, release to start), and stops on keydown. Click/touch controls remain available. Display settings cover 80–200 px font, 0–3 decimal places, live/whole-second/hidden runtime, focus mode and 3D size/visibility. Display precision does not change stored timing or penalties. History is collapsible; settings persist locally.
- Entering practice automatically prepares a random-state question and fills the browser viewport by default, hiding/restoring the app header. Stopping reveals that exact question's solutions without a reveal button; a subsequent independent armed Space prepares the next question and starts inspection/timing. Space is captured before button/3D handlers throughout practice; actual editors and configuration dialogs remain exceptions. Stop-key repeat/release never advances a second time.
- Practice settings (conditional sampling/preview) and timer settings (inspection, hold duration, digits, runtime display, viewport and chart range) use separate dialogs. Completed records snapshot search options; older records without a snapshot use current search settings for review. Reviewing a previous record, a curve point or a custom scramble preserves the live question and never creates a score. Space resumes the live practice flow.
- `PracticeStats.tsx` and `practiceStatistics.ts` chart saved single times plus ao5/ao12 using native ECharts, with mo3, best and mean summaries. +2 affects times; DNF is null in time series with a separate marker rather than zero. Rolling averages use all saved history before the selected plot window is truncated. ao5/ao12 trim one best/worst; two DNFs yield DNF. Curves and selection controls link to review, and history persists locally (up to 200 records).
- `solutionFormat.ts` and `SolutionCards.tsx`: method-specific pastel backgrounds, five stage colors, explicit overlap parentheses, compact executable full copy and original annotated-stage copy with stage/cumulative HTM. Annotations label raw versus reduced counts; parentheses retain original actions exactly once. Both copies preserve AUF, frame and solved state. Notation shortening is local algebra, not a claim of globally shortest solutions.

Ordinary practice uses random-state scrambles and the exact >=4-HTM acceptance check. Conditional practice requires one retained solution to meet every selected condition. Limits can miss a qualifying solution; no-hit does not mean impossible. Settings and history are device-local and do not require login.

## Verification

Stage normalization also merges turns separated by a rotation frame that commutes with the face: e.g. `U' y U2 -> U y`, `R' x R2 -> R x`. This is applied to the complete finish (pre-AUF + formula + post-AUF) before the bounded base/finish join. Internal cleanup does not consume the cross-stage overlap budget; zero overlap disables cross-stage reduction only. Both smoother alternatives and reduced outputs retain internal cleanup, original-token parentheses, exact frame, and recalculated counts/scores.

Generated scrambles contain only R/U/F turns. `engine/scramble.ts` rewrites native random-state output algebraically, carrying the whole-cube frame forward and dropping only its final physical rotation. It verifies the exact frame relation before returning; the Worker then applies the independent >=4-HTM check. This preserves the sampled 2x2 state modulo physical rotation; it is not a random-move generator. User-entered and historical scrambles can still contain other legal moves.

The practice scramble is a sticky sibling of the timer, statistics and solution sections, so it remains visible across the entire page, including while timing. In browser-wide practice it sticks at 0px; normal page mode leaves room for the app header. Current and review scrambles update the same strip without replacing the live question.

```sh
npm run test:two-solver
npx tsc --noEmit --incremental false
npx eslint src/views/TwoSolver scripts/prepare-two-scrambler.mjs scripts/sync-two-solver-data.mjs
# Against a running Next dev or production server:
TWO_SOLVER_URL=http://127.0.0.1:3128/tools/solver/222/ npm run test:two-solver:browser
TWO_SOLVER_URL=http://127.0.0.1:3128/tools/solver/222/ npm run test:two-solver:practice
```

The catalog suite validates every indexed target against an independent sticker oracle, checks all 21 methods, tests AUF/grip and method-boundary regressions, and independently replays returned execution. Browser tests use actual workers/data/random generator/native rendering, with only unrelated account API traffic isolated.

All required static assets are included under `public/two-solver`. No sibling backend is needed for build or runtime. After intentionally upgrading the pinned cubing dependency, regenerate the browser graph with `npm run two-solver:prepare` and run both browser and engine suites. To refresh from an existing sibling Algs snapshot, use `npm run two-solver:sync`. Attribution and scoring assumptions are in `SOURCES.md`.
