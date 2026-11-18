# 架构、目录与依赖

核实日期：2026-11-18。源码路径均相对 `cubing.pro` 仓库根目录。

## 1. 技术栈与应用链路

`package.json` 当前声明前端 4.0.0、Next `^15.3.4`、React `^19.1.0`、Chakra `^3.22.0`、TypeScript `^5.8.3`。这些是声明范围，实际解析版本看 `package-lock.json`，不能当成线上部署版本。

```text
src/app/layout.tsx
  └─ src/components/ui/provider.tsx
       └─ ChakraProvider / ColorModeProvider / I18nProvider / AuthProvider
            ├─ src/app/page.tsx → AppShell → WelcomePageView
            └─ src/app/(main)/layout.tsx → AppShell
                 ├─ 显式 page.tsx：登录、回调、个人中心、设置等
                 └─ [...path]/page.tsx：根据路由分发业务 View
                      └─ src/views/<业务域>
                           ├─ 业务组件、算法、状态机、本地存储
                           ├─ src/components：共享 UI / 图示 / 成绩
                           └─ src/services/cubing-pro
                                ├─ Axios → Go API / 外部服务
                                └─ localStorage / IndexedDB
```

这是组织结构，不是严格单向依赖：FR 历史 service 引用 View 的领域类型；图示模型复用公式分类工具；WCA Kinch 复用群赛统计组件。调整边界前查实际 import，避免按理想分层直接移动文件。

## 2. 根目录职责

| 路径 | 用途与维护边界 |
| --- | --- |
| `src/` | 应用实现，见下表 |
| `config/routes.ts` | 重导出 `src/config/routes.ts`，保留旧入口 |
| `public/` | 不经模块打包的静态文件、JSON、Markdown、图像、求解 Worker 依赖 |
| `scripts/` | 静态构建、HowToCook、二阶数据和 scrambler 准备脚本 |
| `docs/features/` | 功能契约与索引；不能仅凭条目存在判断已实现 |
| `docs/project/` | 页面、组件、服务、资源的详细手册 |
| `docs/api/` | API 文档，部分保留 Umi 旧说明，必须对照实现 |
| `docs/design/`、`docs/color.md` | 设计与配色资料 |
| `docs/static-export.md` | 当前静态路由、导出与 gateway 部署说明 |
| `docs/PROGRESS.md`、`docs/v4.0.0.md`、`docs/Floppy Reduction.pdf` | 进度、版本计划、FR 领域资料 |
| `.agents/skills/`、`skills-lock.json` | 已有专项技能与安装锁定信息 |
| `.opencode/skills/cubing-pro-project/` | 本项目技能及按需参考文档 |
| `AGENTS.md`、`README.md` | 简短项目入口；存在已知技术描述漂移 |
| `package.json`、`package-lock.json` | npm 脚本、依赖声明、解析锁定；无统一 `npm test` |
| `next.config.ts` | 条件静态导出、trailingSlash、图片、rewrite、部分包导入优化 |
| `tsconfig.json`、`next-env.d.ts` | strict TypeScript、`@/* → ./src/*`；后者为生成声明 |
| `eslint.config.mjs` | Next/TS lint；历史业务模块局部放宽规则；vendor 排除 |
| `Makefile` | 远端 API 开发、本地 API 开发和静态构建快捷入口 |
| `.env.example`、本地 `.env*` | 环境变量模板/覆盖；不复制实际值进技能，不提交本地密钥 |
| `.npmrc` | npm 镜像源；安装失败可核对当前源与网络 |
| `.gitignore` | 忽略依赖、构建、环境、HowToCook 等；以实际规则为准 |
| `.next/`、`dist/`、`node_modules/`、`*.tsbuildinfo` | 构建/依赖/缓存产物，不当成业务源文件修改 |
| `.git/`、`.idea/`、`.DS_Store` | 版本控制和本地工具元数据 |
| `cubing.pro/` | 本次仅发现嵌套空目录结构，不是第二套应用入口 |

## 3. src 目录职责

| 路径 | 职责 |
| --- | --- |
| `src/app/` | App Router、根布局、根首页、404、显式页面和 `(main)` 路由组 |
| `src/views/` | 全部业务页面和领域局部组件/工具，详情见功能地图 |
| `src/pages/README.md` | 说明为何业务页已放到 views；不要触发第二套 Pages Router |
| `src/config/routes.ts` | `APP_ROUTES`、`matchRoute`、`extractRouteParams` |
| `src/config/defaultSettings.ts` | 默认布局与 `siteMeta`，包括 API 前缀 |
| `src/contexts/AuthProvider.tsx` | 当前用户、初始化、刷新去重、登录后云外观读取 |
| `src/contexts/I18nProvider.tsx` | locale、`t`、`tf`、HTML 语言同步 |
| `src/hooks/` | `useRouteParam`、国际化兼容、`useHideAppChrome` 沉浸布局 |
| `src/lib/` | 权限、导航、URL、用户解析、外观、群赛规则、静态路径等应用辅助 |
| `src/i18n/index.ts`、`src/i18n/messages/` | 语言存储、翻译回退、中英文主词典与领域分词典 |
| `src/services/cubing-pro/` | HTTP 封装、数据类型和部分浏览器数据存储 |
| `src/styles/tokens.css`、`app-chrome.css` | 全局颜色变量、沉浸布局样式 |
| `src/theme/` | Chakra system、图表颜色、魔方贴纸与奖牌等领域色 |
| `src/utils/time/`、`src/utils/types/` | 通用日期和数值判断；领域工具主要就近放在业务目录 |
| `src/vendor/puzzle-drawing/` | 本地 SVG 绘图源码、来源/版本/许可证，保留上游资料 |

`src/components/` 的主要分工：

| 目录 | 职责 |
| --- | --- |
| `layout/`、`ui/`、`i18n/` | 顶栏与移动导航、Provider/外观/toaster、语言切换 |
| `admin/`、`auth/` | 管理权限 Guard、后台导航/用户选择、登录用户菜单 |
| `Data/cube_comps/`、`Data/cube_record/`、`Data/cube_result/`、`Data/types/` | 比赛、纪录、成绩、图表与共享格式化/类型 |
| `puzzles/` | 动作解析、真实状态、2D/3D 图示、播放和生命周期 |
| `Markdown/` | Markdown 阅读、图片预览、目录、旧 HTML 编辑器 |
| `Buttons/`、`Link/`、`Table/`、`Tabs/` | 返回/复制/前后切换、站内链接、表格行样式、查询参数 tab |
| `CubeIcon/`、`Status/` | 项目图标和名称、对象不存在状态 |
| `routing/` | 静态导出页面标记与真实浏览器 URL 同步 |
| `pages/` | `PlaceholderPage` 通用预留页 |
| `UserData/` | 用户云 KV 上传/应用面板，不能替代尚未实现的 KV 列表页 |

`src/services/cubing-pro/` 的主要分工：

| 目录 / 文件 | 职责 |
| --- | --- |
| `request.ts` | API 选择、Axios、取消请求识别、错误消息提取 |
| `auth/` | token、OAuth、用户资料及管理员/主办/群组/群赛 API |
| `comps/`、`events/`、`players/` | 公开比赛、项目、站内选手及关联类型 |
| `statistics/`、`pktimer/` | Kinch/纪录/自定义榜单、群 PK 历史 |
| `algs/` | 公式 API 缓存、练习配置、抽取/熟练度/自定义公式、IndexedDB 历史、备份 |
| `fr/` | FR 本地练习历史，不是网络求解接口 |
| `wca/`、`cubing_china/` | 站内 WCA 数据、WCA 官方 API、中国赛事/选手辅助 |
| `public/` | 致谢、外链、公开比赛群组 |
| `user/`、`key_value/` | 新用户云 KV 与旧式 KV map；不能默认互换协议 |

## 4. 依赖按实际职责分类

| 依赖 | 用途 / 升级检查 |
| --- | --- |
| Next、React、React DOM、TypeScript | App Router、客户端组件、Worker 构建、hydration 和类型 |
| Chakra、Emotion、next-themes | 新站点 UI、样式引擎、明暗；避免混用 Chakra v2 属性 |
| Ant Design、Ant Design icons | 大量比赛/后台/统计 UI；不会自动跟随 Chakra system |
| react-icons、flag-icons、classnames | 图标、国旗和样式条件 |
| axios | Go API 请求；部分内容页/外部 API 直接用 fetch |
| `cubing` `0.63.3`、`three` `0.170.0` | 状态、3D、scrambler；当前精确固定，升级须测播放器内部适配和 Worker |
| cstimer_module、sr-visualizer | 比赛打乱图示等历史能力；公式主渲染链已使用本地 vendor |
| ECharts、echarts-for-react | 统计图，颜色经 `src/theme/chartColors.ts` 适配 |
| dnd-kit core/sortable/utilities | 拖拽排序能力；具体目标先查 import |
| react-markdown、remark-gfm、wangEditor | Markdown 阅读和旧富文本编辑 |
| html2canvas、file-saver、xlsx、react-image-crop、uuid | 图片导出、文件下载、表格、头像裁剪、记录标识 |
| Playwright、tsx、esbuild、fake-indexeddb | 浏览器回归、TS 测试、隔离测试打包和 IndexedDB 模拟 |
| Python 3、Git | HowToCook 解析、数据抓取/同步脚本的外部工具 |

升级优先检查调用点和锁文件，不将“package.json 中仍安装”视为当前主链。lint 已对迁移代码局部放宽，不为修复一个页面而全局放宽规则。

## 5. 主题、国际化与权限基础设施

配色链为 `tokens.css` → `theme/index.ts` 语义 token → Chakra；`websiteUiConfig.ts` 定义八套 palette、字号和偏好；`chartColors.ts` 将主题转成图表可用颜色。`domainColors.ts` 中贴纸等颜色有领域意义。明暗由 next-themes 管理；不要认为一次云外观读取必然同步所有状态。

语言支持 `zh-CN/en-US`；key 类型来自中文词典，英文主词典对应 `Record<MessageKey, string>`。翻译按当前语言 → 中文 → key 回退。`useIntlMessage` 是旧调用兼容。已有页面仍有中文硬编码和 Ant Design 固定中文 locale，不能宣称全站完成双语。

权限位在 `src/lib/auth.ts`，Player、Organizers、Delegates、Admin、SuperAdmin 是独立 bit。`AdminGuard` 默认允许 Admin/SuperAdmin；`OrganizersGuard` 允许主办/Admin/SuperAdmin。菜单可见、前端 Guard 和后端授权必须分别核对，不用数值大小推导继承。

## 6. 静态资源与数据边界

| 路径 | 来源 / 消费者 |
| --- | --- |
| `public/two-solver/data/` | 从兄弟仓库公式 JSON 派生，Worker 按方法读取，manifest 含数量与哈希 |
| `public/two-solver/scrambler/` | esbuild 生成浏览器 ESM/Worker 图，含 NOTICE |
| `public/HowToCook/` | 外部菜谱 Markdown/图片，同步后被 gitignore |
| `public/recipes.json`、`public/tips.json` | Python 解析索引，同时决定静态详情路径 |
| `public/iba/` | 鸡尾酒 JSON 与相关资源 |
| `public/geo/` | 地理展示数据，使用方主要在 WCA 地图 |
| `public/advertisement/`、`images/`、`qrcode/`、根图标 | 广告、图像、赞助与品牌资源 |
| `public/CHANGELOG.md` | 更新日志页解析的数据源 |

前端静态产物不包含 Go 服务、数据库或浏览器个人数据。清空 localStorage 不会清空 IndexedDB；换域名/端口也会改变浏览器存储作用域。维护备份时要逐业务核对覆盖范围。
