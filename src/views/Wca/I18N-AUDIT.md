# WCA / Algorithms / Puzzle Internationalization Audit

Date: 2026-11-18. Scope: `src/views/Wca` except shared `utils/events.ts`, `src/views/Algs`, `src/views/TwoSolver`, and `src/components/puzzles` excluding vendor code. Draw tools are outside this task. Existing concurrent edits were preserved.

## Delivered

- Added `src/i18n/messages/wca-puzzle-extra.ts`: 76 keys with explicit Simplified Chinese, English, Japanese, Cantonese, Korean, French and Spanish translations. Exports `wcaPuzzleExtraZhCN`, `wcaPuzzleExtraEnUS`, `wcaPuzzleExtraJa`, `wcaPuzzleExtraYue`, `wcaPuzzleExtraKo`, `wcaPuzzleExtraFr`, `wcaPuzzleExtraEs`. Root catalog integration belongs to the coordinating agent; consumers can already use the independent translator.
- Replaced old Chinese-only country lookups in owned consumers; explicit locale propagates through country resolution, WCA IDs/ISO codes, country dropdown caching and sorting. Unknown API country names pass through. Cantonese uses traditional region names.
- Adopted the shared agent's `formatRoundName(code, locale)` in results, charts and milestone generators. Every owned `CubesCn` call now passes locale explicitly, including clipboard text and milestone descriptions.
- Localized the four WCA eyebrows, logo-link alternatives, quartile explanations, native-player loading/ownership/context/timeouts, notation validation, accessible player labels and expected solver errors. Raw player diagnostics remain in state and in error titles; unknown diagnostics remain unchanged.
- Replaced fixed proficiency abbreviations and English proficiency statistics, group counts and previous/next navigation. Algorithm display names select a matching API language field when present without changing source identity/storage keys.
- Added seven-language province labels to the lit-cities map/list. Country tooltips use localized region names; registration date formatting follows locale while retaining the existing Asia/Shanghai time zone.
- Pure solver annotation/stage/chart formatters now use all seven catalogs even without an injected translator.
- Corrected only `wca.results.prStreakBreakAtSuffix` and `wca.results.prStreakBreakPrevSuffix` in each of `fr.ts` and `es.ts`.
- Did not edit existing `puzzle-extra.ts`, shared `utils/events.ts`, vendor sources or Draw tools.

## Verification

| Check | Result |
| --- | --- |
| `npx tsx --test src/views/Wca/wcaPuzzleI18n.test.ts src/views/TwoSolver/solverMessages.test.ts` | 15 tests pass; 76 × 7 catalog entries have matching keys/placeholders; AST scans 119 production TS/TSX files for fixed JSX text/accessibility labels and implicit WCA event locales |
| `npm run test:two-solver` | 283 tests pass, including full real method datasets and independent replay |
| `npm run test:puzzles` | 75 pass, 1 skipped (optional live backend catalog), 0 failures |
| `npm run test:algs` | 17 timer tests and 31 history/storage tests pass |
| `npm run test:algs:browser` | Passes; added seven consecutive locale changes while timing, retaining running phase, question scramble, session count and exactly one committed solve |
| `npm run test:puzzles:native` | Passes; seven locale changes retain the native player object, 300 ms seek position, pool call counts, observers and WebGL contexts |
| `npx tsx src/views/Wca/wcaPuzzleI18n.browser.test.mjs` | Passes; real Worker search/result/question identities and request counts survive all seven locales; running practice retains history and saves once; WCA country options refresh; Twisty/Square-1 instance, canvas and seek position survive; native ownership errors and canvas aria update |
| Scoped ESLint | 0 errors; 11 existing warnings in WCA files (unused parameters/directives and hook dependencies) |
| Scoped `git diff --check` | Passes |
| Whole-repository `npx tsc --noEmit --pretty false` | Blocked by other agents' `competitionExtra.*` keys not yet included in root `MessageKey`; latest output has no errors in this task's owned files |

## Coverage Boundaries

The isolated browser entry uses production components, real local solver data/Worker, real clocks and actual native players. Only WCA HTTP responses are deterministic fixtures. It does not certify live WCA API responses, Next routing, all page layouts or all combinations of external data. The existing port 3000 server timed out, so it was not restarted or used as evidence of an end-to-end Next pass.

API-provided personal names, competition names, formula case names and local geographic source data are content rather than UI translations. Missing localized source fields retain the available source name. Prefecture/county geometry names and unsupported third-party/internal diagnostic messages can remain in their source language. The AST audit is a regression check, not a claim of complete semantic translation of arbitrary API or vendor content.
