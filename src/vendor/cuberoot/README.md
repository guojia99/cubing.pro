# Cuberoot offline drawing sources

## Source and scope

Repository: https://github.com/2017YANR02/cuberoot.me

Pinned commit: `3b1d2cff8634e658cb4ecd9c02d459fa683bc3ea`.

Imported on 2026-11-13. Each `<package>/src/...` here retains its original
`core/packages/<package>/src/...` path relative to the package. This is a
source extraction for local, offline puzzle drawing, not the Cuberoot site,
API, account system, catalog, training data, solver, or simulator UI.

The six researched drawing entry points have a union of 137 TypeScript files:

| Package | Files | Drawing entry |
| --- | ---: | --- |
| visualcube | 25 | `src/index.ts`, `src/preset.ts` (NxN) |
| shared | 7 | `src/skewb_pyramid_svg.ts` plus notation/drawing helpers |
| puzzle-render-core | 41 | `src/iso-svg.ts` (Pyraminx), `src/sq1-svg.ts`, `src/fto-eif-image.ts` |
| vendor-sr-puzzlegen | 64 | `src/index.ts` (Megaminx and its upstream visualizer closure) |

The upstream `iso-svg` headless factory references all four non-NxN engines;
the sr-puzzlegen visualizer factory references its other puzzle renderers.
Those dependencies are retained to keep the original implementations intact.
`alg-thumb-plan.ts` and its ten additional plan-only dependencies are omitted,
including catalog, HTML sanitization, cube orientation, and puzzle-solvers.

## Import aliases

The root `tsconfig.json` maps upstream export names directly to local files.
There is deliberately no `@cuberoot/shared` root barrel or wildcard alias:
import the exact drawing/notation subpath so unrelated site code cannot load.
There is no invented root barrel for puzzle-render-core either.

| Import | Local entry | Main export |
| --- | --- | --- |
| `@cuberoot/visualcube` | `visualcube/src/index.ts` | `renderCubeSVG` |
| `@cuberoot/visualcube/svg` | `visualcube/src/preset.ts` | `renderFromSimpleQuery` |
| `@cuberoot/vendor-sr-puzzlegen` | `vendor-sr-puzzlegen/src/index.ts` | `SVG`, `SvgVisualizer`, `VisualizerType` |
| `@cuberoot/puzzle-render-core/iso-svg` | `puzzle-render-core/src/iso-svg.ts` | `renderPuzzleIsoSvg` |
| `@cuberoot/puzzle-render-core/sq1-svg` | `puzzle-render-core/src/sq1-svg.ts` | `renderSq1ScrambleSvg`, `renderSq1Svg` |
| `@cuberoot/puzzle-render-core/fto-eif-image` | `puzzle-render-core/src/fto-eif-image.ts` | `renderFtoEifSvg` |
| `@cuberoot/shared/skewb-pyramid-svg` | `shared/src/skewb_pyramid_svg.ts` | `renderSkewbPyramidSvgParametric` |

Additional exact aliases expose shared `alg-notation`, `cube-unfolded-svg`,
`fto-notation`, `nnn-sim`, `sq1-notation`, `sr-rotations`, and render-core
`fto-draw-elements`, `support/sq1-stage-mask`, `support/cube-colors`.
The hyphenated export names intentionally map to upstream underscore filenames.

The sr-puzzlegen `SVG`/`SvgVisualizer` entry needs a browser DOM, but no network.
The other tabled render functions return SVG strings without a browser DOM.
Rendering adapters should import these entries and supply local algorithms,
colors and dimensions; no remote image endpoint is required.

## Licenses and attribution

These sources do not all have permissive licenses. Original file notices are
retained and take precedence for their respective code.

| Material | Upstream evidence / license | Retained text |
| --- | --- | --- |
| Cuberoot repository; shared and render-core without a package-specific grant | Root GPL version 3; no additional or-later grant inferred | `LICENSE` (upstream root `LICENSE`) |
| VisualCube, originally Cride5; TypeScript port Tyler Decker | Package README declares LGPL-3 | `visualcube/COPYING`, `visualcube/COPYING.LESSER` |
| sr-puzzlegen fork | Package's Apache License 2.0, rather than unrelated registry metadata | `vendor-sr-puzzlegen/LICENSE` |
| render-core `support/pg-colors.ts`, from cubing.js v0.63.3, Tomas Rokicki et al. | File expressly selects MPL-2.0 | `puzzle-render-core/LICENSE.pg-colors-MPL-2.0` |
| MIT-derived portions of render-core `engine/define.ts`, `engine/tweener.ts` | File headers identify huazhechen/cuber | `puzzle-render-core/LICENSE.cuber-MIT` |
| shared `skewb_pyramid_svg.ts` geometry | File attributes mihlefeld/ALLG-ImageGen, GPL-3.0 | Original file notice and root GPLv3 text |

VisualCube's LGPL notice does not relicense its shared GPL dependencies or the
whole extracted closure. GPL text in `visualcube/COPYING` accompanies the LGPL
text. Original VisualCube documentation is retained as
`visualcube/UPSTREAM_PACKAGE_README.md` (original package `README.md`) and
`visualcube/UPSTREAM_README.md` (same upstream path/name).

The missing MPL text was obtained from Mozilla's official license text:
https://www.mozilla.org/media/MPL/2.0/index.815ca599c9df.txt

The missing MIT text was obtained from the original project's GitHub license
API, blob `e7b8516e1a837e7c7a18aad78d397ee84527470b`:
https://api.github.com/repos/huazhechen/cuber/license

## Local changes and verification

- Package-relative source structure, imports, comments and notices are retained.
- No application adapters, components, package manifests, or dependencies are
  changed by this extraction. Alias configuration is in the root tsconfig only.
- All 137 upstream source Git blob SHA-1 values match the research
  `closure-integrity.json`; the source is byte-for-byte identical to the pin.
- `npx tsc --noEmit --incremental false --pretty false` passes with the existing
  Three.js 0.170.0 / installed @types/three, despite upstream targeting 0.183.
  No Three.js API compatibility edits or dependency upgrades were necessary.
- Offline runtime smoke checks pass for NxN sizes 2 through 7, all four
  headless engines, SQ1 net, FTO and Skewb fan, with finite SVG coordinates.
  A Chromium smoke check of the bundled sr-puzzlegen Megaminx renders 133
  polygons with zero network requests (including its fork's `cameraDist`).
