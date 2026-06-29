# 项目前端目录总览

> 本目录仅记录 **`cubing.pro/`** 前端源码结构。  
> **不**包含后端 `cubing-pro/` 目录文档。

## 应用边界

- **前端仓库**：`cubing.pro/`
- **框架**（当前）：Umi 4 / `@umijs/max`、React、Ant Design Pro Layout
- **API 前缀**：所有后端请求路径前缀为 `/v3/cube-api`（由 `request.tsx` 中 Axios baseURL 配置）
- **构建目录**：`.umi/`、`.umi-production/`（构建生成，不纳入业务树）
- **静态资源**：`cubing.pro/public/`（见 [static-assets.md](static-assets.md)）

## 与仓库根路径关系

```
cubingPro/                # 仓库根
├── cubing.pro/           # 前端应用
│   ├── config/           # Umi 配置
│   ├── public/           # 静态资源
│   └── src/              # 业务源码
├── cubing-pro/           # 后端服务（Go）
└── v4.0.0/              # 本文档
```

## 文档索引

| 文件 | 内容 |
|------|------|
| [app-and-config.md](app-and-config.md) | `app.tsx`、`config/`、`locales/`（*当前：Umi*） |
| [components.md](components.md) | `src/components/` |
| [services.md](services.md) | `src/services/` 总览 |
| [utils.md](utils.md) | `src/utils/` |
| [static-assets.md](static-assets.md) | `public/` 业务引用索引 |
| [pages-welcome-misc.md](pages-welcome-misc.md) | Welcome、设置、404、外链等 |
| [pages-algs.md](pages-algs.md) | 公式库 |
| [pages-tools.md](pages-tools.md) | tools / draw-tools |
| [pages-recipes.md](pages-recipes.md) | 菜谱 / 厨房技巧 / 鸡尾酒 |
| [pages-wca.md](pages-wca.md) | WCA 相关页 |
| [pages-competition.md](pages-competition.md) | 赛事与计时器 |
| [pages-player.md](pages-player.md) | 站内选手 |
| [pages-group-competitions.md](pages-group-competitions.md) | 群组赛 / 静态榜 |
| [pages-admin.md](pages-admin.md) | 登录、主办、后台 |
| [pages-static.md](pages-static.md) | Static 子模块（KinCh、DIY 等） |

## 仓库内延伸阅读

| 路径 | 用途 |
|------|------|
| [cubing.pro/docs/WCA_LOGIN_FRONTEND_GUIDE.md](../../cubing.pro/docs/WCA_LOGIN_FRONTEND_GUIDE.md) | WCA OAuth 与 `/auth/callback` |
| [cubing.pro/docs/VISUALCUBE_USAGE.md](../../cubing.pro/docs/VISUALCUBE_USAGE.md) | VisualCube 嵌入（打乱图、公式页） |
| [fmc-paperless/README.md](../../fmc-paperless/README.md) | 独立子项目 FMC 无纸化（与主站无直接路由耦合） |
