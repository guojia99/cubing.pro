import assert from "node:assert/strict";
import { test } from "node:test";
import { adjustedTime, formatTime } from "./uiPractice";

test("timer precision truncates at the selected resolution without rounding up", () => {
  assert.equal(formatTime(12345), "12.34");
  assert.equal(formatTime(12345, 0), "12");
  assert.equal(formatTime(12345, 1), "12.3");
  assert.equal(formatTime(12345, 3), "12.345");
  assert.equal(formatTime(59999, 2), "59.99");
  assert.equal(formatTime(60000, 3), "1:00.000");
  assert.equal(formatTime(61999, 0), "1:01");
  assert.equal(formatTime(-1, 2), "0.00");
  assert.equal(formatTime(0, 0), "0");
  assert.equal(formatTime(12345, NaN), "12.34");
});

test("display resolution never changes stored penalty calculations", () => {
  assert.equal(adjustedTime({ elapsedMs: 1234.567, penalty: "none" }), 1234.567);
  const penalized = adjustedTime({ elapsedMs: 1234.567, penalty: "+2" });
  assert.equal(penalized, 3234.567);
  assert.equal(formatTime(penalized, 3), "3.234");
  assert.equal(formatTime(adjustedTime({ elapsedMs: 1234.567, penalty: "DNF" }), 0), "DNF");
  assert.equal(formatTime(Infinity, 3), "DNF");
});
