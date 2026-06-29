# frontend-services.md

> 按 `cubing.pro/src/services/cubing-pro/` 子目录分节。  
> 每个导出函数列出签名摘要、HTTP 方法/路径、是否 AuthHeader、被哪些功能使用。

---

## request.tsx

> 核心 HTTP 客户端

| 导出 | 说明 |
|------|------|
| `getAPIUrl()` | 返回 Base URL |
| `isLocal()` | 检测本地开发环境 |
| `getApiErrorDisplayMessage(body)` | 提取错误展示文本 |
| `Request` | Axios 实例，baseURL `/v3/cube-api`，timeout 900s，响应拦截器 |

---

## auth/auth.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `captchaCode()` | GET | `/auth/code` | - | 获取验证码 |
| `login(req)` | POST | `/auth/login` | - | 登录 |
| `getEmailCode(req)` | POST | `/auth/register/email_code` | Yes | 获取邮箱验证码 |
| `refreshToken()` | POST | `/auth/refresh` | Yes | 刷新 Token |
| `logout()` | POST | `/auth/logout` | Yes | 登出 |
| `currentUser()` | GET | `/auth/current` | Yes | 当前用户信息 |
| `register(req)` | POST | `/auth/register` | - | 注册 |
| `updateAvatar(req)` | POST | `/auth/user/avatar` | Yes | 更新头像 |
| `updateDetail(req)` | POST | `/auth/user/detail` | Yes | 更新个人信息 |

---

## auth/token.ts

| 函数 | 说明 |
|------|------|
| `saveToken(token)` | 存入 localStorage |
| `getToken()` | 读取 Token |
| `removeToken()` | 清除 Token |
| `AuthHeader()` | 返回 `{ Authorization, Accept }` |
| `refreshTokenInter()` | 调用 refreshToken |
| `startTokenRefresh()` | 每 5 分钟自动刷新 |

---

## auth/admin.ts

> 需 SuperAdmin 权限

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `apiApprovalComp(compId)` | POST | `/admin/competition/approvals/{compId}/approval` | Yes | 审批比赛 |
| `apiAdminDeleteComp(compId)` | DELETE | `/admin/competition/comps/{compId}` | Yes | 删除比赛 |
| `apiAdminPlayers(req)` | POST | `/admin/users/` | Yes | 查询用户列表 |
| `apiAdminCreatePlayer(req)` | POST | `/admin/users/create_user` | Yes | 创建用户 |
| `apiAdminUpdatePlayerName(req)` | PUT | `/admin/users/update_user_name` | Yes | 更新用户名 |
| `apiAdminUpdatePlayerWCAID(req)` | PUT | `/admin/users/update_wca_id` | Yes | 更新 WCA ID |
| `apiUpdatePlayerAuth(req)` | POST | `/admin/users/update_auth` | Yes | 更新用户权限 |
| `apiMergePlayers(req)` | POST | `/admin/users/merge_user` | Yes | 合并用户 |

---

## auth/admin_organizers.ts

> 需 SuperAdmin 权限

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `apiAdminOrganizersList(params)` | GET | `/admin/competition/organizers` | Yes | 主办团队列表 |
| `apiAdminCreateOrganizer(req)` | POST | `/admin/competition/organizers` | Yes | 创建主办团队 |
| `apiAdminGetOrganizer(orgId)` | GET | `/admin/competition/organizers/{orgId}` | Yes | 获取主办详情 |
| `apiAdminUpdateOrganizer(orgId, req)` | PUT | `/admin/competition/organizers/{orgId}` | Yes | 更新主办团队 |
| `apiAdminDeleteOrganizer(orgId)` | DELETE | `/admin/competition/organizers/{orgId}` | Yes | 删除主办团队 |
| `apiAdminOrganizerGroups(orgId, params)` | GET | `/admin/competition/organizers/{orgId}/groups` | Yes | 群组列表 |
| `apiAdminCreateGroup(orgId, req)` | POST | `/admin/competition/organizers/{orgId}/groups` | Yes | 创建群组 |
| `apiAdminUpdateGroup(groupId, req)` | PUT | `/admin/competition/groups/{groupId}` | Yes | 更新群组 |
| `apiAdminDeleteGroup(groupId)` | DELETE | `/admin/competition/groups/{groupId}` | Yes | 删除群组 |
| `apiAdminAddOrganizerMember(orgId, req)` | POST | `/admin/competition/organizers/{orgId}/members` | Yes | 添加成员 |
| `apiAdminRemoveOrganizerMember(orgId, params)` | DELETE | `/admin/competition/organizers/{orgId}/members` | Yes | 移除成员 |

---

## auth/organizers.ts

> 需登录（主办权限）

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `apiMeOrganizers()` | GET | `/organizers/me` | Yes | 我的主办团队 |
| `apiOrganizers(orgId)` | GET | `/organizers/{orgId}` | Yes | 主办团队详情 |
| `apiCreateComps(orgId, req)` | POST | `/organizers/{orgID}/comp/` | Yes | 创建比赛 |
| `apiGetComps(orgId)` | GET | `/organizers/{orgID}/comp/` | Yes | 比赛列表 |
| `apiGetOrgComp(orgId, compId)` | GET | `/organizers/{orgID}/comp/{compId}` | Yes | 比赛详情 |
| `apiGetGroups(orgId)` | GET | `/organizers/{orgID}/groups` | Yes | 群组列表 |
| `apiEndComp(orgId, compId)` | POST | `/organizers/{orgId}/comp/{compId}/end` | Yes | 结束比赛 |
| `apiGetAllPlayers(orgId, compId)` | GET | `/organizers/{orgId}/comp/{compId}/all_players` | Yes | 全部选手 |
| `apiGetCompsResults(orgId, compId, eventId, round)` | GET | `/organizers/{orgId}/comp/{compId}/result` | Yes | 成绩列表 |
| `apiGetCompsResultsWithPlayer(orgId, compId, cubeId)` | GET | `/organizers/{orgId}/comp/{compId}/result` | Yes | 按选手查成绩 |
| `apiAddCompResults(orgId, compId, req)` | POST | `/organizers/{orgId}/comp/{compId}/result` | Yes | 添加成绩 |
| `apiGetCompsPreResult(orgId, compId, params)` | GET | `/organizers/{orgId}/comp/{compId}/pre_results` | Yes | 预成绩列表 |
| `apiApprovalCompsPreResult(orgId, compId, resultId, req)` | POST | `/organizers/{orgId}/comp/{compId}/pre_results/{result_id}/approval` | Yes | 审批预成绩 |
| `apiDeleteCompsResult(orgId, compId, resultId)` | DELETE | `/organizers/{orgId}/comp/{compId}/result/{result_id}` | Yes | 删除成绩 |
| `apiUpdateCompName(orgId, compId, req)` | POST | `/organizers/{orgId}/comp/{compId}/update_name` | Yes | 更新比赛名 |

---

## auth/system.ts

> 需 SuperAdmin 权限

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `getAcknowledgmentsWithAdmin()` | GET | `/admin/system_result/acknowledgments` | Yes | 获取致谢列表 |
| `setAcknowledgmentsWithAdmin(data)` | PUT | `/admin/system_result/acknowledgments` | Yes | 设置致谢列表 |
| `getOtherLinksWithAdmin()` | GET | `/admin/system_result/otherLinks` | Yes | 获取外链配置 |
| `setOtherLinksWithAdmin(data)` | PUT | `/admin/system_result/otherLinks` | Yes | 设置外链配置 |

---

## comps/

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `apiComps(req)` | POST | `/public/comps/` | - | 比赛列表查询 |
| `apiComp(id)` | GET | `/public/comps/{id}` | - | 比赛详情 |
| `apiCompRecord(id)` | GET | `/public/comps/{id}/record` | - | 比赛产生的记录 |
| `apiCompResult(id)` | GET | `/public/comps/{id}/result` | - | 比赛成绩 |

---

## players/players.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `apiPlayers(req)` | POST | `/public/player/` | - | 选手列表 |
| `apiPlayer(cubeId)` | GET | `/public/player/{cubeID}` | - | 选手基础信息 |
| `apiPlayerResults(cubeId)` | GET | `/public/player/{cubeId}/results` | - | 选手成绩 |
| `apiPlayerRecords(cubeId)` | GET | `/public/player/{cubeId}/records` | - | 选手记录 |
| `apiPlayerNemesis(cubeId)` | GET | `/public/player/{cubeId}/nemesis` | - | 选手宿敌 |
| `apiPlayerComps(cubeId)` | GET | `/public/player/{cubeId}/comps` | - | 选手参加的比赛 |
| `apiPlayerSor(cubeId)` | GET | `/public/player/{cubeId}/sor` | - | 选手统计成绩 |

---

## events/events.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `apiEvents()` | GET | `/public/events` | - | 项目列表（有极短 localStorage 缓存） |

---

## statistics/

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `apiKinch(req)` | POST | `public/statistics/kinch` | - | KinCh 排名 |
| `apiSeniorKinch(req)` | POST | `public/statistics/kinch/senior` | - | 老年魔友 KinCh |
| `apiRecords(req?)` | POST | `public/statistics/records` | - | 记录列表 |

---

## statistics/diy_ranking.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `apiDiyRanking(key)` | GET | `diy_static/diy_rankings/{key}` | - | 获取 DIY 榜数据 |
| `apiDiyRankingKinch(key, req)` | POST | `diy_static/diy_rankings/{key}/kinch` | - | DIY 榜 KinCh |
| `apiGetAllDiyRankingKey()` | GET | `diy_static/diy_rankings` | - | 全部 DIY 榜列表 |
| `apiUpdateRankingWithKey(key, req)` | POST | `diy_static/diy_rankings/{key}` | Yes | 更新 DIY 榜人员 |
| `apiCreateRanking(req)` | POST | `diy_static/diy_rankings` | Yes | 创建 DIY 榜 |
| `apiDiyRankingSor(key, req)` | POST | `diy_static/diy_rankings/{key}/sor` | - | DIY 榜 SoR |
| `apiDiyRankingPersons(key)` | GET | `diy_static/diy_rankings/{key}/person_list` | - | DIY 榜人员列表 |

---

## wca/player.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `GetPlayerRankTimers(personID)` | GET | `/wca/player/{personID}/rank_timers` | Yes | 选手排名变化 |
| `getWCAPersonProfile(wcaID)` | GET | `/wca/player/{wcaID}` | Yes | WCA 选手资料 |
| `getWCAPersonCompetitions(wcaID)` | GET | `/wca/player/{wcaID}/competitions` | Yes | 选手比赛列表 |
| `getWCAPersonResults(wcaID)` | GET | `/wca/player/{wcaID}/results` | Yes | 选手成绩 |
| `getWCAPersons(query)` | GET | `/wca/players/{query}` | Yes | WCA 选手搜索 |
| `getPersonBestRanks(wcaID)` | GET | `/wca/player/{wcaID}/best_ranks` | Yes | 最佳排名 |

---

## wca/wca_api.ts

> 直连 WCA 官方 API，不经本站后端

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `apiGetWCAPersonProfile(wcaID)` | GET | `https://www.worldcubeassociation.org/api/v0/persons/{wcaID}` | - | WCA 官方资料（含头像） |

---

## wca/static.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `GetEventRankTimers(eventID, req)` | POST | `/wca/ranks/historical/full/{eventID}` | Yes | 历史排名变化 |
| `GetEventRankWithFullNow(eventID, req)` | POST | `/wca/ranks/full/{eventID}` | Yes | 当前全排名 |
| `GetEventRankWithOnlyYear(eventID, req)` | POST | `/wca/ranks/historical/{eventID}` | Yes | 按年排名 |
| `GetRankWithStartCompYear(eventID, req)` | POST | `/wca/rank/rank-with-start-comp-year/{eventID}` | Yes | 含首赛年排名 |
| `GetStaticSuccessRateResult(eventID, req)` | POST | `/wca/ranks/success_rate/{eventID}` | Yes | 成功率排名 |
| `GetAllEventsAchievement(req)` | POST | `/wca/ranks/all-events-achiever` | Yes | 大满贯 |
| `GetRankWithDiyEvents(req)` | POST | `/wca/ranks/diy_events` | Yes | 自定义项目组合排名 |
| `GetNotPodiumRankWithDiyEvents(req)` | POST | `/wca/rank/diy_events/not_podium` | Yes | 未上台的自定义排名 |
| `GetAllEventChampionshipsPodium()` | GET | `/wca/grand-slam` | Yes | 各项目冠军领奖台 |

---

## wca/proportion_estimation.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `getResultProportionEstimation(type, wrN)` | GET | `/wca/extend/resultProportionEstimation` | - | 成绩比例拟合数据 |
| `interpolateRatioAt(...)` | - | - | - | 纯数学插值 |
| `solveBackendAnchorCs(...)` | - | - | - | 纯数学计算 |
| `impliedCentisAllEvents(...)` | - | - | - | 纯数学计算 |
| `segmentRefRangeAsAnchorCs(...)` | - | - | - | 纯数学计算 |

---

## wca/country.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `CountryList()` | GET | `/wca/country` | Yes | 国家列表（有缓存） |
| `getCachedWcaCountries()` | - | - | - | 读 localStorage 缓存，无网络 |
| `resolveWcaCountryRecord(raw, list?)` | - | - | - | 将 ISO/别名解析为 `Country` |
| `getWcaCountryLabel(raw, list?)` | - | - | - | 展示用国家/地区中文名 |

---

## wca/cubing_china_person.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `apiGetCubingChinaPerson(wcaId)` | GET | `/wca/cubing-china/person/{wcaId}` | - | CubingChina 选手页数据 |

---

## public/orgs.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `apiPublicOrganizers()` | GET | `public/orgs` | - | 公开主办团队列表 |
| `apiPublicCompGroups()` | GET | `public/comp_groups` | - | 公开赛事群组 |
| `getAcknowledgments()` | GET | `/public/acknowledgments` | - | 致谢列表 |
| `getOtherLinks()` | GET | `/public/otherLinks` | - | 外链列表 |

---

## pktimer/pktimer.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `GetPKTimer(req)` | GET | `/public/pkTimers` | - | PK 计时器列表 |

---

## algs/algs.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `getAlgCubeMap()` | GET | `/public/algorithm/` | - | 公式组总览（有缓存） |
| `getAlgCubeClass(cube, classID)` | GET | `/public/algorithm/{cube}/{classID}` | - | 指定公式分类详情（12h 缓存） |

---

## algs/（localStorage 模块，无 API）

> 以下模块纯 localStorage 操作，不调用后端

### customAlgs.ts

| 函数 | 说明 |
|------|------|
| `getCustomAlgs(algsKey)` | 获取自定义公式 |
| `saveCustomAlgs(algsKey, formulas)` | 保存自定义公式 |
| `addCustomAlg(algsKey, formula)` | 添加自定义公式 |
| `removeCustomAlg(algsKey, index)` | 删除自定义公式 |

### dailyRandomPick.ts（通过 KV 间接调用 API）

| 函数 | 说明 |
|------|------|
| `getDailyPickState()` | 获取每日随机抽题状态 |
| `saveDailyPick(picks)` | 保存抽题结果 |
| `getRemainingPicks(state)` | 计算剩余次数 |
| `clearDailyPick()` | 清空抽题状态 |

### formulaPracticeConfig.ts

| 函数 | 说明 |
|------|------|
| `getFormulaPracticeConfig(cube, classId)` | 获取练习配置 |
| `saveFormulaPracticeConfig(cube, classId, config)` | 保存练习配置 |

### formulaPracticeSelection.ts

| 函数 | 说明 |
|------|------|
| `buildGroupKey(setName, groupName)` | 构建组 key |
| `buildFormulaKey(setName, groupName, algName)` | 构建公式 key |
| `getFormulaPracticeSelection(cube, classId)` | 获取选中的公式 |
| `saveFormulaPracticeSelection(cube, classId, selection)` | 保存选中公式 |

### formulaPracticeHistory.ts

常量：`PAGE_SIZE`（历史分页大小，默认 20）

| 函数 | 说明 |
|------|------|
| `getFormulaPracticeHistory(cube, classId)` | 获取练习历史 |
| `createPracticeSession(cube, classId, params)` | 创建练习会话 |
| `getFormulaPracticeHistoryPage(cube, classId, page)` | 分页查询历史 |
| `appendFormulaPracticeRecord(...)` | 追加练习记录 |
| `deleteFormulaPracticeRecord(...)` | 删除练习记录 |
| `computeTrimmedMean(times, ratio)` | 计算截尾均值 |
| `computeAverages(records, ratio)` | 计算 ao50/ao100/ao1000 |
| `clearFormulaPracticeHistory(cube, classId)` | 清空历史 |

### formulaPracticeProficiency.ts

| 函数 | 说明 |
|------|------|
| `getFormulaProficiency(cube, classId)` | 获取熟练度 |
| `setFormulaProficiency(cube, classId, formulaKey, level)` | 设置熟练度 |
| `getProficiencyLevel(cube, classId, formulaKey)` | 获取熟练度等级 |
| `getUnskilledFormulaKeys(cube, classId)` | 获取未熟练公式 |

### formulaRandomPick.ts

| 函数 | 说明 |
|------|------|
| `getFormulaPickHistory(cube, classId)` | 获取随机抽题历史 |
| `saveFormulaPick(cube, classId, item)` | 保存抽题记录 |

### practiceConfigExport.ts

| 函数 | 说明 |
|------|------|
| `exportPracticeConfig()` | 导出练习配置为 JSON |
| `importPracticeConfig(jsonStr)` | 导入练习配置 |

---

## cubing_china/cubing.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `getCubingChinaComps()` | GET | `/wca/comps/china` | - | 中国赛事列表（有 localStorage 缓存） |
| `findCubingCompetitionByIdentifier(id)` | - | - | - | 从缓存查找赛事 |

---

## key_value/keyvalue_store.ts

> 基于 `/user/kv` 的高层封装

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `getKeyMap(key)` | GET | `/user/kv/{key}` | Yes | 获取 KV 对象 |
| `getSubKeyValue(key, subKey)` | 间接 | - | Yes | 读取子 key |
| `setSubKeyValue(key, subKey, value)` | 间接 | GET+POST `/user/kv/` | Yes | 写入子 key |
| `deleteSubKey(key, subKey)` | 间接 | GET+POST `/user/kv/` | Yes | 删除子 key |

---

## user/user_kv.ts

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `listUserKvs()` | GET | `/user/kv` | Yes | 列出 KV 元数据 |
| `getUserKv(key)` | GET | `/user/kv/{key}` | Yes | 获取 KV 值 |
| `setUserKv(req)` | POST | `/user/kv/` | Yes | 写入 KV |
| `assertPayloadWithinLimit(raw)` | - | - | - | 写入前校验 ≤ `USER_KV_MAX_BYTES` |

常量：`USER_KV_MAX_BYTES`、`USER_KV_KEYS`

---

## sports/sports.ts

> 需登录

| 函数 | Method | Path | Auth | 说明 |
|------|--------|------|------|------|
| `apiGetSportResults(params)` | GET | `/sports/admin/results` | Yes | 体育赛事成绩 |
| `apiCreateSportResult(req)` | POST | `/sports/admin/results` | Yes | 创建成绩 |
| `apiDeleteSportResult(id)` | DELETE | `/sports/admin/results/{id}` | Yes | 删除成绩 |
| `apiGetSportEvents()` | GET | `/sports/admin/events` | Yes | 项目列表 |
| `apiCreateSportEvent(req)` | POST | `/sports/admin/events` | Yes | 创建项目 |
| `apiDeleteSportEvent(id)` | DELETE | `/sports/admin/events/{id}` | Yes | 删除项目 |

---

## otherLinksNormalize.ts

> 纯函数，无 API

| 函数 | 说明 |
|------|------|
| `emptyOtherLinks()` | 返回空 OtherLinks 结构 |
| `sanitizeOtherLinks(data)` | 清洗外链数据 |
| `unwrapOtherLinks(data)` | 解包外链数据（兼容数组） |

---

## index.ts

聚合导出 `{ auth, comps }`，实际业务多按子路径直接 import。
