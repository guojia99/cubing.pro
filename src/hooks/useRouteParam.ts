"use client";

import { useParams, usePathname } from "next/navigation";
import { useMemo } from "react";

import { pickRouteParam } from "@/lib/browserRouteParams";

/** 动态路由参数：优先浏览器 URL，兼容 next dev 下 useParams */
export function useRouteParam(paramName: string): string | undefined {
  const pathname = usePathname() ?? "";
  const params = useParams<Record<string, string | string[]>>();

  return useMemo(
    () => pickRouteParam(paramName, params?.[paramName]),
    [paramName, params, pathname],
  );
}
