# 静态导出说明

## 构建

```bash
npm run build:static
```

输出目录：`out/`（勿提交 git）。

## API

| 部署方式 | 浏览器请求 API |
|----------|----------------|
| `cubing.pro` 同源 | `/v3/cube-api` |
| 其他静态托管 / 本地 `serve out` | `NEXT_PUBLIC_API_BASE`（默认 `https://cubing.pro/v3/cube-api`） |

构建前可在 `.env.production` 修改 `NEXT_PUBLIC_API_BASE`。

## 路由

- 构建时会为**无** `:param` 的路由生成 HTML（见 `src/lib/staticExportPaths.ts`）。
- `/wca/player/:wcaId` 使用独立动态路由 `app/(main)/wca/player/[wcaId]/page.tsx`。
- 静态构建可通过环境变量预生成部分选手页：`WCA_STATIC_PLAYER_IDS=2018SHEN07,2019COMP01 npm run build:static`
- 未预生成的 WCA ID：**站内 Link 跳转**在客户端正常；**直接打开或刷新**需在服务器配置 fallback（见下）。

### Nginx 示例（部署在 cubing.pro）

```nginx
location / {
  try_files $uri $uri/ $uri/index.html =404;
}
```

若需动态 URL 回退到壳页面，可对未匹配路径回退到 `welcome` 或专用 SPA 入口（按运维策略配置）。

## 开发

`npm run dev` 仍使用 Next 开发服务器与 `rewrites`，不受 `output: export` 影响开发体验。
