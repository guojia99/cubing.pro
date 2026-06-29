#!/usr/bin/env node
/**
 * 同步 HowToCook 仓库到 public/HowToCook。
 * - 已是 git 仓库：git pull --ff-only
 * - 目录不存在：浅克隆
 * - 目录存在但非 git：备份后重新克隆（克隆失败则恢复备份）
 *
 * 跳过同步：SKIP_HOWTOCOOK_SYNC=1（需 public/HowToCook 已存在）
 */
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const TARGET = path.join(ROOT, "public", "HowToCook");
const REPO = "https://github.com/Anduin2017/HowToCook.git";

/** 上游 LFS 配额常超限；跳过 smudge，保留已有图片或使用无图占位 */
const GIT_ENV = {
  ...process.env,
  GIT_LFS_SKIP_SMUDGE: "1",
};

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: opts.cwd ?? ROOT,
    env: GIT_ENV,
  });
  return result.status === 0;
}

function hasGitRepo(dir) {
  return existsSync(path.join(dir, ".git"));
}

function cloneFresh() {
  return run("git", ["clone", "--depth", "1", REPO, TARGET]);
}

function restoreBackup(backup) {
  if (!backup || !existsSync(backup)) return;
  if (existsSync(TARGET)) {
    rmSync(TARGET, { recursive: true, force: true });
  }
  renameSync(backup, TARGET);
  console.warn("已恢复同步前的 HowToCook 备份");
}

const MEDIA_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

/** 从旧目录补全 git 克隆时未拉取的 LFS 图片 */
function mergeMediaFromBackup(backupRoot) {
  if (!existsSync(backupRoot)) return;

  let merged = 0;
  function walk(src, rel = "") {
    for (const name of readdirSync(src)) {
      const srcPath = path.join(src, name);
      const relPath = path.join(rel, name);
      if (statSync(srcPath).isDirectory()) {
        walk(srcPath, relPath);
        continue;
      }
      if (!MEDIA_EXT.has(path.extname(name).toLowerCase())) continue;
      const dstPath = path.join(TARGET, relPath);
      if (existsSync(dstPath)) continue;
      mkdirSync(path.dirname(dstPath), { recursive: true });
      cpSync(srcPath, dstPath);
      merged += 1;
    }
  }

  walk(backupRoot);
  if (merged > 0) {
    console.log(`从备份补全 ${merged} 个图片文件`);
  }
}

function verifyLayout() {
  const dishes = path.join(TARGET, "dishes");
  const tips = path.join(TARGET, "tips");
  if (!existsSync(dishes) || !existsSync(tips)) {
    console.error("HowToCook 同步后缺少 dishes/ 或 tips/ 目录");
    process.exit(1);
  }
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

if (hasGitRepo(TARGET)) {
  console.log(`更新 HowToCook: ${TARGET}`);
  if (!run("git", ["pull", "--ff-only"], { cwd: TARGET })) {
    process.exit(1);
  }
} else if (!existsSync(TARGET)) {
  console.log(`克隆 HowToCook -> ${TARGET}`);
  if (!cloneFresh()) {
    process.exit(1);
  }
} else {
  const backup = `${TARGET}.bak-${Date.now()}`;
  console.warn(
    `public/HowToCook 存在但不是 git 仓库，备份到 ${path.basename(backup)} 后重新克隆`,
  );
  renameSync(TARGET, backup);
  if (!cloneFresh()) {
    restoreBackup(backup);
    process.exit(1);
  }
  mergeMediaFromBackup(backup);
  rmSync(backup, { recursive: true, force: true });
}

verifyLayout();
console.log("HowToCook 同步完成");
