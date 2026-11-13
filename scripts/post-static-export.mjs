import { readFileSync, statSync, writeFileSync } from "node:fs";
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

// Fail the build instead of deploying an apparently successful, incomplete catalog.
const manifest = JSON.parse(readFileSync(".static-export-algs.json", "utf8"));
if (manifest.version !== 1 || !Array.isArray(manifest.paths) || !manifest.paths.length) {
  throw new Error("Missing or invalid algorithm route manifest. Re-run the complete static build.");
}
const missing = [];
for (const segments of manifest.paths) {
  if (!Array.isArray(segments) || segments.length !== 3 || segments[0] !== "algs" ||
      segments.some((segment) => typeof segment !== "string" || !segment.trim() || /[/\\\u0000-\u001f\u007f]/.test(segment) || segment === "." || segment === "..")) {
    throw new Error("Invalid algorithm path in static export manifest.");
  }
  for (const file of ["index.html", "index.txt"]) {
    const relative = path.join(...segments, file);
    try {
      if (!statSync(path.join(distDir, relative)).isFile() || statSync(path.join(distDir, relative)).size === 0) missing.push(relative);
    } catch { missing.push(relative); }
  }
}
if (missing.length) throw new Error(`Algorithm export is incomplete: ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? ` (and ${missing.length - 10} more)` : ""}`);
console.log(`Verified ${manifest.paths.length} algorithm routes from ${manifest.apiBase}.`);

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
