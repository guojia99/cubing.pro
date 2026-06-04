# 功能简述与 implType 汇总

按业务域分节；每项 1～2 句。id 链到 [_index.md](_index.md)。

---

## 欢迎与通用

| id | 说明 |
|----|------|
| [welcome](#welcome) | 首页：致谢轮播 + 广告 + 外链。需加载公开 API 获取致谢数据 |
| [buy-coffee](#buy-coffee) | 赞助页：展示打赏二维码 |
| [changelog](#changelog) | 加载 `/CHANGELOG.md` 静态文件渲染 |
| [external-links](#external-links) | 外链聚合页，按分组展示后端配置的外链列表 |
| [advertisement](#advertisement) | 广告页（隐藏路由） |
| [settings](#settings) | 用户设置：主题、字号等，同步到 localStorage 和用户 KV |
| [user-kv-data](#user-kv-data) | 用户 KV 数据管理页 |
| [404](#404) | 404 兜底页 |

## 用户与认证

| id | 说明 |
|----|------|
| [login](#login) | WCA OAuth 登录页（跳转 WCA） |
| [auth-callback](#auth-callback) | WCA 回调：接收 token 后跳转 |
| [old-login](#old-login) | 旧版账号密码登录（已隐藏） |
| [user-profile](#user-profile) | 个人中心：头像、昵称等编辑 |

## 主办端（admin/organizers/*）

| id | 说明 |
|----|------|
| [admin-organizers](#admin-organizers) | 主办工具导航首页 |
| [admin-organizers-comps](#admin-organizers-comps) | 主办方查看自己创建的比赛列表 |
| [admin-organizers-create](#admin-organizers-create) | 创建比赛 |
| [admin-organizers-details](#admin-organizers-details) | 占位路由（空页面）；实际见 comps / [result 详述](detail/admin-organizers-result.md) |
| [admin-organizers-group](#admin-organizers-group) | 群组成员管理 |
| [admin-organizers-result](#admin-organizers-result) | 成绩录入、批量导入、预成绩审批（[详述](detail/admin-organizers-result.md)） |
| [admin-organizers-list](#admin-organizers-list) | 我的主办团队列表 |
| [admin-organizers-comp-result](#admin-organizers-comp-result) | 按 URL 参数进入的成绩录入（与 result 同组件） |

## 后台管理（admin/*）

| id | 说明 |
|----|------|
| [admin-admins](#admin-admins) | 后台管理导航首页 |
| [admin-users](#admin-users) | 用户 CRUD、合并、权限管理 |
| [admin-manage-organizers](#admin-manage-organizers) | 管理主办团队 CRUD |
| [admin-manage-groups](#admin-manage-groups) | 管理赛事群组 |
| [admin-diy-ranking](#admin-diy-ranking) | DIY 自定义榜单 CRUD |
| [admin-acknowledgments](#admin-acknowledgments) | 致谢列表管理 |
| [admin-other-links](#admin-other-links) | 外链配置管理 |
| [admin-sports](#admin-sports) | 体育赛事成绩管理 |
| [admin-sports-events](#admin-sports-events) | 体育项目 CRUD |

## 公式库（algs/*）

| id | 说明 |
|----|------|
| [algs-list](#algs-list) | 公式总览：按魔方分类展示算法组 |
| [algs-detail](#algs-detail) | 公式详情：筛选、练习、随机抽公式、熟练度追踪（后端 + 本地存储混合） |

## 生活内容（other/*）

| id | 说明 |
|----|------|
| [recipes](#recipes) | 菜谱列表：静态 JSON + localStorage 收藏 |
| [recipe-detail](#recipe-detail) | 菜谱详情：加载 Markdown 正文 |
| [kitchen-skills](#kitchen-skills) | 厨房技巧列表 |
| [kitchen-skill-detail](#kitchen-skill-detail) | 厨房技巧详情 |
| [cocktails](#cocktails) | 鸡尾酒列表：IBA 标准配方 |
| [cocktail-detail](#cocktail-detail) | 鸡尾酒详情 |

## 工具（tools/*）

| id | 说明 |
|----|------|
| [tool-bld-d](#tool-bld-d) | BLD 德语字母记忆辅助 |
| [tool-bld-pingyin](#tool-bld-pingyin) | BLD 拼音记忆辅助 |
| [tool-associative-words](#tool-associative-words) | BLD 联想词表 |
| [tool-mbld-d](#tool-mbld-d) | MBLD 记忆辅助 |
| [tool-team-match](#tool-team-match) | 团体赛对阵：抽签、淘汰赛、种子、导出（外部 API + 大量前端逻辑） |
| [draw-sq1](#draw-sq1) | SQ1 打图工具 |
| [draw-minx](#draw-minx) | 五魔方打图工具 |
| [draw-sk](#draw-sk) | Skewb 打图工具 |
| [draw-py](#draw-py) | Pyraminx 打图工具 |

## WCA / 统计

| id | 说明 |
|----|------|
| [wca-comps](#wca-comps) | WCA 官方赛事列表（直连 WCA API） |
| [wca-player](#wca-player) | WCA 选手资料、成绩、比赛、排名 |
| [wca-players](#wca-players) | WCA 选手搜索 |
| [wca-proportion-estimation](#wca-proportion-estimation) | 多项目成绩比例拟合工具 |
| [wca-statistics](#wca-statistics) | WCA 8 类统计 Tab（[详述](detail/wca-statistics.md)） |

## 赛事 / 选手 / 排行（group-competitions/*）

| id | 说明 |
|----|------|
| [gc-static](#gc-static) | 多 Tab：KinCh / 大龄 KinCh / DIY 榜 / WCA 统计（见 [detail/gc-static.md](detail/gc-static.md)） |
| [gc-records](#gc-records) | 纪录查询 |
| [gc-events](#gc-events) | 项目列表 |
| [gc-competitions](#gc-competitions) | 赛事列表（搜索） |
| [gc-players](#gc-players) | 选手列表（搜索） |
| [gc-pktimer](#gc-pktimer) | PK 计时器成绩展示 |
| [competition-detail](#competition-detail) | 赛事详情多 Tab：详情 / 规则 / 赛果 / 打乱（内嵌群赛计时器，见 detail） |
| [player-detail](#player-detail) | 站内选手详情（成绩、SOR、宿敌、比赛） |

---

## implType 汇总

### `frontend-only`（纯前端）

| id | name |
|----|------|
| buy-coffee | 赞助 |
| changelog | 更新日志 |
| advertisement | 广告 |
| 404 | 404 页面 |
| login | WCA 登录页 |
| auth-callback | WCA 回调 |
| admin-organizers | 主办导航 |
| admin-organizers-details | 主办详情（占位，空页） |
| admin-admins | 后台导航 |
| recipes | 菜谱列表 |
| recipe-detail | 菜谱详情 |
| kitchen-skills | 厨房技巧列表 |
| kitchen-skill-detail | 厨房技巧详情 |
| cocktails | 鸡尾酒列表 |
| cocktail-detail | 鸡尾酒详情 |
| tool-bld-d | BLD 德语记忆 |
| tool-bld-pingyin | BLD 拼音记忆 |
| tool-associative-words | BLD 联想词 |
| tool-mbld-d | MBLD 记忆 |
| draw-sq1 | SQ1 打图 |
| draw-minx | 五魔方打图 |
| draw-sk | Skewb 打图 |
| draw-py | Pyraminx 打图 |
| test | 测试页 |

共 **24** 项。

### `frontend-heavy`（前端为主）

| id | name |
|----|------|
| algs-list | 公式列表 |

共 **1** 项（赛事详情内「群赛计时器」子模块见 [competition-group-timer.md](detail/competition-group-timer.md)，不计入路由表）。

### `hybrid`（混合）

| id | name |
|----|------|
| welcome | 欢迎页 |
| settings | 设置 |
| algs-detail | 公式详情 |
| tool-team-match | 团体赛对阵 |
| competition-detail | 赛事详情（赛果/详情 Tab 接口驱动，打乱 Tab + 计时器为混合） |

共 **5** 项。

### `api-driven`（接口驱动）

| id | name |
|----|------|
| external-links | 外链聚合 |
| user-kv-data | 用户 KV |
| old-login | 旧版登录 |
| user-profile | 个人中心 |
| admin-organizers-comps | 主办比赛列表 |
| admin-organizers-create | 创建比赛 |
| admin-organizers-group | 群组管理 |
| admin-organizers-result | 成绩管理 |
| admin-organizers-list | 主办团队列表 |
| admin-organizers-comp-result | 录入成绩 |
| admin-users | 用户管理 |
| admin-manage-organizers | 管理主办 |
| admin-manage-groups | 管理群组 |
| admin-diy-ranking | DIY 榜单 |
| admin-acknowledgments | 致谢管理 |
| admin-other-links | 外链管理 |
| admin-sports | 体育赛事 |
| admin-sports-events | 体育项目 |
| wca-comps | WCA 赛事列表 |
| wca-player | WCA 选手页 |
| wca-players | WCA 选手搜索 |
| wca-proportion-estimation | 成绩比例拟合 |
| wca-statistics | WCA 统计 |
| player-detail | 站内选手详情 |
| gc-static | 排行/静态 |
| gc-records | 纪录 |
| gc-events | 项目页 |
| gc-competitions | 比赛列表 |
| gc-players | 选手列表 |
| gc-pktimer | PK 计时器 |

共 **30** 项。
