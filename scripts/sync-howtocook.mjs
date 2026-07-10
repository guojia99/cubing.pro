#!/usr/bin/env node
/**
 * 克隆 HowToCook 到 public/HowToCook。
 * - 在 /tmp 缓存 git 仓库，已存在则复用
 * - 将缓存内容（不含 .git）同步到 public/HowToCook
 *
 * 跳过：SKIP_HOWTOCOOK_SYNC=1（需 public/HowToCook 已存在）
 * 可覆盖：HOWTOCOOK_CACHE_DIR（默认 /tmp/cubing-pro-howtocook-cache）
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const TARGET = path.join(ROOT, "public", "HowToCook");
const CACHE =
  process.env.HOWTOCOOK_CACHE_DIR?.trim() || "/tmp/cubing-pro-howtocook-cache";
const REPO = "https://gh-proxy.com/https://github.com/Anduin2017/HowToCook.git";

function hasGitRepo(dir) {
  return existsSync(path.join(dir, ".git"));
}

function cloneToCache() {
  mkdirSync(path.dirname(CACHE), { recursive: true });
  const result = spawnSync("git", ["clone", REPO, CACHE], {
    stdio: "inherit",
    cwd: ROOT,
  });
  return result.status === 0;
}

function syncCacheToTarget() {
  mkdirSync(path.dirname(TARGET), { recursive: true });

  if (existsSync(TARGET)) {
    rmSync(TARGET, { recursive: true, force: true });
  }
  mkdirSync(TARGET, { recursive: true });

  for (const name of readdirSync(CACHE)) {
    if (name === ".git") continue;
    cpSync(path.join(CACHE, name), path.join(TARGET, name), { recursive: true });
  }
}

if (process.env.SKIP_HOWTOCOOK_SYNC === "1") {
  if (!existsSync(TARGET)) {
    console.error("public/HowToCook 不存在，无法跳过同步");
    process.exit(1);
  }
  process.exit(0);
}

if (!hasGitRepo(CACHE)) {
  console.log(`克隆 HowToCook -> ${CACHE}`);
  if (!cloneToCache()) {
    process.exit(1);
  }
} else {
  console.log(`复用缓存: ${CACHE}`);
}

if (!existsSync(TARGET)) {
  console.log(`同步到 ${TARGET}`);
  syncCacheToTarget();
}

process.exit(0);
