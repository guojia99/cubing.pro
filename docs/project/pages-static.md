# pages — 排行/静态/项目页

> 路径：`cubing.pro/src/pages/Static/`、`Events/`

## 目录树

```
Static/
├── Static.tsx                     # 多 Tab 容器（KinCh + DIY）
├── Record.tsx                     # 纪录页
├── RecordComponents/
│   ├── RecordWithBest.tsx         # 最佳纪录展示
│   └── RecordWithEvents.tsx      # 按项目纪录
├── Kinsor.tsx                     # KinCh 排名
├── Sor.tsx                        # DIY SoR 排名
├── DiyRanks.tsx                   # DIY 榜单
├── Pktimers.tsx                   # PK 计时器
├── Best.tsx                       # 最佳成绩（辅助组件）
├── EventSelector.tsx              # 项目选择器
├── EventSelectorEventsOnly.tsx    # 仅项目选择
├── KinsorPlayerDetail.tsx         # KinCh 选手详情

Events/
└── Events.tsx                     # 项目列表页
```

## 功能职责

| 组件 | 路由 | implType | services |
|------|------|----------|----------|
| `Static.tsx` | `/group-competitions/static` | api-driven | 委托 Kinsor、DiyRanks |
| `Record.tsx` | `/group-competitions/records` | api-driven | `apiRecords`、`apiEvents`、`apiPublicCompGroups` |
| `Events.tsx` | `/group-competitions/events` | api-driven | `apiEvents` |
| `Pktimers.tsx` | `/group-competitions/pktimer` | api-driven | `GetPKTimer` |
| `Kinsor.tsx` | （子组件） | api-driven | `apiKinch`、`apiSeniorKinch` |
| `DiyRanks.tsx` | （子组件） | api-driven | `apiDiyRanking`、`apiDiyRankingKinch`、`apiGetAllDiyRankingKey` |
| `Sor.tsx` | （子组件） | api-driven | `apiDiyRankingSor` |
