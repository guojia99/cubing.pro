# app.tsx 与 config（当前：Umi）

## app.tsx（运行时配置）

> 路径：`cubing.pro/src/app.tsx`

### 导出

| 导出 | 类型 | 说明 |
|------|------|------|
| `getInitialState` | async | 初始化全局状态：先处理 WCA URL token → 拉取 `currentUser` → 尝试从用户 KV 同步 UI 配置 |
| `layout` | `RunTimeLayoutConfig` | ProLayout 配置：侧栏、内容区、头像区、Footer、LanguageSelect、NavThemeSwitch |

### 内部函数

| 函数 | 职责 |
|------|------|
| `processWcaCallbackToken` | 从 URL query 读取 `token` → `saveToken()` → 清理 URL |

### 全局状态结构

```ts
{
  settings: Partial<LayoutSettings>,  // ProLayout 设置（可从 KV 同步）
  currentUser: AuthAPI.CurrentUser,   // 当前登录用户（未登录时 id=0）
  fetchUserInfo: () => Promise<...>    // 重新拉取用户
}
```

## global.tsx

> 路径：`cubing.pro/src/global.tsx`

PWA Service Worker 生命周期管理：
- `sw.offline`：离线提示
- `sw.updated`：新版本可用，提示用户刷新

## typings.d.ts

> 路径：`cubing.pro/src/typings.d.ts`

全局模块声明（`*.css`、`*.less`、`*.svg` 等资源模块）。

## service-worker.js

PWA Service Worker 文件。

---

## config/ 目录

> 路径：`cubing.pro/config/`

| 文件 | 说明 |
|------|------|
| `config.ts` | Umi 主配置：hash、路由、代理、主题、国际化、layout、openAPI、构建优化等 |
| `routes.ts` | 路由表（见 [_index.md](../features/_index.md)） |
| `proxy.ts` | 开发代理配置：`dev` 环境代理 One API；`pre` 代理后端 |
| `defaultSettings.ts` | ProLayout 默认配置：`navTheme: light`、`layout: top`、PWA 开启 |
| `cubing-pro.ts` | 站点备案号等常量 |
| `oneapi.json` | OpenAPI 规范（用于代码生成） |

### config.ts 关键配置

| 配置项 | 值 | 说明 |
|--------|------|------|
| `hash` | `true` | 构建产物带 hash |
| `history.type` | `browser` | 无 `/#/` 前缀 |
| `locale.default` | `zh-CN` | 默认中文 |
| `locale.supported` | zh-CN、zh-TW、en-US、ja-JP | |
| `layout` | `top` | 顶栏布局 |
| `mfsu.strategy` | `normal` | MFSU 加速 |
| `codeSplitting.jsStrategy` | `granularChunks` | 细粒度代码分割 |
