import fs from "node:fs";
import path from "node:path";

import { APP_ROUTES } from "@/config/routes";
import type { AlgCubeMap } from "@/services/cubing-pro/algs/algs";
import type { Cocktail } from "@/views/Cocktails/types";
import type { KitchenTipsData } from "@/views/KitchenSkills/types";
import type { RecipesData } from "@/views/Recipes/types";

import { DYNAMIC_ROUTE_EXPORT_PLACEHOLDER } from "@/lib/dynamicRoute";

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
  "competition",
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

/** 构建时需回退到占位页的动态路由（供 post-static-export 生成 nginx 片段） */
export const DYNAMIC_ROUTE_FALLBACKS = [
  {
    match: "^/competition/[^/]+/?$",
    placeholder: `/competition/${DYNAMIC_ROUTE_EXPORT_PLACEHOLDER}/index.html`,
  },
  {
    match: "^/player/[^/]+/?$",
    placeholder: `/player/${DYNAMIC_ROUTE_EXPORT_PLACEHOLDER}/index.html`,
  },
  {
    match: "^/wca/player/[^/]+/?$",
    placeholder: `/wca/player/${DYNAMIC_ROUTE_EXPORT_PLACEHOLDER}/index.html`,
  },
  {
    match: "^/admin/organizers/[^/]+/comp/[^/]+/result/?$",
    placeholder: `/admin/organizers/${DYNAMIC_ROUTE_EXPORT_PLACEHOLDER}/comp/${DYNAMIC_ROUTE_EXPORT_PLACEHOLDER}/result/index.html`,
  },
] as const;

function isStaticExportBuild(): boolean {
  return (
    process.env.NEXT_OUTPUT_EXPORT === "1" ||
    process.env.NEXT_OUTPUT_EXPORT === "true"
  );
}

/**
 * 动态 ID 路由在静态导出时仅预构建占位页；真实 ID 由部署回退 + 客户端从 URL 解析。
 * 适用于 WCA 选手（30 万+）、赛事、站内选手等不可枚举的路由。
 */
export function getDynamicRoutePlaceholderParams(): { path: string[] }[] {
  if (!isStaticExportBuild()) {
    return [];
  }

  return [
    { path: ["competition", DYNAMIC_ROUTE_EXPORT_PLACEHOLDER] },
    { path: ["player", DYNAMIC_ROUTE_EXPORT_PLACEHOLDER] },
    { path: ["wca", "player", DYNAMIC_ROUTE_EXPORT_PLACEHOLDER] },
    {
      path: [
        "admin",
        "organizers",
        DYNAMIC_ROUTE_EXPORT_PLACEHOLDER,
        "comp",
        DYNAMIC_ROUTE_EXPORT_PLACEHOLDER,
        "result",
      ],
    },
  ];
}

function readPublicJson<T>(filename: string): T | null {
  try {
    const filePath = path.join(process.cwd(), "public", filename);
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function getRecipeDetailStaticParams(): { path: string[] }[] {
  const data = readPublicJson<RecipesData>("recipes.json");
  if (!data?.recipes) return [];
  return data.recipes.map((r) => ({
    path: ["other", "recipes", encodeURIComponent(r.category), encodeURIComponent(r.id)],
  }));
}

export function getKitchenSkillDetailStaticParams(): { path: string[] }[] {
  const data = readPublicJson<KitchenTipsData>("tips.json");
  if (!data?.tips) return [];
  return data.tips.map((t) => ({
    path: ["other", "kitchen-skills", encodeURIComponent(t.category), encodeURIComponent(t.id)],
  }));
}

export function getCocktailDetailStaticParams(): { path: string[] }[] {
  const data = readPublicJson<Cocktail[]>("iba/cocktails.json");
  if (!Array.isArray(data)) return [];
  return data.map((c) => ({
    path: ["other", "cocktails", encodeURIComponent(c.slug)],
  }));
}

/** catch-all 静态导出参数：固定路由 + 动态占位 + 公式/菜谱/技巧/鸡尾酒详情 */
export async function getAllCatchAllStaticParams(): Promise<{ path: string[] }[]> {
  const staticPaths = getCatchAllStaticParams();
  const dynamicPlaceholders = getDynamicRoutePlaceholderParams();
  const foodPaths = [
    ...getRecipeDetailStaticParams(),
    ...getKitchenSkillDetailStaticParams(),
    ...getCocktailDetailStaticParams(),
  ];
  const map = await fetchAlgCubeMapForBuild();

  if (!map) {
    return [...staticPaths, ...dynamicPlaceholders, ...foodPaths];
  }

  return [
    ...staticPaths,
    ...dynamicPlaceholders,
    ...foodPaths,
    ...getAlgsDetailStaticParamsFromMap(map),
  ];
}
