#!/usr/bin/env node
/**
 * 同步 HowToCook 仓库到 public/HowToCook。
 *
 * 流程：
 * 1. 在 /tmp 缓存目录维护 git 仓库（跨构建复用）
 * 2. 按顺序尝试镜像站 clone / pull
 * 3. git lfs pull 拉取大文件
 * 4. 将工作区文件（不含 .git）同步到 public/HowToCook
 *
 * 环境变量：
 * - SKIP_HOWTOCOOK_SYNC=1  跳过同步（需 public/HowToCook 已存在）
 * - HOWTOCOOK_CACHE_DIR    缓存目录，默认 /tmp/cubing-pro-howtocook-cache
 * - HOWTOCOOK_MIRRORS      逗号分隔的 git 远程 URL，按顺序尝试
 *
 * 跳过同步：SKIP_HOWTOCOOK_SYNC=1（需 public/HowToCook 已存在）
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const TARGET = path.join(ROOT, "public", "HowToCook");
const CACHE =
  process.env.HOWTOCOOK_CACHE_DIR?.trim() || "/tmp/cubing-pro-howtocook-cache";

const UPSTREAM = "https://github.com/Anduin2017/HowToCook.git";

const DEFAULT_MIRRORS = [
  "https://gh-proxy.com/https://github.com/Anduin2017/HowToCook.git",
  UPSTREAM,
];

const MIRRORS = (
  process.env.HOWTOCOOK_MIRRORS
    ? process.env.HOWTOCOOK_MIRRORS.split(",")
    : DEFAULT_MIRRORS
)
  .map((url) => url.trim())
  .filter(Boolean);

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: opts.inherit === false ? "pipe" : "inherit",
    cwd: opts.cwd ?? ROOT,
    env: opts.env ?? process.env,
    encoding: opts.inherit === false ? "utf8" : undefined,
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
  };
}

function hasGitRepo(dir) {
  return existsSync(path.join(dir, ".git"));
}

function tryWithMirrors(action) {
  const errors = [];
  for (const mirror of MIRRORS) {
    console.log(`尝试镜像: ${mirror}`);
    const result = action(mirror);
    if (result.ok) {
      console.log(`镜像成功: ${mirror}`);
      return result;
    }
    const detail = result.stderr || result.stdout || "未知错误";
    errors.push(`${mirror}: ${detail}`);
    console.warn(`镜像失败: ${mirror}`);
  }
  console.error("所有镜像均失败:\n" + errors.join("\n"));
  return { ok: false };
}

function cloneToCache(mirror) {
  if (existsSync(CACHE)) {
    rmSync(CACHE, { recursive: true, force: true });
  }
  mkdirSync(path.dirname(CACHE), { recursive: true });
  return run("git", ["clone", "--depth", "1", mirror, CACHE], { inherit: false });
}

function pullInCache(mirror) {
  run("git", ["remote", "set-url", "origin", mirror], { cwd: CACHE, inherit: false });
  return run("git", ["pull", "--ff-only"], { cwd: CACHE, inherit: false });
}

function ensureLfsInCache() {
  const install = run("git", ["lfs", "install", "--local"], {
    cwd: CACHE,
    inherit: false,
  });
  if (!install.ok) {
    console.warn("git lfs install 失败，请确认已安装 git-lfs");
    return false;
  }
  const pull = run("git", ["lfs", "pull"], { cwd: CACHE, inherit: false });
  if (!pull.ok) {
    console.warn("git lfs pull 失败，图片等大文件可能不完整");
    return false;
  }
  return true;
}

function syncCacheToTarget() {
  mkdirSync(path.dirname(TARGET), { recursive: true });

  if (existsSync(TARGET)) {
    rmSync(TARGET, { recursive: true, force: true });
  }
  mkdirSync(TARGET, { recursive: true });

  let copied = 0;
  for (const name of readdirSync(CACHE)) {
    if (name === ".git") continue;
    const src = path.join(CACHE, name);
    const dst = path.join(TARGET, name);
    cpSync(src, dst, { recursive: true });
    copied += 1;
  }
  console.log(`已从缓存同步 ${copied} 个顶层项到 ${TARGET}`);
}

function verifyLayout() {
  const dishes = path.join(TARGET, "dishes");
  const tips = path.join(TARGET, "tips");
  if (!existsSync(dishes) || !existsSync(tips)) {
    console.error("HowToCook 同步后缺少 dishes/ 或 tips/ 目录");
    process.exit(1);
  }
}

function updateCache() {
  console.log(`HowToCook 缓存目录: ${CACHE}`);

  if (hasGitRepo(CACHE)) {
    console.log("更新缓存仓库…");
    const result = tryWithMirrors((mirror) => pullInCache(mirror));
    if (!result.ok) {
      process.exit(1);
    }
  } else {
    console.log("克隆到缓存目录…");
    const result = tryWithMirrors((mirror) => cloneToCache(mirror));
    if (!result.ok) {
      process.exit(1);
    }
  }

  console.log("拉取 Git LFS 大文件…");
  ensureLfsInCache();
}

if (process.env.SKIP_HOWTOCOOK_SYNC === "1") {
  console.log("SKIP_HOWTOCOOK_SYNC=1，跳过 HowToCook 同步");
  if (!existsSync(TARGET)) {
    console.error("public/HowToCook 不存在，无法跳过同步");
    process.exit(1);
  }
  verifyLayout();
  process.exit(0);
}

updateCache();
syncCacheToTarget();
verifyLayout();
console.log("HowToCook 同步完成");
