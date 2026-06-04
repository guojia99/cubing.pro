# pages — 赛事（Competition）

> 路径：`cubing.pro/src/pages/Competition/`

## 目录树

```
Competition/
├── Competition.tsx                 # 赛事详情页（多 Tab）
├── Competitions.tsx               # 赛事列表页
└── CompetitionComponents/
    ├── CompetitionDetail.tsx       # 详情 Tab
    ├── CompetitionResults.tsx     # 成绩 Tab
    ├── CompetitionScrambles.tsx    # 打乱/计时 Tab
    ├── CompetitionRegistration.tsx # 报名 Tab
    ├── CompetitionCompetitors.tsx  # 参赛选手 Tab
    ├── CompetitionSchedule.tsx     # 赛程 Tab
    ├── CompetitionRegulations.tsx  # 规则 Tab
    └── groupTimer/
        ├── GroupTimer.tsx          # 群组计时器
        └── storage.ts             # 计时器持久化（localStorage）
```

## 功能职责

| 组件 | 路由 | implType | services |
|------|------|----------|----------|
| `Competition.tsx` | `/competition/:id` | api-driven | `apiComp`（委托子组件） |
| `Competitions.tsx` | `/group-competitions/competitions` | api-driven | `apiComps` |
| `CompetitionResults.tsx` | （子 Tab） | api-driven | `apiCompRecord`、`apiCompResult`、`apiEvents` |
| `CompetitionScrambles.tsx` | （子 Tab） | hybrid | `apiEvents` + GroupTimer（localStorage） |
| `CompetitionDetail.tsx` | （子 Tab） | frontend-only | 接收 prop 渲染 |
| `CompetitionRegistration.tsx` | （子 Tab） | frontend-only | 接收 prop 渲染 |

## localStorage keys

| key | 使用组件 | 说明 |
|-----|----------|------|
| `cubingPro.groupTimer.v1:{compId}` | `groupTimer/storage.ts` | 比赛计时器状态（还原记录、光标、导出追踪） |
| `cubingPro.groupTimerUi.v1` | `groupTimer/uiConfig.ts` | 计时器全局 UI 配置 |

## 功能详述

| 主题 | 文档 |
|------|------|
| 打乱 Tab + URL `groupTimer` | [features/detail/competition-scrambles.md](../features/detail/competition-scrambles.md) |
| 群赛计时器 | [features/detail/competition-group-timer.md](../features/detail/competition-group-timer.md) |
