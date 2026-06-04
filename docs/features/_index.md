# 功能清单总表

> 粒度：`config/routes.ts` 中带 `component` 的叶子路由（含 `hidden: true`）。  
> 排序按路由表出现顺序。

| id | name | route | implType | tags | pageComponent | services | apiPaths | renderMode | detailDoc | status |
|----|------|-------|----------|------|---------------|----------|----------|------------|-----------|--------|
| welcome | 欢迎页 | `/welcome` | hybrid | | `Welcome.tsx` | `getAcknowledgments`、`apiGetWCAPersonProfile` | `/public/acknowledgments` | `client-spa` | [detail/welcome.md](detail/welcome.md) | done |
| buy-coffee | 赞助/买咖啡 | `/buy-coffee` | frontend-only | | `BuyCoffee/index.tsx` | - | - | `client-spa` | | done |
| changelog | 更新日志 | `/changelog` | frontend-only | | `Changelog/index.tsx` | - | - | `static-first` | | done |
| external-links | 外链聚合页 | `/external-links` | api-driven | | `ExternalLinks/ExternalLinksPage.tsx` | `getOtherLinks` | `/public/otherLinks` | `client-spa` | | done |
| advertisement | 广告（隐藏） | `/advertisement` | frontend-only | | `Advertisement/index.tsx` | - | - | `client-spa` | | done |
| 404 | 404 页面 | `*` | frontend-only | | `404.tsx` | - | - | `client-spa` | | done |
| settings | 设置 | `/settings` | hybrid | | `Settings.tsx` | `setUserKv`、`getToken` | `/user/kv/` | `client-spa` | | done |
| user-kv-data | 用户 KV 数据 | `/user/kv-data` | api-driven | | `UserData/PersonalKvList.tsx` | `getUserKv`、`listUserKvs` | `/user/kv` | `client-spa` | | done |
| login | WCA 登录（隐藏） | `/login` | frontend-only | `admin` | `Admin/Login.tsx` | - | - | `client-spa` | | done |
| auth-callback | WCA 回调（隐藏） | `/auth/callback` | frontend-only | | `Admin/AuthCallback.tsx` | - | - | `client-spa` | | done |
| old-login | 旧版登录（隐藏） | `/old-login` | frontend-only | | `Admin/OldLogin.tsx` | `login` | `/auth/login` | `client-spa` | | done |
| user-profile | 个人中心 | `/user/profile` | api-driven | | `Admin/Profile.tsx` | `currentUser`、`updateAvatar`、`updateDetail`、`logout` | `/auth/current`、`/auth/user/avatar`、`/auth/user/detail`、`/auth/logout` | `client-spa` | | done |
| admin-organizers | 主办团队首页 | `/admin/organizers` | frontend-only | `admin` | `Admin/Organizers.tsx` | - | - | `client-spa` | | done |
| admin-organizers-comps | 比赛列表（主办） | `/admin/organizers/comps` | api-driven | `admin` | `Admin/OrganizersComponent/OrganizersComps.tsx` | `apiGetComps` | `/organizers/{orgID}/comp/` | `client-spa` | | done |
| admin-organizers-create | 创建比赛 | `/admin/organizers/comps/create` | api-driven | `admin` | `Admin/OrganizersComponent/CreateComps.tsx` | `apiOrganizers`、`apiCreateComps` | `/organizers/{orgId}`、`/organizers/{orgID}/comp/` | `client-spa` | | done |
| admin-organizers-details | 比赛详情（主办，占位） | `/admin/organizers/details` | frontend-only | `admin` | `Admin/OrganizersComponent/OrganizersDetails.tsx` | - | - | `client-spa` | [detail/admin-organizers-details.md](detail/admin-organizers-details.md) | done |
| admin-organizers-group | 群组管理（主办） | `/admin/organizers/group` | api-driven | `admin` | `Admin/OrganizersComponent/OrganizersGroup.tsx` | `apiOrganizers`、`apiGetGroups` | `/organizers/{orgId}`、`/organizers/{orgID}/groups` | `client-spa` | | done |
| admin-organizers-result | 成绩管理（主办） | `/admin/organizers/result` | api-driven | `admin` | `Admin/OrganizersComponent/OrganizersResults.tsx` | 见 [admin-organizers-result](detail/admin-organizers-result.md) | `/organizers/{orgId}/comp/{compId}/*` | `client-spa` | [detail/admin-organizers-result.md](detail/admin-organizers-result.md) | done |
| admin-organizers-list | 主办团队列表 | `/admin/organizers/list` | api-driven | `admin` | `Admin/OrganizersComponent/OrganizersList.tsx` | `apiMeOrganizers` | `/organizers/me` | `client-spa` | | done |
| admin-organizers-comp-result | 录入成绩 | `/admin/organizers/:orgId/comp/:compId/result` | api-driven | `admin` | `Admin/OrganizersComponent/OrganizersResults.tsx` | 同 admin-organizers-result | `/organizers/{orgId}/comp/{compId}/*` | `client-spa` | [detail/admin-organizers-result.md](detail/admin-organizers-result.md) | done |
| admin-admins | 后台管理首页 | `/admin/admins` | frontend-only | `admin` | `Admin/Admin.tsx` | - | - | `client-spa` | | done |
| admin-users | 用户管理 | `/admin/users` | api-driven | `admin` | `Admin/AdminComponent/Users.tsx` | `apiAdminPlayers`、`apiAdminCreatePlayer`、`apiAdminUpdatePlayerName`、`apiAdminUpdatePlayerWCAID`、`apiUpdatePlayerAuth`、`apiMergePlayers` | `/admin/users/`、`/admin/users/create_user`、`/admin/users/update_user_name`、`/admin/users/update_wca_id`、`/admin/users/update_auth`、`/admin/users/merge_user` | `client-spa` | | done |
| admin-manage-organizers | 管理主办团队 | `/admin/manage/organizers` | api-driven | `admin` | `Admin/AdminComponent/AdminOrganizers.tsx` | `apiAdminOrganizersList`、`apiAdminCreateOrganizer`、`apiAdminGetOrganizer`、`apiAdminUpdateOrganizer`、`apiAdminDeleteOrganizer`、`apiAdminOrganizerGroups`、`apiAdminCreateGroup`、`apiAdminUpdateGroup`、`apiAdminDeleteGroup`、`apiAdminAddOrganizerMember`、`apiAdminRemoveOrganizerMember` | `/admin/competition/organizers/*` | `client-spa` | | done |
| admin-manage-groups | 管理赛事群组 | `/admin/manage/groups` | api-driven | `admin` | `Admin/AdminComponent/AdminCompetitionGroups.tsx` | 同上 | `/admin/competition/organizers/*/groups` | `client-spa` | | done |
| admin-diy-ranking | DIY 榜单管理 | `/admin/diy-ranking` | api-driven | `admin` | `Admin/AdminComponent/DiyRanking.tsx` | `apiGetAllDiyRankingKey`、`apiDiyRanking`、`apiDiyRankingPersons`、`apiCreateRanking`、`apiUpdateRankingWithKey` | `/diy_static/diy_rankings`、`/diy_static/diy_rankings/{key}` | `client-spa` | | done |
| admin-acknowledgments | 致谢管理 | `/admin/acknowledgments` | api-driven | `admin` | `Admin/AdminComponent/AdminAcknowledgments.tsx` | `getAcknowledgmentsWithAdmin`、`setAcknowledgmentsWithAdmin`、`getAcknowledgments` | `/admin/system_result/acknowledgments`、`/public/acknowledgments` | `client-spa` | | done |
| admin-other-links | 外链管理 | `/admin/other-links` | api-driven | `admin` | `Admin/AdminComponent/AdminExternalLinks.tsx` | `getOtherLinksWithAdmin`、`setOtherLinksWithAdmin`、`getOtherLinks` | `/admin/system_result/otherLinks`、`/public/otherLinks` | `client-spa` | | done |
| admin-sports | 体育赛事配置 | `/admin/sports` | api-driven | `admin` | `Admin/SportsComponents/Sports.tsx` | `apiGetSportResults`、`apiDeleteSportResult` | `/sports/admin/results` | `client-spa` | | done |
| admin-sports-events | 体育项目配置 | `/admin/sports/events` | api-driven | `admin` | `Admin/SportsComponents/Events.tsx` | `apiGetSportEvents`、`apiCreateSportEvent`、`apiDeleteSportEvent` | `/sports/admin/events` | `client-spa` | | done |
| algs-list | 公式列表 | `/algs` | frontend-heavy | | `Algs/AlgsList.tsx` | `getAlgCubeMap` | `/public/algorithm/` | `client-spa` | | done |
| algs-detail | 公式详情 | `/algs/:cube/:class` | hybrid | | `Algs/AlgsDetail.tsx` | `getAlgCubeClass` | `/public/algorithm/{cube}/{classID}` | `client-spa` | [detail/algs.md](detail/algs.md) | done |
| recipes | 菜谱列表 | `/other/recipes` | frontend-only | | `Recipes/RecipeList.tsx` | - | - | `static-first` | | done |
| recipe-detail | 菜谱详情 | `/other/recipes/:category/:id` | frontend-only | | `Recipes/RecipeDetail.tsx` | - | - | `static-first` | | done |
| kitchen-skills | 厨房技巧列表 | `/other/kitchen-skills` | frontend-only | | `KitchenSkills/KitchenSkillList.tsx` | - | - | `static-first` | | done |
| kitchen-skill-detail | 厨房技巧详情 | `/other/kitchen-skills/:category/:id` | frontend-only | | `KitchenSkills/KitchenSkillDetail.tsx` | - | - | `static-first` | | done |
| cocktails | 鸡尾酒列表 | `/other/cocktails` | frontend-only | | `Cocktails/CocktailList.tsx` | - | - | `static-first` | | done |
| cocktail-detail | 鸡尾酒详情 | `/other/cocktails/:slug` | frontend-only | | `Cocktails/CocktailDetail.tsx` | - | - | `static-first` | | done |
| tool-bld-d | BLD 德语记忆法 | `/tools/bld-d` | frontend-only | `tool` | `Tools/Bld/BldMeor.tsx` | - | - | `client-spa` | | done |
| tool-bld-pingyin | BLD 拼音记忆法 | `/tools/bld-pingyin` | frontend-only | `tool` | `Tools/Bld/BldPingYin.tsx` | - | - | `client-spa` | | done |
| tool-associative-words | BLD 联想词 | `/tools/associative-words` | frontend-only | `tool` | `Tools/Bld/Bld_Associative_Words.tsx` | - | - | `client-spa` | | done |
| tool-mbld-d | MBLD 记忆法 | `/tools/mbld-d` | frontend-only | `tool` | `Tools/Bld/MBld.tsx` | - | - | `client-spa` | | done |
| tool-team-match | 团体赛对阵 | `/tools/team-match` | hybrid | `tool` | `Tools/TeamMatch/TeamMatch.tsx` | `apiGetWCAPersonProfile`、`apiGetCubingChinaPerson`（外部 fetch） | -（外部 API） | `client-spa` | [detail/team-match.md](detail/team-match.md) | done |
| draw-sq1 | SQ1 打图 | `/draw-tools/sq1-d` | frontend-only | `tool` | `Tools/Draws/SQ1Draw.tsx` | - | - | `client-spa` | | done |
| draw-minx | 五魔方打图 | `/draw-tools/minx-d` | frontend-only | `tool` | `Tools/Draws/MinxDraw.tsx` | - | - | `client-spa` | | done |
| draw-sk | Skewb 打图 | `/draw-tools/sk-d` | frontend-only | `tool` | `Tools/Draws/SkDraw.tsx` | - | - | `client-spa` | | done |
| draw-py | Pyraminx 打图 | `/draw-tools/py-d` | frontend-only | `tool` | `Tools/Draws/PyDraw.tsx` | - | - | `client-spa` | | done |
| test | 测试页面 | `/test` | frontend-only | | `Tests/Test.tsx` | - | - | `client-spa` | | done |
| wca-comps | WCA 赛事列表 | `/wca/wca-comps` | api-driven | `wca` | `Tools/Comps/WCAComps.tsx` | -（直接 fetch WCA 官方 API） | `worldcubeassociation.org/api/v0/competition_index` | `client-spa` | | done |
| wca-player | WCA 选手页 | `/wca/player/:wcaId` | api-driven | `wca` | `WCA/Player.tsx` | `getWCAPersonProfile`、`getWCAPersonResults`、`getWCAPersonCompetitions`、`GetPlayerRankTimers`、`apiGetWCAPersonProfile` | `/wca/player/{wcaID}`、`/wca/player/{wcaID}/results`、`/wca/player/{wcaID}/competitions`、`/wca/player/{personID}/rank_timers` | `client-spa` | | done |
| wca-players | WCA 选手搜索 | `/wca/players` | api-driven | `wca` | `WCA/Players.tsx` | `getWCAPersons` | `/wca/players/{query}` | `client-spa` | | done |
| wca-proportion-estimation | 成绩比例拟合 | `/wca/proportion-estimation` | api-driven | `wca` | `WCA/ProportionEstimation.tsx` | `getResultProportionEstimation` | `/wca/extend/resultProportionEstimation` | `client-spa` | | done |
| wca-statistics | WCA 统计榜单 | `/wca/statistics` | api-driven | `wca` | `WCA/Statistics/index.tsx` | `GetEventRankTimers`、`GetEventRankWithFullNow`、`GetEventRankWithOnlyYear`、`GetStaticSuccessRateResult`、`GetAllEventsAchievement`、`GetAllEventChampionshipsPodium`、`GetRankWithDiyEvents`、`GetNotPodiumRankWithDiyEvents`、`GetRankWithStartCompYear`、`CountryList` | `/wca/ranks/*`、`/wca/grand-slam`、`/wca/country` | `tab-shell` | [detail/wca-statistics.md](detail/wca-statistics.md) | done |
| competition-detail | 赛事详情 | `/competition/:id` | hybrid | | `Competition/Competition.tsx` | `apiComp`、`apiEvents`（打乱 Tab） | `/public/comps/{id}`、`/public/events` | `tab-shell` | [detail/competition-scrambles.md](detail/competition-scrambles.md)（含 [group-timer](detail/competition-group-timer.md)） | done |
| player-detail | 站内选手详情 | `/player/:id` | api-driven | | `Player/Player.tsx` | `apiPlayer` | `/public/player/{cubeID}` | `client-spa` | | done |
| gc-static | 排行/静态 | `/group-competitions/static` | api-driven | | `Static/Static.tsx`（委托子组件） | `apiKinch`、`apiSeniorKinch`、`apiDiyRanking`、`apiGetAllDiyRankingKey`；`stats` Tab 见 `wca-statistics` | `/public/statistics/kinch`、`/diy_static/diy_rankings`、`/wca/ranks/*` | `tab-shell` | [detail/gc-static.md](detail/gc-static.md) | done |
| gc-records | 纪录 | `/group-competitions/records` | api-driven | | `Static/Record.tsx` | `apiRecords`、`apiEvents`、`apiPublicCompGroups` | `/public/statistics/records`、`/public/events`、`/public/comp_groups` | `client-spa` | | done |
| gc-events | 项目页 | `/group-competitions/events` | api-driven | | `Events/Events.tsx` | `apiEvents` | `/public/events` | `client-spa` | | done |
| gc-competitions | 比赛列表 | `/group-competitions/competitions` | api-driven | | `Competition/Competitions.tsx` | `apiComps` | `/public/comps/` | `client-spa` | | done |
| gc-players | 选手列表 | `/group-competitions/players` | api-driven | | `Player/Players.tsx` | `apiPlayers` | `/public/player/` | `client-spa` | | done |
| gc-pktimer | PK 计时器 | `/group-competitions/pktimer` | api-driven | | `Static/Pktimers.tsx` | `GetPKTimer` | `/public/pkTimers` | `client-spa` | | done |
