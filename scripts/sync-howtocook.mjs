#!/usr/bin/env node
/**
 * 同步 HowToCook 到 public/HowToCook。
 *
 * 模式一（指定本地目录）：
 * - HOWTOCOOK_SOURCE_DIR=/path/to/HowToCook
 * - 每次构建都从该目录拷贝到 public/HowToCook（覆盖）
 *
 * 模式二（默认）：
 * - 在 /tmp 缓存 git 仓库，已存在则复用
 * - public/HowToCook 不存在时，从缓存拷贝
 *
 * 跳过：SKIP_HOWTOCOOK_SYNC=1（需 public/HowToCook 已存在）
 * 可覆盖：HOWTOCOOK_CACHE_DIR（默认 /tmp/cubing-pro-howtocook-cache）
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const TARGET = path.join(ROOT, "public", "HowToCook");
const SOURCE_DIR = process.env.HOWTOCOOK_SOURCE_DIR?.trim();
const CACHE =
  process.env.HOWTOCOOK_CACHE_DIR?.trim() || "/tmp/cubing-pro-howtocook-cache";
const REPO = "https://gh-proxy.com/https://github.com/Anduin2017/HowToCook.git";

function hasGitRepo(dir) {
  return existsSync(path.join(dir, ".git"));
}

function verifyLayout(dir) {
  const dishes = path.join(dir, "dishes");
  const tips = path.join(dir, "tips");
  if (!existsSync(dishes) || !existsSync(tips)) {
    console.error(`${dir} 缺少 dishes/ 或 tips/ 目录`);
    process.exit(1);
  }
}

function resolveSourceDir() {
  const resolved = path.resolve(SOURCE_DIR);
  if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
    console.error(`HOWTOCOOK_SOURCE_DIR 不是有效目录: ${resolved}`);
    process.exit(1);
  }
  return resolved;
}

function copyDirToTarget(source) {
  mkdirSync(path.dirname(TARGET), { recursive: true });

  if (existsSync(TARGET)) {
    rmSync(TARGET, { recursive: true, force: true });
  }
  mkdirSync(TARGET, { recursive: true });

  for (const name of readdirSync(source)) {
    if (name === ".git") continue;
    cpSync(path.join(source, name), path.join(TARGET, name), { recursive: true });
  }
}

function cloneToCache() {
  mkdirSync(path.dirname(CACHE), { recursive: true });
  const result = spawnSync("git", ["clone", REPO, CACHE], {
    stdio: "inherit",
    cwd: ROOT,
  });
  return result.status === 0;
}

if (process.env.SKIP_HOWTOCOOK_SYNC === "1") {
  if (!existsSync(TARGET)) {
    console.error("public/HowToCook 不存在，无法跳过同步");
    process.exit(1);
  }
  process.exit(0);
}

if (SOURCE_DIR) {
  const source = resolveSourceDir();
  verifyLayout(source);
  console.log(`从本地目录拷贝: ${source} -> ${TARGET}`);
  copyDirToTarget(source);
  verifyLayout(TARGET);
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
  copyDirToTarget(CACHE);
  verifyLayout(TARGET);
}

process.exit(0);
