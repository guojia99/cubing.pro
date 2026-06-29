import type { NextConfig } from "next";

/** 本地 dev 时 /v3/cube-api 代理到的上游（默认线上） */
const CUBE_API_UPSTREAM =
  process.env.CUBE_API_UPSTREAM ?? "https://cubing.pro/v3/cube-api";

/** 静态导出时浏览器直连的 API（可 .env.production 覆盖） */
const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://cubing.pro/v3/cube-api";

/** 仅静态导出构建启用 output: export；next dev 需支持任意 /wca/player/:id */
const staticExport =
  process.env.NEXT_OUTPUT_EXPORT === "1" ||
  process.env.NEXT_OUTPUT_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(staticExport
    ? { output: "export" as const, distDir: "dist" }
    : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE: PUBLIC_API_BASE,
  },
  experimental: {
    optimizePackageImports: ["@chakra-ui/react", "react-icons"],
  },
  async rewrites() {
    // 仅 next dev / next start 生效；output: export 产物不经过 rewrites
    return [
      {
        source: "/v3/cube-api/:path*",
        destination: `${CUBE_API_UPSTREAM}/:path*`,
      },
    ];
  },
};

export default nextConfig;
