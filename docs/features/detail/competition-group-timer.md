# Competition GroupTimer — 群赛计时器

> 嵌入 [competition-scrambles.md](competition-scrambles.md) 的子模块，非独立路由。

## 1. 功能概述

赛事打乱 Tab 内的全屏计时器：按比赛打乱顺序逐条计时（含多盲/连拧合并行）、备打、手动输入、导出追踪；配置可存 localStorage，并可选同步到用户 KV（UI 配置）。

## 2. implType 判定依据

- 打乱行由父组件根据 `comp` + `apiEvents` 构建后以 props/context 传入。
- 无直接 `services/cubing-pro` 请求；`loadGroupTimer` / `saveGroupTimer` 使用 localStorage。
- UI 配置：`loadGroupTimerUiFromStorage`；登录用户可通过 KV 合并云端偏好（见 `GroupTimer.tsx` 内 KV 逻辑）。

**结论：frontend-heavy**

## 3. 用户流程

打开计时器 → 选择项目/轮次/行 → 计时或手动录入 → 下一条 → 可选标记「已导出」→ 关闭抽屉（状态自动保存）。

## 4. 页面与组件树

```
CompetitionScrambles.tsx
└── GroupTimer.tsx
    ├── buildEventContexts.ts
    ├── buildScrambleRows.ts / navigation.ts
    ├── storage.ts
    ├── uiConfig.ts
    ├── types.ts
    └── ScrambleImageMini.tsx
```

## 5. 状态与数据

| localStorage key | 说明 |
|------------------|------|
| `cubingPro.groupTimer.v1:{compId}` | 版本 1：光标、各 slot 成绩、`exportByEvent` |
| `cubingPro.groupTimerUi.v1` | 全局 UI：输入模式、字号、主题色等 |

## 6. 接口契约

无直接 HTTP。父级提供 `CompAPI.CompResp` 与 `EventsAPI.Event[]`。

## 7. 关键函数索引

| 符号 | 文件 | 职责 |
|------|------|------|
| `loadGroupTimer` / `saveGroupTimer` | `groupTimer/storage.ts` | 按比赛 ID 读写计时状态 |
| `buildScrambleRowsForGroup` | `groupTimer/buildScrambleRows.ts` | 与打乱表一致的行序列 |
| `loadGroupTimerUiFromStorage` | `groupTimer/uiConfig.ts` | 读取 UI 配置 |
| `GroupTimer` | `groupTimer/GroupTimer.tsx` | 主 UI 与计时逻辑 |

## 8. 限制与待办

- 比赛 `IsDone` 时父组件拒绝打开。
- 成绩未自动 POST 到主办端成绩接口；导出仅为前端标记/剪贴板类能力（见组件内实现）。
