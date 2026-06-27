import { extractRouteParams, matchRoute } from "@/config/routes";
import { DYNAMIC_ROUTE_EXPORT_PLACEHOLDER } from "@/lib/dynamicRoute";

export function normalizeBrowserPathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname.replace(/\/$/, "") || "/");
  } catch {
    return pathname.replace(/\/$/, "") || "/";
  }
}

function isPlaceholderValue(value: string | undefined): boolean {
  return !value || value === DYNAMIC_ROUTE_EXPORT_PLACEHOLDER;
}

/** 从浏览器地址栏解析当前路由的动态参数（静态导出占位页回退时的权威来源） */
export function resolveBrowserRouteParams(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const browserPath = normalizeBrowserPathname(window.location.pathname);
  const route = matchRoute(browserPath);
  if (!route) {
    return {};
  }

  return extractRouteParams(route.pattern, browserPath) ?? {};
}

export function pickRouteParam(
  paramName: string,
  routerValue: string | string[] | undefined,
): string | undefined {
  const fromBrowser = resolveBrowserRouteParams()[paramName];
  if (!isPlaceholderValue(fromBrowser)) {
    return fromBrowser;
  }

  if (typeof routerValue === "string" && !isPlaceholderValue(routerValue)) {
    return routerValue;
  }

  return undefined;
}
