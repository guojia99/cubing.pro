# pages — WCA / 统计

> 路径：`cubing.pro/src/pages/WCA/`

## 目录树

```
WCA/
├── Player.tsx                      # WCA 选手页
├── Players.tsx                     # WCA 选手搜索
├── ProportionEstimation.tsx        # 成绩比例拟合
├── Statistics/                     # WCA 统计榜单（多 Tab）
│   ├── index.tsx
│   ├── GrandSlamRank.tsx
│   ├── HistoricalRank.tsx
│   └── …（见 detail/wca-statistics.md）
└── PlayerComponents/                # 选手页子组件
    ├── region/
    │   └── all_contiry.ts          # 国家/地区列表数据
    └── ...
```

## 功能职责

| 组件 | 路由 | implType | services |
|------|------|----------|----------|
| `Player.tsx` | `/wca/player/:wcaId` | api-driven | `getWCAPersonProfile`、`getWCAPersonResults`、`getWCAPersonCompetitions`、`GetPlayerRankTimers`、`apiGetWCAPersonProfile` |
| `Players.tsx` | `/wca/players` | api-driven | `getWCAPersons` |
| `ProportionEstimation.tsx` | `/wca/proportion-estimation` | api-driven | `getResultProportionEstimation` 及数学工具函数 |
| `Statistics/index.tsx` | `/wca/statistics` | api-driven | `wca/static.ts` + `CountryList`；见 [wca-statistics.md](../features/detail/wca-statistics.md) |
