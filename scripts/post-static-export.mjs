import { writeFileSync } from "node:fs";
import path from "node:path";

/** 与 src/lib/staticExportPaths.ts 中 DYNAMIC_ROUTE_FALLBACKS 保持一致 */
const DYNAMIC_ROUTE_FALLBACKS = [
  {
    match: "^/competition/[^/]+/?$",
    placeholder: "/competition/__dynamic__/index.html",
  },
  {
    match: "^/player/[^/]+/?$",
    placeholder: "/player/__dynamic__/index.html",
  },
  {
    match: "^/wca/player/[^/]+/?$",
    placeholder: "/wca/player/__dynamic__/index.html",
  },
  {
    match: "^/admin/organizers/[^/]+/comp/[^/]+/result/?$",
    placeholder:
      "/admin/organizers/__dynamic__/comp/__dynamic__/result/index.html",
  },
];

const distDir = path.join(process.cwd(), "dist");

const nginxLines = [
  "# cubing.pro 静态导出：动态 ID 路由回退到占位页（每种路由仅构建 __dynamic__ 一份 HTML）",
  "# 将本片段 include 到 server { } 内、通用 location / 之前",
  "",
  ...DYNAMIC_ROUTE_FALLBACKS.flatMap(({ match, placeholder }) => [
    `location ~ ${match} {`,
    `  try_files $uri $uri/ ${placeholder} =404;`,
    "}",
    "",
  ]),
];

writeFileSync(
  path.join(distDir, "nginx-dynamic-fallback.conf.snippet"),
  `${nginxLines.join("\n")}\n`,
);

console.log("Wrote dist/nginx-dynamic-fallback.conf.snippet");
