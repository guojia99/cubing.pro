/** 静态导出页在 HTML 中标记的预渲染路径，供客户端与浏览器 URL 比对 */
export function ExportPathMarker({ path }: { path: string }) {
  const normalized = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
  return <meta name="x-export-path" content={normalized || "/"} />;
}
