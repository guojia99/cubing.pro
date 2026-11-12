# Algs Detail — 公式详情页

## 1. 功能概述

展示指定魔方和分类的公式列表，支持：
- 公式筛选/搜索
- 练习计时（准备 → 计时 → 保存 → 下一题）
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

**结论：hybrid** — 后端提供公式数据 + 每日抽题同步，配置存于 localStorage，练习会话与成绩存于 IndexedDB。

## 3. 用户流程

1. 进入公式详情页 → 加载公式组数据
2. 筛选感兴趣的公式 → 选中
3. 确认题集和模式 → 按住空格/计时区准备 → 松开开始 → 再次按下停止 → 保存成功后下一题
4. 查看实际样本均值；满 50/100/1000 条后显示相应 aoN，历史分页读取
5. 标记熟练度
6. 使用随机抽公式练习

### 布局约定

- 页面采用上方练习工具卡片行、下方可调宽的筛选/公式双栏。宽度达到 880px 时显示 288px 默认导航栏及可拖拽分隔条；分隔栏范围 240–480px，公式区至少保留 480px，宽度保存在 `algs_filter_panel_width`。窄屏改用筛选抽屉；工具仍在上方独立一行，可横向滚动。
- 实际公式列数按中间容器宽度、图形尺寸及用户列数上限统一计算。各分组共享列数与卡片高度，网格间距为 8px；末行保持既定列宽，不单独拉伸某张卡片。
- 卡片标题、图示、公式预览区域统一尺寸。普通卡片公式最多预览三行，单列模式每条最多预览两行；完整公式可进入详情查看，字体偏好保持不变。

## 4. 页面与组件树

```
AlgsDetailView.tsx
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
| `algs:formula_practice_config:{cube}-{classId}` | 练习配置 |
| `algs:formula_practice_selection:{cube}-{classId}` | 选中公式 |
| `algs:formula_practice_proficiency:{cube}-{classId}` | 熟练度数据 |
| `algs:formula_random_pick:{cube}:{classId}` | 抽题历史 |
| `algs_custom_{algsKey}` | 自定义公式 |

cube/classId 按各服务既有编码规则生成；旧冒号分隔的历史与选择 key 保持迁移兼容。

### IndexedDB

数据库 `cubing-pro-formula-practice-history`（版本 1），包含 `sessions`、`records`、`migrations` 三个 store。

- 会话和成绩按公式库隔离、按条保存，无应用内条数/会话数上限；实际容量受浏览器配额约束。
- 普通界面按 20 条分页，均值读取最近最多 1000 条，频率统计用游标聚合，不加载全部记录。
- 旧 localStorage 数组/v1/v2 历史在事务提交并核验迁移标记后清理；标记保证重试不会重复导入。
- 成绩具有稳定 ID，失败重试同一条记录，不重复计数；写入失败保留 pending 成绩并提示重试。
- 同题集、配置和内容关闭重开可续练；改变后重新确认配置并建立新会话。窗口失焦或进入后台中断计时，不保存中断成绩。
- 备份接口为异步，导出版本 2，兼容导入版本 1；覆盖 IndexedDB 历史与实际自定义公式 key。现有后端端点不变。

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

## 9. 回归验证

```bash
npm run test:algs
npx playwright install chromium
npm run test:algs:browser
# 启动 Next 开发服务后验证实际详情页布局
ALGS_TEST_URL=http://127.0.0.1:3000 npm run test:algs:layout
npx tsc --noEmit --incremental false
```

第一条覆盖计时状态机、无截断存储、并发/幂等写入、迁移、导入导出与错误恢复。浏览器测试使用真实 React/Chakra 与 IndexedDB、受控故障注入，覆盖快捷键隔离、主指针触控、跨库异步、历史分页、双语、皮肤与短屏布局。无需启动后端。
