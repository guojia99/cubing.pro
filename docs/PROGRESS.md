# PROGRESS

| 模块 | 产出文件 | status | 备注 |
|------|----------|--------|------|
| 骨架 | `features/detail/README.md` | done | |
| 骨架 | `project/README.md` | done | |
| 骨架 | `api/README.md` | done | |
| features | `features/_index.md` | done | 全量路由表 |
| features | `features/brief.md` | done | 按业务域归纳 |
| project | `project/app-and-config.md` | done | |
| project | `project/pages-static.md` | done | |
| project | `project/pages-welcome-misc.md` | done | |
| project | `project/pages-algs.md` | done | |
| project | `project/pages-tools.md` | done | |
| project | `project/pages-recipes.md` | done | |
| project | `project/pages-wca.md` | done | |
| project | `project/pages-competition.md` | done | |
| project | `project/pages-player.md` | done | |
| project | `project/pages-admin.md` | done | |
| project | `project/pages-group-competitions.md` | done | |
| project | `project/components.md` | done | |
| project | `project/services.md` | done | |
| project | `project/utils.md` | done | |
| project | `project/static-assets.md` | done | |
| api | `api/frontend-services.md` | done | |
| api | `api/public-api.md` | done | |
| detail | `features/detail/team-match.md` | done | hybrid |
| detail | `features/detail/algs.md` | done | hybrid |
| detail | `features/detail/welcome.md` | done | hybrid |
| detail | `features/detail/competition-scrambles.md` | done | hybrid；§4.5 已补全 |
| detail | `features/detail/competition-group-timer.md` | done | frontend-heavy；§4.5 已补全 |
| detail | `features/detail/gc-static.md` | done | tab-shell |
| detail | `features/detail/wca-statistics.md` | done | 8 Tab + `/wca/ranks/*` |
| detail | `features/detail/admin-organizers-details.md` | done | 占位路由说明 |
| detail | `features/detail/admin-organizers-result.md` | done | OrganizersResults |

---

## 质量检查（对照 [README.md](README.md) §6.5 / §8）

| 项 | 状态 |
|----|------|
| `routes.ts` 叶子路由 ↔ `_index.md` | 已对齐（60 项；不含 redirect） |
| `public.go` ↔ `public-api.md`（含 14 条 stub） | 已对齐（42 条） |
| `services/cubing-pro` 导出 ↔ `frontend-services.md` | 已覆盖（含纯函数与 localStorage 模块） |
| `implType` 汇总 ↔ `brief.md` | 已对齐（24+1+5+30=60，含 wca-statistics） |
| `project/` 无 `backend/` | 是 |
| `static-assets` 未展开 HowToCook 树 | 是 |
| 框架表述标注 *当前：Umi* | 见 `project/app-and-config.md` 等 |

**可选后续**：`notify` / `forum` 等仅后端 Public 端点待产品接入时再写前端封装；`admin/organizers/details` 可考虑重定向至 `comps` 或 `result`。
