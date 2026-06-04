# Cubing Pro v4.0.0 文档梳理任务说明（Agent 协作版）

本文档是执行文档工作的**唯一任务书**。产出目录为仓库根目录 **`v4.0.0/`**（与 `cubing.pro/`、`cubing-pro/` 平级）。请严格按本文边界、目录与分类规则完成；勿自行发明另一套结构。

---

## 0. 任务边界（必读）

### 0.1 本次范围内（必须完成）

| 范围 | 路径 | 说明 |
|------|------|------|
| 前端应用 | `cubing.pro/src`、`cubing.pro/config` | 路由、页面、组件、services、utils、locales |
| 前端 API 封装 | `cubing.pro/src/services/cubing-pro/**` | 函数 → HTTP 路径、入参/出参类型、鉴权方式 |
| **后端 Public API（完整）** | `cubing-pro/src/api/routes/public.go` 及子路由 | 产出 **`api/public-api.md`**：登记 `/v3/cube-api/public/**` 下**全部**端点（含前端暂未调用的） |
| 功能与实现分类 | 见 §2 | 全路由 `implType`（含纯前端 / 前端为主） |
| 前端目录结构 | `v4.0.0/project/**` | 镜像 `cubing.pro` 业务源码；`public/` 静态资源见 §5.4 |

### 0.2 两类「public」勿混淆

| 名称 | 路径 / 前缀 | 文档要求 |
|------|----------------|----------|
| **前端静态资源目录** | `cubing.pro/public/` | **不**逐文件罗列（尤其 `HowToCook/**` 等大量 md）；只写「被业务引用的资源索引」（§5.4） |
| **后端 Public API** | `GET/POST … /v3/cube-api/public/…`（`public.go`） | **必须完整描述**（§6.3）：Method、Path、Query/Body、响应要点、限流/鉴权、Handler 文件名；`stub` / `TODO` 须标注 |

### 0.3 本次范围外（禁止展开）

| 范围 | 说明 |
|------|------|
| 后端源码树文档 | **不**建 `project/backend/`；**不**写 Handler 内部实现、数据库模型、非 public 路由分组的全集（如 `admin.go` 全文） |
| 前端 `public/` 全量清单 | **不**为每个静态文件单独建 md；第三方内容库（菜谱原文等）不复制进 `v4.0.0/` |
| 其他子仓库 | `fmc-paperless/` 等：最多一行交叉引用 |
| 构建产物 | `node_modules/`、`.umi*` |
| 密钥与配置 | `.env`、证书、真实 Token |

### 0.4 后端只读来源（用于 Public API 文档）

撰写 `api/public-api.md` 时**只读**：

- `cubing-pro/src/api/routes/public.go`（权威路由表）
- 对应 `cubing-pro/src/api/app/**` Handler 文件（摘出入参/出参，**不**迁整份后端结构说明）
- 与 `api/frontend-services.md` 交叉标注：哪些端点已有前端封装、哪些仅后端暴露

**不得**新增 `project/backend/`；非 public 的后端路由仅在 `frontend-services` 已封装处按需提及路径。

### 0.5 框架无关性说明（重要）

当前实现基于 **Umi 4 / `@umijs/max`、React、Ant Design Pro Layout**（见 `cubing.pro/package.json`、`config/`）。

文档描述须满足：

1. **业务与行为优先**：用户可见功能、数据流、状态、接口契约 —— 这些在换框架后仍应成立。  
2. **实现细节标注「当前框架」**：如 `getInitialState`、`ProLayout`、`config/routes.ts`、`.umi` 生成目录等，统一放在章节标题或段落首句标明 *（当前：Umi）*，避免写成永久架构。  
3. **`renderMode` 使用框架中性枚举**（§4.3）；不假设未来仍使用 Umi 路由表格式。  
4. **目录文档以 `src/` 业务路径为准**，而非以 Umi 插件名为章节主轴。

后续可能整体更换前端框架；本文档目标是 **v4.0.0 行为与契约快照**，不是绑定 Umi 的永久说明书。

---

## 1. 目标

使仅凭 **`v4.0.0/`** 即可理解当前前端全部功能与源码布局，并支持后续重构/换框架时的对照。

| 序号 | 要求 | 说明 |
|------|------|------|
| ① | **完整资料整理** | 功能、页面、前端 service 层、关键类型、渲染/数据方式、依赖关系 |
| ② | **前端目录结构整理** | `cubing.pro/src` 与相关 `config/` 的模块树与文件职责 |
| ③ | **纯前端实现标记** | 不调用本站后端 API、核心逻辑在浏览器内完成 |
| ④ | **前端为主实现标记** | UI/算法/本地状态占主导，接口少量或可选 |

---

## 2. 实现类型分类（必须标注）

每个功能项（§4.1）必须有 **`implType`**，且只能取下列四值之一。

### 2.1 分类定义

| `implType` | 中文标签 | 判定标准 |
|------------|----------|----------|
| `frontend-only` | **纯前端** | 运行期不调用 `src/services/cubing-pro/**` 中指向本站后端的请求；核心流程不强制登录；数据来自静态资源、localStorage、IndexedDB、URL，或第三方公开源且不经本站后端 |
| `frontend-heavy` | **前端为主** | 核心交互/计算/可视化在前端；本站 API ≤3 个且多为读、或失败仍可部分使用；或 API 仅作同步/备份/KV 等可选能力 |
| `api-driven` | **接口驱动** | 列表/详情/提交/审批等依赖本站 REST；无接口则无业务数据或无法完成主流程 |
| `hybrid` | **混合** | 大量前端逻辑 + 多条本站或代理 API；详述中分「前端职责 / 接口职责」 |

边界不清时取**更依赖接口**的一级（如 `frontend-heavy` 与 `api-driven` 之间取 `api-driven`）。

### 2.2 判定步骤

1. `cubing.pro/config/routes.ts` → `component` → `src/pages/...`  
2. 搜索页面目录：`@/services/cubing-pro`、`request(`、`fetch(`、`useRequest`  
3. 若有请求：在 `services` 对应文件确认 path/method；必要时只读对照 `cubing-pro` 路由文件  
4. 结论写入 `features/_index.md`；争议写在详述 `implType-notes`  

### 2.3 初步倾向（须逐条用代码核实）

| 区域 / 路由前缀 | 初步 `implType` | 核实要点 |
|-----------------|-----------------|----------|
| `tools/*`、`draw-tools/*` | 多为 `frontend-only` / `frontend-heavy` | 是否引用 comp/organizers 等 service |
| `other/recipes`、`kitchen-skills`、`cocktails` | 多为 `frontend-only` | 静态数据 + 本地存储 |
| `algs/*` | 多为 `frontend-heavy` | 公式分组接口 vs 练习记录本地化 |
| `wca/*` | 多为 `api-driven` / `hybrid` | `services/cubing-pro/wca/*` |
| `group-competitions/*` | 多为 `api-driven` | comps / players / statistics |
| `admin/*` | 多为 `api-driven` | auth / organizers / admin services |

`src/pages/Tools/` 下页面在 `tags` 中加 `tool`。

---

## 3. 输出目录结构

所有产出写在 **`v4.0.0/`**（本目录）：

```text
v4.0.0/
├── README.md                    # 本任务书
├── PROGRESS.md                  # 模块 × status × locked-by（Agent 会话 id）
│
├── features/
│   ├── _index.md                # 全量功能表（含 implType、路由、源文件）
│   ├── brief.md                 # 按业务域简短归纳 + implType 汇总表
│   └── detail/                  # 复杂 / hybrid / 多 Tab 功能
│       ├── README.md
│       └── *.md
│
├── project/                     # 仅前端目录结构
│   ├── README.md                # 总览：应用边界、API 前缀约定、与 cubing.pro 根路径关系
│   ├── app-and-config.md        # app.tsx、config、locales（当前：Umi）
│   ├── pages-*.md               # 按 pages 业务域拆分
│   ├── components.md
│   ├── services.md
│   ├── utils.md
│   └── static-assets.md         # cubing.pro/public/ 引用索引（非全量树）
│
└── api/
    ├── README.md                # Base URL、鉴权、错误体；public 与需登录接口的关系
    ├── frontend-services.md     # services/cubing-pro 全量导出（含对 public 的封装）
    └── public-api.md            # 后端 Public API 完整契约（对照 public.go，必全）
```

**禁止**：单文件堆砌全部内容；**禁止**创建 `project/backend/`；**禁止**用 `frontend-services.md` 替代 `public-api.md`（后者须覆盖 public.go 全部注册路由）。

---

## 4. 功能清单规范

### 4.1 粒度

以 **`config/routes.ts` 中带 `component` 的叶子路由** 为一项；`hidden: true` 路由也需列出（如 `/auth/callback`）。

### 4.2 `_index.md` 表格列

| 列名 | 必填 | 说明 |
|------|------|------|
| `id` | ✓ | 稳定 slug，如 `tools-team-match` |
| `name` | ✓ | 中文功能名 |
| `route` | ✓ | 浏览器路径 |
| `implType` | ✓ | §2 四值之一 |
| `tags` |  | `tool` `admin` `wca` … |
| `pageComponent` | ✓ | 相对 `src/pages` |
| `services` |  | `services/cubing-pro` 函数名；无则 `-` |
| `apiPaths` |  | 实际请求路径（如 `/v3/cube-api/...`）；无则 `-` |
| `renderMode` | ✓ | §4.3 |
| `detailDoc` |  | 相对 `features/detail/` |
| `status` | ✓ | `todo` / `draft` / `done` |

> 列名使用 `apiPaths` 而非 `backendRoutes`，强调记录的是**前端观测到的契约**，不是后端实现文档。

### 4.3 `renderMode`（框架中性）

| 值 | 含义 |
|----|------|
| `client-spa` | 单页客户端渲染（当前由 Umi 提供） |
| `static-first` | 首屏主要依赖打包静态数据，无首屏接口 |
| `tab-shell` | 多 Tab 外壳；各 Tab 可在 detail 中分别标 `implType` |

### 4.4 `brief.md`

- 按业务域分节；每项 1～2 句 + 链接 `_index` 的 `id` 或 detail  
- 单独一节：**`implType` 汇总表**（`frontend-only` / `frontend-heavy` 清单）

### 4.5 `features/detail/*.md` 章节

1. 功能概述（业务语言，少写框架 API 名）  
2. **`implType` 判定依据**（import / 请求列表）  
3. 用户流程  
4. 页面与组件树（`src/pages` 路径）  
5. 状态与数据（storage key、Context 等）  
6. **接口契约**（若有）：链到 `api/frontend-services.md` 或 `api/public-api.md` 锚点；不写 Handler 业务实现细节  
7. 关键函数索引表（§5.3）  
8. 限制与待办  

---

## 5. 前端目录结构文档

### 5.1 完整度

- 覆盖 `cubing.pro/src` 一级目录：`components`、`pages`、`services`、`utils`、`locales`  
- 覆盖 `cubing.pro/config` 中与路由、代理、请求相关的文件  
- 每篇：**目录树** + **表格**（路径 | 职责 | 关键导出）  
- Umi 专有目录（`.umi*`）仅一句说明「构建生成，不纳入业务树」

### 5.2 与仓库内旧文档

可迁移 `cubing.pro/src/SOURCE_STRUCTURE.md` 内容至 `project/` 并扩充；是否在旧文件加回链由执行 Agent 自行判断，非硬性要求。

### 5.3 关键函数索引表

| 符号 | 文件（相对 `cubing.pro/`） | 行号 | 职责 |
|------|---------------------------|------|------|
| `export function foo` | `src/pages/...` | 42 | … |

行号漂移时保留符号与路径即可。

### 5.4 `cubing.pro/public/` 静态资源（精简原则）

该目录为构建时原样发布的静态文件（图标、JSON、GeoJSON、二维码、CHANGELOG 等），**不是**后端 API。

文档中仅维护 **`project/static-assets.md`**（或并入 `project/README.md` 一节），内容限于：

1. **顶层目录/文件索引表**：路径 | 类型 | 被谁使用（页面或 `fetch` 路径） | 是否业务关键  
2. **须列出的典型项**（按代码引用核实，可增补）：  
   - `recipes.json`、`tips.json`、`CHANGELOG.md`  
   - `iba/`、`HowToCook/`（说明：菜谱/技巧正文由页面按路径加载，**不**展开子树）  
   - `geo/bound/`（地图边界）  
   - `qrcode/`、`icons/`、`favicon.ico`、`logo.svg` 等品牌资源  
3. **禁止**：复制 `HowToCook` 下数百个 `.md` 的目录树；禁止为每个菜品/技巧单独写功能说明。

引用方式示例：页面通过 `` `/recipes.json` `` 或 `` `/HowToCook/dishes/...` `` 加载 —— 在 `features/detail` 中写清 URL 模式即可。

---

## 6. API 文档规范

### 6.1 `api/frontend-services.md`

- 按 `src/services/cubing-pro/` 子目录分节  
- 每个导出函数：**签名摘要**、HTTP 方法、路径、Query/Body、响应类型（`typings.d.ts`）、是否 `AuthHeader`、被哪些 `features/_index` `id` 使用  

### 6.2 `api/README.md`

从前端 `request.tsx` 等归纳：Base URL 规则（含 `/v3/cube-api` 前缀）、本地/生产差异、Token 刷新、统一错误展示；说明 **Public API 无需登录** 及全局限流（`public.go` 中 `RateLimitMiddleware`）。

### 6.3 `api/public-api.md`（后端 Public API，必须完整）

以 `cubing-pro/src/api/routes/public.go` 为**唯一完整性基准**：文件中注册的每一条路由都必须在本文档出现（含 `statistics` 下尚未实现 Handler 的 `sta.GET(...)` 占位）。

建议按 `public.go` 分组分节：`/public` 根、`/public/player`、`/public/comps`、`/public/statistics`、`/public/algorithm`。

每条路由固定字段：

| 字段 | 说明 |
|------|------|
| Method / Path | 完整路径，如 `POST /v3/cube-api/public/statistics/kinch` |
| Handler | `src/api/app/...` 文件名与导出函数名 |
| 鉴权 | 通常为无 JWT；注明中间件（限流等） |
| Query / Body | 参数名、类型、必填 |
| Response | 响应结构要点或类型名 |
| 前端封装 | 对应 `services/cubing-pro` 函数名；**无则写 `—`（前端未封装）** |
| 备注 | `stub`、`TODO`、与注释不一致处 |

`statistics` 子路由中仅注册、无 Handler 的端点：列入文档并标 **`stub（路由已注册，Handler 未实现）`**。

### 6.4 两份 API 文档的分工

| 文档 | 完整性要求 |
|------|------------|
| `public-api.md` | **public.go 路由 100%** |
| `frontend-services.md` | **services/cubing-pro 非空导出 100%**；调用 public 的函数须链到 `public-api.md` 锚点 |

### 6.5 完整性检查

- [ ] `public.go` 每条路由在 `public-api.md` 有对应条目（含 stub）  
- [ ] `services/cubing-pro` 每个非空 `.ts` 导出函数在 `frontend-services.md` 出现  
- [ ] `_index.md` 的 `apiPaths` 与 service / `public-api.md` 一致（grep 验证）  
- [ ] `project/static-assets.md` 已建且**未**展开 `HowToCook` 全树  
- [ ] 无编造路径  

---

## 7. 执行顺序（可多 Agent 并行）

```mermaid
flowchart LR
  A[routes + SOURCE_STRUCTURE] --> B[features/_index 骨架]
  B --> C[project/* 前端树]
  B --> D[api/frontend-services]
  B --> G[api/public-api 全量]
  C --> E[detail + 函数表]
  D --> E
  G --> E
  E --> F[PROGRESS 收尾]
```

| 阶段 | 任务 | 产出 |
|------|------|------|
| 0 | 创建 §3 子目录、`PROGRESS.md` | 骨架 |
| 1 | 扫描 `routes.ts` | `features/_index.md` |
| 2 | 梳理 `cubing.pro/src` + `config` | `project/*` |
| 3a | 梳理 `services/cubing-pro` | `api/frontend-services.md`、`api/README.md` |
| 3b | 通读 `public.go` + Handler | `api/public-api.md`（全量） |
| 3c | 索引 `cubing.pro/public/` 引用 | `project/static-assets.md` |
| 4 | 核实 `implType`；`brief.md` + `detail/*` | 分类完成 |
| 5 | §8 清单 | `status: done` |

**并行**：同一文件仅一 Agent 编辑；在 `PROGRESS.md` 声明 `locked-by: <session-id>`。

---

## 8. 质量检查清单

- [ ] `_index.md` 覆盖 `routes.ts` 全部叶子路由（合并项已注明）  
- [ ] 每项有 `implType`；`brief.md` 含纯前端 / 前端为主汇总  
- [ ] `tools/*`、`draw-tools/*` 带 `tool` 标签  
- [ ] `project/` 仅含前端模块，文件非空  
- [ ] **无** `project/backend/`  
- [ ] `api/public-api.md` 与 `public.go` 路由条数一致（含 stub）  
- [ ] **未**展开 `cubing.pro/public/HowToCook` 等大体量静态树  
- [ ] 框架相关表述均标明「当前：Umi」或归入 `renderMode` / 专节  
- [ ] 关键函数含 `cubing.pro/` 下路径  

---

## 9. 书写约定

- 简体中文为主；代码、路径、类型名保持英文  
- 仓库内链接用相对路径  
- 不写入密钥、`.env`、真实 Token  

---

## 10. 参考文件（只读）

| 文件 | 用途 |
|------|------|
| `cubing.pro/config/routes.ts` | 路由 ↔ 页面 |
| `cubing.pro/src/SOURCE_STRUCTURE.md` | 前端结构与 service 清单起点 |
| `cubing.pro/docs/WCA_LOGIN_FRONTEND_GUIDE.md` | WCA 登录流程 |
| `cubing.pro/docs/VISUALCUBE_USAGE.md` | VisualCube |
| `cubing-pro/src/api/routes/public.go` | **Public API 完整路由表（必读）** |
| `cubing-pro/src/api/routes/*.go` | 非 public 路由：仅在为 `frontend-services` 核对路径时只读 |

---

*任务书版本：v4.0.0-agent-3 · 产出根目录 `v4.0.0/` · 范围：前端全量 + 后端 Public API 全量 + 静态 public 索引。*
