# 前端视觉重构与修复记录

日期：2026-11-18。范围：当前 Next.js 前端仓库。本记录描述代码变更和本地验证，不代表已经部署上线。

## 一、目标与最终设计方向

参考 jingxin18.cn 的导航布局、分组菜单、透明表面、圆角、轻阴影与内容层级，使用 Cubing Pro 的海蓝品牌色。采用紧凑功能首页，保留既有业务、接口、权限、数据与本地存储协议。

参考站的 hover-only 菜单、自定义弹层焦点缺失、滚动监听重复注册等实现没有照搬。本站导航使用可访问的 Chakra Menu/Drawer，支持触控、键盘、Escape、焦点恢复与背景滚动管理。

### 首页文案与栏目

- 标识：`CUBING PRO`。
- 标题：**魔方公式、练习与赛事**。
- 说明：**公式查询、还原练习、线上比赛与 WCA 数据，常用功能集中在这里。**
- 练习工具：公式库、二阶求解器、FR；不包含团体赛或绘图工具。
- 致谢紧接练习工具区，位于公式库、二阶求解器、FR 三个快捷卡片之后、分类目录之前。
- 致谢人物卡支持鼠标悬停轻微抬升、品牌色柔光、阴影和头像缩放/微旋转；键盘聚焦提供边框和背景反馈，触屏不启用悬停变形，减少动效模式关闭位移与缩放。
- 快捷目录：群赛、WCA、公式库、绘图四组，每组四个主入口，统一入口行高和分组高度。
- 公式快捷入口：二阶 CLL、EG1，三阶 OLL、PLL；分类已对照 API 核实。
- 绘图主入口及补充入口合计保留正阶外部工具、SQ-1、Megaminx、Skewb、Pyraminx、FTO。
- 团体赛对阵等入口归入赛事工具区域。
- “吃吃喝喝”独立全宽栏目：菜谱、厨房技能、鸡尾酒，配站内现有照片。
- 既有致谢、精选外链、赞助、广告继续接入，未编造统计或动态数据。

### 品牌资产

| 用途 | 实际资源 |
| --- | --- |
| 顶栏、首页 Logo | `public/CubingProLogo.png` |
| 浏览器 icon | `public/CubingProMiniIcon.png`，metadata 直接引用原 PNG |
| 首页分组插画 | `src/views/Welcome/HomeIllustration.tsx` 静态 SVG |
| WCA 分组图片 | `public/images/wca.svg` |
| 生活栏目照片 | 复用 HowToCook 照片与 `public/iba/images/negroni.webp` |

没有复制参考站品牌图片、视频或字体文件。首页图形不引入 3D/求解引擎。

## 二、通用组件与主题基础

| 文件/模块 | 本次职责 |
| --- | --- |
| `src/components/ui/page.tsx` | `PageHeader`、`SectionHeader`、`Surface`、`FeatureLink`，统一页头、分区、面板和入口卡片 |
| `src/styles/design-system.css` | 内容宽度、顶栏高度、字体、圆角、阴影、焦点、Ant 共享视觉和 reduced-motion |
| `src/styles/tokens.css` | 保留八套配色与明暗模式，优化默认海天色的表面及文字层次 |
| `src/theme/index.ts` | Chakra 默认语义色、按钮/输入框 recipes、卡片/菜单/弹窗/Tabs slot recipes |
| `src/components/ui/AntThemeProvider.tsx` | Ant Design 跟随真实明暗、palette、语言，统一表格/控件/弹窗样式 |
| `src/theme/useThemeColors.ts` | 订阅 HTML 主题与配色变化，向图表提供稳定颜色快照 |
| `src/components/layout/*` | 桌面居中品牌、左右导航/动作区、手机分组抽屉、明确容器宽度 |
| `src/components/{Tabs,Buttons,Table,Data,Link}` | 导航 Tab、分页、固定列、表格、链接统一视觉 |
| `src/components/Markdown/*` | 阅读、目录、编辑器工具栏及弹层跟随站内主题 |

基础值：顶栏高度 4rem，常规页面最大宽度 1440px，卡片圆角 1rem；普通弹窗 1.5rem，Ant Modal 1rem。阅读页、密集表格、沉浸工具仍保留适合自身任务的宽度与密度。

业务颜色独立保留：魔方贴纸、奖牌、纪录、罚时、团队和直播自定义颜色不随品牌色机械替换。

## 三、路由覆盖清单

以 `src/config/routes.ts` 为基准，共 **64 条登记路由**，另有根首页和 404。以下“覆盖”指页面及其共享组件已接入视觉迁移；原有占位页没有扩展为完整业务。动态路由代表一类页面，不表示每个真实 ID 都逐一人工检查。

### 门户与账户（11 条）

| 路由 | 覆盖内容/保留状态 |
| --- | --- |
| `/welcome`；另有 `/` | 首页主视觉、练习入口、四组目录、生活栏目、致谢/外链/赞助/广告 |
| `/buy-coffee` | 支付卡片、二维码加载/预览、图片回退 |
| `/changelog` | 年份/范围筛选、日志卡、Markdown、窄屏滚动 |
| `/external-links` | 搜索、分组、图标、外链卡、空结果 |
| `/advertisement` | 广告详情、无效 key 状态、图文响应式与图片原图 |
| `/settings` | 主题、字号、palette、保存区与移动端布局 |
| `/user/kv-data` | 统一通用预留页；原本未实现 KV 列表 |
| `/login` | WCA 登录与回跳说明 |
| `/auth/callback` | OAuth 回调过程/错误展示，保留处理和跳转逻辑 |
| `/old-login` | 统一通用预留页，未实现旧登录业务 |
| `/user/profile` | 资料、头像上传/URL、更改面板 |

### 主办工作台（8 条）

| 路由 | 覆盖内容/保留状态 |
| --- | --- |
| `/admin/organizers` | 主办导航与入口卡 |
| `/admin/organizers/comps` | 筛选、分页、比赛列表与入口 |
| `/admin/organizers/comps/create` | 创建表单、项目/轮次、导入导出所在公共壳层 |
| `/admin/organizers/details` | 保留“暂未开放”，统一提示面板 |
| `/admin/organizers/group` | 保留“开发中”，统一提示面板 |
| `/admin/organizers/result` | 比赛管理、单条/批量录入、预成绩审批 |
| `/admin/organizers/list` | 保留“开发中”，统一提示面板 |
| `/admin/organizers/:orgId/comp/:compId/result` | 动态成绩工作台，保留真实参数解析 |

### 管理员后台（11 条）

| 路由 | 覆盖内容/保留状态 |
| --- | --- |
| `/admin/admins` | 管理员/超管分组导航，未开放入口保持禁用 |
| `/admin/competition/approvals` | 群赛审批列表、筛选、审批弹窗 |
| `/admin/competition/manage` | 管理模式比赛工作台 |
| `/admin/users` | 用户表、搜索、资料/权限、合并/删除确认 |
| `/admin/manage/organizers` | 团队、成员、组长、关联群组 |
| `/admin/manage/groups` | 群组列表与编辑 |
| `/admin/diy-ranking` | 榜单管理与编辑 |
| `/admin/acknowledgments` | 致谢列表、编辑、置顶、拖拽 |
| `/admin/other-links` | 外链分组、排序、跨组移动、删除策略 |
| `/admin/sports` | 通用预留页，未实现体育赛事业务 |
| `/admin/sports/events` | 通用预留页，未实现体育项目业务 |

### 公式与工具（15 条）

| 路由 | 覆盖内容/保留状态 |
| --- | --- |
| `/algs` | 分类目录、工具栏、导入导出入口 |
| `/algs/:cube/:class` | 筛选、案例网格、公式/自定义弹窗、随机、练习与历史统计 |
| `/tools/team-match` | 组队、录入、抽签、阶段工作区、导入确认、直播设置；保留专用舞台 |
| `/tools/floppy-reduction` | 分析、轴选择、解法、3D、教程、练习/历史 |
| `/tools/solver/222` | 求解工作台、配置、解法、3D、计时练习、复盘和统计 |
| `/draw-tools/sq1-d` | 画布、视图切换、调色、控制与导出 |
| `/draw-tools/minx-d` | 画布、视图切换、调色、控制与导出 |
| `/draw-tools/sk-d` | 画布、视图切换、调色、控制与导出 |
| `/draw-tools/py-d` | 画布、调色、控制与导出 |
| `/draw-tools/fto-d` | 画布、调色、控制与导出 |
| `/tools/bld-d` | 通用预留页，未实现 BLD 练习 |
| `/tools/bld-pingyin` | 通用预留页，未实现拼音工具 |
| `/tools/associative-words` | 通用预留页，未实现联想词工具 |
| `/tools/mbld-d` | 通用预留页，未实现 MBLD 工具 |
| `/test` | 通用预留页 |

### 群赛、赛事与站内选手（8 条）

| 路由 | 覆盖内容 |
| --- | --- |
| `/group-competitions/static` | Kinch 排名、筛选和明细 |
| `/group-competitions/records` | 总纪录/历史、项目与群组筛选 |
| `/group-competitions/events` | 项目信息与分类 |
| `/group-competitions/competitions` | 赛事列表、搜索、分页 |
| `/group-competitions/players` | 选手列表、搜索、分页 |
| `/group-competitions/pktimer` | PK 历史及嵌套成绩，不是实时计时器 |
| `/competition/:id` | 详情、规则、赛果、打乱，以及独立群赛计时器 |
| `/player/:id` | 资料、成绩、赛事、纪录、宿敌、排位分、统计图；原有能力占位仍保留 |

### WCA（5 条）

| 路由 | 覆盖内容 |
| --- | --- |
| `/wca/wca-comps` | 国家/项目筛选、卡片/表格、报名信息 |
| `/wca/players` | 选手搜索及结果/错误/空状态 |
| `/wca/player/:wcaId` | 资料、成绩/比赛、项目统计、里程碑、城市地图及图表 |
| `/wca/proportion-estimation` | 参数、推算表、比例拟合图及算法说明 |
| `/wca/statistics` | Kinch、大满贯、历史榜、全量榜、年度全量榜、参赛年度、成功率、全项目成就、多项目榜九个子页 |

### 菜谱、厨房技能与鸡尾酒（6 条）

| 路由 | 覆盖内容 |
| --- | --- |
| `/other/recipes` | 分类/难度/材料筛选、卡片、收藏、随机、今晚清单 |
| `/other/recipes/:category/:id` | 详情、图片、Markdown、目录、收藏/清单 |
| `/other/kitchen-skills` | 分类、技能卡片、搜索/空态 |
| `/other/kitchen-skills/:category/:id` | 正文、目录、图片、内部链接 |
| `/other/cocktails` | 分类、图文卡、收藏、随机与配料清单 |
| `/other/cocktails/:slug` | 图文详情、配料、步骤、收藏/清单 |

另行处理：未知 URL 的 404、对象不存在状态、权限 Guard、加载状态。404 移除重复 Provider，避免嵌套主题和认证上下文。

## 四、修复项与兼容性

| 问题 | 修复 |
| --- | --- |
| 根首页和动态详情导航归属不正确 | 规范化首页路径，为赛事/选手详情提供所属菜单高亮 |
| 手机自定义侧栏缺少完整键盘/焦点行为 | Chakra Drawer、Escape、焦点移入/返回、滚动锁与断点/路由关闭 |
| 1280px 英文导航挤入 Logo | 调整桌面导航留白及品牌布局；320px 收窄登录动作 |
| Chakra/Ant/自定义控件各用一套主题 | 统一 CSS 语义色、全局 Ant Provider、共享 recipes |
| Chakra slot 短数组破坏默认槽位 | 使用完整 anatomy slots，保留 Tabs 根布局和尺寸变量 |
| Markdown 仅跟随系统深色 | 改为跟随站内 `html.dark`，编辑器及弹层也接入语义色 |
| 深色固定表头/列白底或透字 | 区分表头与 tbody 固定列，使用不透明主题背景 |
| 静态确认框不继承主题 | 用户管理使用上下文 Modal；团体赛导入与 One ID 流程使用 `App.useApp().modal` |
| Portal 中旧 Ant 变量没有作用域 | 群赛计时器/打乱工具改用站点语义变量 |
| 图表切主题不更新 | `useThemeColors()` 订阅；memo 纳入主题依赖，无须刷新或重取业务 API |
| 地图渐变导致 ECharts 解析异常 | 热力插值使用 ECharts 数值 RGBA；不向其插值器传 `color-mix()` |
| sticky 工具栏被顶栏遮挡 | 使用 header token 加间距，按实际几何验证 |
| 320px 年份筛选与致谢 ID 溢出 | 年份容器可滚动，长 ID 可断行，控制最小宽度 |
| 320px 英文首页目录高度不一致 | 目录 grid 使用等高自动行，保留完整标题，描述最多两行 |
| 致谢列表加载后未观察尺寸 | 数据就绪后绑定/清理 ResizeObserver |
| 二维码先请求不存在 PNG | 优先实际 JPG，保留加载失败回退和预览 |
| 轮播缺乏暂停与键盘反馈 | 手动切换、暂停、hover/focus 暂停和 reduced-motion |
| 材料清单触控/名称关联不足 | 名称关联复选框并扩大点击区域 |
| 测试样式与生产不同 | 公式计时 harness 加载生产 CSS；群赛测试使用真实 Ant Provider |

未改变公式身份、计时键盘协议、Worker 求解、URL Tabs 事件/保留挂载策略、localStorage/IndexedDB schema、OAuth/权限规则、API 契约。修复范围包含显示和交互兼容，不包含新后端功能。

## 五、验证记录

### 静态检查与构建

| 检查 | 结果 |
| --- | --- |
| `./node_modules/.bin/tsc --noEmit --incremental false` | 通过 |
| `./node_modules/.bin/eslint src --quiet` | 通过；仍有历史 warning，未自动修复无关逻辑 |
| `git diff --check` | 通过 |
| `SKIP_HOWTOCOOK=1 npm run build:static` | 通过，生成 633 个页面，核验 78 个公式路由；沿用现有菜谱数据，没有重新同步 |
| 全仓库 `npm run lint` | 未通过：还扫描 public 中生成/上游打乱器代码，不能视为源码检查通过；本次未修改这些生成文件 |

静态导出会提示 rewrites 不应用于静态文件，这是现有部署模式的限制；动态详情继续依靠生成的 nginx fallback 配置。构建存在既有 Hook/图片 warning，未将它们写为零警告。

### 功能与浏览器

| 范围 | 已执行结果 |
| --- | --- |
| 静态导出脚本/路径测试 | 75 通过 |
| Puzzle 单测 | 75 通过、1 项依赖本地目录的测试跳过 |
| 二阶求解单测 | 283 通过 |
| 公式计时/历史单测 | 48 通过 |
| 群赛业务单测 | 19 通过 |
| 原有公式布局/计时浏览器 | 通过，布局含 320–1920px、拖拽/键盘调宽与存储 |
| 原有二阶工作台/练习/公式联动浏览器 | 通过，含真实 Worker、3D、计时、复盘、深链 |
| 五域复杂工作台 | 390/1440 × 明暗，68 项检查；公式/二阶/FR/团体赛/赛事与群赛计时器 |
| WCA/群赛/后台页面矩阵 | 242 个截图检查点，页面异常 0；读写请求通过 fixture 拦截 |
| 图表同页主题/配色切换 | 390 与 1440 各 88 项颜色检查、20 个截图检查点；世界/中国/上海地图往返；不刷新、不重取业务 API、series 数据保持 |
| 食品与绘图 | 44 组页面、28 组交互，20 次 SVG 导出；检查收藏/清单持久化与真实贴纸点击 |
| 导航 | 320/390/1024/1440 × 中英文 × 明暗，32 组页面与16组真实路由/前后退；另测1280英文 |
| 最终首页调整 | 在静态构建产物上跑 320/390/1440 × 中英文 × 明暗，12组全部通过；四组各四入口且等高，图片加载成功，无 hydration 警告 |
| 公共标题 hydration/404 | 首页、welcome、settings 重访未再出现标题 class mismatch；未知页返回404且仅一个顶栏 |
| 深色导入/One ID确认与Portal | 390/1440 × 明暗，76项颜色断言；取消不写、确认写、冲突阻止写 |

可复跑新增测试：

```bash
node src/views/Welcome/home.browser.test.mjs
node src/views/Algs/components/workspaceVisual.browser.test.mjs
node src/views/TeamMatch/components/portalTheme.browser.test.mjs
node src/views/admin/visualMigration.browser.test.mjs
node src/views/FoodShared/foodDrawVisual.browser.test.mjs
VISUAL_FILTER='^(proportion|wca-player|wca-player-litCities|gc-player)$' VISUAL_CHART_THEME=1 node src/views/admin/visualMigration.browser.test.mjs
```

首页测试支持 `HOME_TEST_URL`。本轮最终执行 `HOME_TEST_URL=http://127.0.0.1:4173 node src/views/Welcome/home.browser.test.mjs`，4173 使用本地 HTTP 服务直接托管 `dist/`，因此同时覆盖生产打包后的标题、图片、等高布局与 icon。

这些真实页面测试默认使用 `http://127.0.0.1:3000`，需先启动开发服务；具体 URL 环境变量见脚本。截图、JSON 报告、下载文件位于脚本输出的临时目录，不作为业务静态资源提交。

## 六、验证边界与后续维护

- 页面矩阵主要使用确定性 API/认证 fixture，避免更改线上数据；不等于已完成真实 OAuth 和后台线上写入联调。
- 动态页按代表性数据、空态、无效对象测试，没有穷举全部选手/赛事/公式与全部数据规模。
- 已实际测量布局、计算样式、对比度与交互；部分代表截图由辅助图像工具核验，不宣称全部截图逐像素人工验收。
- 绘图本轮验证 SVG 导出；PNG/JPG 下载仍使用原实现，未做完整逐格式验收。
- 团体赛未在真实现场走完全赛季和全部直播硬件流程；浏览器测试覆盖本地赛事状态及相关弹层。
- 原有9个通用占位路由与3个主办提示页仍然保留。视觉统一不代表相应业务已开发。
- catch-all 页面构建输出仍较大，本次未重写路由分发或进行全量按页拆包。
- 发布前仍需按实际域名验证静态 fallback、OAuth 回调、API 配置和 CDN 资源。当前未提交、未部署。

后续新增页面优先复用公共 page 组件与语义色；图表使用订阅 hook；自定义 Portal 使用站点 token；Chakra recipe 必须保留完整 anatomy slots。新增页面/交互时同步更新本清单和对应回归脚本。
