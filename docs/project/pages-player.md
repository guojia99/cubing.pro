# pages — 选手（Player）

> 路径：`cubing.pro/src/pages/Player/`

## 目录树

```
Player/
├── Player.tsx                      # 选手详情页
├── Players.tsx                     # 选手列表/搜索
└── PlayerComponents/
    ├── PlayerDetail.tsx             # 详情展示
    ├── PlayerResults.tsx            # 成绩 Tab（核心）
    ├── PlayerResultsList.tsx        # 成绩列表
    ├── PlayerResultsListWithEvent.tsx
    ├── PlayerResultsListWithComps.tsx
    ├── PlayerResultsComps.tsx       # 比赛记录
    ├── PlayerResultRecord.tsx       # 纪录
    ├── PlayerResultNemesis.tsx      # 宿敌
    ├── PlayerResultSor.tsx          # 统计成绩
    ├── PlayerResultDownloadButton.tsx
    ├── SuccessRateBox.tsx           # 成功率
    ├── BestBoGroup.tsx              # 最佳成绩组
    └── echarts/                     # 图表组件
```

## 功能职责

| 组件 | 路由 | implType | services |
|------|------|----------|----------|
| `Player.tsx` | `/player/:id` | api-driven | `apiPlayer`（委托子组件） |
| `Players.tsx` | `/group-competitions/players` | api-driven | `apiPlayers` |
| `PlayerResults.tsx` | （子 Tab） | api-driven | `apiPlayerResults`、`apiPlayerComps`、`apiPlayerNemesis`、`apiPlayerRecords`、`apiPlayerSor`、`apiEvents` |
| `PlayerDetail.tsx` | （子组件） | api-driven | `apiEvents`（辅助） |
