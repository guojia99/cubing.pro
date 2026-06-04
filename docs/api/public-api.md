# Public API 完整契约

> 唯一完整性基准：`cubing-pro/src/api/routes/public.go`  
> 中间件：`RateLimitMiddleware(20 req/s)` 作用于 `/public` 全组  
> 鉴权：无 JWT（Public），除非特别标注  
> **路径**：下表 Path 为相对 Base URL `/v3/cube-api` 的后缀（完整示例：`GET /v3/cube-api/public/events`）。

---

## /public 根路由

| Method | Path | Handler | 鉴权 | Query / Body | Response | 前端封装 | 备注 |
|--------|------|---------|------|--------------|----------|----------|------|
| GET | `/public/swagger/json` | 匿名 | 无 | - | 404 | - | 始终返回 404 |
| GET | `/public/events` | `result.Events` | 无 | - | `{ Events: []event.Event, UpdateTime: time.Time }` | `apiEvents` | TODO: 加缓存 |
| GET | `/public/notify` | `notify.GetNotifyList` | 无 | - | `{ Tops []Notification, Results []Notification }` | - | **前端未封装** |
| GET | `/public/forum` | `posts.GetForums` | 无 | - | `[]post.Forum` | - | **前端未封装** |
| GET | `/public/orgs` | `organizers.PublicOrganizers` | 无 | `page?, size?` | `GenerallyListResp` (name, id, introduction, status) | `apiPublicOrganizers` | |
| GET | `/public/comp_groups` | `organizers.PublicCompGroups` | 无 | - | `GenerallyListResp` (name, id) | `apiPublicCompGroups` | |
| GET | `/public/pkTimers` | `pktimer.GetPKtimer` | 无 | `page?, size?` | `GenerallyListResp` of PKtimerResponse | `GetPKTimer` | MaxSize=20 |
| GET | `/public/acknowledgments` | `acknowledgments.GetAcknowledgments` | 无 | - | `[]Thank{ wcaID, nickname, amount, avatar, other }` | `getAcknowledgments` | |
| GET | `/public/otherLinks` | `other_link.GetOtherLinks` | 无 | - | `OtherLinks{ Tops, Groups, GroupMap, Links }` | `getOtherLinks` | |

---

## /public/player — 选手

| Method | Path | Handler | 鉴权 | Query / Body | Response | 前端封装 | 备注 |
|--------|------|---------|------|--------------|----------|----------|------|
| ANY | `/public/player/` | `users.Users` | 无 | `page, size, search(cube_id/en_name/name)` | `GenerallyListResp` (id, name, en_name, cube_id, wca_id, represent_name, avatar) | `apiPlayers` | maxSize=100 |
| GET | `/public/player/:cubeId` | `users.UserBaseResult` | 无 | - | `{ User, Detail, BestResults }` | `apiPlayer` | |
| GET | `/public/player/:cubeId/results` | `result.PlayerResults` | 无 | - | `{ All: []result.Results }` | `apiPlayerResults` | |
| GET | `/public/player/:cubeId/nemesis` | `result.PlayerNemesis` | 无 | Body: `Events []string`(可选) | `[]PlayerNemesis` | `apiPlayerNemesis` | |
| GET | `/public/player/:cubeId/records` | `result.PlayerRecords` | 无 | - | `[]result.Record` (按 CompId 倒序) | `apiPlayerRecords` | |
| GET | `/public/player/:cubeId/sor` | `result.PlayerSor` | 无 | Body: `Events []string`(可选) | KinCh SoR 数据 | `apiPlayerSor` | |
| GET | `/public/player/:cubeId/comps` | `result.PlayerComps` | 无 | - | `GenerallyListResp{ Items: []PlayerComp }` | `apiPlayerComps` | |

---

## /public/comps — 比赛

| Method | Path | Handler | 鉴权 | Query / Body | Response | 前端封装 | 备注 |
|--------|------|---------|------|--------------|----------|----------|------|
| ANY | `/public/comps/` | `comp.List` | 无 | `page, size, search(name/id/str_id/country/city/genre...)` | `GenerallyListResp` (status=Running) | `apiComps` | |
| GET | `/public/comps/:compId` | `comp.Comp` | 无 | - | `CompResp{ Competition, Org, Group, RegisterNum, ... }` | `apiComp` | RejectMsg 已清除 |
| GET | `/public/comps/:compId/registers` | `comp.Registers` | 无 | - | `GenerallyListResp` (status=Pass) | - | **前端未封装** |
| GET | `/public/comps/:compId/result` | `comp.Results` | 无 | - | `[]result.Results` | `apiCompResult` | |
| GET | `/public/comps/:compId/record` | `comp.Record` | 无 | - | `[]result.Record` | `apiCompRecord` | |

---

## /public/statistics — 统计

### 已实现 Handler

| Method | Path | Handler | 鉴权 | Query / Body | Response | 前端封装 | 备注 |
|--------|------|---------|------|--------------|----------|----------|------|
| ANY | `/public/statistics/best_result` | `statistics.Best` | 无 | `page, size, avg` | `{ Best map[eventID][]Results, Avg map[eventID][]Results }` | - | **前端未封装** |
| ANY | `/public/statistics/best_result/:eventId` | `statistics.Best` | 无 | `page, size, avg` | `{ BestResults, AvgResults }` (分页) | - | **前端未封装** |
| ANY | `/public/statistics/records` | `statistics.Records` | 无 | Body: `{ GroupId?, EventId? }` | `{ Records[] }` 或 `{ Best, Average }` | `apiRecords` | |
| ANY | `/public/statistics/kinch` | `statistics.KinCh` | 无 | `page, size, age, events[], country[]` | `GenerallyListResp` (KinCh SoR) | `apiKinch` | |
| ANY | `/public/statistics/kinch/senior` | `statistics.SeniorKinCh` | 无 | `page, size, age, events[], country[]` | `GenerallyListResp` (Senior KinCh) | `apiSeniorKinch` | |

### stub（路由已注册，Handler 未实现）

| Method | Path | 备注 |
|--------|------|------|
| GET | `/public/statistics/sum-of-ranks` | 排名总和榜单 |
| GET | `/public/statistics/medal-collection` | 奖牌累积榜单 |
| GET | `/public/statistics/top-n` | 项目前N历史成绩 |
| GET | `/public/statistics/record-num` | 记录数 |
| GET | `/public/statistics/comp-record-num` | 赛事打破记录数 |
| GET | `/public/statistics/record-time` | 记录保持时间 |
| GET | `/public/statistics/most-comps-num` | 选手比赛数 |
| GET | `/public/statistics/most-persons-in-comps` | 赛事人数排名 |
| GET | `/public/statistics/most-solves-by-persons` | 选手还原次数 |
| GET | `/public/statistics/most-solves-in-comps` | 赛事还原次数 |
| GET | `/public/statistics/most-personal-solves` | 选手个人还原次数 |
| GET | `/public/statistics/best-uncrowned-kings` | 无冕之王 |
| GET | `/public/statistics/best-podium-miss` | 老四之王 |
| GET | `/public/statistics/all-events` | 大满贯 |

---

## /public/algorithm — 公式

| Method | Path | Handler | 鉴权 | Query / Body | Response | 前端封装 | 备注 |
|--------|------|---------|------|--------------|----------|----------|------|
| GET | `/public/algorithm/` | `pub.AlgorithmGroups` | 无 | - | `{ CubeKeys []string, ClassMap map[string][]outputClass }` | `getAlgCubeMap` | |
| GET | `/public/algorithm/:cubeID/:classID` | `pub.AlgorithmGroupsWithCube` | 无 | - | `AlgorithmClass` | `getAlgCubeClass` | 缓存 120 分钟 |

---

## 路由计数汇总

| 分组 | 已实现 | stub | 总计 |
|------|--------|------|------|
| /public 根 | 9 | 0 | 9 |
| /public/player | 7 | 0 | 7 |
| /public/comps | 5 | 0 | 5 |
| /public/statistics（已实现） | 5 | 0 | 5 |
| /public/statistics（stub） | 0 | 14 | 14 |
| /public/algorithm | 2 | 0 | 2 |
| **总计** | **28** | **14** | **42** |
