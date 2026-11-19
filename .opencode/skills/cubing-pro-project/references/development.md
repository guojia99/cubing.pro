# 开发、验证、发布和维护

核实日期：2026-11-18。命令默认在当前前端仓库根目录执行；明确标注后端的命令在 `../cubing-pro` 执行。这里记录操作方法，不代表本次已运行构建或业务联调。

## 1. 环境准备与日常开发

需要能运行当前 Next 15 和 npm 锁文件的 Node.js 环境；仓库没有声明 engines，不虚构固定工具链版本。解析菜谱需 Python 3；首次同步 HowToCook 需 Git/网络；浏览器测试需 Playwright Chromium。

```bash
git status --short
npm ci
npm run dev
```

`npm ci` 适合锁文件可复现安装，会重建依赖目录；已有可用依赖时无需每次重装。修改依赖才更新 `package.json`/锁文件。开发一般从 3000 端口访问，实际端口看 Next 日志。按现有 README 指引不要给 dev 添加 `--turbopack`；需要变更时单独验证 Chakra/Emotion hydration。

前端已有 API 默认指向线上；先确认请求地址，再测试会写数据的后台功能。`make start` 对应普通 dev；`make dev` 设置本地 API，但当前地址写为 `0.0.0.0`，浏览器更适合使用可访问的回环/开发机地址。

### 本地 Go 联调

先阅读 [兄弟项目关系](backend.md) 的启动副作用。后端需隔离开发配置、业务/WCA 数据库、公式/打乱等所需资源，不能直接复用生产配置。

后端启动形式为 `go run main.go api --config <开发配置路径>`；`make api` 固定读取其 `local/server_local_dev.yaml`，该文件在新克隆中不保证存在。启动 API 默认不额外打开 `-j/-w`，但仍有 AutoMigrate 和部分后台行为。

在前端 `.env.local` 配置示例：

```dotenv
NEXT_PUBLIC_DEV_API_BASE=http://127.0.0.1:20000/v3/cube-api
CUBE_API_UPSTREAM=http://127.0.0.1:20000/v3/cube-api
```

重启 dev 后检查浏览器 Network 的真实 Request URL。本机以外访问需将 127.0.0.1 换成浏览器能到达的开发机地址；HTTPS 页面还要检查 HTTP 混合内容。OAuth 需单独核对后端回调与前端回跳白名单。

### 三种 API 变量不能混淆

| 配置 | 消费位置与作用 |
| --- | --- |
| `NEXT_PUBLIC_DEV_API_BASE` | request.ts 的本地浏览器分支；必须是完整 HTTP API 根地址 |
| `NEXT_PUBLIC_API_BASE` | 其他域名/默认远端请求，公开到浏览器，静态发布前确定 |
| `CUBE_API_UPSTREAM` | Next rewrite 的目标，也是静态构建公式目录请求的优先来源；不是所有浏览器请求的总开关 |
| `NEXT_OUTPUT_EXPORT` | 1/true 时启用 export 和 dist 输出，日常 dev 不设置 |

本地域名未配置 DEV 地址时通常直接请求默认远端；`cubing.pro` 及子域名使用同源 `/v3/cube-api`。静态产物不执行 Next rewrites，也不会读取服务器上后来修改的 `.env.local`。构建时 API 优先级与浏览器分支不同，应分别验证。

## 2. 常见开发任务

| 任务 | 修改与验证顺序 |
| --- | --- |
| 新增页面 | `views` 实现 → APP_ROUTES → catch-all 或显式 page → navigation → Guard/词典 → 静态路径 |
| 新增动态 URL | 同时检查 useRouteParam、dynamicRoute、staticExportPaths、post-static-export 和 Go gateway 回退 |
| 修改接口 | 前端 service/types → 后端 routes/Handler/模型 → 调用方响应/错误/权限 → 本地联调 |
| 修改主题 | tokens.css/design-system.css → theme/index.ts → 全局 AntThemeProvider → websiteUiConfig → useThemeColors 图表订阅；避免局部 ConfigProvider 重置共享主题 |
| 新增文案 | 七语领域词典 → 根 catalogs 接入 → t/tf 与共用 formatMessage → check:i18n / test:i18n → 七语布局检查 |
| 修改计时器 | 对应状态机/输入捕获 → 保存幂等和错误恢复 → storage → 键盘/触屏浏览器回归 |
| 修改持久化 | 找所有读写和备份 → 旧数据兼容/迁移 → 配额/事务/失败恢复 → 跨版本导入 |
| 更新公式 | 后端来源/加载/API → 前端缓存 → 二阶静态数据 → 静态分类页重建 |
| 更新说明/内容 | 找 API、本地注册、JSON/Markdown 的真实来源 → 重新生成受影响索引/静态页 |

就近复用组件和业务类型；`@/*` 只指向当前 `src`。保留原生列表/表格的业务语义、取消请求和组件卸载清理，避免为了局部修复重写整套 UI。

页头是单实例，全局导航菜单、语言、外观和移动抽屉在 Chakra Root 上显式设置 `app-header-*` 稳定 ID，避免自动 ID 路径变化影响 hydration/ARIA 关联。`APP_HEADER_URL=http://127.0.0.1:3129 node src/components/layout/appHeader.browser.test.mjs` 验证真实 SSR HTML 与水合后 ID 一致、刷新、无重复 ID、桌面/手机菜单交互及控制台错误；测试需已有 Next 服务。

## 3. 检查与测试矩阵

仓库没有统一 `npm test` 或独立 typecheck script；通过 `package.json` 选择任务。文档/技能变更优先验证路径、frontmatter、命令和 diff，不要求启动应用。

| 改动范围 | 已有命令 | 说明 |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | 可能依赖已有 Next 生成声明；区分环境/历史错误 |
| lint | `npm run lint` | 全仓 eslint；小改动可对实际目标文件运行 eslint |
| 七语/复数/内容合同 | `npm run test:i18n`、`npm run check:i18n` | 真实根词典、领域 formatter 与 Provider hooks；数量参数用 number；AST 精确例外防倒退；详见 `docs/project/internationalization.md` |
| 动态广告后台 | `npx tsx --test src/views/admin/advertisementDraft.test.ts`、`node --test src/views/admin/advertisements.browser.test.mjs` | 校验、排序、七语、入口及权限；离线浏览器覆盖真实管理页，service/公共预览使用契约替身，不接触真实 API |
| 公式计时/历史 | `npm run test:algs` | 状态机、IndexedDB/历史相关 |
| 图示/动作/setup | `npm run test:puzzles` | 包含部分使用 Playwright 的测试，不是纯 Node 单元集 |
| 二阶算法/练习/深链接 | `npm run test:two-solver` | engine、统计、格式、i18n、公式链接等 |
| 静态路由/脚本 | `npm run test:static-export` | 路径枚举、目录接口异常、导出产物检查和恢复 |
| 公式练习浏览器 | `npm run test:algs:browser` | 独立浏览器测试入口 |
| 公式布局 | `npm run test:algs:layout` | 需要正在运行的页面；`ALGS_TEST_URL` 指定站点根地址 |
| 图示浏览器 | `npm run test:puzzles:browser` | 图示/播放器浏览器回归 |
| 绘图下载 | `node --test src/views/DrawTools/drawDownload.browser.test.mjs` | 五种绘图三格式、深浅/移动、像素与失败重试；默认隔离真实 View，`DRAW_DOWNLOAD_BASE_URL` 可验证实际 Next 服务 |
| 公式/对阵图下载 | `node --test src/views/Algs/utils/diagramDownload.browser.test.mjs`、`node src/views/TeamMatch/bracketExportPng.browser.test.mjs` | SVG 栅格化、尺寸、资源清理及 CSS4 颜色的克隆转换；不访问 API |
| 原生二阶播放器 | `npm run test:puzzles:native` | 生命周期和渲染回归 |
| 二阶浏览器 | `npm run test:two-solver:browser` | 需要现有服务；`TWO_SOLVER_URL` 是完整工作台 URL |
| 二阶练习/翻译/公式链接 | `test:two-solver:practice`、`test:two-solver:i18n`、`test:two-solver:formula`（均 npm run） | 同样检查页面 URL/运行服务 |

部分测试未注册 npm script，按改动查 `*.test.ts/*.test.mjs`，如 `src/views/admin/groupCompetition.browser.test.mjs`、团体赛和 FR 局部测试。先阅读测试入口再直接运行；不要假设所有 browser 测试都会自启 Next。

全站视觉迁移测试还包括 `Algs/components/workspaceVisual.browser.test.mjs`、`TeamMatch/components/portalTheme.browser.test.mjs`、`admin/visualMigration.browser.test.mjs`、`FoodShared/foodDrawVisual.browser.test.mjs`。覆盖范围、执行结果和限制详见 `docs/design/frontend-refactor-2026-11-18.md`。`npm run lint` 会扫描生成/上游 public 脚本；定位应用源码问题可使用 `./node_modules/.bin/eslint src --quiet`，不可将其当成全仓 lint 已通过。

Playwright 浏览器缺失时可执行 `npx playwright install chromium`，会下载外部资源。二阶浏览器默认 URL 当前是 3129 端口，不等于 dev 的默认 3000；例如服务已在 3000 时：

```bash
TWO_SOLVER_URL=http://127.0.0.1:3000/tools/solver/222/ npm run test:two-solver:browser
ALGS_TEST_URL=http://127.0.0.1:3000 npm run test:algs:layout
```

二阶 workbench/practice/i18n 浏览器测试会创建产物目录并写报告/截图，默认目录含开发机的 macOS 临时路径。换机器时用 `TWO_SOLVER_ARTIFACTS` 指定已确认可写的产物目录；图示浏览器测试用 `PUZZLE_SCREENSHOT_DIR` 覆盖截图目录。先检查各测试入口支持哪些变量，不照搬本机绝对路径。

后端测试先检查是否初始化真实配置/DB、运行迁移/同步，再选隔离范围；不以直接跑 `go test ./...` 作为默认联调起手。交付说明区分通过、跳过、环境阻塞，不将源码阅读称为运行验收。

## 4. 数据准备与生成文件

| 命令 | 输入 / 输出 / 注意 |
| --- | --- |
| `npm run two-solver:sync` | 读兄弟仓库 `build/Algs/2x2db`，写 public/two-solver/data 和 manifest；缺兄弟数据会失败 |
| `npm run two-solver:prepare` | 读取安装的 cubing，用 esbuild 写 public/two-solver/scrambler 和 NOTICE |
| `npm run howtocook:sync` | 同步 public/HowToCook；默认通过代理地址 clone 外部 Git 缓存 |
| `npm run recipes:parse`、`npm run tips:parse` | Python 解析 Markdown 生成 public 索引 |
| `npm run howtocook:parse` | 依次解析菜谱和技巧 |
| `npm run howtocook:prepare` | 同步再解析；普通 build 的 prebuild 和静态脚本都会使用 |

HowToCook 控制变量：`HOWTOCOOK_SOURCE_DIR` 指定本地来源（会覆盖目标副本）；`HOWTOCOOK_CACHE_DIR` 改缓存；`SKIP_HOWTOCOOK_SYNC=1` 只跳同步且要求目标目录存在；`SKIP_HOWTOCOOK_PARSE=1` 沿用索引；`SKIP_HOWTOCOOK=1` 全跳。

默认同步复用 Git 缓存，不自动 git pull；目标存在时也不每次覆盖。需要更新时明确来源及版本，再同步解析。全跳只适合确认现有索引、Markdown 和图片齐备的环境；新克隆 public/HowToCook 被忽略，不能默认跳过。

`two-solver:sync/prepare` 不是当前 prebuild 自动步骤；修改其源依赖后需显式执行并检查生成差异。保留来源、许可证、NOTICE 和 manifest，不直接手改生成 bundle 修 bug。

## 5. 构建与静态发布

```bash
npm run build:static
npm run preview:static
```

当前 `preview:static` 运行 serve@14 服务 `dist`。普通 `npm run build` 是 Next 常规构建，`npm start`/`npm run start` 是 Next server；静态产物应由静态服务器或 Go gateway 服务，不用 next start。

静态构建顺序：

1. `build-static.mjs` 准备 HowToCook。
2. `prepare-static-export.mjs` 备份 catch-all 文件为 `.bak`，临时将 dynamicParams 改为 false。
3. 设置 `NEXT_OUTPUT_EXPORT=1` 执行 Next build，导出至 `dist/`。
4. `staticExportPaths.ts` 请求公式目录（CUBE_API_UPSTREAM 优先），枚举公式和本地内容详情，写临时 `.static-export-algs.json`。
5. `post-static-export.mjs` 检查每个公式页 `index.html/index.txt` 非空，生成 nginx 动态回退片段。
6. finally 中 `restore-static-export.mjs` 恢复源文件和删除临时 manifest；保留失败退出码。

脚本会临时改源码，不同时在同一工作区运行多个静态构建或编辑该 catch-all；正常失败通常恢复，强制终止后先检查 `.bak`、源码和用户改动，再决定恢复，不能盲目覆盖。

路由分三类：

| 类别 | 构建 / 部署要求 |
| --- | --- |
| 固定路由 | 按 APP_ROUTES 和显式页面构建 |
| 公式/菜谱/技巧/鸡尾酒详情 | 构建期全量枚举；新增条目需重建；保留原始路径段，不额外重复编码 |
| competition/player/WCA player/主办比赛结果等动态 ID | 生成各自 `__dynamic__` 页；服务器按模式回退，客户端从真实 URL 解析参数 |

只启动通用静态预览，不代表未枚举动态 ID 的直接访问回退已配置。部署 Go gateway 时核对 `staticRoot`、`spa: false`、`dynamicRouteFallbacks` 与 API 代理顺序；Nginx 环境可参考产物 `nginx-dynamic-fallback.conf.snippet`。不要把所有 URL 回退到根首页。

发布完整同步 `dist/`，包括 `_next`、HTML/TXT、数据和图片。验证站内跳转和直接刷新两种访问，特别是中文/特殊字符分类和动态 ID。浏览器 NEXT_PUBLIC 变量在构建时固化。前后端可以独立发布，但契约变更需安排兼容和先后次序。

## 6. 故障定位表

| 现象 | 优先检查 |
| --- | --- |
| 本地改了后端却无效 | 浏览器真实 URL、DEV_API_BASE、Next 重启、直连官方 API 和静态数据 |
| API 404 | method、精确尾斜杠、baseURL、Next rewrite、Go 路由和网关 Host 优先级 |
| 页面显示预留/开发中 | catch-all 有无 case、是否是明确占位路由，不只看 APP_ROUTES |
| 新公式分类线上 404 | 构建时目录源、dist 对应 HTML/TXT、完整上传、staticRoot、是否重建 |
| 动态页站内可开、刷新失败 | 对应 __dynamic__ 页面、服务器回退、useRouteParam、StaticExportRouteSync |
| 分类或公式未更新 | 目录/详情 TTL、运行后端资源、二阶静态数据、静态分类页分别核实 |
| 登录失败或无权限 | OAuth 两种回调地址、JWT、current 响应、权限位、团队归属、后端路由授权 |
| 个人历史看似丢失 | 域名/端口、localStorage 与 IndexedDB 分别检查、导入版本；不要先清存储 |
| 图示错误/3D 泄漏 | 动作格式、项目映射、setup、FTO 标记、播放器所有权和卸载 |
| 二阶随机/求解失败 | 静态 data/manifest、scrambler 模块路径/Worker、搜索预算、库结构校验 |
| 菜谱无正文/图像 | public/HowToCook 是否齐备、索引与源版本、Markdown 基址 |
| 配色不一致 | CSS token、Chakra、Ant Design、图表、领域色和外观存储分别检查 |

## 7. 维护闭环

完成功能时同步路由/实现状态、接口类型、静态规则、存储迁移、词典和测试；涉及对外功能可更新 `public/CHANGELOG.md` 与对应 `docs/project`，避免只改技能导致用户文档继续漂移。

更新本技能的时机：目录/入口变化、增删页面、占位转实现、数据源改变、脚本命令变化、权限/单位/schema 改动、框架/播放器升级、跨仓库路径/部署关系变化。更新核实日期并用源码重查，不复制生产凭证、个人数据和本机绝对路径。

交付前检查 `git diff --check`、目标 diff 和 `git status --short`，确认没有带入构建产物、临时 `.bak`、密钥或用户无关改动。新增/修改 OpenCode 技能后退出并重启 OpenCode，让新会话重新发现技能。
