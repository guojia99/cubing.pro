# admin-organizers-result — 主办成绩录入

> 路由：  
> - `/admin/organizers/:orgId/comp/:compId/result`（推荐）  
> - `/admin/organizers/result`（同组件，须具备动态参数）  
> 组件：`OrganizersResults.tsx`

## 1. 功能概述

主办方录入/维护比赛成绩：按项目轮次单条录入、批量解析录入、查询已录入成绩、预成绩列表与批量审批。需主办权限 `AuthOrganizers`，并校验 `comp.OrganizersID === org.id`。

## 2. implType 判定依据

| API | 用途 |
|-----|------|
| `apiGetOrgComp` | 比赛详情与赛程 JSON |
| `apiOrganizers` | 主办团队信息 |
| `apiGetAllPlayers` | 参赛选手 |
| `apiEvents` | 项目元数据（图标/中文名） |
| `apiGetCompsResults` / `apiGetCompsResultsWithPlayer` | 已录入成绩 |
| `apiAddCompResults` | 提交成绩 |
| `apiDeleteCompsResult` | 删除成绩 |
| `apiGetCompsPreResult` / `apiApprovalCompsPreResult` | 预成绩审批 |

**结论：api-driven**

## 3. 用户流程

1. 从 `OrganizersComps` 进入指定 `orgId` + `compId`。
2. 加载比赛、选手、项目轮次 Cascader。
3. Tab：单条录入 / 批量录入 / 成绩表 / 预成绩审批。
4. 提交后刷新 ProTable；预成绩可多选审批通过或拒绝。

## 4. 页面与组件树

```
OrganizersResults.tsx
├── checkAuth([AuthOrganizers])
├── NavTabs（录入模式）
├── ProTable / Table（成绩、预成绩）
├── Form + Cascader（项目/轮次）
└── Modal（批量解析、确认）
```

## 5. 状态与数据

- React state：`comp`、`org`、`players`、`oneResults`、`multiResults`、`preResults` 等。
- 无业务 localStorage。

## 6. 接口契约

路径均相对 `/v3/cube-api`，需 `AuthHeader()`。函数定义见 `services/cubing-pro/auth/organizers.ts`：

| 函数 | 典型 Method | 路径模式 |
|------|-------------|----------|
| `apiGetOrgComp` | GET | `/organizers/{orgId}/comp/{compId}` |
| `apiGetAllPlayers` | GET | `/organizers/{orgId}/comp/{compId}/players` |
| `apiGetCompsResults` | GET | `/organizers/{orgId}/comp/{compId}/result` |
| `apiAddCompResults` | POST | `/organizers/{orgId}/comp/{compId}/result` |
| `apiDeleteCompsResult` | DELETE | `/organizers/{orgId}/comp/{compId}/result/{resultId}` |
| `apiGetCompsPreResult` | GET | `/organizers/{orgId}/comp/{compId}/pre_results` |
| `apiApprovalCompsPreResult` | POST | `/organizers/{orgId}/comp/{compId}/pre_results/{id}/approval` |

公开项目列表：`apiEvents` → `GET /public/events`（[public-api.md](../../api/public-api.md)）。

## 7. 关键函数索引

| 符号 | 文件 | 职责 |
|------|------|------|
| `OrganizersResults` | `OrganizersComponent/OrganizersResults.tsx` | 主页面 |
| `updateRound` | 同上 | 轮次 Cascader 联动 |
| `apiAddCompResults` | `auth/organizers.ts` | 提交成绩 |

## 8. 限制与待办

- 文件体量较大（千行级），后续可拆 Tab 子组件。
- `admin/organizers/details` 路由仍为空，勿与本文档混淆。
