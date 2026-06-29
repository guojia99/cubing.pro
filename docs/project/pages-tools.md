# pages — 工具（Tools）

> 路径：`cubing.pro/src/pages/Tools/`

## 目录树

```
Tools/
├── Bld/
│   ├── BldMeor.tsx               # BLD 德语记忆法
│   ├── BldPingYin.tsx            # BLD 拼音记忆法
│   ├── Bld_Associative_Words.tsx # BLD 联想词
│   └── MBld.tsx                   # MBLD 记忆法
├── Draws/
│   ├── SQ1Draw.tsx               # SQ1 打图
│   ├── MinxDraw.tsx              # 五魔方打图
│   ├── SkDraw.tsx                # Skewb 打图
│   └── PyDraw.tsx                # Pyraminx 打图
├── TeamMatch/                     # 团体赛（最大模块，约 65 个文件）
│   ├── TeamMatch.tsx             # 主入口
│   ├── types.ts                  # 类型定义
│   ├── state/                    # 状态管理
│   ├── bracket/                  # 对阵生成
│   ├── elimination/              # 淘汰赛
│   ├── seeding/                  # 种子计算
│   ├── ui/                       # UI 组件
│   ├── utils/
│   │   ├── wcaAvatar.ts          # WCA 头像（apiGetWCAPersonProfile）
│   │   ├── cubingAvatar.ts       # CubingChina 头像（apiGetCubingChinaPerson）
│   │   └── oneGradeApi.ts        # One 成绩平台 API（直接 fetch）
│   └── ...
├── Comps/
│   └── WCAComps.tsx              # WCA 赛事列表（直连 WCA API）
├── Fmc/                          # FMC 工具（如有）
├── timerParser/                  # 计时器日志解析
└── super_bld_metor/              # 超级 BLD 记忆
```

## 功能职责

| 组件 | 路由 | implType | 说明 |
|------|------|----------|------|
| `BldMeor.tsx` | `/tools/bld-d` | frontend-only | BLD 德语字母记忆辅助 |
| `BldPingYin.tsx` | `/tools/bld-pingyin` | frontend-only | BLD 拼音记忆辅助 |
| `Bld_Associative_Words.tsx` | `/tools/associative-words` | frontend-only | BLD 联想词 |
| `MBld.tsx` | `/tools/mbld-d` | frontend-only | MBLD 记忆辅助 |
| `TeamMatch.tsx` | `/tools/team-match` | hybrid | 见 [detail/team-match.md](../features/detail/team-match.md) |
| `SQ1Draw.tsx` | `/draw-tools/sq1-d` | frontend-only | SQ1 打图 |
| `MinxDraw.tsx` | `/draw-tools/minx-d` | frontend-only | 五魔方打图 |
| `SkDraw.tsx` | `/draw-tools/sk-d` | frontend-only | Skewb 打图 |
| `PyDraw.tsx` | `/draw-tools/py-d` | frontend-only | Pyraminx 打图 |
| `WCAComps.tsx` | `/wca/wca-comps` | api-driven | 直连 `worldcubeassociation.org/api/v0/competition_index` |
