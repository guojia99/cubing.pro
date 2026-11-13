#!/usr/bin/env node
/**
 * 准备 HowToCook 数据：同步到 public/HowToCook，再生成 public/recipes.json、tips.json。
 *
 * 全部跳过（直接使用仓库内已有数据）：SKIP_HOWTOCOOK=1
 * 仅跳过同步：SKIP_HOWTOCOOK_SYNC=1（需 public/HowToCook 已存在）
 * 仅跳过解析：SKIP_HOWTOCOOK_PARSE=1（沿用现有 JSON）
 */
import { spawnSync } from "node:child_process";

const NPM = process.platform === "win32" ? "npm.cmd" : "npm";

function run(script) {
  const result = spawnSync(NPM, ["run", script], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.env.SKIP_HOWTOCOOK === "1") {
  console.log("SKIP_HOWTOCOOK=1，跳过 HowToCook 同步与解析");
  process.exit(0);
}

run("howtocook:sync");

if (process.env.SKIP_HOWTOCOOK_PARSE === "1") {
  console.log("SKIP_HOWTOCOOK_PARSE=1，跳过 HowToCook 解析");
  process.exit(0);
}

run("howtocook:parse");
