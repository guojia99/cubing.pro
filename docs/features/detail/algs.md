# Algs Detail — 公式详情页

## 1. 功能概述

展示指定魔方和分类的公式列表，支持：
- 公式筛选/搜索
- 练习计时（计时 → 记录 → 统计）
- 随机抽公式（手动/每日自动）
- 熟练度追踪
- 自定义公式管理
- VisualCube 方块图渲染
- 配置导入/导出

## 2. implType 判定依据

**API 调用**：
- `getAlgCubeClass`（`GET /public/algorithm/{cube}/{classID}`）
- `getDailyPickState` / `saveDailyPick`（间接通过 `getKeyMap` / `setSubKeyValue` → `/user/kv/`）

**localStorage 调用**（≥7 个 key）：
- 练习配置、选中公式、练习历史、熟练度、随机抽题、自定义公式、UI 偏好

**结论：hybrid** — 后端提供公式数据 + 每日抽题同步，大量前端逻辑在浏览器完成。

## 3. 用户流程

1. 进入公式详情页 → 加载公式组数据
2. 筛选感兴趣的公式 → 选中
3. 开始练习 → 计时 → 保存记录
4. 查看统计（ao50/100/1000）
5. 标记熟练度
6. 使用随机抽公式练习

## 4. 页面与组件树

```
AlgsDetail.tsx
├── getAlgCubeClass → 加载公式数据
├── 公式筛选/搜索 UI
├── 练习模式
│   ├── 计时器
│   ├── 记录管理
│   └── 统计图表（ao50/100/1000）
├── 随机抽公式
│   ├── 手动抽题
│   └── 每日抽题（KV 同步）
├── 熟练度面板
├── 自定义公式管理
├── VisualCube 渲染
└── 配置导入/导出
```

## 5. 状态与数据

### localStorage keys

| key | 说明 |
|-----|------|
| `algs_user_selection` | 用户选中的公式 |
| `algs_formula_font_size` | 字号偏好 |
| `algs_formula_font_family` | 字体偏好 |
| `algs_use_visualcube_renderer` | VisualCube 开关 |
| `algs_columns_per_row_by_repo` | 布局列数 |
| `algs_hide_alt_formulas_by_repo` | 隐藏备用公式 |
| `algs_hidden_formulas_by_repo` | 隐藏的公式 key |
| `algs_practice:{cube}:{classId}:config` | 练习配置 |
| `algs_practice:{cube}:{classId}:selection` | 选中公式 |
| `algs_practice:{cube}:{classId}:history` | 练习历史 |
| `algs_proficiency:{cube}:{classId}` | 熟练度数据 |
| `algs_random_pick:{cube}:{classId}` | 抽题历史 |
| `algs_custom:{algsKey}` | 自定义公式 |

### 后端 KV

| key | 说明 |
|-----|------|
| `algs:daily_random_pick` | 每日抽题状态（需登录） |

## 6. 接口契约

| 函数 | 端点 | 见 |
|------|------|------|
| `getAlgCubeClass` | `GET /public/algorithm/{cube}/{classID}` | [public-api.md](../../api/public-api.md) |
| `getDailyPickState` | 间接 `GET /user/kv/algs:daily_random_pick` | [frontend-services.md](../../api/frontend-services.md) |
| `saveDailyPick` | 间接 `POST /user/kv/` | [frontend-services.md](../../api/frontend-services.md) |

## 7. 关键函数索引表

| 符号 | 文件（相对 `cubing.pro/`） | 职责 |
|------|---------------------------|------|
| `getFormulaPracticeHistory` | `src/services/cubing-pro/algs/formulaPracticeHistory.ts` | 获取练习历史 |
| `createPracticeSession` | 同上 | 创建练习会话 |
| `appendFormulaPracticeRecord` | 同上 | 追加练习记录 |
| `computeAverages` | 同上 | 计算 ao50/100/1000 |
| `getFormulaProficiency` | `src/services/cubing-pro/algs/formulaPracticeProficiency.ts` | 获取熟练度 |
| `getUnskilledFormulaKeys` | 同上 | 获取未熟练公式 |
| `getFormulaPickHistory` | `src/services/cubing-pro/algs/formulaRandomPick.ts` | 获取抽题历史 |

## 8. 限制与待办

- 未登录时每日抽题不跨设备同步（仅 localStorage）
- VisualCube 渲染使用内置 `sr-visualizer`（客户端本地生成，非外链）
- 交互色规范见 [design/colors.md](../../design/colors.md)（正常 / 夜晚两套语义 token）
