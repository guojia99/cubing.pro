# pages — 后台管理（Admin）

> 路径：`cubing.pro/src/pages/Admin/`

## 目录树

```
Admin/
├── Login.tsx                        # WCA OAuth 登录页
├── AuthCallback.tsx                 # WCA 回调处理
├── OldLogin.tsx                     # 旧版登录（已隐藏）
├── Profile.tsx                      # 个人中心
├── AvatarDropdown.tsx                # 头像下拉菜单（导出 AvatarDropdown/AvatarName）
├── Admin.tsx                        # 后台导航首页
├── Organizers.tsx                   # 主办导航首页
├── OrganizersComponent/
│   ├── OrganizersComps.tsx          # 主办 - 比赛列表
│   ├── CreateComps.tsx              # 主办 - 创建比赛
│   ├── OrganizersDetails.tsx        # 主办 - 占位（空组件，见 detail/admin-organizers-details.md）
│   ├── OrganizersGroup.tsx          # 主办 - 群组管理
│   ├── OrganizersResults.tsx        # 主办 - 成绩录入
│   └── OrganizersList.tsx           # 主办 - 我的团队
├── AdminComponent/
│   ├── Users.tsx                    # 用户管理
│   ├── AdminOrganizers.tsx          # 管理主办团队
│   ├── AdminCompetitionGroups.tsx    # 管理赛事群组
│   ├── DiyRanking.tsx              # DIY 榜单管理
│   ├── AdminAcknowledgments.tsx     # 致谢管理
│   └── AdminExternalLinks.tsx       # 外链管理
└── SportsComponents/
    ├── Sports.tsx                    # 体育赛事成绩
    └── Events.tsx                   # 体育项目管理
```

## 功能职责

| 组件 | 路由 | implType | services |
|------|------|----------|----------|
| `Login.tsx` | `/login` | frontend-only | WCA OAuth 跳转 |
| `AuthCallback.tsx` | `/auth/callback` | frontend-only | 读取 URL 参数 → 跳转 |
| `Profile.tsx` | `/user/profile` | api-driven | `currentUser`、`updateAvatar`、`updateDetail`、`logout` |
| `Admin.tsx` | `/admin/admins` | frontend-only | 导航卡片 |
| `Organizers.tsx` | `/admin/organizers` | frontend-only | 导航卡片 |
| `OrganizersComps.tsx` | `/admin/organizers/comps` | api-driven | `apiGetComps` |
| `CreateComps.tsx` | `/admin/organizers/comps/create` | api-driven | `apiOrganizers`、`apiCreateComps` |
| `OrganizersDetails.tsx` | `/admin/organizers/details` | frontend-only | 无（占位） |
| `OrganizersResults.tsx` | `/admin/organizers/:orgId/comp/:compId/result` 等 | api-driven | 见 [admin-organizers-result.md](../features/detail/admin-organizers-result.md) |
| `OrganizersGroup.tsx` | `/admin/organizers/group` | api-driven | `apiOrganizers`、`apiGetGroups` |
| `OrganizersList.tsx` | `/admin/organizers/list` | api-driven | `apiMeOrganizers` |
| `Users.tsx` | `/admin/users` | api-driven | 7 个 admin service 函数 |
| `AdminOrganizers.tsx` | `/admin/manage/organizers` | api-driven | 11 个 admin_organizers 函数 |
| `AdminCompetitionGroups.tsx` | `/admin/manage/groups` | api-driven | admin_organizers 函数 |
| `DiyRanking.tsx` | `/admin/diy-ranking` | api-driven | diy_ranking 函数 |
| `AdminAcknowledgments.tsx` | `/admin/acknowledgments` | api-driven | `getAcknowledgmentsWithAdmin`、`setAcknowledgmentsWithAdmin` |
| `AdminExternalLinks.tsx` | `/admin/other-links` | api-driven | `getOtherLinksWithAdmin`、`setOtherLinksWithAdmin` |
| `Sports.tsx` | `/admin/sports` | api-driven | `apiGetSportResults`、`apiDeleteSportResult` |
| `Events.tsx` | `/admin/sports/events` | api-driven | `apiGetSportEvents`、`apiCreateSportEvent`、`apiDeleteSportEvent` |

## 功能详述

| 主题 | 文档 |
|------|------|
| 主办详情占位路由 | [features/detail/admin-organizers-details.md](../features/detail/admin-organizers-details.md) |
| 成绩录入 / 预成绩 | [features/detail/admin-organizers-result.md](../features/detail/admin-organizers-result.md) |
