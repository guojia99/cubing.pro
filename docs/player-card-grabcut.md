# Player card: experimental person cutout

The unmodified official [OpenCV.js 4.11.0 release](https://docs.opencv.org/4.11.0/opencv.js)
is shipped with the static app. The JS includes WASM and is 11.4 MB before
compression. It is not fetched on initial load or when viewing or adjusting
the box. The bundled files include the OpenCV Apache 2.0 license, third-party
licenses and recorded SHA-256 digests. Build needs no OpenCV download.
To re-fetch the exact same files, run `node scripts/prepare-player-card-opencv.mjs`.

## Behavior and coordinates

- The CV worker and runtime load only on **抠出人物（试验）**. Ordinary photo,
  existing alpha, solid-background replacement and rectangle editing load no CV.
- A dedicated classic worker imports the same-origin versioned runtime. It has
  no upload code, model or server processing. One worker per job is terminated
  on cancellation, crop change, replacement upload, restore and unmount.
- Rectangle editing is a separate mode from pan, background sampling and eraser.
  Pointer capture keeps touch drags active outside the canvas. Drag inside to
  move, lower-right corner to resize, outside to redraw. Keyboard arrows move;
  Shift+arrows resize. Cancel/lost capture clears the active gesture.
- The rectangle is in normalized preview coordinates. At invocation it maps
  through the square crop's source scale, offsets and zoom into the **full source
  image**, downsampled to at most 720px on its longest side for segmentation.
  Crop/reset cancels the job and resets the preview rectangle. No nickname,
  frame, stage, crop clipping or eraser overlay enters the segmentation input.
- `GC_INIT_WITH_MASK`: inside the box = probable foreground, outside = probable
  background, only the full source image's outermost pixel = definite background.
  Thus accessories outside the box can survive; the rectangle is never a hard
  alpha clip. Photos should leave background at their edges. GrabCut has no
  semantic person recognition; similar foreground/background colors and edge
  touching subjects can require manual repair or restore.
- Five iterations, deterministic RNG seed. Result mask is scaled to a full-source
  replacement raster up to 2160px, without feathering that editable raster.
  Original photo alpha is retained by compositing. Existing output remains 1080².
- Result identity is checked before applying async work; terminating a job also
  rejects its promise. Errors retain the current photo/replacement. On success
  the eraser and restore brush share one-stroke undo. The restore brush brings back
  original pixels only where painted, including thin details missed by GrabCut.
  Restore original background exits the edit entirely.
- Deep blue 24px outer frame + 2px light blue inset are painted into exported PNG.
  The selection overlay is DOM-only. Neither photo RGB nor nickname is blurred.
  Solid, GrabCut and eraser masks share one alpha-only feather after projection
  into the 1080px photo layer. Radius is 5 × zoom output pixels; translation
  does not change it. The stage stays separate; text, outline and frame are painted afterward.
  Alpha is capped by the unfiltered coverage, so deleted background RGB cannot
  reappear; a straight hard edge loses about 1.36px of integrated coverage at
  zoom 1, while fine strands retain nonzero alpha. Binary native PNG alpha uses
  the same path; native PNGs with any semitransparency retain their authored
  alpha unchanged (including narrow antialiasing).

## Focused validation

```sh
node --test src/views/DrawTools/PlayerCard/personCutout.test.mjs
node --test src/views/DrawTools/PlayerCard/grabCutWorker.browser.test.mjs
npx tsx --test src/views/DrawTools/PlayerCard/*.test.ts
npx tsc --noEmit
npm run build:static
node --test src/views/DrawTools/PlayerCard/edgeFeather.browser.test.mjs
node --test src/views/DrawTools/PlayerCard/restoreBrush.browser.test.mjs
node --test src/views/DrawTools/PlayerCard/personCutout.browser.test.mjs
node --test src/views/DrawTools/PlayerCard/repairBrush.browser.test.mjs
node --test src/views/DrawTools/PlayerCard/transparentPhoto.browser.test.mjs
node --test src/views/DrawTools/PlayerCard/playerCard.browser.test.mjs
```

The browser tests serve localhost and generate deterministic synthetic fixtures
for cancel, pointer, boundary and pixel assertions. Separately, both 390px
mouse and touch flows were checked visually using
[Rubik's Cube Mumbai Open](https://commons.wikimedia.org/wiki/File:Rubik%27s_Cube_Mumbai_Open.jpg),
Vishalkhopkar, CC BY-SA 4.0 (not distributed with the app). Framing closely
around the person retained hair, hands and the handheld cube; a loose box
can retain pieces of the background or timer. This remains experimental.
