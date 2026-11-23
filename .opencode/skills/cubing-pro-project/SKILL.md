---
name: cubing-pro-project
description: cubing.pro 项目全景、目录职责、功能分布、依赖关系、开发维护与兄弟项目 cubing-pro 联调指南。Use when developing, debugging, reviewing, onboarding, or maintaining this Next.js frontend, its static export, puzzle tools, competition workflows, or contracts with the sibling Go backend.
---

# Cubing Pro 项目开发与维护

## 定位与使用方式

当前仓库 `cubing.pro` 是 Next.js 前端；相邻 `../cubing-pro` 是 Go API、网关、机器人与数据维护仓库。两者名称相似，但拥有独立 Git 历史和构建流程。前端 `package.json` 的 name 也叫 `cubing-pro`，识别仓库应看目录和源码入口。

本技能根据 2026-11-18 的本地源码核实，覆盖主要目录、功能域、跨仓库依赖和操作流程，不是线上部署现状证明。所有下文路径默认相对当前仓库根目录；`../cubing-pro/` 才表示兄弟仓库。参考文档里的源码路径也遵守此约定。

使用本技能时：

1. 先读用户目标对应的参考文档，再打开实际源码，确认当前实现没有变化。
2. 先看 `git status --short`，保留用户或其他代理已有改动。
3. 沿“路由入口 → View → service/本地状态 → 后端 Handler/数据源”定位，区分页面代码存在、路由接入、后端支持和实际验收四件事。
4. 实现最小必要改动，运行与改动相符的检查；说明没有完成的外部联调。
5. 功能、目录、接口、脚本或存储协议发生变化时，同步更新本技能相应参考文档。

## 按需阅读

| 问题 / 任务 | 先读 | 接着核对 |
| --- | --- | --- |
| 初次接手、查目录、理依赖、框架升级 | [架构与目录](references/architecture.md) | `package.json`、Provider、路由入口 |
| 公式、二阶、FR、图示、团体赛、群赛、WCA、内容页 | [功能地图](references/features.md) | 表中实际 View 与 service |
| 接口、权限、登录、Go 服务、数据同步、网关联调 | [兄弟项目关系](references/backend.md) | 两仓库对应路由、DTO、模型与配置结构 |
| 安装、开发、测试、静态发布、故障排查、长期维护 | [开发维护手册](references/development.md) | `package.json`、`scripts/`、当前环境 |

## 必须掌握的事实

- 前端主链是 `src/app` → `src/views` → `src/services/cubing-pro`；共享组件在 `src/components`。`src/pages` 仅保留说明，不在此新增业务页。
- `src/config/routes.ts` 是路由元数据；真正的页面分发在 `src/app/(main)/[...path]/page.tsx` 和显式 App Router 页面。顶栏在 `src/lib/navigation.ts`，不是路由表自动生成。
- `config/routes.ts` 只是重导出。`pageComponent` 含旧 Umi 命名，不能直接作为当前磁盘路径；`hidden`、`tags` 不能代替权限 Guard。
- Chakra v3 与 Ant Design 并存；沿目标页面现有体系维护。主题源为 `src/styles/tokens.css`，Chakra 映射在 `src/theme/index.ts`，当前有八套 palette。
- 业务服务目录同时含 HTTP API、localStorage 和 IndexedDB 存储，不是所有功能都由 Go 后端保存。
- 前端默认可调用线上 API。本地联调浏览器优先看 `NEXT_PUBLIC_DEV_API_BASE`；只设置 `CUBE_API_UPSTREAM` 不足以保证浏览器请求指向本地。
- API 前缀为 `/v3/cube-api`，尾斜杠是契约的一部分。Axios 不统一注入认证头，也不统一解包响应；检查每个 service 的实际返回值。
- 静态导出产物为 `dist/`；只有 `NEXT_OUTPUT_EXPORT=1/true` 才启用 export。动态 ID 页面需要对应占位页、部署回退和客户端真实 URL 解析。
- 公式分类页构建时从 API 枚举；二阶求解公式来自 `../cubing-pro/build/Algs/2x2db` 离线转换。这是两条不同的数据链。
- 公式练习历史使用 IndexedDB；团体赛、群赛计时和二阶练习有各自本地状态。不要把“设置云同步”写成“所有历史自动云同步”。
- 站内成绩、WCA 成绩和计时器分别有秒、百分之一秒、毫秒及不同 DNF/DNS 编码，跨域转换必须显式检查。
- Go 公共启动初始化会连接数据库并 AutoMigrate；部分后台行为不受 `-j/-w` 完全控制。阅读配置结构和命令实现后再运行后端。

## 任务执行规则

### 页面与 UI

新增功能同时检查路由元数据、App Router 分发、导航、权限、词典和静态导出。动态参数使用现有 `useRouteParam` 适配，不假定 catch-all 自动提供具名参数。

使用已有样式和领域组件。新增/修改 Chakra UI、React 或 Next 功能时，按任务读取现有 `chakra-ui-builder`、`chakra-ui-refactor`、`vercel-react-best-practices` 等技能；本技能负责项目事实，不替代这些专项指南。历史 `.agents/skills/SKILL.md` 的路径说明需要与实际仓库核对。

浏览器 API、Web Worker、WebGL 和 storage 在客户端边界内使用，保留取消请求、懒加载、组件卸载清理和 Strict Mode 下的生命周期保护。

### 接口与跨仓库变更

修改接口前，对照前端 service 与兄弟仓库 `src/api/routes`、Handler、模型 JSON tag。同时核对 HTTP method、路径和尾斜杠、参数、响应 envelope、权限位、单位、空值和错误结构。

兄弟仓库缺失时，只推进可在当前仓库验证的工作，并明确哪些契约未核实；不臆造后端字段或外部配置。用户只要求当前仓库的变更时，不自动修改兄弟仓库。

### 数据与维护

后端业务数据库唯一指定为 **MySQL 8.0.16+**。不要为 SQLite 添加任何保护性兼容、迁移、表重建、索引/触发器保留、自增序列恢复、锁冲突处理、驱动回退或其他额外操作；不要为了 SQLite 测试改变 MySQL 业务实现。业务数据库测试使用 MySQL，缺少隔离测试库时报告跳过，不回退到 SQLite。用户明确保留 WCA 离线 SQLite 导出工具，它不代表业务库支持 SQLite。

后端表迁移统一放在 `../cubing-pro/src/internel/convenient/`；公式目录数据导入由 API 子模块引导，不放在 cmd 中。

修改 localStorage key、IndexedDB schema、公式身份、导入导出格式时，保留旧数据读取/迁移能力并验证失败恢复。不要通过清空用户数据来掩盖兼容问题。

生成文件从来源和脚本维护：求解数据用 `two-solver:sync`，scrambler 用 `two-solver:prepare`，菜谱用 HowToCook 脚本；保留 vendor 来源、许可证和 NOTICE。

本技能的普通核验不要求启动数据库、执行全量后端测试、同步 WCA 或发布服务。若任务本身涉及这些动作，先核对环境和副作用；不要把带数据库写入的命令当成只读探测。

## 文档漂移处理

存在已知漂移：根 README 的 Pages Router/导航路径、本地代理描述，以及 AGENTS 中的 `out/` 和无条件 export 描述均与当前实现不同；`docs/api/README.md` 保留 Umi 时期资料。遇到冲突，应说明差异并以当前源码核实技术事实；用户明确约束仍优先遵守。

维护此技能时同步检查四份参考文档的关联条目，不固定引用易漂移的行号、机器绝对路径、实际密钥或生产配置值。新增技能后需退出并重启 OpenCode，已有会话不会重新加载技能目录。
