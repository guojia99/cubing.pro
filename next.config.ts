import type { NextConfig } from "next";

/** 本地 dev 时 /v3/cube-api 代理到的上游（默认线上） */
const CUBE_API_UPSTREAM =
  process.env.CUBE_API_UPSTREAM ?? "https://cubing.pro/v3/cube-api";

/** 静态导出时浏览器直连的 API（可 .env.production 覆盖） */
const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://cubing.pro/v3/cube-api";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE: PUBLIC_API_BASE,
  },
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
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
