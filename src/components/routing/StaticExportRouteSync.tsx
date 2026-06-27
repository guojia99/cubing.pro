"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { matchRoute } from "@/config/routes";

const SYNC_ATTEMPT_KEY = "cubing-pro-export-route-sync";

function normalizePathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname.replace(/\/$/, "") || "/");
  } catch {
    return pathname.replace(/\/$/, "") || "/";
  }
}

function isWelcomeEquivalent(a: string, b: string): boolean {
  const welcomePaths = new Set(["/", "/welcome"]);
  return welcomePaths.has(a) && welcomePaths.has(b);
}

function readExportedPath(): string | null {
  const meta = document.querySelector('meta[name="x-export-path"]');
  const value = meta?.getAttribute("content")?.trim();
  return value ? normalizePathname(value) : null;
}

function hasSyncAttempted(browserPath: string): boolean {
  try {
    return sessionStorage.getItem(`${SYNC_ATTEMPT_KEY}:${browserPath}`) === "1";
  } catch {
    return false;
  }
}

function markSyncAttempted(browserPath: string): void {
  try {
    sessionStorage.setItem(`${SYNC_ATTEMPT_KEY}:${browserPath}`, "1");
  } catch {
    // ignore quota / private mode
  }
}

/**
 * 静态导出部署若 fallback 到错误的 index.html，浏览器 URL 正确但 SSR 壳页面不匹配。
 * 对比 meta x-export-path 与 location.pathname，触发客户端导航到真实路由。
 */
export function StaticExportRouteSync() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;

    const browserPath = normalizePathname(window.location.pathname);
    const exportedPath = readExportedPath();
    if (!exportedPath) return;

    if (browserPath === exportedPath) return;
    if (isWelcomeEquivalent(browserPath, exportedPath)) return;

    if (!matchRoute(browserPath)) return;

    // 网关 SPA 回退会导致整页重载；避免对同一路径反复 router.replace 形成刷新死循环
    if (hasSyncAttempted(browserPath)) return;

    synced.current = true;
    markSyncAttempted(browserPath);

    const target =
      window.location.pathname + window.location.search + window.location.hash;
    router.replace(target);
  }, [pathname, router]);

  return null;
}
