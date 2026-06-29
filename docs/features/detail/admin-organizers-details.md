# admin-organizers-details — 主办「比赛详情」路由

> 路由：`/admin/organizers/details`  
> 组件：`OrganizersDetails.tsx`（**当前为空实现**）

## 1. 功能概述

路由在 `routes.ts` 中保留，对应组件仅渲染空片段，**无业务 UI**。主办端实际能力分布在：

| 能力 | 实际路由 | 组件 | 详述 |
|------|----------|------|------|
| 比赛列表 / 改名 / 结束 | `/admin/organizers/comps` | `OrganizersComps.tsx` | 见下文 §3 |
| 成绩录入 / 预成绩审批 | `/admin/organizers/:orgId/comp/:compId/result` | `OrganizersResults.tsx` | [admin-organizers-result.md](admin-organizers-result.md) |
| 同上（别名路由） | `/admin/organizers/result` | `OrganizersResults.tsx` | 需 URL 带 `orgId`、`compId` 动态段；无参时 `useParams` 为空会异常 |

从比赛列表点击「录入成绩」会 `history.replace` 到 `/admin/organizers/{orgId}/comp/{compId}/result`。

## 2. implType 判定依据

- `OrganizersDetails.tsx` 无 `services` import、无请求。

**结论：frontend-only**（占位路由；非「接口驱动的详情页」）

> `_index` 若仍标注大量 `apiGetOrgComp` 等，属于**历史误标**，应以本文件与 [admin-organizers-result.md](admin-organizers-result.md) 为准。

## 3. 用户流程（主办比赛列表）

`OrganizersComps.tsx`：

1. `apiMeOrganizers` 加载当前主办团队。
2. `apiGetComps` 拉取该团队比赛列表（ProTable）。
3. 操作：修改名称（`apiUpdateCompName`）、结束比赛（`apiEndComp`）、跳转成绩录入、创建比赛链接。
4. 超管可 `apiApprovalComp`、`apiAdminDeleteComp`。

## 4. 页面与组件树

```
OrganizersDetails.tsx     → （空）
OrganizersComps.tsx       → 列表 + 操作列
OrganizersResults.tsx     → 成绩/预成绩（见专文）
```

## 5. 状态与数据

- `OrganizersComps`：`curOrg`、`org` 来自 `apiMeOrganizers`。
- 无专用 localStorage。

## 6. 接口契约（OrganizersComps）

| 函数 | 路径前缀 |
|------|----------|
| `apiMeOrganizers` | `GET /organizers/me` |
| `apiGetComps` | `GET /organizers/{orgID}/comp/` |
| `apiUpdateCompName` | `PUT /organizers/{orgId}/comp/{compId}/name` |
| `apiEndComp` | `POST /organizers/{orgId}/comp/{compId}/end` |

成绩相关接口见 [admin-organizers-result.md](admin-organizers-result.md)。

## 7. 限制与待办

- 应合并或重定向 `admin/organizers/details` → `comps` 或具体 `result` URL，避免用户进入空白页。
- `admin/organizers/result` 若不带 `:orgId/:compId`，与 `OrganizersResults` 的 `useParams` 不匹配，不宜作为入口。
