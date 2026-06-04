# TeamMatch — 团体赛对阵工具

## 1. 功能概述

团体赛对阵管理工具，支持：
- 赛队管理（创建/编辑/添加选手）
- 对阵方案生成（瑞士轮、单败/双败淘汰）
- 种子排名（基于 WCA 成绩）
- 直播 UI（大屏展示）
- 对阵结果录入
- 导出功能

## 2. implType 判定依据

**本站后端 API 调用**：无（不调用 `services/cubing-pro/` 中指向本站后端的请求）

**外部 API 调用**：
- `apiGetWCAPersonProfile` → WCA 官方 API（获取选手头像）
- `apiGetCubingChinaPerson` → 本站 `/wca/cubing-china/person/{wcaId}`（获取 CubingChina 选手页数据）
- `fetch()` → `https://ss.sxmfxh.com/api/grade/user`、`api/comp`、`api/grade/comp`（One 成绩平台）

**大量前端逻辑**：对阵生成算法、淘汰赛编排、种子计算、状态管理（~65 个文件）

**结论：hybrid** — 核心算法全在浏览器，但依赖外部 API 获取选手数据和成绩。

## 3. 用户流程

1. 创建赛事 → 配置项目
2. 添加赛队 → 添加选手（搜索 WCA/CubingChina/One 平台）
3. 生成对阵方案 → 支持多种赛制
4. 录入成绩 → 自动计算晋级
5. 开启直播大屏
6. 导出结果

## 4. 页面与组件树

```
TeamMatch.tsx
├── state/              # 全局状态管理（Context）
├── bracket/            # 对阵生成
│   ├── swiss/         # 瑞士轮
│   └── elimination/   # 淘汰赛
├── seeding/            # 种子排名
│   └── wcaSeeding.ts  # 基于 WCA 成绩计算种子
├── ui/                 # UI 组件（直播、对阵表、结果录入）
└── utils/
    ├── wcaAvatar.ts    # WCA 头像（apiGetWCAPersonProfile）
    ├── cubingAvatar.ts # CubingChina 头像
    └── oneGradeApi.ts  # One 平台 API（直接 fetch）
```

## 5. 状态与数据

### localStorage keys

| key | 说明 |
|-----|------|
| `cubingPro.team-match.v1:STORAGE_KEY` | 主会话数据（赛队、对阵、结果） |
| `cubing-pro:team-match:live-ui-settings` | 直播 UI 设置 |
| `cubing-pro:team-match:pk-arena-settings` | PK 竞技场设置（旧版） |

## 6. 接口契约

### 外部 API

| 函数 | URL | 用途 |
|------|-----|------|
| `apiGetWCAPersonProfile` | `worldcubeassociation.org/api/v0/persons/{wcaID}` | WCA 选手头像 |
| `apiGetCubingChinaPerson` | `/wca/cubing-china/person/{wcaId}`（经本站代理） | CubingChina 选手数据 |
| One 平台 | `https://ss.sxmfxh.com/api/grade/user` | 选手成绩等级 |
| One 平台 | `https://ss.sxmfxh.com/api/comp` | 赛事列表 |
| One 平台 | `https://ss.sxmfxh.com/api/grade/comp` | 赛事成绩等级 |

## 7. 关键函数索引表

| 符号 | 文件（相对 `cubing.pro/`） | 职责 |
|------|---------------------------|------|
| TeamMatch 主入口 | `src/pages/Tools/TeamMatch/TeamMatch.tsx` | 团体赛主页面 |
| wcaSeeding | `src/pages/Tools/TeamMatch/seeding/wcaSeeding.ts` | WCA 成绩种子计算 |
| oneGradeApi | `src/pages/Tools/TeamMatch/utils/oneGradeApi.ts` | One 平台 API 封装 |

## 8. 限制与待办

- 依赖 One 平台 API（第三方，可能不稳定）
- 大量文件（~65），是前端最大模块
