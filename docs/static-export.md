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

**不要**使用 `try_files ... /index.html` 把所有路径都回退到根页面——否则直接打开 `/algs/222/EG` 等子路由会先拿到欢迎页 HTML。应用内已加入 `StaticExportRouteSync`：若检测到 `meta[name=x-export-path]` 与浏览器 URL 不一致，会尝试客户端导航到真实路由；**仍需**保证 `dist/algs/.../index.html` 与 `index.txt` 等静态文件可被访问。

若需动态 URL 回退到壳页面，可对未匹配路径回退到 `welcome` 或专用 SPA 入口（按运维策略配置）。

### cubing-pro gateway（`src/gateway`）

Next 多页静态导出部署到主站时，**勿**使用遗留 Umi 单页模式（`indexPath` + `staticPath`、所有路由回退同一 `index.html`）。

推荐 `etc/server.yaml`：

```yaml
gateway:
  staticRoot: "/build"   # build:static 产物目录（含 algs/、_next/ 等）
  spa: false
```

或使用 `indexPath: "/build/index.html"` 且**不配置** `staticPath`，并设 `spa: false`。

若使用 `staticSites` 按 Host 托管，`spa` 同样须为 `false`。

## 开发

`npm run dev` 仍使用 Next 开发服务器与 `rewrites`，不受 `output: export` 影响开发体验。
