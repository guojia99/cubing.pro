# pages — 公式库（Algs）

> 路径：`cubing.pro/src/pages/Algs/`

## 目录树

```
Algs/
├── AlgsList.tsx                   # 公式总览页
└── AlgsDetail.tsx                 # 公式详情页（含练习、抽题、熟练度）
```

## 功能职责

| 组件 | 路由 | implType | 说明 |
|------|------|----------|------|
| `AlgsList.tsx` | `/algs` | frontend-heavy | 加载公式组总览，展示各魔方分类。API 仅一个（getAlgCubeMap） |
| `AlgsDetail.tsx` | `/algs/:cube/:class` | hybrid | 详情见 [detail/algs.md](../features/detail/algs.md) |

## AlgsDetail 子功能（内置，非独立路由）

| 功能 | implType | 数据来源 |
|------|----------|----------|
| 公式筛选/展示 | hybrid | API 公式数据 + localStorage 用户选择 |
| 练习计时 | frontend-only | localStorage |
| 熟练度追踪 | frontend-only | localStorage |
| 随机抽公式 | hybrid | localStorage + KV（每日抽题） |
| 自定义公式 | frontend-only | localStorage |
| VisualCube 渲染 | frontend-only | VisualCube URL |
| 练习统计（ao50/100/1000） | frontend-only | localStorage |
