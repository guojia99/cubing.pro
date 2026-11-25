# Player cards: templates and private storage

The generator defaults to `classic` (1080 × 1080). Its existing `composition.ts`, crop,
background replacement, cutout and repair implementation are unchanged (with a clean
checkerboard overlay while painting repair strokes). `motion` composes an original
1080 × 1440 PNG without the classic square frame, adding an uncropped full-photo
cutout workbench (`motion-workbench`), `22%` original-photo ghosting in restore mode,
and an adjustable brush size alongside GrabCut `cleanSubjectMask` interior-hole filling
(<= 6% enclosed regions) and disconnected exterior island removal.

`motionComposition.ts` paints the authoritative 1080 × 1440 sRGB canvas that is
previewed, downloaded and saved. The nebula, mist, dust, moons and orbital lines are
painted first, behind the photo. There are two local rendering paths:

- For an opaque photo, `autoBackdropMatte.ts` samples the borders at up to 1080 px
  on the long side. A consistent studio backdrop of any hue is removed by an
  edge-connected flood fill. The matte drops isolated specks, softens the edge and
  removes the sampled backdrop color from the fringe. The result is cached while
  the user pans, drags or scales. A native alpha channel or a manual cutout takes priority.
- Cutouts start anchored to the HERO region at (18, 320), size 1044 × 1044, and
  composite across the full 1080 × 1440 card surface via `MotionPlacement` (`x`, `y`,
  `scale`), supporting direct card drag, arrow-key nudges and independent subject
  scaling without mutating the `classic` crop. Interior pixels keep their alpha; only
  when the visible hem reaches y = 1140 does its last 75 px fade. A soft backlight and
  narrow edge light separate the silhouette from the sky. A complex photo instead fills
  a tall arched window with a double gold border and a subtle inner vignette. No
  elliptical mask cuts through the picture.

Only the open gold vines, lilies, outer frame and optional nameplate are drawn in
front. A trimmed nickname centers on the enamel plaque at y = 1262; without one,
the floral crown stays open. The die-cut outer corners remain transparent.

`CardArtwork` uses the live canvas in the editor and the decoded private PNG in
**My cards**. Brush and undo operations increment the edit revision even when the
replacement canvas is mutated in place. Texture updates preserve the current pose.
The lazily loaded Three.js stage samples the same artwork on a full unlit face
(z = 0), a soft-edged subject (14) and the open foreground (36), with a soft frame
shadow between them (22). Projection compensation at a camera distance of 2350
aligns these layers face-on. Only the foreground metalwork receives tilt-dependent reflections (36.2);
four-point glints sit at 38. `motionDesign.ts` supplies shared masks and anchors for
editor and replay. The external stage, floating shadow, parallax, moving dust and
specular glints are playback effects.

The pause control holds the pose, dust and glints. Playback sleeps when the stage
is offscreen or the page is hidden. Reduced-motion uses the original still without
loading the renderer. If WebGL is unavailable or its context is lost, the same
still remains visible. Neither playback path requests a video or the source photo.

## Private API contract

All requests use the existing Request client and AuthHeader. No card API request is
made during guest editing. Only the explicit Save button uploads, with exactly:

- `title`: trimmed display name, limited to 80 Unicode code points, or `小卡`.
- `png`: the final PNG (up to 7 MiB), named `card.png`.
- `template`: `classic` or `motion`.

Endpoints: POST and paginated GET `/user/cube-cards`, private blob GET
`/user/cube-cards/:id/image`, DELETE `/user/cube-cards/:id`. IDs are numeric and used only as URL path segments. Save errors (including 503) leave local PNG download available.
There are no browser COS credentials or original-photo/background-draft uploads.

`/user/cube-cards/` is a static route with an authenticated collection and a guest
login link. It provides pagination, viewing, PNG download and confirmed deletion;
account changes remount private state and image object URLs are revoked on cleanup.

## Focused checks

Run with Node 22 and the repository dependencies:

```sh
node --import tsx --test src/services/cubing-pro/cubeCards.test.ts
node --test src/views/DrawTools/PlayerCard/motionComposition.browser.test.mjs
node --test src/views/DrawTools/PlayerCard/cardExpansion.browser.test.mjs
```

The composition test decodes exported cards with opaque and cutout subjects, with and
without a nickname. It checks studio backdrop removal, retention of opaque hands and clothing, the full
photo window for complex scenes, conditional hem fading, crop mapping, corner alpha,
PNG size, in-place brush cache invalidation and the relief masks used on replay.

The expansion browser harness bundles real components and CSS, with an authentication fixture
and an Axios adapter, and serves all page resources through Playwright memory routes.
It uses only a synthetic geometric cube image. It checks dimensions, unchanged
classic pixels after switching, actual WebGL output, pose changes and pause,
reduced-motion, guest privacy, exact final PNG multipart bytes, 503/download
independence, authenticated replay/download/delete and pagination.

Set `SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE` for an installed browser and optionally
`SITE_PLAYER_CARD_SCREENSHOT` to capture the motion artwork. The separate `playerCard.browser.test.mjs` exercises the classic editor against a local
static build (`SITE_PLAYER_CARD_STATIC_DIR`, default `dist`).
