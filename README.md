# Cubing Pro v4.0.0

魔方社区与工具平台前端（Next.js + Chakra UI v3）。

## 技术栈

- Next.js 15（App Router）
- React 19
- Chakra UI v3
- TypeScript

## 开发

```bash
npm install
npm run dev
```

请勿对 `npm run dev` 使用 `--turbopack`：Chakra + Emotion 在 Turbopack 下会出现 hydration 警告（见 [Chakra Next.js 文档](https://chakra-ui.com/docs/get-started/frameworks/next-app)）。

访问 [http://localhost:3000](http://localhost:3000)，默认跳转 `/welcome`。

## 目录

| 路径 | 说明 |
|------|------|
| `src/app/` | 路由与布局 |
| `src/config/routes.ts` | 功能路由表（对齐 `docs/features/_index.md`） |
| `src/config/navigation.ts` | 顶栏导航 |
| `src/pages/` | 业务页面组件（待实现） |
| `src/components/` | 共享 UI 与布局 |
| `docs/` | 研发手册与功能契约 |

## API 代理

开发环境将 `/v3/cube-api/*` 代理到 `http://localhost:20000`（见 `next.config.ts`）。
