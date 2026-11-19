# 功能地图与领域依赖

核实日期：2026-11-18。表中“已接入”表示有实际 View/调用链，不代表本次完成线上验收。精确路由清单看 `src/config/routes.ts`，实际接线看显式 page 与 `src/app/(main)/[...path]/page.tsx`。

## 1. 页面与功能定位

| 路由 / 功能 | 实现位置（src/views 下） | 数据和协作模块 |
| --- | --- | --- |
| `/`、`/welcome` 首页 | `Welcome/` | 致谢、外链、赞助、广告与站点信息 |
| `/login`、`/auth/callback`、`/user/profile` | `admin/LoginPage.tsx`、`AuthCallbackPage.tsx`、`ProfilePage.tsx` | AuthProvider、auth services、WCA OAuth、头像裁剪 |
| `/settings` | `SettingsPage.tsx` | 网站外观、本地偏好、用户云 KV |
| `/algs`、`/algs/:cube/:class` | `Algs/AlgsListView.tsx`、`AlgsDetailView.tsx` | 公式 API、练习存储、图示、深链接 |
| `/tools/solver/222` | `TwoSolver/` | 本地 Worker、静态公式库、cubing、练习统计 |
| `/tools/floppy-reduction` | `FloppyReduction/` | 前端 FR 状态/分析/求解、3D、教程和本地历史 |
| `/tools/team-match` | `TeamMatch/` | 本地 session、WCA/One 成绩、抽签/对阵/现场显示 |
| `/draw-tools/sq1-d`、`minx-d`、`sk-d`、`py-d`、`fto-d` | `DrawTools/` | 手工形状/颜色编辑与 SVG/PNG/JPEG 导出 |
| `/group-competitions/competitions` | `GroupCompetitions/Competitions/` | 比赛列表、搜索、分页 |
| `/competition/:id` | `Competition/CompetitionView.tsx` | 比赛详情、规则、成绩、打乱和群赛计时 |
| `/group-competitions/players`、`/player/:id` | `GroupCompetitions/Players/`、`GroupCompetitions/Player/GcPlayerView.tsx` | 站内选手资料、成绩、比赛、纪录、SOR |
| `/group-competitions/events`、`static`、`records` | `GroupCompetitions/Events/`、`Static/`、`Records/` | 项目元数据、Kinch、纪录 |
| `/group-competitions/pktimer` | `GroupCompetitions/Pktimer/` | HTTP 拉取 PK 历史；不是实时群赛计时入口 |
| `/wca/wca-comps`、`/wca/players`、`/wca/player/:wcaId` | `Wca/WcaComps/`、`Wca/`、`Wca/PlayerComponents/` | 站内 WCA 库、部分 WCA 官方 API |
| `/wca/statistics`、`/wca/proportion-estimation` | `Wca/Statistics/`、`Wca/ProportionEstimation.tsx` | 统计、年度榜、成功率、多项目排行、比例拟合/ECharts |
| `/admin/organizers`、`comps`、`comps/create` | `admin/` 对应 Organizers View | 主办导航、比赛列表、创建与归属校验 |
| `/admin/organizers/result`、`/admin/organizers/:orgId/comp/:compId/result` | `admin/OrganizersResultsPageView.tsx` | 主办模式比赛管理、成绩录入、审批 |
| `/admin/competition/approvals`、`manage` | `admin/OrganizersCompsPageView.tsx` 导出的 `AdminCompetitionApprovalsPageView`、复用 Results View | 管理员模式列表审批与成绩管理 |
| `/admin/admins`、`users`、`manage/organizers`、`manage/groups` | `admin/` 对应管理 View | 用户权限、主办、群组和成员 |
| `/admin/diy-ranking`、`acknowledgments`、`other-links` | `admin/` 对应管理 View | 自定义人员榜、致谢、外链 |
| `/admin/advertisements` | `admin/AdminAdvertisementsPageView.tsx`、`advertisementDraft.ts` | 显式 SuperAdmin Guard；动态广告完整列表编辑、图片上传、排序和真实组件草稿预览；共用 service 与 ManagedAdvertisement 由展示侧维护 |
| `/other/recipes`、`/other/recipes/:category/:id` | `Recipes/` | 静态索引、Markdown、收藏、今晚清单 |
| `/other/kitchen-skills`、详情 | `KitchenSkills/` | tips 索引与 Markdown |
| `/other/cocktails`、`/other/cocktails/:slug` | `Cocktails/` | IBA JSON、收藏、随机选择、今晚清单 |
| 内容类共享模块（无单独路由） | `FoodShared/` | 筛选、随机选择、分页、收据、材料勾选 |
| `/external-links`、`/buy-coffee`、`/changelog`、`/advertisement` | `ExternalLinks/`、`BuyCoffee/`、`Changelog/`、`Advertisement/` | API 外链、赞助、本地 changelog、固定广告注册表与公开广告 API |
| 共享项目筛选（无单独路由） | `Static/EventSelectorEventsOnly.tsx` | WCA 赛事与统计复用；不是当前群赛统计主目录 |

### 尚未完成或未接入的部分

以下路由有元数据，但当前 catch-all 回退 `PlaceholderPage`：`/user/kv-data`、`/old-login`、`/tools/bld-d`、`/tools/bld-pingyin`、`/tools/associative-words`、`/tools/mbld-d`、`/test`、`/admin/sports`、`/admin/sports/events`。

`/admin/organizers/details`、`group`、`list` 有 View，但仍为“未开放/开发中”提示。后台导航中也有 disabled 卡片。

`CompetitionRegistration.tsx`、`CompetitionSchedule.tsx`、`CompetitionCompetitors.tsx` 是未完成/简单旧组件，当前比赛 View 未接入；不能宣称公开报名、赛程和参赛者页面已完成。后端存在某接口也不证明前端已经实现。

## 2. 公式、练习和图示

```text
AlgsListView / AlgsDetailView
  ├─ services/cubing-pro/algs/algs.ts → /public/algorithm/ 及分类详情
  ├─ AlgsFormulaCard / AlgsModal → 变体、自定义公式、隐藏/筛选
  ├─ FormulaPracticeModal → PracticeTimer → IndexedDB 历史
  └─ AlgsCubeDiagram → components/puzzles/PuzzleDiagram
       ├─ model / notation / practiceSetup → 实际状态
       ├─ cubeDiagrams / specialDiagrams → 本地 SVG
       └─ NativeTwoByTwo / Square1Player / TwistyPuzzlePlayer → 3D
```

维护关键点：

- `algs.ts` 分类目录缓存十分钟，详情缓存十二小时；后端更新后页面仍旧，先核对请求、缓存和源分类。
- `views/Algs/utils/` 负责身份 key、存储、过滤、分类和深链接。`formulaDeepLink.ts` 按 `set/group/case/alg` 精确定位；显示文案不能随意替换持久化身份。
- `formulaPracticeTimer.ts` 的同步状态机负责题目快照、停止和保存；重试沿用记录 ID，历史追加校验幂等。
- `formulaPracticeHistoryDb.ts` 使用 IndexedDB sessions/records/migrations；事务提交后才算成功，不改成每次读取全部历史数组。
- `practiceConfigExport.ts` 汇总多类 localStorage 与 IndexedDB 数据，兼容历史版本并处理失败恢复；不是全站个人数据备份。
- 公式云面板使用 `algorithm_config` 手动上传/应用；不代表每次计时自动上云。
- `PuzzleDiagram` 有可见性懒加载、缓存、进行中 Promise 去重、SVG ID 隔离；批量卡片性能依赖这些机制。
- `model.ts` 显式解析项目/类别，不能只凭动作猜阶数；动作解析有限额，SQ1 另有合法切割检查。
- 缺少后端打乱时 `practiceSetup.ts` 可生成逆公式 setup；FTO 的 `// cubing-pro:native` 是持久化记号边界，显示时才移除。
- 当前 `AlgsCubeDiagram` 主链统一进入 `PuzzleDiagram`；保留的旧 `AlgsVisualCube.tsx` 不等于主链仍远程请求图示。
- 升级 cubing/Three.js 时重点测 `twistyViewerLifecycle.ts`、播放器资源释放、移动端反复开关和 Strict Mode 重挂载。

## 3. 二阶求解与 FR

二阶链路：`TwoSolverView → useTwoSolver → solver.worker.ts → engine/`。Worker 按方法读取 `public/two-solver/data` 并缓存，取消通过 terminate，完成后可复用 warm Worker。`engine/` 包含状态模型、方法索引、结构、搜索、转体、消步和手感评分。

当前支持 CLL、EG1、EG2、LEG1、TCLL±、LS1–9、CBL、EGLS1/2、TEG1/2、FH，默认选择见代码。公式库由实际公式逆操作建立状态索引并校验结构，不直接相信导入 setup。

搜索受时间、深度、结果预算影响，必须保留 `complete/reason/depthReached` 语义；不能把有结果写成穷尽最优。手感分数不是实测秒数，`maxOverlap` 是边界交互预算。`formulaLink.ts` 使用源公式身份，不能拿消步后的 execution 构造原公式链接。

顺手度 v2 在现有 token/三连 `cost` 之上使用 `engine/ergonomicsScale.ts` 的固定分段标尺显示 1%–100%，相同执行 token 不受候选集合影响。总成本、推荐排序与候选保留逻辑不变。UI 配置保存 `scoreVersion`，旧版本仅重置顺手度最低阈值，保留其余偏好；校准锚点及全库/固定搜索分布回归见 `TwoSolver/SOURCES.md` 和 `engine/catalog.test.ts`。

分析页打乱随现有 UI 配置的 `scramble` 字段本地保存，首次自动搜索前完成恢复；手输、随机、空白及未完成草稿均保留，旧配置无此字段时使用示例。练习题及复盘打乱不覆盖分析页输入。

练习链在 `uiPractice.ts`、`practiceStatistics.ts`、`PracticeStats.tsx`；本地保留有限记录，ao5/ao12 先按完整历史计算再截取显示。随机打乱从本地 scrambler 模块生成；条件无命中不证明不存在解。`SolverCube` 有独立播放器所有权。

FR 链路在 `FloppyReduction/fr/`，入口 `analyzeScramble` 验证 HTR，再按 ud/fb/rl 三轴分类真/假 FR，BFS 返回参考解；是前端同步分析，非远程 API 或二阶 Worker。`FrCube3D` 的视角旋转和解法面重标定需配套修改。`services/cubing-pro/fr/practiceHistory.ts` 保存有限本地历史，不与公式 IndexedDB 混用。

手工绘图 `DrawTools/components/DrawPalette` 提供颜色、路径、文字与导出；它和“公式解析成实际状态”的图示链用途不同。

绘图与公式图示下载复用 `lib/svgDownload.ts`：仅序列化 SVG 并交给浏览器栅格化，不解析页面 CSS；绘图 PNG 透明、JPEG 白底，按原画布尺寸 2× 输出，公式 PNG 保持 viewBox 尺寸 2× 白底。团体赛 HTML 对阵图必须走 `lib/html2canvasColors.ts` 的截图克隆颜色转换，不能直接调用 html2canvas 1.4.1 解析主题的 `color()` / `color-mix()` 等值。该转换只改克隆文档并清理本次 iframe，不得全局改写主题或用户画布。

## 4. 群赛、计时与后台

公开比赛 `CompetitionView` 拉取详情，规则/结果等局部懒加载；共享展示依赖 `components/Data`。打乱在 `CompetitionScrambles.tsx`，采用 cstimer 图示链，与公式库本地图示链不同。`scrambleSegments.ts` 处理连拧/多盲，无法可靠拆分时保留原文。

真实群赛计时入口在比赛打乱页，可通过 `comps_tabs=scrambles&groupTimer=1` 打开，源码位于 `Competition/CompetitionComponents/groupTimer/`。支持观察、长按、手输、多盲、备用打乱、导航、本地历史和文本导出。按比赛 ID 保存，导出未记录项按 DNS；云 KV `group_timer_ui_config` 同步设置，不直接提交正式比赛成绩。

后台主链：`OrganizersResultsPageView → auth/groupCompetition.ts → competitionService(mode, orgId, compId)`。它根据主办/管理员模式选 URL，支持完整比赛管理、单条/批量录入、预成绩审批和轮次操作。`lib/groupCompetition.ts` 管理状态、北京时间日期、成绩解析等规则。

动态广告后台入口紧跟赞助，`admin-advertisements` 由 catch-all 接入。管理页仅在 GET 成功后允许编辑和 PUT 完整列表；保存和上传期间锁定编辑，保存失败保留草稿，离页链接和刷新提示未保存修改。图片上传保存原始 `url`，缩略图通过共用 `resolveAdvertisementImage` 显示；不编辑或替换原固定广告。词典 `i18n/messages/advertisements.ts` 导出 `getAdvertisementMessages(locale)`，七语及公共展示 keys 均以 `advertisements.` 开头并注册至根 catalogs。

广告编辑器桌面布局为左侧列表 1/4、右侧编辑 3/4；左侧仅显示选择与状态，当前广告操作在右侧。基础信息（含封面）与详细内容分别展示，商品及展示图采用响应式卡片网格。顶部保存栏吸顶，详情底部另有保存修改入口，两者均保存完整列表。

首页广告紧跟赞助致谢名单，顺序为固定俊改广告、启用的动态广告、固定联系广告。公开 API 失败时仍展示固定广告；动态详情页区分加载、失败重试和未找到。`ManagedAdvertisement` 同时用于后台预览及公开展示，支持封面、商品、展示图、放大预览及站内/外链跳转；未配置目标地址则进入 `/advertisement?key=...`。

维护关键点：

- 群赛必须同时满足 `Genre === 5 && GroupId > 0`。创建请求当前发送 `Genre: 0`，规范化结果需看后端，不凭页面标题修改常量。
- 管理页的录入/审批规则与公开计时器按 `IsDone` 禁用是不同判断；调整时分别核对。
- 主办列表旧接口返回全量数据后前端筛选分页；管理员接口服务端分页，不能统一假设。
- 全量编辑保留比赛和 `comp_json` 原字段，改名另有接口；替换 DTO 时不能丢字段。
- 多盲使用特定三元组，不能套普通单次成绩解析。
- 当前群赛与二阶观察罚时边界的 `>`/`>=` 存在差异，改规则应按各自测试核实。
- `auth/organizers.ts` 保留旧调用，先查 View 实际 import，不只修改历史 service。

## 5. 团体赛

`TeamMatchContext → sessionReducer → storage` 维护本地工作流；三人队伍、种子、抽签、预选/淘汰、16 队正赛、PK、重赛、手工判胜和领奖台分布在同目录领域文件。`stepAccess.ts` 管理步骤可达性，UI 索引与内部 wizardStep 不混用。

`seedingMath`、`drawRandom`、`eliminationDraw/Resolve`、`bracketGen/Complete`、`pkSettlement` 是规则维护入口。确认队伍后改阵容/种子会清空下游，属于一致性机制。并列或双方 DNF 不自动判胜。

支持粘贴/One 导入、WCA/One 成绩补齐、头像同步、JSON 备份与 PNG 对阵导出。外部成绩需转成团体赛秒数，保留手填策略和中止/进度。整个流程主要是本地 session，不与线上群赛共用持久化；`mockLocal.ts` 是显式测试数据能力。

## 6. WCA、统计和内容

WCA 个人页组合站内 profile、比赛、成绩、排名计时，并向官方 person API 补资料。统计包含 Kinch、大满贯、历史/年度全项目、比赛年度、成功率、全项目成就和多项目排行；Kinch 复用群赛组件。`ProportionEstimation.tsx` 结合 API 与前端计算/ECharts。后台 DIY 人员名单与 WCA 多项目综合排行不是同一种数据。

WCA 赛事 `competition_index.ts` 直接调用官方接口；当前调用方未见自动遍历所有页，不要宣称全量赛事都已拉取。

单位边界：

| 数据域 | 常用单位 | DNF / DNS | 优先核对 |
| --- | --- | --- | --- |
| 站内成绩 | 秒 | `-10000 / -10001` | `components/Data/types/result.ts`、后端 result 模型 |
| WCA 原始成绩 | 百分之一秒 | `-1 / -2` | `views/Wca/utils/wca_results.tsx`、WCA service |
| 各练习计时器 | 毫秒 | 各自 penalty/记录协议 | 对应 timer、history 和 formatter |

菜谱和厨房技巧通过静态 JSON 索引 fetch Markdown，鸡尾酒读取 IBA JSON；收藏、今晚清单、材料勾选保存在各自 localStorage。切 API base 不会改变这些内容源。`FoodShared` 共享 UI，`MarkdownViewer` 处理图片基址、标题锚点和内部链接；旧 `editer.tsx` 的 HTML 渲染不能等同于 Markdown 安全边界。

首页致谢/外链来自 API；广告来自 `Advertisement/config.ts` 本地注册；更新日志读取 `public/CHANGELOG.md`。维护内容时先确定源头，避免在展示层写死后台数据。
