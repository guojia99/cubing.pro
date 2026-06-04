# API 文档总览

## Base URL

| 环境 | Base URL | 说明 |
|------|----------|------|
| 本地开发 | `http://localhost:8000/v3/cube-api` | Umi dev server 代理到后端 |
| 生产环境 | `/v3/cube-api`（同源） | Nginx 反向代理 |

本地开发时，`/v3/cube-api` 请求由 Umi proxy 转发（见 `config/proxy.ts` 的 `pre` 配置指向 `localhost:20000/v3/cube-api/`）。

## 鉴权方式

| 方式 | 说明 |
|------|------|
| JWT Bearer Token | Header: `Authorization: Bearer <token>` |
| Token 存储 | `localStorage`，key 由 `auth/token.ts` 管理 |
| Token 刷新 | `POST /auth/refresh`，`startTokenRefresh()` 每 5 分钟自动刷新 |
| WCA OAuth | 跳转 WCA 授权 → 回调 URL 带 `token` 参数 → `saveToken()` |

## 统一错误处理

`request.tsx` 导出 Axios 实例 `Request`，响应拦截器：
- HTTP 错误通过 `WarnToast` 展示错误提示
- `getApiErrorDisplayMessage(body)` 提取错误文本

## Public API

- **无需 JWT**，但受全局限流 `RateLimitMiddleware(20 req/s)`
- 完整路由表见 [public-api.md](public-api.md)

## 需登录接口

- 使用 `AuthHeader()` 附加 JWT
- `/auth/*`（登录/注册/刷新）、`/organizers/*`（主办端）、`/admin/*`（后台管理）、`/user/*`（用户数据）

## 文档分工

| 文档 | 覆盖范围 |
|------|----------|
| [frontend-services.md](frontend-services.md) | `services/cubing-pro/` 全量导出函数，含前端封装的 HTTP 契约 |
| [public-api.md](public-api.md) | `public.go` 注册的全部路由 100%，含前端未封装的端点 |

WCA 登录流程见 [cubing.pro/docs/WCA_LOGIN_FRONTEND_GUIDE.md](../../../../cubing.pro/docs/WCA_LOGIN_FRONTEND_GUIDE.md)。
