# Algs Detail — 公式详情页

## 1. 功能概述

展示指定魔方和分类的公式列表，支持：
- 公式筛选/搜索
- 练习计时（准备 → 计时 → 保存 → 下一题）
- 随机抽公式（手动/每日自动）
- 熟练度追踪
- 自定义公式管理
- 本地 SVG 图示与交互 3D 公式播放
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

练习器默认铺满浏览器窗口，头部可切换浏览器原生全屏；浏览器拒绝或不支持时仍保留全窗口布局。退出全屏不重建会话或清除成绩，关闭练习器时只退出自身申请的全屏。全屏变化中断准备/计时，不保存中断成绩。主练习页标记熟练度后恢复计时区焦点，下一次空格可正常准备和开始；历史、详情、配置及其他输入控件仍保持快捷键隔离。

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
├── 本地 SVG / 3D 渲染（共享 PuzzleDiagram）
└── 配置导入/导出
```

## 5. 状态与数据

### localStorage keys

| key | 说明 |
|-----|------|
| `algs_user_selection` | 用户选中的公式 |
| `algs_formula_font_size` | 字号偏好 |
| `algs_formula_font_family` | 字体偏好 |
| `algs_use_visualcube_renderer` | 旧偏好兼容；支持的魔方始终本地生成 |
| `algs_puzzle_preferences_v1` | 本地底色、前色和默认视图；随 v2 备份导入导出 |
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
- 2D 图示使用随站点打包的本地绘图源码；公式状态校验及 3D 使用 `cubing@0.63.3`。不请求外部 CDN 或图片服务，公式数据仍来自现有 API 与缓存；不承诺整个网站离线可用。上游固定版本、来源及 GPL/LGPL/Apache/MPL/MIT 许可保留在 `src/vendor/puzzle-drawing/README.md` 和相邻许可证文件中。
- 列表、分类封面、详情、自定义公式、练习、抽题和熟练度入口共用 `src/components/puzzles/PuzzleDiagram.tsx`。历史只有图片且无法重建状态时保留旧图兼容。
- 默认正阶配色为 D 白、U 黄、F 红、B 橙、R 绿、L 蓝。底色与前色必须相邻，其余四面由 24 种实物旋转推导；不随站点明暗主题改变。
- 默认自动模式：缩略图为 2D，交互详情为 3D；用户可选择默认 2D/3D，或在详情临时切换。
- 二阶例外：非 PBL 分类使用上游 VisualCube `view: plan, puzzleSize: 2` 绘制四格单顶面及侧面色条，cubing.js 负责公式校验、展开与求逆，自动模式详情默认 2D。PBL 直接用原生 `TwistyPlayer` 的 `puzzle: 2x2x2, visualization: 3D`：缩略图缓存原生 Canvas 截图，详情默认交互 3D，不再使用静态 SVG 立体投影。两种状态来源（公式反推、setup）使用相同分类规则。
- 其余正阶使用上游 VisualCube 的分类 preset：OLL/PLL/COLL/CMLL 顶层识别图、F2L 和 ZBLS 的专用视图、高阶 L2E 完整立体识别图。五魔使用上游 `MEGAMINX_TOP`，金字塔使用 `renderPuzzleIsoSvg`，Skewb 使用 25 多边形扇形图，SQ1 使用堆叠分层 SVG，FTO 使用 EIF 全面图。只引入绘图依赖闭包，不引入上游账户、API 或公式数据。
- 不同引擎之间按完整贴纸动作验证记号转换，包括五魔 `Br/Bl` 与 `BR/BL` 的差异、旋转及宽转。正阶首次证明的动作按阶数缓存，保留每条 setup/pattern 和最终全贴纸一致性校验。SQ1 阶段优先读取 setName（CP/EP 不从 CPEP 猜拆），CS 单色形状图，其他阶段保留本地配色。Skewb 内嵌通用 CSS 转为局部 polygon 属性，避免污染同页其他 SVG。
- 二阶原生播放器采用最多两个可复用槽（截图一个、交互一个），避免重复创建原生 viewer 的资源增长；停放时暂停并移出视口。弹窗交互区同步层级、滚动裁剪及局部 Tab 边界，退出后恢复焦点；其余魔方维持原受控 viewer 路径。
- 原生弹窗的裁剪遍历止于 dialog，不再读取锁滚后 body 的页面坐标，避免滚到后续公式时把 fixed 3D 误隐藏。截图及交互分别串行排队，10 秒超时会终止当前 generation；过期任务不能写回共享状态或缓存。初始化失败不缓存 rejected Promise，WebGL context 恢复后允许后续请求重试；无订阅的排队缩略图取消，不继续消耗渲染资源。
- 公式分组列表 JSX 单独缓存，打开、关闭和前后切换详情不重绘全题集；筛选、图示/字体设置、公式选择、自定义公式、语言 Context 等更新仍正常生效。真实 EGLS1 1830 张卡片复测 40 次前进/后退和 20 次开关，滚动后截图全部非空，两个原生槽的 geometry/program 数不增长。
- 二阶目录仅在前端分为四组：LS1–LS9、EGLS1/2（兼容旧 LS）为 LS / EGLS；CLL、EG1、EG2、LEG 为 CLL / EG；CBL 单列；剩余及未来未知分类进入“其他”。组内保留后端原名称、计数和路由，LS 按数字顺序排列。LS/EGLS、FakeBar 与 PBL 共用原生 3D 截图和自动模式详情 3D，其余二阶默认平面图。
- `PLLP` 映射四阶，`L2E` 映射五阶；`special` 根据分类区分金字塔和 FTO。未知类型不隐式按三阶处理。
- 新高阶目录识别显式阶数前缀（4x4 OLLP/PLLP、5x5 L2E/L2C、6x6 L2E/L2C），无前缀 LCE 按后端 `5x5-LCE-Trainer` 映射五阶。L2C 使用中心遮罩，L2E/LCE 使用完整识别图；旧 PLLP/L2E 链接继续兼容。
- 正阶解析使用上游换握标记规则，将注释外的 `↑↓·` 替换为空格，并严格分隔 `U'D'`、`UD`、`(U2)F` 等紧邻标准动作；显示原文不变，未知字符不丢弃。小写 m/e/s 与大写 M/E/S 分别按原生动作转换并校验，避免高阶内层转动混淆。
- 正常公式以逆公式生成案例状态，打乱图正向执行 setup。SQ1 检查切层合法性；Skewb、金字塔、FTO 和 SQ1 方言按有来源的记号规则适配，原文保留。
- 不能可靠执行的公式明确提示；有有效标准 setup 时可生成图并拖动观察，但不冒充原公式播放。缺少练习打乱时，仅为有效可逆公式生成 setup。FTO 自产 setup 的 `// cubing-pro:native` 持久化标记保留解析域，界面不显示该元数据。
- SQ1 使用独立 Three.js 形变播放器，其他类型复用 cubing 动画模型与控件。受控 viewer 生命周期依赖 0.63.3 的接入点，因此精确锁定版本；升级前需复测 symbol 初始化、订阅断开、渲染资源销毁和原生控件。
- SVG 每个实例隔离全部 ID/引用，视图及遮罩由上游绘图工具处理。2D 绘图限制与合法 3D 状态分别处理，平面失败不阻断原公式的 3D 播放。列表按可见范围加载；完成结果缓存最多 256 项，进行中请求独立去重。
- 2026-11-13 对当前公开库 6,365 个 case 的首公式及首 setup 检查：6,339 个正常（含一个显式已复原案例）、24 个 setup 回退、2 个四阶 PLLP 含不支持的 M/异常原文而失败。这是记号/执行检查，不构成案例命名或图态语义正确性的证明。
- 交互色规范见 [design/colors.md](../../design/colors.md)（正常 / 夜晚两套语义 token）
- 真实 Next 生产构建、573 页生成及九类图示功能检查通过。主题复访仍偶发既有 next-themes bootstrap 水合错误，定位到用户现有 `color-mode.tsx` 的服务端/客户端 script 分支；该文件未由本次绘图改造修改，不计为零运行时错误。

## 9. 回归验证

```bash
npm run test:algs
npx playwright install chromium
npm run test:algs:browser
npm run test:puzzles
npm run test:puzzles:browser
npm run test:puzzles:native
# 启动 Next 开发服务后验证实际详情页布局
ALGS_TEST_URL=http://127.0.0.1:3000 npm run test:algs:layout
npx tsc --noEmit --incremental false
```

第一条覆盖计时状态机、无截断存储、并发/幂等写入、迁移、导入导出与错误恢复。浏览器测试使用真实 React/Chakra 与 IndexedDB、受控故障注入，覆盖快捷键隔离、主指针触控、跨库异步、历史分页、双语、皮肤与短屏布局。无需启动后端。

`test:puzzles` 覆盖记号方言、物理切层、展开预算、配色手性、缺打乱反推、自产 setup 历史往返及并发去重。`test:puzzles:browser` 使用真实 SVG 和 GPU 渲染，覆盖九类代表魔方、播放终态、同页配色同步、SVG 引用隔离、关闭重开资源计数、320/768/1440px 布局及无外域资源请求。异步播放条件使用 Node 轮询，并包含 false 超时负对照。
