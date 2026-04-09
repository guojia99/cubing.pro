# `src` 源码目录说明

本文档梳理 **手写业务源码** 的目录层级与职责；**不包含** Umi 构建生成的 `.umi/`、`.umi-production/`（运行时插件与路由胶水代码）。路由表见项目根目录 `config/routes.ts`。

**技术栈**：Umi 4 / `@umijs/max`、Ant Design Pro Layout、React、TypeScript。

**统计**（不含 `.umi*`）：约 **401** 个 `.ts` / `.tsx` / `.js` / `.less` / `.css` 文件。

---

## 根目录入口文件

| 文件 | 说明 |
|------|------|
| `app.tsx` | Umi 运行时配置：导出 `getInitialState`、`layout`（ProLayout、头像、页脚、语言切换、`TokenCallbackHandler` 包裹内容区）；内部含 `processWcaCallbackToken` 处理 URL 中的 WCA token |
| `global.tsx` | 全局运行时：PWA / Service Worker 更新提示、离线提示等 |
| `global.less` | 全局样式 |
| `typings.d.ts` | 全局类型声明 |
| `service-worker.js` | PWA Service Worker |

---

## 目录树（相对 `src/`，节选层级）

```
src/
├── app.tsx
├── global.tsx
├── global.less
├── typings.d.ts
├── service-worker.js
├── SOURCE_STRUCTURE.md          # 本说明文件
│
├── components/                   # 可复用 UI 与业务展示组件
│   ├── index.ts                  # 聚合导出：Footer、AvatarDropdown、AvatarName（部分来自 Admin）
│   ├── Alert/toast.tsx
│   ├── background/WaveBackground.tsx
│   ├── Buttons/                  # 返回、复制、分页、回到顶部等
│   ├── CubeIcon/                 # 魔方项目图标与映射（cube.ts、cube_map.ts 等）
│   ├── Data/                     # 比赛/成绩/纪录表格与类型、ECharts 等
│   │   ├── cube_comps/
│   │   ├── cube_record/
│   │   ├── cube_result/
│   │   └── types/
│   ├── Footer/
│   ├── HeaderDropdown/
│   ├── Inputs/password.tsx
│   ├── Link/Links.tsx
│   ├── Markdown/               # Markdown 渲染与编辑器
│   ├── Status/404.tsx
│   ├── Table/table_style.tsx
│   ├── Tabs/
│   ├── Title/Title.tsx
│   ├── TokenCallbackHandler.tsx  # Token 回调处理（与登录态配合）
│   └── Wait/wait.tsx
│
├── locales/                      # 国际化
│   ├── locales.ts
│   ├── Language/LanguageSelect.tsx
│   ├── zh-CN.ts / zh-CN/*.ts
│   ├── zh-TW.ts / zh-TW/*.ts
│   ├── en-US.ts / en-US/*.ts
│   └── ja-JP.ts / ja-JP/*.ts
│   # 子命名空间示例：algs、draws、home、layout、menu、wca
│
├── pages/                        # 页面（与 config/routes 对应）
│   ├── 404.tsx
│   ├── Welcome.tsx               # 欢迎页
│   ├── Welcome/                  # 轮播、致谢区块等
│   ├── Settings.tsx
│   ├── Static.tsx / Static/      # 静态数据：纪录、Kinch、DIY 榜、PKTimer 等
│   ├── Events/Events.tsx
│   ├── Competition/              # 赛事列表与详情
│   ├── Player/                   # 站内选手（非 WCA 专页）
│   ├── WCA/                      # WCA 选手、统计、Players 列表
│   ├── Admin/                    # 登录、个人中心、主办、后台管理
│   ├── Algs/                     # 公式库、练习与随机抽公式等
│   ├── Tools/                    # BLD、绘图、团体赛 TeamMatch、FMC、计时器解析等
│   ├── ExternalLinks/            # 外链聚合页与图标
│   ├── Advertisement/
│   ├── BuyCoffee/
│   ├── Recipes/                  # 菜谱（other 子路由）
│   ├── KitchenSkills/            # 厨房技巧
│   ├── Tests/
│   └── ...
│
├── services/                     # API 与布局配置
│   ├── layout_config.ts          # ExtAppList：侧栏/顶栏外链应用列表
│   └── cubing-pro/               # 后端 API 封装（见下文「服务层导出」）
│
└── utils/                        # 通用工具（无 React 依赖为主）
    ├── aes/aes.ts                # AES 加解密
    ├── time/data_time.ts         # 日期时间解析
    ├── types/numbers.ts
    └── uri/params.ts             # URL / Query 参数
```

---

## `app.tsx` 导出（运行时）

| 导出 | 类型 | 说明 |
|------|------|------|
| `getInitialState` | async | 初始化全局状态：先处理 WCA URL token，再拉取 `currentUser` |
| `layout` | `RunTimeLayoutConfig` | ProLayout：侧栏、内容区、头像区、`Footer`、`TokenCallbackHandler`、`LanguageSelect` |

内部函数 `processWcaCallbackToken`：从查询串读取 `token` 写入本地并清理 URL（非导出）。

---

## `services/cubing-pro` 服务层（主要导出函数）

按子目录归类；具体类型见各目录 `typings.d.ts` / `types.ts`。

### `request.tsx`

- `getAPIUrl()`、`isLocal()`、`getApiErrorDisplayMessage(body)`

### `auth/auth.ts`

- `captchaCode`、`login`、`getEmailCode`、`refreshToken`、`logout`、`currentUser`、`register`、`updateAvatar`、`updateDetail`

### `auth/token.ts`

- `saveToken`、`getToken`、`removeToken`、`AuthHeader`、`refreshTokenInter`、`startTokenRefresh`

### `auth/admin.ts`

- `apiApprovalComp`、`apiAdminPlayers`、`apiAdminCreatePlayer`、`apiAdminUpdatePlayerName`、`apiAdminUpdatePlayerWCAID`、`apiUpdatePlayerAuth`、`apiMergePlayers`

### `auth/organizers.ts`

- `apiMeOrganizers`、`apiOrganizers`、`apiCreateComps`、`apiGetComps`、`apiGetOrgComp`、`apiGetGroups`、`apiEndComp`、`apiGetAllPlayers`
- `apiGetCompsResults`、`apiGetCompsResultsWithPlayer`、`apiAddCompResults`、`apiGetCompsPreResult`、`apiApprovalCompsPreResult`、`apiDeleteCompsResult`、`apiUpdateCompName`

### `auth/system.ts`

- `getAcknowledgmentsWithAdmin`、`setAcknowledgmentsWithAdmin`、`getOtherLinksWithAdmin`、`setOtherLinksWithAdmin`

### `comps/comp.ts`

- `apiComp`、`apiCompRecord`

### `comps/comps.ts`

- `apiComps`

### `comps/result.ts`

- `apiCompResult`

### `players/players.ts`

- `apiPlayers`、`apiPlayer`、`apiPlayerResults`、`apiPlayerRecords`、`apiPlayerNemesis`、`apiPlayerComps`、`apiPlayerSor`

### `events/events.ts`

- `apiEvents`

### `statistics/records.ts`

- `apiRecords`

### `statistics/sor.ts`

- `apiKinch`、`apiSeniorKinch`

### `statistics/diy_ranking.ts`

- `apiDiyRanking`、`apiDiyRankingKinch`、`apiGetAllDiyRankingKey`、`apiUpdateRankingWithKey`、`apiCreateRanking`、`apiDiyRankingSor`、`apiDiyRankingPersons`

### `statistics/best.ts`

- （当前文件为空，占位或未使用）

### `pktimer/pktimer.ts`

- `GetPKTimer`

### `key_value/keyvalue_store.ts`

- `getKeyMap`、`getSubKeyValue`、`setSubKeyValue`、`deleteSubKey`

### `sports/sports.ts`

- `apiGetSportResults`、`apiCreateSportResult`、`apiDeleteSportResult`、`apiGetSportEvents`、`apiCreateSportEvent`、`apiDeleteSportEvent`

### `public/orgs.ts`

- `apiPublicOrganizers`、`apiPublicCompGroups`、`getAcknowledgments`、`getOtherLinks`

### `otherLinksNormalize.ts`

- `emptyOtherLinks`、`sanitizeOtherLinks`、`unwrapOtherLinks`

### `cubing_china/cubing.ts`

- `getCubingChinaComps`、`findCubingCompetitionByIdentifier`

### `algs/algs.ts`

- `getAlgCubeMap`、`getAlgCubeClass`

### `algs/dailyRandomPick.ts`

- `getDailyPickState`、`saveDailyPick`、`getRemainingPicks`、`clearDailyPick`

### `algs/formulaPracticeConfig.ts`

- `getFormulaPracticeConfig`、`saveFormulaPracticeConfig`

### `algs/formulaPracticeSelection.ts`

- `buildGroupKey`、`buildFormulaKey`、`getFormulaPracticeSelection`、`saveFormulaPracticeSelection`

### `algs/formulaPracticeHistory.ts`

- `getFormulaPracticeHistory`、`createPracticeSession`、`getFormulaPracticeHistoryPage`、`appendFormulaPracticeRecord`、`deleteFormulaPracticeRecord`
- `computeTrimmedMean`、`computeAverages`、`clearFormulaPracticeHistory`
- 另导出常量 `PAGE_SIZE` 与若干接口类型

### `algs/formulaPracticeProficiency.ts`

- `getFormulaProficiency`、`setFormulaProficiency`、`getProficiencyLevel`、`getUnskilledFormulaKeys`
- 另导出 `PROFICIENCY_WEIGHTS`、`DEFAULT_PROFICIENCY` 等

### `algs/formulaRandomPick.ts`

- `getFormulaPickHistory`、`saveFormulaPick`

### `algs/practiceConfigExport.ts`

- `exportPracticeConfig`、`importPracticeConfig`

### `wca/wca_api.ts`

- `apiGetWCAPersonProfile`

### `wca/player.ts`

- `GetPlayerRankTimers`、`getWCAPersonProfile`、`getWCAPersonCompetitions`、`getWCAPersonResults`、`getWCAPersons`、`getPersonBestRanks`

### `wca/static.ts`

- `GetEventRankTimers`、`GetEventRankWithFullNow`、`GetEventRankWithOnlyYear`、`GetStaticSuccessRateResult`、`GetAllEventsAchievement`、`GetAllEventChampionshipsPodium`

### `wca/country.ts`

- `CountryList`

### `wca/types.ts`

- 大量 WCA 相关 **interface**（如 `WCAResult`、`WCAPerson`、`WCACompetition` 等），供前端类型使用

### `index.ts`

- 默认导出聚合（当前主要为 `auth`、`comps` 命名空间），OpenAPI 生成痕迹；实际业务多按子路径直接 import

---

## `services/layout_config.ts`

- `ExtAppList()`：返回 ProLayout `appList` 所需的外链应用条目（多语言标题与描述）

---

## `utils` 导出

| 文件 | 导出 |
|------|------|
| `aes/aes.ts` | `aesEncrypt`、`aesDecrypt` |
| `time/data_time.ts` | `parseDateTime` |
| `types/numbers.ts` | `isNumber` |
| `uri/params.ts` | `GetAllQueryParams`、`GetLocationQueryParams`、`GetLocationQueryParam`、`UpdateBrowserURL`、`GetURLParams` |

---

## `components/index.ts` 聚合导出

- `Footer`
- `AvatarDropdown`、`AvatarName`（实现位于 `pages/Admin/AvatarDropdown.tsx`）

---

## 页面模块速览（`pages/`）

以下为按业务域划分，**非**路由文件的穷举；具体路径以 `config/routes.ts` 为准。

| 目录 | 职责摘要 |
|------|----------|
| `Welcome` | 首页与致谢、广告轮播 |
| `Admin` | WCA/旧登录、回调、个人资料、主办端、后台用户/DIY 榜/致谢与外链管理、体育赛事配置 |
| `Competition` | 赛事列表、详情、报名、赛程、成绩等多 Tab |
| `Player` | 站内选手资料、成绩列表、SOR、宿敌、图表等 |
| `WCA` | WCA ID 选手页、选手搜索、统计榜单（全项目、大满贯、历史、成功率、年度等） |
| `Static` / `Events` | 静态排行、纪录、Kinch、DIY、PKTimer、项目页 |
| `Algs` | 公式列表/详情、筛选、练习记录、熟练度、随机抽公式等 |
| `Tools` | BLD 辅助、绘图工具、**团体赛 TeamMatch**（对阵、淘汰、种子、导出等大量模块）、FMC 拓扑、计时器日志解析等 |
| `ExternalLinks` | 外链展示与分组、图标选择器 |
| `Recipes` / `KitchenSkills` | 菜谱与厨房技巧列表/详情（静态数据 + 本地存储） |
| `Advertisement` / `BuyCoffee` | 广告与赞助入口 |

---

## 维护说明

- 新增页面：在 `pages/` 添加组件，并在 **`config/routes.ts`** 注册路径与 `name`（菜单 i18n 键在 `locales/*/menu.ts`）。
- 新增 API：优先在 `services/cubing-pro/` 合适子目录新增函数，并在本文档「服务层导出」中补充一行，便于检索。
- 若 Umi 升级导致 `.umi` 结构变化，无需更新本文档；**业务代码**以 `src` 下非 `.umi*` 为准。

---

*文档生成基准：目录扫描于仓库当前版本；文件数量随开发迭代变化。*
