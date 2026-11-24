<p align="center">
  <img src="public/CubingProLogo.png" alt="Cubing Pro 标志" width="96" />
</p>

<h1 align="center">Cubing Pro</h1>

<p align="center">从一个公式，到下一次突破。<br />魔方公式、还原练习、线上赛事与 WCA 数据，一站探索。</p>

<p align="center">
  <a href="https://cubing.pro">访问网站</a> ·
  <a href="#快速开始">本地开发</a> ·
  <a href="docs/features/_index.md">功能手册</a> ·
  <a href="https://github.com/guojia99/cubing.pro/issues">问题反馈</a>
</p>

---

## 探索 Cubing Pro

面向魔方爱好者的社区与工具平台。本仓库是网站的 **Next.js 前端**，API 服务由独立后端提供。

| 想做什么 | 从这里开始 |
| --- | --- |
| 查公式、练习手法 | [公式库](https://cubing.pro/algs/)：分类查询、状态图示与计时练习 |
| 研究二阶解法 | [二阶工作台](https://cubing.pro/tools/solver/222/)：打乱求解、方法筛选与练习统计 |
| 探索 FR | [Floppy Reduction](https://cubing.pro/tools/floppy-reduction/)：形态识别、分析与练习 |
| 参加或回顾群赛 | [线上比赛](https://cubing.pro/group-competitions/competitions/)：比赛、选手、排名与纪录 |
| 查看 WCA 数据 | [WCA 统计](https://cubing.pro/wca/statistics/)：选手成绩、历史排名与多项目分析 |
| 组织团体赛 | [团体赛工具](https://cubing.pro/tools/team-match/)：组队、抽签、对阵与导出 |

此外还有魔方绘图等工具。界面支持简体中文、English、日本語、廣東話、한국어、Français 和 Español，并提供深浅色模式与主题设置。

## 快速开始

准备好支持 Next.js 15 的 Node.js 环境和 npm，然后执行：

```bash
git clone https://github.com/guojia99/cubing.pro.git
cd cubing.pro
npm ci
npm run dev
```

打开 [localhost:3000](http://localhost:3000)。默认端口被占用时，以终端输出为准。

> 开发时沿用默认的 Webpack 模式，不额外添加 `--turbopack`，避免当前 Chakra UI / Emotion 集成的 hydration 问题。

### API 与本地联调

**本地前端默认连接线上 API**，可以直接浏览公开数据。需要联调本地后端时，在 `.env.local` 中设置：

```dotenv
NEXT_PUBLIC_DEV_API_BASE=http://127.0.0.1:20000/v3/cube-api
CUBE_API_UPSTREAM=http://127.0.0.1:20000/v3/cube-api
```

重启开发服务器后生效。本地后端需自行准备并启动，修改前端配置不会自动启动 API 服务。

| 环境变量 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_DEV_API_BASE` | 本地浏览器直连的完整 API 根地址 |
| `NEXT_PUBLIC_API_BASE` | 其他域名部署时使用的 API，默认指向线上 |
| `CUBE_API_UPSTREAM` | Next.js 代理上游与静态构建公式目录的数据源，默认指向线上 |

部署在 `cubing.pro` 及其子域名时，浏览器使用同源 `/v3/cube-api`。`NEXT_PUBLIC_*` 配置会公开到浏览器，并在构建时固化；仅修改 `CUBE_API_UPSTREAM` 不会切换所有浏览器请求。

## 构建与部署

### 静态站点

```bash
npm run build:static
npm run preview:static
```

产物输出到 **`dist/`**，预览命令直接服务该目录。静态构建会请求公式目录 API，因此需要该数据源可用。

比赛、选手等动态 ID 页面需要服务器配置对应的路径回退，才能直接访问或刷新。部署配置、环境变量和导出检查见 [静态导出说明](docs/static-export.md)。

### Next.js 服务

```bash
npm run build
npm start
```

普通构建使用 Next.js 服务模式；`build:static` 脚本会单独启用静态导出。

## 项目导航

**Next.js 15 · React 19 · TypeScript · Chakra UI v3 · Ant Design**

```text
src/
├── app/                  # App Router 路由入口与布局
├── views/                # 业务页面与功能实现
├── components/           # 共享 UI、布局与魔方图示
├── services/cubing-pro/  # API 调用与领域存储
├── config/routes.ts      # 路由元数据
├── lib/navigation.ts     # 顶栏导航
├── i18n/                 # 七语词典与格式化
├── styles/               # 设计 token 与全局样式
└── theme/                # Chakra UI 主题映射
docs/                     # 功能契约与维护文档
scripts/                  # 内容准备、静态导出与检查脚本
public/                   # 静态资源与内容数据
```

新增页面从 `src/views/` 开始，再接入 App Router、路由元数据与导航。页面实现不放在旧的 `src/pages/` 中。

## 参与贡献

欢迎通过 [Issues](https://github.com/guojia99/cubing.pro/issues) 反馈问题、提出功能建议，或提交 Pull Request。报告问题时，请附上页面地址、复现步骤、浏览器和设备信息。

提交前按改动范围运行检查：

| 改动范围 | 检查命令 |
| --- | --- |
| TypeScript | `npx tsc --noEmit` |
| 代码规范 | `npm run lint` |
| 界面文案与国际化 | `npm run test:i18n`、`npm run check:i18n` |
| 魔方图示与动作解析 | `npm run test:puzzles` |
| 二阶求解与练习 | `npm run test:two-solver` |
| 静态路由与导出脚本 | `npm run test:static-export` |

新增界面文案请同步补齐七语词典，相关约定见 [国际化维护](docs/project/internationalization.md)。

更多入口：[功能索引](docs/features/_index.md) · [静态部署](docs/static-export.md) · [更新记录](public/CHANGELOG.md)
