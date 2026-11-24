import assert from "node:assert/strict";
import test from "node:test";
import { repairPoint, REPAIR_RADIUS } from "./repairBrush";

test("visible brush maps through sourcePoint, zoom, offsets and rounded replacement dimensions", () => {
  for (const [width, height] of [[4032, 3025], [3025, 4032], [800, 800]]) {
    for (const zoom of [1, 1.73, 3]) for (const preview of [286, 512]) {
      const ratio = Math.min(1, 2160 / Math.max(width, height));
      const bw = Math.round(width * ratio), bh = Math.round(height * ratio);
      const crop = { zoom, x: 53, y: -27 };
      const rect = { left: 11, top: 25, width: preview, height: preview };
      const p = repairPoint(width, height, bw, bh, crop, rect, 151, 173);
      const scale = 1080 / Math.min(width, height) * zoom;
      assert.ok(Math.abs((p.x * width / bw * scale + (1080 - width * scale) / 2 + crop.x) * preview / 1080 - 140) < 1e-9);
      assert.ok(Math.abs((p.y * height / bh * scale + (1080 - height * scale) / 2 + crop.y) * preview / 1080 - 148) < 1e-9);
      assert.ok(Math.abs(p.rx * width / bw * scale * preview / 1080 - REPAIR_RADIUS) < 1e-9);
      assert.ok(Math.abs(p.ry * height / bh * scale * preview / 1080 - REPAIR_RADIUS) < 1e-9);
    }
  }
});
