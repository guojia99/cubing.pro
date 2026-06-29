# pages — 群组赛（group-competitions/*）

> 路径：`cubing.pro/src/pages/`（群组赛相关页面分散在 Static/、Competition/、Player/、Events/ 等目录）

## 路由与组件映射

| 路由 | 组件 | implType | 说明 |
|------|------|----------|------|
| `/group-competitions/static` | `Static/Static.tsx` | api-driven | Tab 容器：KinCh + DIY 榜 |
| `/group-competitions/records` | `Static/Record.tsx` | api-driven | 纪录查询 |
| `/group-competitions/events` | `Events/Events.tsx` | api-driven | 项目列表 |
| `/group-competitions/competitions` | `Competition/Competitions.tsx` | api-driven | 比赛列表 |
| `/group-competitions/players` | `Player/Players.tsx` | api-driven | 选手搜索 |
| `/group-competitions/pktimer` | `Static/Pktimers.tsx` | api-driven | PK 计时器 |

## 注意

`/wca/historical-rank` 已重定向到 `/wca/statistics`。
