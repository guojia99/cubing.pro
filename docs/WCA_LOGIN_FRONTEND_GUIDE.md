# WCA 登录 - 前端对接手册

本文档汇总后端 WCA OAuth 登录相关改动，供前端开发对接参考。

---

## 一、登录方式概览

| 登录方式 | 接口 | 说明 |
|---------|------|------|
| 账号密码登录 | `POST /v3/cube-api/auth/login` | 原有方式，保持不变 |
| **WCA 登录** | `GET /v3/cube-api/auth/wca` | **新增**，跳转到 WCA 授权页 |

两种方式最终都返回**相同格式的 JWT**，后续请求携带方式一致。

---

## 二、WCA 登录流程

```
┌─────────┐    ① 点击 WCA 登录     ┌─────────┐    ② 302 跳转     ┌─────────┐
│  前端   │ ────────────────────► │  后端   │ ───────────────► │  WCA    │
│         │   GET /auth/wca       │         │  授权页 URL      │  官网   │
└─────────┘   ?redirect=xxx       └─────────┘                  └────┬────┘
     ▲                                                                    │
     │                                                                    │ ③ 用户授权
     │                                                                    ▼
     │    ⑤ 302 跳回 + token      ┌─────────┐    ④ 回调 + code    ┌─────────┐
     └────────────────────────── │  后端   │ ◄───────────────── │  WCA    │
        或 ⑤' JSON 返回           │ callback│   /auth/wca/callback│         │
                                 └─────────┘                     └─────────┘
```

---

## 三、接口说明

### 1. 发起 WCA 登录

**请求**

```
GET /v3/cube-api/auth/wca?redirect={redirect}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| redirect | string | 否 | 登录成功后跳转地址，需为配置的 `frontendBase` 域名下 |

**行为**

- 302 重定向到 WCA 授权页
- `redirect` 为空或 `debug`：回调时返回 JSON，不跳转（调试用）
- `redirect` 为有效前端地址：回调时 302 跳转到 `redirect?token=xxx`

**redirect 校验**

- 必须为 `frontendBase` 配置的域名（如 `https://cubing.pro`）
- 示例：`https://cubing.pro/profile`、`https://cubing.pro/competitions?tab=my`

**错误响应**（JSON，非 302 时）

| http_code | message | 说明 |
|-----------|---------|------|
| 400 | invalid redirect URI | redirect 不在允许域名下 |
| 500 | WCA OAuth 未配置 | 后端未配置 appId/appSecret |

---

### 2. WCA 回调（后端处理，前端不直接调用）

```
GET /v3/cube-api/auth/wca/callback?code=xxx&state=xxx
```

由 WCA 授权后自动跳转，前端只需在合适的页面接收带 `token` 的跳转。

---

### 3. 调试：获取当前用户

**请求**

```
GET /v3/cube-api/auth/wca/me
Authorization: Bearer {token}
```

**响应**

```json
{
  "user": {
    "id": 1,
    "Name": "张三",
    "WcaID": "2020ZHAN01",
    "WcaLoginAt": "2026-03-11T12:00:00Z",
    ...
  }
}
```

---

## 四、前端需要实现的逻辑

### 1. WCA 登录入口

```javascript
// 跳转到后端 WCA 登录接口，redirect 为登录成功后要回到的页面
const redirect = encodeURIComponent(`${window.location.origin}/profile`);
window.location.href = `${API_BASE}/v3/cube-api/auth/wca?redirect=${redirect}`;
```

### 2. 接收 token 的页面

登录成功后会 302 到 `redirect?token=xxx`，需在对应页面（如 `/profile`、`/auth/callback`）处理：

```javascript
// 在页面加载时检查 URL 是否带有 token
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
if (token) {
  // 1. 存储 token（与账号密码登录一致）
  localStorage.setItem('token', token);
  // 2. 清除 URL 中的 token，避免泄露
  const url = new URL(window.location.href);
  url.searchParams.delete('token');
  window.history.replaceState({}, '', url.toString());
  // 3. 更新登录状态，跳转到目标页等
}
```

### 3. 统一 token 使用方式

WCA 登录与账号密码登录的 JWT 格式相同，请求方式一致：

```
Authorization: Bearer {token}
```

或使用 Cookie（若后端开启 `SendCookie`）。

---

## 五、数据结构变更

### 1. JWT Payload（与原有一致）

```typescript
interface JwtMapClaims {
  id: number;
  auth: number;        // 权限位
  name: string;
  enName: string;
  loginID: string;
  cubeID: string;
  wcaID: string;       // WCA 登录用户会有值
  delegateName: string;
}
```

### 2. 用户信息（GET /auth/current 等）

**新增字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| WcaID | string | WCA ID，如 "2020ZHAN01" |
| WcaLoginAt | string (ISO 8601) | 最近一次 WCA 登录时间，未使用过为 null |

**不返回字段**（仅后端存储）

- `WcaAccessToken`
- `WcaTokenExpiresAt`

### 3. 调试模式回调（redirect=debug 或空）

**响应**（JSON，不跳转）

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "auth": 1,
    "name": "张三",
    "enName": "Zhang San",
    "loginID": "",
    "cubeID": "",
    "wcaID": "2020ZHAN01",
    "delegateName": ""
  },
  "wca": {
    "wca_id": "2020ZHAN01",
    "name": "张三",
    "email": "user@example.com",
    "avatar": "https://..."
  }
}
```

---

## 六、错误响应格式

与现有接口一致：

```json
{
  "http_code": 400,
  "message": "无效输入",
  "error": "invalid redirect URI",
  "data": "invalid redirect URI",
  "level": "",
  "line": "err at ...",
  "ref": ""
}
```

---

## 七、注意事项

### 1. redirect 安全

- `redirect` 必须在配置的 `frontendBase` 域名下
- 不要用用户输入拼接 redirect，避免开放重定向

### 2. 环境与回调地址

| 环境 | 回调地址 |
|------|----------|
| 生产 | `https://cubing.pro/v3/cube-api/auth/wca/callback` |
| 本地 Gateway | `http://localhost:8000/v3/cube-api/auth/wca/callback` |
| 直连 API | `http://localhost:20000/v3/cube-api/auth/wca/callback` |

前端发起登录时，应使用当前环境的 API 根地址。

### 3. 自动重新授权

以下情况后端会**自动 302 到 WCA 授权页**，用户无需手动重试：

- state 无效或过期
- code 过期

用户会再次看到 WCA 授权页，授权后正常完成登录。

### 4. WCA 用户与本地用户

- 首次 WCA 登录：创建新用户，`WcaID` 必填
- 再次 WCA 登录：若 `WcaID` 已存在则关联并更新信息
- 账号密码登录与 WCA 登录共用同一套用户体系，通过 `WcaID` 关联

### 5. 调试建议

- 使用 `?redirect=debug` 可在回调时直接拿到 JSON，便于调试
- `/auth/wca/me` 需携带有效 token，用于验证登录状态

---

## 八、接口汇总

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /v3/cube-api/auth/wca | 否 | 发起 WCA 登录 |
| GET | /v3/cube-api/auth/wca/callback | 否 | WCA 回调（后端处理） |
| GET | /v3/cube-api/auth/wca/me | Bearer | 调试：获取当前用户 |
| POST | /v3/cube-api/auth/login | 否 | 账号密码登录（原有） |
| GET | /v3/cube-api/auth/current | Bearer | 获取当前用户（原有） |

---

## 九、配置参考（后端）

```yaml
# etc/server.yaml - global.wcaAuth2
wcaAuth2:
  appId: "xxx"
  appSecret: "xxx"
  redirectBase: "https://cubing.pro"    # 生产
  frontendBase: "https://cubing.pro"   # 登录成功后跳回的前端
  auths: ["public", "dob", "email", "openid", "profile"]
```

---

*文档版本：2026-03-11*
