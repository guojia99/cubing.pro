# 与兄弟项目 cubing-pro 的关系

核实日期：2026-11-18。`../cubing-pro` 指相邻 Go 仓库；本文是源码关系说明，不代表已验证生产拓扑。

## 1. 仓库边界与三条连接

| 仓库 | 角色 | 入口 |
| --- | --- | --- |
| 当前 `cubing.pro` | Next.js 前端、浏览器工具、静态导出 | `src/app/`、`package.json` |
| `../cubing-pro` | Go API、网关、QQ 机器人、WCA 同步和维护工具 | `main.go → cmd/root.go` |

```text
浏览器 cubing.pro
  ├─ /v3/cube-api → Go API → 业务 DB / WCA DB / 文件 / 外部服务
  ├─ 静态 JSON、Markdown、Worker → 前端 public/ 和 dist/
  └─ 部分直接请求 → WCA 官方 / One 等

Go gateway → 前端 dist/ 静态文件 + 动态路由回退 + API 反向代理
Go robot   → 共用业务服务、群赛逻辑、数据库

../cubing-pro/build/Algs/2x2db
  → 当前 scripts/sync-two-solver-data.mjs
  → public/two-solver/data → 二阶求解 Worker
```

两仓库独立构建发布。运行时主要是 HTTP，不是前端直接调用 Go 包；当前未发现 Go→TS 客户端/类型生成或共享业务源码包。二阶数据脚本是明确的跨仓库文件依赖：移动目录或新克隆缺数据会影响同步，但已有静态数据可供前端使用。

## 2. Go 项目定位图

后端 `go.mod` 声明 Go `1.25.0`，核心为 Gin、Cobra、GORM、MySQL/SQLite、gin-jwt、go-cache 和 WebSocket。具体版本以该仓库锁定为准，不推断生产工具链。

| 后端路径（均带 ../cubing-pro/ 前缀） | 职责 |
| --- | --- |
| `main.go`、`cmd/root.go` | Cobra 入口、共享 flags、公共服务初始化 |
| `cmd/api/`、`cmd/gateway/`、`cmd/robot/` | 独立 API、网关、机器人子命令 |
| `cmd/admin/`、`cmd/initer/`、`cmd/group/`、`cmd/syncer_wca/` | 权限、基础数据、群组和 WCA 维护入口 |
| `src/api/api.go`、`src/api/routes/` | Gin、中间件、`/v3/cube-api` 领域路由注册 |
| `src/api/app/`、`src/api/public/`、`src/api/middleware/`、`src/api/exception/` | Handler、公开数据、JWT/CORS/权限、响应 |
| `src/internel/svc/` | 配置、数据库、缓存、业务门面、打乱、WCA 的服务容器 |
| `src/internel/convenient/` | 模型自动迁移、业务接口/实现、任务装配 |
| `src/internel/groupcomp/` | 群赛成绩、预成绩、审批、轮次和机器人共用逻辑 |
| `src/internel/database/model/` | 用户、比赛、报名、成绩、群组、KV、图片等 GORM 模型 |
| `src/internel/algs/`、`scramble/`、`wca_api/`、`email/` | 公式加载、打乱、外部 WCA/Seniors、邮件 |
| `src/wca/` | WCA 导入库、同步、索引、排名和统计 |
| `src/gateway/` | API 代理、静态站、多 Host、动态页回退、TLS 等 |
| `src/robot/` | CQHTTP/QQBot、消息与比赛插件、Webhook/WS |
| `src/configs/configs.go` | 配置结构和兼容加载；比本机实际 YAML 更适合作为字段依据 |
| `build/Algs/`、`build/Alg-Trainers/`、`scripts/` | 公式资源及导入、同步、SQL 维护资料 |
| `etc/`、`Makefile`、`src/SOURCE_STRUCTURE.md` | 配置/unit 模板、构建快捷命令、旧目录说明 |
| `local/`、`test/` 等忽略目录 | 可能只在本机存在；新克隆不保证具备 |

`internel` 是真实历史拼写，不能在查找或文档中擅自改成 `internal`。`cmd/server/server.go` 不是当前统一启动入口。旧迁移工具如 `cmd/v2_mi_v3`、`moyuan2maomao`、`o333bf` 不是日常启动步骤。

## 3. 主要接口对应表

以下 URL 相对 `/v3/cube-api`，不是完整接口清单。改动时继续追 Handler、DTO 和模型。

| 领域 | 前端 src/services/cubing-pro 下 | 后端 ../cubing-pro 下 |
| --- | --- | --- |
| current/refresh/WCA OAuth/资料 | `auth/auth.ts`、`auth/token.ts` | `src/api/routes/auth.go`、`src/api/app/auth/` |
| `/public/player/` 及选手数据 | `players/` | `src/api/routes/public.go`、选手 Handler |
| `/public/comps/` 及详情/赛果 | `comps/` | `src/api/routes/public.go`、比赛 Handler |
| 主办比赛、成绩 | `auth/groupCompetition.ts`、`auth/organizers.ts` | `src/api/routes/comp_result.go`、`src/api/app/organizers/` |
| 管理员群赛、主办、群组、用户 | `auth/` 相应 service | `src/api/routes/admin.go`、对应 Handler |
| `/public/algorithm/` 和分类详情 | `algs/algs.ts` | `src/api/public/alg.go`、`src/internel/algs/` |
| `/wca/*` 站内 WCA 数据 | `wca/player.ts`、`wca/static.ts` 等 | `src/api/routes/wca.go`、`src/api/app/wca/`、`src/wca/` |
| `/user/kv`、`/user/kv/:key`、POST `/user/kv/` | `user/user_kv.ts` | `src/api/routes/user.go`、`src/api/app/users/KeyValues.go` |
| 普通/Senior Kinch、纪录 | `statistics/` | `src/api/routes/public.go` |
| DIY 榜单及其 Kinch/SOR | `statistics/diy_ranking.ts` 等 | `src/api/routes/static.go` |
| `/public/pkTimers` | `pktimer/pktimer.ts` | `src/api/app/pktimer/pktimer.go` |
| 致谢、外链、公开群组 | `public/`、`auth/` 对应管理 service | public/admin 路由及系统内容 Handler |

后端关闭了 Gin 自动尾斜杠跳转；`/public/algorithm/`、`POST /user/kv/` 等保留精确路径。前端 Axios interceptor 只补 baseURL，不全局注入 `AuthHeader()`、刷新或解包。通用成功 envelope 常见 `{code:"200", data, msg}`，公式和部分 WCA 直接返回对象/数组；错误还可能使用 `http_code/message/error/data`。不能全局强行统一为 `.data.data`。

`wca/wca_api.ts`、`wca/competition_index.ts` 还有直达官方的请求；One 在团体赛局部 service。PK 前端目前是 HTTP 历史读取；后端机器人的 WS 不等于浏览器存在实时 PK WebSocket。

## 4. 认证、权限与持久化契约

认证链：前端登录 → Go `/auth/wca` → WCA → Go OAuth 回调生成本站 JWT → 前端 `/auth/callback` 保存 token 并从 URL 清除 → `/auth/current` → AuthProvider。后端 OAuth 回调与前端登录成功回跳是不同地址；本地登录同时检查 WCA 登记、后端配置和回跳白名单。

JWT 使用 Bearer Authorization；前端 token 在 localStorage，刷新检查每五分钟触发。权限是 Player/Organizers/Delegates/Admin/SuperAdmin 位集合，不是等级自动继承。后端不同路由可要求不同权限位，主办还校验团队成员和资源归属；前端卡片/Guard 不足以保证操作被授权。

业务数据库按配置选择 MySQL/SQLite；WCA 查询使用独立 MySQL 导入库，通过 `wca.txt` 切换。缓存包括进程内 go-cache、业务表、文件和浏览器存储；本次未发现 Redis 或对象存储客户端。图片当前可存本地磁盘+模型元数据，也可引用外链。

比赛嵌套赛程通过数据库 JSON 还原成 `comp_json`；成绩保留 Result/Penalty 与计算字段，前后端各自有模型/格式化。修改字段、单位或枚举需同时检查序列化、全量编辑和旧数据。

用户 KV 前端限制为 2 MiB，写入 key/type/value；新增 key 还要核对后端白名单、长度和联合唯一约束。`websize_ui_config` 是历史拼写兼容，不直接删掉。旧 `key_value/` 与新 `user/` 不是无条件可互换接口。

## 5. 公式数据的两种消费方式

1. 后端 `src/internel/algs/algs.go` 加载 `Algs/catalog.json` 与 Trainer 文件，供公式库 API；配置资源路径需核对运行目录。
2. 前端 `scripts/sync-two-solver-data.mjs` 读取 `../cubing-pro/build/Algs/2x2db`，转换 21 个方法到 `public/two-solver/data/`，生成 manifest 数量与 SHA-256；不会改后端文件。

后端抓取/导入脚本有 `scrape_2x2db.py`、`import_local_algs.py`、`sync_alg_trainers.py`。部分依赖未跟踪快照或固定上游修订，不能假设新克隆能立即重建全部数据。前端同步不刷新运行中的 Go 公式目录，也不重新构建静态公式页面；维护时分别检查三者。

## 6. 启动和维护副作用

`cmd/root.go` 在子命令执行前调用 `svc.NewAPISvc`；`convenient` 初始化会连接业务 DB 并执行 AutoMigrate。因此 API、gateway、robot 共享初始化，不能把启动网关当成纯静态文件读取。

| 行为 | 当前条件 | 维护注意 |
| --- | --- | --- |
| 通用任务 | `-j/--job`，默认关闭 | 任务启动后先执行一次，可能写 DB/文件 |
| 纪录重算 | 普通任务，约 30 分钟 | 删除旧纪录后重建 |
| 中国赛事抓取 | 普通任务，约 24 小时 | 更新系统 KV |
| 静态站自动更新 | 普通任务 + 站点 autoUpdate | git pull、检测 HEAD、执行配置构建 |
| WCA 同步 | `-w/--sync-wca` 或 `sync_wca` 命令 | 下载/导入、DROP/CREATE 库、切换、旧库/文件清理 |
| WCA 库连接刷新 | 不开同步时仍有循环 | 定期读取 wca.txt 重连 |
| Seniors 缓存 | 包 init 中后台运行 | 不完全受 -j/-w 控制，可能联网/写缓存 |

打乱分支也有环境要求：tNoodle 为 HTTP 服务，非 Darwin 的 Rust 分支通过 CGO 链接；Darwin stub 不能作为真实比赛打乱验证。Go、CGO、静态库、MySQL CLI、公式/字体/图片目录要按使用范围准备。

后端 `make api` 依赖本机忽略配置；`make api_j/api_w` 开启额外任务；`make install` 会停止服务、替换系统二进制并重启，是发布操作。不要默认运行全量 `go test ./...`：部分旧测试初始化本地服务或调用 WCA 同步，先审查测试副作用。

## 7. 跨仓库改动检查表

| 改动 | 前端 | 后端 |
| --- | --- | --- |
| URL、method、DTO | service/typings/页面解包 | routes、Handler、模型 JSON tag、exception |
| 权限、登录 | Guard、AuthProvider、token、回调 | JWT、路由权限、资源归属、OAuth 配置 |
| 群赛/成绩规则 | groupCompetition service、lib、录入和计时 UI | groupcomp、模型、Handler、机器人插件 |
| 公式分类 | Algs、缓存、静态枚举、求解数据 | 数据目录、加载器、公式 API |
| 页面路径 | 路由表、catch-all、useRouteParam、静态脚本 | gateway 动态回退和多 Host 路由顺序 |
| KV/schema | 序列化、大小、迁移、导入导出 | 白名单、类型、唯一约束、迁移 |

群赛还要对照两侧 `docs`，但规则冲突时读实现和测试。网关支持 Next 多页、旧 Umi SPA、多 Host 代理/静态站；Next 产物通常应 `spa: false`。`localProxies/staticSites` 的 Host 匹配先于通用 API 转发，同源 API 可达性须实际验证。

本次未核实生产 unit、实际配置/数据库、线上任务开关、CDN/Nginx、OAuth/SMTP/机器人可用性。仓库 `etc` 是模板，`local` 是本机环境，不能把它们写成确定的生产事实。
