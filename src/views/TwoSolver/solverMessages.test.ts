import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import ts from "typescript";
import { twoSolverEngineEnUS, twoSolverEngineZhCN } from "../../i18n/messages/two-solver-engine";
import { evaluateErgonomics } from "./engine/ergonomics";
import { localizeEngineText } from "./solverMessages";

const han = /\p{Script=Han}/u;
const messages: readonly (readonly [string, string])[] = [
  ["初始化完整状态引擎", "Initializing the full-state engine"],
  ["生成二阶随机状态打乱", "Generating a random-state 2x2 scramble"],
  ["已取消", "Cancelled"],
  ["任务已取消", "Task cancelled"],
  ["已有搜索任务正在运行", "A search is already running"],
  ["初始化或搜索超时，请重试或减少启用的方法", "Initialization or search timed out. Try again or enable fewer methods."],
  ["求解 Worker 加载失败", "Failed to load the solver Worker"],
  ["缺少搜索参数", "Missing search options"],
  ["未能生成满足至少 4 步还原条件的打乱，请重试", "Could not generate a scramble requiring at least 4 moves to solve. Please try again."],
  ["序列过长（最多 4000 个字符）", "Sequence too long (maximum 4000 characters)"],
  ["括号嵌套过深", "Parentheses are nested too deeply"],
  ["序列展开不能超过 200 步", "The expanded sequence cannot exceed 200 moves"],
  ["动作转数须为非零安全整数", "Move amounts must be nonzero safe integers"],
  ["层转动不能超过 100 步", "The sequence cannot exceed 100 layer turns"],
  ["请选择有效的方法", "Please select valid methods"],
  ["请选择有效底色", "Please select valid bottom colors"],
  ["做底深度须在 0–6 之间", "Base depth must be between 0 and 6"],
  ["各体系做底深度须在 0–6 之间", "Each method family's base depth must be between 0 and 6"],
  ["消步最大重叠数须在 0–6 之间", "Maximum cancellation overlap must be between 0 and 6"],
  ["无效的动作集合", "Invalid move set"],
  ["无效的搜索时间上限", "Invalid search time limit"],
  ["无效的结果上限", "Invalid result limit"],
  ["请输入至少一个层转动", "Please enter at least one layer turn"],
  ["含启发式估计；成本为相对排序权重，不代表实测用时。", "Includes heuristic estimates; cost is a relative ranking weight, not a measured execution time."],
  ["采用 two-tool 三连参考权重；不代表个人实测速度。", "Uses two-tool reference triplet weights; does not represent your measured speed."],
  ["F 起手增加参考三连均值一半的启动成本，属于握姿启发式。", "Starting with F adds half the mean reference triplet weight as a startup cost, based on a grip heuristic."],
  ["短片段或缺失三连使用参考均值及局部动作估计；不按 B/D/L 面名加罚。", "Short segments or missing triplets use the reference mean and local move estimates; B/D/L face names carry no extra penalty."],
  ["无层转动作；前置转体不计成本。", "No layer turns; leading cube rotations have no cost."],
  ["无法读取本地历史，仍可继续本次练习。", "Could not read local history. You can continue this practice session."],
  ["无法在此设备保存历史，请保持页面打开以保留本次练习记录。", "Could not save history on this device. Keep this page open to retain this session's records."],
  ["20 条已验证解法", "20 verified solutions"],
  ["加载 TCLL+ 公式", "Loading TCLL+ algorithms"],
  ["建立 TCLL- 完整状态索引", "Building the TCLL- full-state index"],
  ["做底深度 3/6 · 123,456 节点 · 20 条解法", "Base depth 3/6 · 123,456 nodes · 20 solutions"],
  ["LS9 公式加载失败 (404)", "Failed to load LS9 algorithms (404)"],
  ["EGLS2 公式数据格式错误", "Invalid EGLS2 algorithm data format"],
  ["二阶不支持动作 M2", "Unsupported 2x2 move: M2"],
  ["内部转体 12 次，分别计费并估计换手；三连上下文在此断开。", "12 internal cube rotations, each charged separately with an estimated regrip; triplet context is interrupted at each rotation."],
  ["F2 R' 出现 7 次，启发式估计可能换手，实际取决于指法。", "F2 R' occurs 7 times; possible regrips are estimated heuristically and depend on finger tricks."],
];

test("known wire messages have precise English translations and unchanged Chinese", () => {
  for (const [raw, expected] of messages) {
    assert.equal(localizeEngineText(raw, "en-US"), expected, raw);
    assert.doesNotMatch(expected, han, raw);
    assert.equal(localizeEngineText(raw, "zh-CN"), raw);
    assert.equal(localizeEngineText(expected, "en-US"), expected);
  }
});

test("all named engine catalog entries have matching parameters and adapter coverage", () => {
  assert.deepEqual(Object.keys(twoSolverEngineEnUS).sort(), Object.keys(twoSolverEngineZhCN).sort());
  const params: Record<string, string> = { method: "TCLL+", status: "503", move: "M2", count: "20", depth: "0", maxDepth: "6", nodes: "9,876,543" };
  const interpolate = (text: string) => text.replace(/\{(\w+)\}/g, (_, name: string) => {
    assert.ok(name in params, `Missing test parameter ${name}`);
    return params[name];
  });
  for (const key of Object.keys(twoSolverEngineZhCN) as (keyof typeof twoSolverEngineZhCN)[]) {
    assert.ok(key.startsWith("two.engine."));
    const zh = twoSolverEngineZhCN[key], en = twoSolverEngineEnUS[key];
    assert.deepEqual(zh.match(/\{\w+\}/g)?.sort(), en.match(/\{\w+\}/g)?.sort(), key);
    assert.doesNotMatch(en, han, key);
    assert.equal(localizeEngineText(interpolate(zh), "en-US"), interpolate(en), key);
    assert.equal(localizeEngineText(interpolate(zh), "zh-CN"), interpolate(zh), key);
  }
});

test("dynamic method IDs, HTTP statuses, depths and counters remain literal", () => {
  const methods = ["CLL", "EG1", "EG2", "LEG1", "TCLL+", "TCLL-", ...Array.from({ length: 9 }, (_, i) => `LS${i + 1}`), "CBL", "EGLS1", "EGLS2", "TEG1", "TEG2", "FH"];
  for (const method of methods) {
    assert.equal(localizeEngineText(`加载 ${method} 公式`, "en-US"), `Loading ${method} algorithms`);
    assert.equal(localizeEngineText(`建立 ${method} 完整状态索引`, "en-US"), `Building the ${method} full-state index`);
    assert.equal(localizeEngineText(`${method} 公式数据格式错误`, "en-US"), `Invalid ${method} algorithm data format`);
    for (const status of [0, 403, 404, 500, 503]) {
      assert.equal(localizeEngineText(`${method} 公式加载失败 (${status})`, "en-US"), `Failed to load ${method} algorithms (${status})`);
    }
  }
  const nodes = ["0", "1234567", "1,234,567", "1.234.567", "1 234 567", "1\u00a0234\u00a0567", "1\u202f234\u202f567", "١٬٢٣٤٬٥٦٧", "1’234’567"];
  for (let depth = 0; depth <= 6; depth++) for (const count of [0, 1, 20, 2000]) {
    assert.equal(localizeEngineText(`${count} 条已验证解法`, "en-US"), `${count} verified solutions`);
    for (const n of nodes) {
      assert.equal(localizeEngineText(`做底深度 ${depth}/6 · ${n} 节点 · ${count} 条解法`, "en-US"), `Base depth ${depth}/6 · ${n} nodes · ${count} solutions`);
    }
  }
});

test("unsupported notation and complete Error/RangeError help retain raw parameters", () => {
  const formula = "[M2, (R U R')2] $& $$ $` $' {move} {count}\nR′ U’";
  assert.equal(localizeEngineText(`二阶不支持动作 ${formula}`, "en-US"), `Unsupported 2x2 move: ${formula}`);
  for (const prefix of ["Error: ", "RangeError: ", "SyntaxError: ", "TypeError: ", "AbortError: ", "Error: RangeError: "]) {
    for (const [raw, expected] of messages) {
      assert.equal(localizeEngineText(prefix + raw, "en-US"), prefix + expected);
      assert.equal(localizeEngineText(prefix + raw, "zh-CN"), prefix + raw);
    }
    assert.equal(localizeEngineText(prefix + `二阶不支持动作 ${formula}`, "en-US"), prefix + `Unsupported 2x2 move: ${formula}`);
  }
});

test("English/native errors and unknown diagnostics pass through without losing details", () => {
  for (const text of [
    "", "Failed to fetch", "Unexpected end of input", "Invalid rotation conjugation", "Unknown move M",
    "Empty formula", "Invalid whole-cube rotation", "Stage normalization changed the exact transformation",
    "Boundary reduction changed the exact transformation", "RUF scramble conversion changed the physical state",
    "RangeError: Expected canonical face turns or x/y/z rotations.",
    "SyntaxError: Unexpected token at index 7: R @ U", "Error: Network failure (503)",
    "新的诊断：请保留原文 R U R'", "Error: 未知异常 (id=42)",
    "前缀：请选择有效的方法", "请选择有效的方法（额外诊断）", "加载 CLL 公式失败",
    "做底深度 3/6 · 未知计数 节点 · 20 条解法", "内部转体 2 次，新的说明。",
    "R U R'", "白", "同色面，下层排列完整",
  ]) {
    assert.equal(localizeEngineText(text, "en-US"), text);
    assert.equal(localizeEngineText(text, "zh-CN"), text);
  }
});

test("actual ergonomics notes localize without mutating scores or original notes", () => {
  const seen = new Set<string>();
  for (const alg of ["", "x y2", "R", "R U", "R U R'", "B D L", "F R U", "R x U y2 F", "F2 R' x U F2 R'"]) {
    const result = evaluateErgonomics(alg ? alg.split(" ") : []);
    const snapshot = structuredClone(result);
    for (const note of result.notes) {
      seen.add(note);
      assert.doesNotMatch(localizeEngineText(note, "en-US"), han, note);
      assert.equal(localizeEngineText(note, "zh-CN"), note);
    }
    assert.deepEqual(result, snapshot);
  }
  assert.ok(seen.size >= 7, "Exercise reference, estimate, startup, rotation, regrip, fallback and empty notes");
});

test("every current Chinese wire literal/template in engine, worker and hook is mapped", () => {
  // Inspect syntax nodes rather than matching comments, descriptor metadata or
  // test fixtures. A new wire phrase should fail here until the map is updated.
  const values: Record<string, string> = {
    method: "TCLL+", "dataset.method": "LS9", "response.status": "503", m: "M2",
    depth: "3", maxDepth: "6", "nodes.toLocaleString()": "1,234,567",
    "results.size": "20", "response.solutions.length": "20", rotations: "2", pairRegrips: "3",
  };
  let checked = 0;
  for (const file of ["engine/state.ts", "engine/search.ts", "engine/library.ts", "engine/ergonomics.ts", "engine/cancellation.ts", "engine/scramble.ts", "solver.worker.ts", "useTwoSolver.ts"]) {
    const source = ts.createSourceFile(file, readFileSync(path.resolve(__dirname, file), "utf8"), ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node) {
      let raw: string | undefined;
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) raw = node.text;
      if (ts.isTemplateExpression(node) && han.test(node.getText(source))) {
        raw = node.head.text;
        for (const span of node.templateSpans) {
          const name = span.expression.getText(source);
          assert.ok(name in values, `${file}: add a test value for ${name}`);
          raw += values[name] + span.literal.text;
        }
      }
      if (raw && han.test(raw)) {
        assert.doesNotMatch(localizeEngineText(raw, "en-US"), han, `${file}: ${raw}`);
        assert.equal(localizeEngineText(raw, "zh-CN"), raw);
        checked++;
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.ok(checked >= 35, `Expected all current wire phrases, checked ${checked}`);
});

test("switching display locale reuses original progress and errors", () => {
  const state = Object.freeze({ progress: "做底深度 2/5 · 12,345 节点 · 20 条解法", error: "CLL 公式加载失败 (503)" });
  for (const locale of ["zh-CN", "en-US", "zh-CN", "en-US"] as const) {
    assert.equal(localizeEngineText(state.progress, locale), locale === "zh-CN" ? state.progress : "Base depth 2/5 · 12,345 nodes · 20 solutions");
    assert.equal(localizeEngineText(state.error, locale), locale === "zh-CN" ? state.error : "Failed to load CLL algorithms (503)");
  }
});
