# Cubing Pro v4.0.0

Next.js 15 + Chakra UI v3 前端。业务契约见 `docs/`；路由表见 `config/routes.ts` / `src/config/routes.ts`。

- 顶栏布局（`layout: top`）
- 主题色：淡蓝 / 青色 / 海蓝（`src/theme`）
- 页面实现目录：`src/views/`（按手册逐步落地；`src/app` 为路由入口）

```bash
npm install && npm run dev
```

**静态导出**（产物在 `out/`，对齐原 Umi `export`）：

```bash
npm run build:static
npm run preview:static   # 本地预览 out/
```

- `next.config.ts` 已设 `output: "export"`、`trailingSlash: true`
- 无动态段的路由会在构建时预生成；含 `:param` 的路由需站内跳转，或直接访问时需 Web 服务器 fallback（见 `docs/static-export.md`）
- 浏览器 API：部署在 `cubing.pro` 用同源 `/v3/cube-api`；其他域名用 `NEXT_PUBLIC_API_BASE`（默认线上）

本地开发默认将 `/v3/cube-api` 代理到线上 `https://cubing.pro/v3/cube-api`（见 `next.config.ts`）。改本地后端可在 `.env.local` 设置 `CUBE_API_UPSTREAM=http://127.0.0.1:20000/v3/cube-api` 后重启 dev。
