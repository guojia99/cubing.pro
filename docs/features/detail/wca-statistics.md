# wca-statistics — WCA 统计榜单

> 路由：`/wca/statistics`（亦嵌入 `gc-static` 的 `stats` Tab）。  
> 入口：`src/pages/WCA/Statistics/index.tsx`。

## 1. 功能概述

WCA 扩展统计页：卡片式 Tab 切换 8 类榜单（大满贯、历史排名、全量排名、年度排名、参赛年份排名、成功率、全项目成就、多项目综合/殿军榜）。各 Tab 独立筛选（项目、国家/地区、单/平均、分页等）并请求本站 `/wca/ranks/*` 代理接口。

## 2. implType 判定依据

- 所有榜单数据经 `services/cubing-pro/wca/static.ts` → `Request` + `AuthHeader()`（需登录 JWT）。
- `CountryList` / `getWcaCountryLabel` 辅助国家筛选（`GET /wca/country`）。
- 无 localStorage 业务持久化；筛选状态在组件内 `useState`。

**结论：api-driven**

## 3. 用户流程

1. 进入 `/wca/statistics`（默认 Tab `grandSlam`，URL `?tab=`）。
2. 点击顶部卡片切换 Tab → `navigate` 更新 `?tab=`。
3. 在子面板选择项目/国家/年份等 → 请求对应榜单 API → 表格展示。
4. 从 `gc-static` 进入时路径仍为 `/group-competitions/static?static_tabs=stats`，组件相同。

## 4. 页面与组件树

```
Statistics/index.tsx（Tab 外壳，?tab=）
├── GrandSlamRank.tsx          → GetAllEventChampionshipsPodium
├── HistoricalRank.tsx         → GetEventRankTimers
├── FullRank.tsx               → GetEventRankWithFullNow
├── YearlyFullRank.tsx         → GetEventRankWithOnlyYear
├── CompYearRank.tsx           → GetRankWithStartCompYear
├── SuccessRateRank.tsx        → GetStaticSuccessRateResult
├── AllEventsAchievementRank.tsx → GetAllEventsAchievement
└── DiyEventsRank.tsx          → GetRankWithDiyEvents / GetNotPodiumRankWithDiyEvents
```

## 5. 状态与数据

| 项 | 说明 |
|----|------|
| URL `tab` | `grandSlam` \| `historical` \| `full` \| `yearlyFull` \| `compYear` \| `successRate` \| `allEventsAchievement` \| `multiEventRank` |
| 子组件 state | 各 Rank 组件内：`eventID`、`country`、`page`、`is_avg` 等 |

## 6. 接口契约

| Tab | 前端函数 | HTTP（相对 `/v3/cube-api`） |
|-----|----------|---------------------------|
| 大满贯 | `GetAllEventChampionshipsPodium` | `GET /wca/grand-slam` |
| 历史排名 | `GetEventRankTimers` | `POST /wca/ranks/historical/full/{eventID}` |
| 全量排名 | `GetEventRankWithFullNow` | `POST /wca/ranks/full/{eventID}` |
| 年度排名 | `GetEventRankWithOnlyYear` | `POST /wca/ranks/historical/{eventID}` |
| 参赛年份 | `GetRankWithStartCompYear` | `POST /wca/rank/rank-with-start-comp-year/{eventID}` |
| 成功率 | `GetStaticSuccessRateResult` | `POST /wca/ranks/success_rate/{eventID}` |
| 全项目成就 | `GetAllEventsAchievement` | `POST /wca/ranks/all-events-achiever` |
| 多项目综合 | `GetRankWithDiyEvents` | `POST /wca/ranks/diy_events` |
| 殿军/未上台 | `GetNotPodiumRankWithDiyEvents` | `POST /wca/rank/diy_events/not_podium` |
| 国家列表 | `CountryList` | `GET /wca/country` |

详见 [frontend-services.md](../../api/frontend-services.md) 的 `wca/static.ts`、`wca/country.ts`。

## 7. 关键函数索引

| 符号 | 文件 | 职责 |
|------|------|------|
| `Statistics` | `WCA/Statistics/index.tsx` | Tab 路由与卡片 UI |
| `getTabFromSearch` | 同上 | 解析 `?tab=` |
| `GetEventRankTimers` 等 | `services/cubing-pro/wca/static.ts` | 榜单 API 封装 |

## 8. 限制与待办

- 请求均带 `AuthHeader()`，未登录可能失败（与 Public API 无关）。
- `_index` 中 `pageComponent` 应为 `WCA/Statistics/index.tsx`（非单文件 `Statistics.tsx`）。
