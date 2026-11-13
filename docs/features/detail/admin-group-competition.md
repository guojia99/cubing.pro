# 群赛管理与审批

实现位于 `src/views/admin/`，保留 Chakra 外壳，业务表单和表格使用 antd。接口契约以相邻后端项目 `cubing-pro/docs/group-competition-api.md` 为准。

## 入口

- `/admin/competition/approvals`：管理员全局群赛列表，默认 `status=Reviewing`，`status=all` 显示全部。
- `/admin/competition/manage?compId=42`：固定比赛管理页，`input_tabs=manage/one/multi/pre_result` 选择管理、单条、批量、成绩审批。
- `/admin/organizers/comps`：始终查询自己所属团队，管理员兼主办也保留原团队比赛（含非群赛）；无团队时提供全局群赛入口，不自动切换。
- `/admin/organizers/result?orgId=7&compId=42`：固定主办管理页。
- 原 `/admin/organizers/:orgId/comp/:compId/result` 继续支持，始终使用原 organizer 接口及团队权限，不因管理员角色改用群赛专用接口。只有固定 `/admin/competition/*` 页面显式启用 admin 模式，纯管理员/超级管理员无团队身份可用该新入口。

新固定入口已加入 `APP_ROUTES`，由现有 `getCatchAllStaticParams()` 枚举，因此静态导出可按固定路径刷新，比赛 ID 只放 query。原动态路径仍依赖部署 fallback。

列表保留 `id/name/status/orgId/groupId/isDone/date/page/size`；进入管理页会携带受限的 `returnTo` 返回筛选结果。登录 guard 保留 query 和 hash。

列表参考公共 `GcCompetitionsView`，采用紧凑行、序号、项目图标、交替行样式、日期 Tag、固定操作列和分页。沿用当前比赛名 252px、团队/群组各 128px 和 8em 名称宽度，长名称换行，窄屏仅表格内部横向滚动。

团队/群组以真实名称为主、ID 为辅助。管理员（不要求超级管理员）通过 `GET /admin/competition/filters?page=1&size=500` 加载只读名称选项，累积到 organizersNext/groupsNext 均为 false。名称下拉可搜索，群组按 OrganizersID 联动；成绩管理顶部也可按团队/群组/比赛名称查找并进入对应审批页。详情优先显示后端 OrganizersName/GroupName，其次关联对象或只读选项，不猜造名称。

普通主办使用自身团队和群组接口。后端 organizer 原列表已恢复 HEAD 的全团队列表（不支持新增筛选分页），前端在该授权范围内本地筛选/分页；仅对 Genre=5 且列表投影缺少 GroupId 的候选，用最多 4 个并发详情补取群组元数据。不改变原列表接口行为、不按管理员 API 越权查询。

## 业务规则

- 创建日期取 DatePicker 的日历字符串，显式提交 `YYYY-MM-DDT00:00:00+08:00`，不调用浏览器时区的 `toISOString()`。
- 最新群赛规则：仅要求比赛审批通过（Status=Running），赛前、赛后及 IsDone=true 均允许新增、覆盖、修改、删除成绩和正常审批。比赛日期与结束标记用于展示，不作为成绩录入截止条件；权限、选手身份、项目/轮次存在、成绩格式等校验继续保留。
- End 可在有待审成绩时执行，标记比赛结束，但不停止新增、覆盖、编辑或审批。前端不显示 ResultClosedAt 截止规则，也不要求补齐旧时间记录；已移除旧人工核查 UI，正常审批不发送 HistoricalConfirmed。
- 日期和状态呈现只用于后端定义的 `Genre=5 && GroupId>0` 群赛。公共群赛日期结束或显式结束后仍只显示“已结束”；内部可显示“赛期结束”或“已结束”，不再表达仅可审批旧单。其余比赛（含无群线上非正式赛、有关联群组的线上正式赛）保持原有时间戳状态判断和日期格式。
- 非群赛原录入行为不变。`parseBatchResults` 的 `requireOpen` 默认 false，成绩页显式传 false，已配置的关闭轮次也可单条/批量录入；不存在的轮次仍拒绝。
- 非群赛编辑展示完整原始 RFC3339 时间为只读值；保存说明等字段时逐字保留原 CompStartTime/CompEndTime（含小数秒和时区），不会重写北京零点。仅群赛编辑转换日历日期到 +08:00。
- 创建及导入项目的轮次默认全部开放；编辑新增轮次也默认开放，已有轮次保留原状态。手动轮次管理支持“一键开放全部轮次”，确认后通过一次事务开放所有项目轮次；全部已开放时按钮禁用。开放开关用于赛程管理，不是成绩录入资格条件。轮次关闭不阻止已审批群赛录入成绩。
- 项目/轮次配置通过可编辑表格维护，完整编辑 body 使用 `comp_json`，轮次开放状态只走 `refresh_event`。
- 后续轮次明确选择“按晋级名单 / 无限制”，新建后续轮次默认按名单，配置有限人数时默认生效。已有或导入的明确 `NoRestrictions=true/false` 不会因人数编辑或保存被改写；无限制配有限人数时显示提示，需用户明确切换才能校验名单。晋级人数属于本轮，上一轮关闭时计算本轮名单，0 表示不限制晋级人数。
- 成绩查询筛选不受赛期或 IsDone 限制，全部轮次（含关闭轮次）都可选；单条按项目/轮次查询，清空轮次后可按 CubeID 查询，批量页按 CubeID 查询。群赛未审批通过时禁用录入和成绩修改，查询继续可用。
- 多盲支持 `0/0 DNS`、`3/4 DNF`，以及服务端定义的 DNF/DNS/DNP/DNT（对应 -10000/-10001/-10002/-10003）。0 次尝试只允许 DNS，其他负值、负数或非整数计数、复原数超过尝试数均拒绝。
- 比赛驳回原因必填。报名审批、成绩审批和轮次开关均显式发送布尔 false。
- 批量录入和审批逐条执行并显示真实完成量。录入成功行移除、失败行保留；不会对部分成功显示全部成功。
- 成绩审批可筛待审、通过、驳回、超时、全部完成、全部；已完成记录不可再次选择审批，历史缺失记录仍能显示并由后台校验。
- 通过/驳回分别发送 `review_status=passed/rejected` 并显式携带 `finish=true`，超时发送 `finishDetail=timeout&finish=true`。保留原有 `pre_finish=ok/not` 页面 URL 值，每次只请求当前 page/size，直接使用服务端筛选后的 items/total，不再逐页拉取或本地过滤。接口也支持 `finishDetail=ok/not`；终态筛选与 `finish=false` 冲突会返回参数错误。

## 验证

```sh
node --test src/views/admin/groupCompetition.test.mjs
node src/views/admin/groupCompetition.browser.test.mjs
./node_modules/.bin/tsc --noEmit --incremental false
```

浏览器测试采用 esbuild 内存打包和 localhost 隔离页面，Axios mock adapter 返回固定数据。Node 的 HTTP/HTTPS/TCP/fetch 全程拦截；浏览器只放行当前 localhost origin，禁用 Service Worker 和外部 DNS，并验证外网探针被路由拦截。不启动 Next dev、不生成 `.next/dist`。验证 320/390/768/1440px、管理员/主办权限、URL 筛选、开关轮次、单条及批量录入、审批部分失败、创建日期与人数，以及赛前/赛后/显式 End 后关闭轮次可新增覆盖、成绩删除、配置修改、缺失旧截止不阻碍普通审批、未审批禁止录入、passed/rejected/timeout 的准确总数和单页分页。

新增回归包含普通 admin 名称选项、options 双列表分页、长名称响应式、日期 Tag 和固定操作列、公共群赛“已结束”和非群赛旧展示边界。

原路径回归覆盖 admin+organizer 访问原团队列表及动态成绩页、过期且 IsDone 的非群赛未开轮单条/批量录入、仅改说明而原始小数秒/时区不变，以及无团队纯 admin/super 在固定入口管理群赛。

## 限制

- 隔离浏览器测试替换了 Next 导航与登录上下文；不能代替真实 JWT、部署服务器或生产数据库联调。未执行完整静态 build，固定入口通过静态路由枚举测试验证。
- 上一轮实施测试早期因 tsx ESM/CJS 模块实例不一致，mock 曾漏出首条线上 GET 并返回 404，未发生写入；本次交叉审查重测在加载业务模块前已拦截网络，全部离线。
