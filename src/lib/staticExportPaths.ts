import { APP_ROUTES } from "@/config/routes";
import type { AlgCubeMap } from "@/services/cubing-pro/algs/algs";

function getBuildTimeApiBase(): string {
  return (
    process.env.CUBE_API_UPSTREAM ??
    process.env.NEXT_PUBLIC_API_BASE ??
    "https://cubing.pro/v3/cube-api"
  );
}

/** 已由 app 目录单独实现的页面，不再由 [...path] 预渲染 */
const DEDICATED_PATHS = new Set([
  "welcome",
  "login",
  "settings",
  "auth/callback",
  "user/profile",
]);

function patternToPathSegments(pattern: string): string[] {
  return pattern.replace(/^\//, "").split("/").filter(Boolean);
}

/** 不含动态段（:param）且非独立 page 的路由，用于静态导出 generateStaticParams */
export function getCatchAllStaticParams(): { path: string[] }[] {
  return APP_ROUTES.filter((route) => {
    if (route.pattern.includes(":")) return false;
    const segments = patternToPathSegments(route.pattern);
    const key = segments.join("/");
    return !DEDICATED_PATHS.has(key);
  }).map((route) => ({
    path: patternToPathSegments(route.pattern),
  }));
}

/** /algs/:cube/:class — 构建时从 API 拉取全部分组 */
export function getAlgsDetailStaticParamsFromMap(map: AlgCubeMap): { path: string[] }[] {
  const params: { path: string[] }[] = [];

  for (const cube of map.CubeKeys) {
    for (const item of map.ClassMap[cube] ?? []) {
      params.push({
        path: ["algs", cube, encodeURIComponent(item.name)],
      });
    }
  }

  return params;
}

async function fetchAlgCubeMapForBuild(): Promise<AlgCubeMap | null> {
  try {
    const res = await fetch(`${getBuildTimeApiBase()}/public/algorithm/`, {
      cache: "force-cache",
    });
    if (!res.ok) return null;
    return (await res.json()) as AlgCubeMap;
  } catch {
    return null;
  }
}

/**
 * WCA 选手页 `/wca/player/:wcaId` — 静态导出时预生成的 ID 列表。
 * 构建可设 `WCA_STATIC_PLAYER_IDS=2018SHEN07,2019COMP01`；未设置则不预生成（依赖站内跳转 + 服务器 fallback）。
 */
/** 静态导出占位页：配合服务器 fallback，客户端从 URL 读取真实 wcaId */
export const WCA_PLAYER_EXPORT_PLACEHOLDER = "__dynamic__";

export function getWcaPlayerStaticParams(): { wcaId: string }[] {
  const raw = process.env.WCA_STATIC_PLAYER_IDS?.trim();
  if (raw) {
    const ids = raw
      .split(",")
      .map((id) => id.trim().toUpperCase())
      .filter((id) => id.length === 10)
      .map((wcaId) => ({ wcaId }));
    if (ids.length > 0) return ids;
  }

  const staticExport =
    process.env.NEXT_OUTPUT_EXPORT === "1" ||
    process.env.NEXT_OUTPUT_EXPORT === "true";
  if (staticExport) {
    return [{ wcaId: WCA_PLAYER_EXPORT_PLACEHOLDER }];
  }

  return [];
}

/** catch-all 静态导出参数：固定路由 + 公式详情 */
export async function getAllCatchAllStaticParams(): Promise<{ path: string[] }[]> {
  const staticPaths = getCatchAllStaticParams();
  const map = await fetchAlgCubeMapForBuild();

  if (!map) {
    return staticPaths;
  }

  return [...staticPaths, ...getAlgsDetailStaticParamsFromMap(map)];
}
