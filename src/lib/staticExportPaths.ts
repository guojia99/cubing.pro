import { APP_ROUTES } from "@/config/routes";

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
