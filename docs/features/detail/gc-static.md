# gc-static — 成绩统计多 Tab

> 路由：`/group-competitions/static`，`renderMode: tab-shell`。

## 1. 功能概述

「成绩统计」容器页，聚合 KinCh 榜、大龄 KinCh、DIY 自定义榜入口、以及内嵌完整 `WCA/Statistics` 统计页。

## 2. implType 判定依据

| Tab key | 子组件 | 主要 API |
|---------|--------|----------|
| `kinch_sor` | `Static/Kinsor` | `apiKinch` → `/public/statistics/kinch` |
| `kinch_senior_sor` | `Static/Kinsor`（senior） | `apiSeniorKinch` |
| `wca_view` | `Static/DiyRanks` | `apiDiyRanking`、`apiGetAllDiyRankingKey` |
| `stats` | `WCA/Statistics` | 多条 `/wca/ranks/*`（见 [wca-statistics.md](wca-statistics.md)） |

**结论：api-driven**（外壳路由项；各 Tab 均为接口驱动，无纯前端 Tab）。

## 3. 用户流程

进入 `/group-competitions/static` → 选择 Tab（`static_tabs` 查询参数）→ 子组件自行请求榜单数据。若 `static_tabs=records` 会自动重定向到 `/group-competitions/records`。

## 4. 页面与组件树

```
Static/Static.tsx
├── KinCh (×2 配置)
├── DiyRanks
└── WCA/Statistics.tsx
```

## 5. 状态与数据

- URL：`static_tabs` 与 `NavTabs` 同步。
- 子组件内部各自管理筛选条件与分页。

## 6. 接口契约

见 [frontend-services.md](../../api/frontend-services.md) 的 `statistics/`、`statistics/diy_ranking.ts`、`wca/static.ts` 及 [public-api.md](../../api/public-api.md) 统计分组。

## 7. 限制与待办

- `wca_view` Tab 注释 `todo 做成不同的key`，与 DIY 榜 key 可能混淆。
- 「纪录」已拆到独立路由 `gc-records`，本页通过 query 重定向兼容旧链接。
