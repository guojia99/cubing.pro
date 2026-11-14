import assert from "node:assert/strict";
import { test } from "node:test";
import { averageOf, buildPracticeStats, formatPracticeTooltip, formatStatistic, meanOf } from "./practiceStatistics";
import type { PracticeRecord } from "./uiPractice";

function record(id: number, elapsedMs = id * 1000, penalty: PracticeRecord["penalty"] = "none"): PracticeRecord {
  return { id: `record-${id}`, elapsedMs, penalty, inspectionMs: 0, inspectionPenalty: "none",
    scramble: "R U R'", sampling: "random", date: `2026-11-14T00:00:${String(id % 60).padStart(2, "0")}Z` };
}

test("empty and incomplete windows differ from DNF", () => {
  const stats = buildPracticeStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.dnfCount, 0);
  assert.deepEqual(stats.points, []);
  for (const value of [stats.latest, stats.best, stats.mean, stats.mo3, stats.ao5, stats.ao12]) assert.equal(value, null);
  assert.equal(averageOf([1, 2, 3, 4], 5), null);
  assert.equal(averageOf(Array(11).fill(1000), 12), null);
  assert.equal(formatStatistic(null, 2), "—");
  assert.equal(formatStatistic(Infinity, 2), "DNF");
  assert.equal(formatStatistic(12345, 3), "12.345");
});

test("ao5 and ao12 trim ceil(n * .05) at exact window thresholds", () => {
  assert.equal(averageOf([1000, 2000, 3000, 4000, 90000], 5), 3000);
  assert.equal(averageOf([1000, ...Array(10).fill(2000), 90000], 12), 2000);
  assert.equal(averageOf([999999, 1000, 2000, 3000, 4000, 5000], 5), 3000);
  assert.equal(averageOf([0, 1, ...Array(17).fill(10), 98, 99], 21), 10);
});

test("one DNF is dropped, two DNFs invalidate ao5 and ao12", () => {
  for (const n of [5, 12]) {
    assert.equal(averageOf([...Array(n - 1).fill(2000), Infinity], n), 2000);
    assert.equal(averageOf([...Array(n - 2).fill(2000), Infinity, Infinity], n), Infinity);
  }
  assert.equal(meanOf([1000, 2000, Infinity]), Infinity);
  assert.equal(meanOf([1000, 2000, 3000]), 2000);
  assert.equal(meanOf([]), null);
});

test("adjustments retain precision, +2 counts once, and zero remains valid", () => {
  const stats = buildPracticeStats([record(3, 0), record(2, 1234.567, "+2"), record(1, 1000)]);
  assert.equal(stats.latest, 0);
  assert.equal(stats.best, 0);
  assert.equal(stats.points[1].single, 3234.567);
  assert.equal(stats.mo3, (1000 + 3234.567) / 3);
  assert.equal(stats.mean, stats.mo3);
  assert.equal(stats.dnfCount, 0);
  assert.equal(buildPracticeStats([record(1, 1000, "DNF")]).points[0].single, null);
});

test("history reverses without mutation and rolling results precede display truncation", () => {
  const history = Object.freeze(Array.from({ length: 25 }, (_, index) => Object.freeze(record(25 - index))));
  const stats = buildPracticeStats(history, 20);
  assert.equal(history[0].id, "record-25");
  assert.equal(stats.total, 25);
  assert.equal(stats.points.length, 20);
  assert.equal(stats.points[0].record, history[19]);
  assert.equal(stats.points[0].number, 6);
  assert.equal(stats.points[0].ao5, 4000);
  assert.equal(stats.points[5].ao12, null);
  assert.equal(stats.points[6].ao12, 6500);
  assert.equal(stats.points.at(-1)?.record.id, "record-25");
  assert.equal(stats.ao5, 23000);
  assert.equal(stats.ao12, 19500);
});

test("DNF retains its chronological position and expires from exact rolling windows", () => {
  const history = Array.from({ length: 14 }, (_, index) => record(14 - index, 1000, [3, 6].includes(14 - index) ? "DNF" : "none"));
  const stats = buildPracticeStats(history);
  assert.equal(stats.points[2].single, null);
  assert.equal(stats.points[5].single, null);
  assert.equal(stats.points[5].ao5, Infinity);
  assert.equal(stats.points[7].ao5, 1000);
  assert.equal(stats.points[11].ao12, Infinity);
  assert.equal(stats.points[13].ao12, Infinity);
  const expired = buildPracticeStats([record(15, 1000), ...history]);
  assert.equal(expired.ao12, 1000);
  assert.equal(stats.dnfCount, 2);
  assert.equal(stats.mean, Infinity);
  assert.equal(buildPracticeStats([record(3), record(2, 1000, "DNF"), record(1)]).mo3, Infinity);
});

test("all DNF is representable without zero or NaN and display is capped at 200", () => {
  const stats = buildPracticeStats(Array.from({ length: 200 }, (_, i) => record(i, 1000, "DNF")), 200);
  assert.equal(stats.best, Infinity);
  assert.equal(stats.mean, Infinity);
  assert.equal(stats.mo3, Infinity);
  assert.equal(stats.ao5, Infinity);
  assert.equal(stats.ao12, Infinity);
  assert.equal(stats.dnfCount, 200);
  assert.ok(stats.points.every((point) => point.single === null));
  assert.equal(buildPracticeStats(Array.from({ length: 201 }, (_, i) => record(i)), 1000).points.length, 200);
  assert.equal(buildPracticeStats([record(1)], 0).points.length, 1);
});

test("tooltip is plain text for richText, includes source and prevents rich token injection", () => {
  const source = { ...record(1, 1234, "+2"), scramble: '<img src=x onerror="alert(1)"> {evil|text}\nR U' };
  const point = buildPracticeStats([source]).points[0];
  const tooltip = formatPracticeTooltip(point, 3);
  assert.ok(tooltip.includes("3.234 (+2)"));
  assert.ok(tooltip.includes("原始用时：1.234"));
  assert.ok(tooltip.includes(source.date));
  assert.ok(tooltip.includes('<img src=x onerror="alert(1)"> （evil|text） R U'));
  assert.ok(!tooltip.includes("{evil|"));
  assert.equal(tooltip.split("\n").length, 6);
});
