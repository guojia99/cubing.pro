# Competition Scrambles — 打乱 Tab

> 父路由：`competition-detail`（`/competition/:id`）。群赛计时器子模块见 [competition-group-timer.md](competition-group-timer.md)。

## 1. 功能概述

赛事详情页的「打乱」Tab：按项目/轮次展示官方打乱串与打乱图；可打开全屏「群赛计时器」在浏览器内计时并本地保存成绩。支持 URL `?groupTimer=1` 在登录回跳后自动打开计时器。

## 2. implType 判定依据

| 来源 | 说明 |
|------|------|
| `Competition.tsx` | `apiComp` → `GET /public/comps/:id`（父级加载 `comp`） |
| `CompetitionScrambles.tsx` | `apiEvents` → `GET /public/events`（项目元数据、图标映射） |
| 打乱正文 | 来自 `comp.data` 内嵌的 `Scrambles`，无单独打乱 API |
| `GroupTimer` | 见 [competition-group-timer.md](competition-group-timer.md)（`frontend-heavy`） |

**结论：hybrid** — 展示依赖接口；计时与导出以 localStorage 为主。

## 3. 用户流程

1. 进入 `/competition/:id`，父页 `fetchComp` 加载比赛详情。
2. 切换到「打乱」Tab（`comps_tabs=scrambles`）→ `apiEvents` 拉取项目列表。
3. 按项目 Tab 浏览各轮打乱表（桌面 Table / 移动卡片）。
4. 点击「群赛计时器」→ 抽屉/全屏 `GroupTimer`；或带 `?groupTimer=1` 自动打开（已结束比赛会提示并清除参数）。
5. 在计时器内逐条计时、标记导出状态；关闭后状态保留在 localStorage。

## 4. 页面与组件树

```
Competition.tsx (apiComp)
└── CompetitionScrambles.tsx
    ├── apiEvents
    ├── NavTabs（按 EventID 分项目）
    ├── ScrambleEventRounds / scrambleTable
    │   ├── scrambleSegments.ts（分段、多段连拧）
    │   └── ScrambleImage（VisualCube）
    └── GroupTimer.tsx
        ├── buildScrambleRows.ts / buildEventContexts.ts
        ├── storage.ts / uiConfig.ts
        └── ScrambleImageMini.tsx
```

## 5. 状态与数据

| 项 | 说明 |
|----|------|
| URL `comps_tabs` | 与 `NavTabs` 同步，默认详情 Tab |
| URL `groupTimer=1` | 打开群赛计时器；与 `comps_tabs=scrambles` 联动 |
| `comp.data.IsDone` | 已结束比赛禁止打开计时器 |
| localStorage | 计时器见 [competition-group-timer.md](competition-group-timer.md) |

## 6. 接口契约

| 函数 | 端点 | 文档 |
|------|------|------|
| `apiComp` | `GET /public/comps/:id` | [public-api.md](../../api/public-api.md) |
| `apiEvents` | `GET /public/events` | [public-api.md](../../api/public-api.md) |

赛果 Tab 另用 `apiCompResult`、`apiCompRecord`（见 `pages-competition.md`）。

## 7. 关键函数索引

| 符号 | 文件 | 职责 |
|------|------|------|
| `CompetitionScrambles` | `src/pages/Competition/CompetitionComponents/CompetitionScrambles.tsx` | 打乱 Tab 入口 |
| `scrambleTable` | 同上 | 构建轮次/分组表格行 |
| `parseScramblePuzzleIds` | `scrambleSegments.ts` | 解析多段 puzzleId |
| `buildScrambleRowsForGroup` | `groupTimer/buildScrambleRows.ts` | 与展示一致的计时器行列表 |

## 8. 限制与待办

- 报名、赛程、选手 Tab 在 `routes.ts` 中已注释，组件文件仍存在但未挂路由。
- 计时器成绩仅存浏览器，未提交至 `/organizers/.../result`。
