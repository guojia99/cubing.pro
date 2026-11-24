# Player cards: templates and private storage

The generator defaults to `classic` (1080 × 1080). Its existing `composition.ts`, crop,
background replacement, cutout and repair implementation are unchanged. `motion`
uses the same editor values to compose an original 1080 × 1440 PNG, without the
classic square frame. Its square crop editor remains separate from the final preview.

`CardArtwork` and its CSS module render both the generator's motion preview and
private saved artwork. Perspective float and foil sweep are CSS animations, with a
pause control. Reduced-motion displays a still frame and hides that control. PNG
files are still images; animation replays in **My cards** from `template: motion`.
No video export or additional dependencies are introduced.

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
node --test src/views/DrawTools/PlayerCard/cardExpansion.browser.test.mjs
```

The browser harness bundles real components and CSS, with an authentication fixture
and an Axios adapter, and serves all page resources through Playwright memory routes.
It uses only a synthetic geometric cube image. It checks dimensions, unchanged
classic pixels after switching, visible changing transforms and sweep, pause,
reduced-motion, guest privacy, exact final PNG multipart bytes, 503/download
independence, authenticated replay/download/delete and pagination.

Set `SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE` for an installed browser and optionally
`SITE_PLAYER_CARD_SCREENSHOT` to capture the motion artwork. Actual Go fixture,
static build and visual review run externally; adapter tests do not replace them.
