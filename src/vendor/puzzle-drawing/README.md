# Local Puzzle Drawing Sources

## Scope

This directory contains only the source dependencies used by the local puzzle
drawing adapters. It has no package installation, API client, account system,
catalog data, training UI or network image endpoint.

| Module | TypeScript files | Purpose |
| --- | ---: | --- |
| `visualcube` | 25 | NxN SVG drawing and view presets |
| `shared` | 7 | Notation, cube facelets and Skewb fan geometry |
| `puzzle-render-core` | 22 | Pyraminx schematic engine, SQ1 SVG and FTO SVG |
| `vendor-sr-puzzlegen` | 36 | Megaminx top SVG and its simulator |

The original extraction contained 137 TypeScript files. Pruning removes 47
unused source files, including other headless engines, puzzle factories and
unrelated simulator/geometry implementations. The retained 90 files are all
reachable from the application or its state-equivalence tests.

## Local Entry Points

- `visualcube/src/index.ts`: `renderCubeSVG` and native drawing helpers.
- `visualcube/src/preset.ts`: `renderFromSimpleQuery`, `buildSimpleOptions`.
- `shared/src/skewb_pyramid_svg.ts`: Skewb fan renderer and sticker state.
- `puzzle-render-core/src/iso-svg.ts`: Pyraminx schematic SVG only.
- `puzzle-render-core/src/sq1-svg.ts`: stacked SQ1 layer drawing.
- `puzzle-render-core/src/fto-eif-image.ts`: FTO EIF drawing.
- `vendor-sr-puzzlegen/src/index.ts`: Megaminx top SVG factory only.

Imports use local relative paths. Application adapters import these files
directly. Only actual external dependencies such as Three.js remain package
imports. No workspace package aliases or special extension resolver are needed.

## Sources and Required Attribution

Extracted from the repository identified in SOURCES.md at commit
`3b1d2cff8634e658cb4ecd9c02d459fa683bc3ea`. Source paths originally began at
`core/packages/<module>/src/`. This link identifies provenance; it is not used
by the application at runtime or by the build.

Original copyright notices and file-specific grants are retained. The source
collection is not uniformly permissively licensed.

| Material | License / attribution | Retained text |
| --- | --- | --- |
| Shared and render-core sources without a file-specific grant | Upstream root GPL version 3; no additional or-later grant inferred | `LICENSE` |
| VisualCube, originally Cride5; TypeScript port Tyler Decker | LGPL-3; original PHP VisualCube (c) Cride5, TypeScript port (c) Tyler Decker | `visualcube/COPYING`, `visualcube/COPYING.LESSER` |
| sr-puzzlegen drawing sources | Apache License 2.0 | `vendor-sr-puzzlegen/LICENSE` |
| `puzzle-render-core/src/support/pg-colors.ts`, from cubing.js v0.63.3, Tomas Rokicki et al. | MPL-2.0, selected in the file header | `puzzle-render-core/LICENSE.pg-colors-MPL-2.0` |
| MIT-derived engine definitions and tweening, huazhechen/cuber | Original MIT copyright and permission notice | `puzzle-render-core/LICENSE.cuber-MIT` |
| Skewb geometry from mihlefeld/ALLG-ImageGen | GPL-3.0; original source attribution in file header | `LICENSE` and the original header |

VisualCube's grant does not relicense its shared dependencies. Both GPL and LGPL
texts remain, as do all original source-file copyright notices. Upstream usage
guides for packages and remote APIs were removed because they do not describe
the local implementation; the license/origin information is retained above.

The supplemental MPL text comes from Mozilla's official license text. The MIT
text is the original `huazhechen/cuber` license (Git blob
`e7b8516e1a837e7c7a18aad78d397ee84527470b`).

## Local Changes

- Workspace package imports were converted to local relative paths.
- Relative `.js` specifiers pointing to TypeScript sources became extensionless.
- Headless and SVG factories were narrowed to the puzzles actually used;
  unsupported kinds explicitly throw rather than drawing a solved fallback.
- Unused source modules and obsolete remote/package usage guides were removed.
- Source directory and application adapter names were made project-neutral.

The remaining drawing/state algorithms retain their original implementation.
The main application separately validates notation and proves action mappings
before calling these renderers. The files are checked by TypeScript and covered
by the puzzle adapter/browser tests; project ESLint excludes only this source
directory to avoid rewriting retained third-party code for house style.
