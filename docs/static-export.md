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

### 动态 ID 路由（不可枚举）

`/competition/:id`、`/player/:id`、`/wca/player/:wcaId`、`/admin/organizers/:orgId/comp/:compId/result` 等路由的 ID 数量不可在构建时枚举（WCA 选手 30 万+），采用 **占位页 + 部署回退 + 客户端 URL 解析** 三件套：

1. **构建**：`[...path]` catch-all 仅为每种动态路由生成一份 `__dynamic__` 占位 HTML（见 `getDynamicRoutePlaceholderParams`）。
2. **部署**：未命中静态文件时，gateway 的 `dynamicRouteFallbacks` 回退到对应占位页（见 `cubing-pro/local/prod.yaml`）；无需 nginx。
3. **运行时**：页面组件通过 `useRouteParam` 从 `window.location` 读取真实 ID；`StaticExportRouteSync` 将 Next 路由与浏览器 URL 对齐。

`npm run dev` 不受静态导出限制，任意动态 URL 均可直接访问。

### 固定与可枚举路由

- 构建时会为**无** `:param` 的路由生成 HTML（见 `src/lib/staticExportPaths.ts`）。
- 以下路由在构建时**全量预生成**（数据来自本地 JSON 或构建时 API），**不需要** `__dynamic__` 占位：
  - `/other/recipes/:category/:id` — `public/recipes.json`（约 350+）
  - `/other/kitchen-skills/:category/:id` — `public/tips.json`
  - `/other/cocktails/:slug` — `public/iba/cocktails.json`
  - `/algs/:cube/:class` — 构建时请求 `/public/algorithm/`
- 路径段使用**原始中文/明文**生成目录名（勿 `encodeURIComponent`），与浏览器地址栏一致。
- 若尚未重新构建，gateway 会对未命中路径再尝试 `%XX` 编码目录名（兼容旧产物）。
- 上述内容若在部署后新增条目，需重新 `build:static` 后发布。

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

推荐 `gateway` 配置（见 `cubing-pro/local/prod.yaml`）：

```yaml
gateway:
  staticRoot: "/root/work/cubing.pro/dist"   # build:static 产物目录
  spa: false
  dynamicRouteFallbacks:
    - match: "^/competition/[^/]+/?$"
      placeholder: "/competition/__dynamic__/index.html"
    - match: "^/player/[^/]+/?$"
      placeholder: "/player/__dynamic__/index.html"
    - match: "^/wca/player/[^/]+/?$"
      placeholder: "/wca/player/__dynamic__/index.html"
    - match: "^/admin/organizers/[^/]+/comp/[^/]+/result/?$"
      placeholder: "/admin/organizers/__dynamic__/comp/__dynamic__/result/index.html"
```

`dynamicRouteFallbacks` 由 gateway 在 `serveStaticSite` 中实现，无需 nginx。构建后 `post-static-export.mjs` 仍会生成 `nginx-dynamic-fallback.conf.snippet` 供其他环境参考。

若使用 `staticSites` 按 Host 托管，`spa` 同样须为 `false`（子项目若为 Vue/React 单页可单独设 `spa: true`）。

## 开发

`npm run dev` 仍使用 Next 开发服务器与 `rewrites`，不受 `output: export` 影响开发体验。
