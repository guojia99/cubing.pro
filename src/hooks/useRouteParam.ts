"use client";

import { useParams, usePathname } from "next/navigation";

import { pickRouteParam } from "@/lib/browserRouteParams";

/** 动态路由参数：优先浏览器 URL，兼容 next dev 下 useParams */
export function useRouteParam(paramName: string): string | undefined {
  // Subscribe to client navigation so browser-derived params refresh too.
  usePathname();
  const params = useParams<Record<string, string | string[]>>();

  return pickRouteParam(paramName, params?.[paramName]);
}
