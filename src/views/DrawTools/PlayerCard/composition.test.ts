import assert from "node:assert/strict";
import test from "node:test";
import { CARD_SIZE, INITIAL_CROP, cardFilename, clampCrop, zoomCrop } from "./composition";
import { APP_ROUTES, matchRoute } from "../../../config/routes";
import { getCatchAllStaticParams } from "../../../lib/staticExportPaths";
import { catalogs } from "../../../i18n";

test("landscape and portrait crops cover every edge; zoom preserves the center subject", () => {
  assert.equal(CARD_SIZE, 1080);
  const cases = [
    [clampCrop(1600, 800, { zoom: 1, x: 9999, y: -99 }), { zoom: 1, x: 540, y: 0 }],
    [clampCrop(800, 1600, { zoom: 1, x: -99, y: -9999 }), { zoom: 1, x: 0, y: -540 }],
    [zoomCrop(1600, 800, { zoom: 1, x: 200, y: 0 }, 2), { zoom: 2, x: 400, y: 0 }],
    [zoomCrop(800, 800, { zoom: 3, x: 1080, y: -1080 }, 1), INITIAL_CROP],
    [clampCrop(800, 800, { zoom: 5, x: 9999, y: -9999 }), { zoom: 3, x: 1080, y: -1080 }],
  ];
  for (const [actual, expected] of cases) {
    assert.equal(actual.zoom, expected.zoom);
    assert.ok(Math.abs(actual.x - expected.x) < 1e-9);
    assert.ok(Math.abs(actual.y - expected.y) < 1e-9);
  }
});

test("download names are deterministic, retain CJK, and remove separators", () => {
  assert.equal(cardFilename("  小明  "), "小明-card.png");
  assert.equal(cardFilename(""), "player-card.png");
  assert.equal(cardFilename("  ... "), "player-card.png");
  assert.equal(cardFilename('A/B\\C: D?'), "A-B-C- D--card.png");
  assert.equal(cardFilename("名".repeat(100)), `${"名".repeat(64)}-card.png`);
});

test("public route is registered, statically enumerated and translated in all seven locales", () => {
  assert.equal(matchRoute("/draw-tools/player-card")?.id, "draw-player-card");
  assert.equal(APP_ROUTES.find(route => route.id === "draw-player-card")?.hidden, undefined);
  assert.ok(getCatchAllStaticParams().some(entry => entry.path.join("/") === "draw-tools/player-card"));
  assert.equal(Object.keys(catalogs).length, 7);
  for (const catalog of Object.values(catalogs)) {
    for (const key of Object.keys(catalogs["zh-CN"]).filter(key => key.startsWith("playerCard."))) {
      assert.ok(catalog[key as keyof typeof catalog]?.trim(), key);
    }
    assert.ok(catalog["shell.route.draw-player-card"]);
  }
});
