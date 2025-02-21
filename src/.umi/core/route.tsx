// @ts-nocheck
// This file is generated by Umi automatically
// DO NOT CHANGE IT MANUALLY!
import React from 'react';

export async function getRoutes() {
  const routes = {"1":{"path":"/welcome","parentId":"ant-design-pro-layout","id":"1"},"2":{"path":"/","redirect":"/welcome","parentId":"ant-design-pro-layout","id":"2"},"3":{"path":"*","parentId":"ant-design-pro-layout","id":"3"},"4":{"path":"settings","parentId":"ant-design-pro-layout","id":"4"},"5":{"path":"/login","hidden":true,"parentId":"ant-design-pro-layout","id":"5"},"6":{"path":"/register","hidden":true,"parentId":"ant-design-pro-layout","id":"6"},"7":{"path":"/user/profile","parentId":"ant-design-pro-layout","id":"7"},"8":{"path":"user/organizers","parentId":"ant-design-pro-layout","id":"8"},"9":{"path":"user/organizers/comps","parentId":"ant-design-pro-layout","id":"9"},"10":{"path":"user/organizers/comps/create","parentId":"ant-design-pro-layout","id":"10"},"11":{"path":"user/organizers/details","parentId":"ant-design-pro-layout","id":"11"},"12":{"path":"user/organizers/group","parentId":"ant-design-pro-layout","id":"12"},"13":{"path":"user/organizers/result","parentId":"ant-design-pro-layout","id":"13"},"14":{"path":"user/organizers/list","parentId":"ant-design-pro-layout","id":"14"},"15":{"path":"user/organizers/:orgId/comp/:compId/result","parentId":"ant-design-pro-layout","id":"15"},"16":{"path":"user/admins","parentId":"ant-design-pro-layout","id":"16"},"17":{"path":"user/admin/users","parentId":"ant-design-pro-layout","id":"17"},"18":{"path":"tools","name":"工具","parentId":"ant-design-pro-layout","id":"18"},"19":{"path":"sq1-d","name":"SQ1绘图工具","parentId":"18","id":"19"},"20":{"path":"minx-d","name":"Minx绘图工具","parentId":"18","id":"20"},"21":{"path":"sk-d","name":"Sk绘图工具","parentId":"18","id":"21"},"22":{"name":"统计","path":"/static","parentId":"ant-design-pro-layout","id":"22"},"23":{"name":"项目","path":"/events","parentId":"ant-design-pro-layout","id":"23"},"24":{"name":"比赛","path":"/competitions","parentId":"ant-design-pro-layout","id":"24"},"25":{"path":"/competition/:id","parentId":"ant-design-pro-layout","id":"25"},"26":{"name":"选手","path":"/players","parentId":"ant-design-pro-layout","id":"26"},"27":{"path":"/player/:id","parentId":"ant-design-pro-layout","id":"27"},"28":{"name":"","path":"/x/static","parentId":"ant-design-pro-layout","id":"28"},"29":{"name":"","path":"/x/events","parentId":"ant-design-pro-layout","id":"29"},"30":{"name":"","path":"/x/competitions","parentId":"ant-design-pro-layout","id":"30"},"31":{"path":"/x/competition/:id","name":"","parentId":"ant-design-pro-layout","id":"31"},"32":{"name":"","path":"/x/players","parentId":"ant-design-pro-layout","id":"32"},"33":{"path":"/x/player/:id","name":"","parentId":"ant-design-pro-layout","id":"33"},"ant-design-pro-layout":{"id":"ant-design-pro-layout","path":"/","isLayout":true},"umi/plugin/openapi":{"path":"/umi/plugin/openapi","id":"umi/plugin/openapi"}} as const;
  return {
    routes,
    routeComponents: {
'1': React.lazy(() => import(/* webpackChunkName: "p__Welcome" */'@/pages/Welcome.tsx')),
'2': React.lazy(() => import('./EmptyRoute')),
'3': React.lazy(() => import(/* webpackChunkName: "p__404" */'@/pages/404.tsx')),
'4': React.lazy(() => import(/* webpackChunkName: "p__Settings" */'@/pages/Settings.tsx')),
'5': React.lazy(() => import(/* webpackChunkName: "p__Auths__Login" */'@/pages/Auths/Login.tsx')),
'6': React.lazy(() => import(/* webpackChunkName: "p__Auths__Register" */'@/pages/Auths/Register.tsx')),
'7': React.lazy(() => import(/* webpackChunkName: "p__Auths__Profile" */'@/pages/Auths/Profile.tsx')),
'8': React.lazy(() => import(/* webpackChunkName: "p__Auths__Organizers" */'@/pages/Auths/Organizers.tsx')),
'9': React.lazy(() => import(/* webpackChunkName: "p__Auths__OrganizersComponent__OrganizersComps" */'@/pages/Auths/OrganizersComponent/OrganizersComps.tsx')),
'10': React.lazy(() => import(/* webpackChunkName: "p__Auths__OrganizersComponent__CreateComps" */'@/pages/Auths/OrganizersComponent/CreateComps.tsx')),
'11': React.lazy(() => import(/* webpackChunkName: "p__Auths__OrganizersComponent__OrganizersDetails" */'@/pages/Auths/OrganizersComponent/OrganizersDetails.tsx')),
'12': React.lazy(() => import(/* webpackChunkName: "p__Auths__OrganizersComponent__OrganizersGroup" */'@/pages/Auths/OrganizersComponent/OrganizersGroup.tsx')),
'13': React.lazy(() => import(/* webpackChunkName: "p__Auths__OrganizersComponent__OrganizersResults" */'@/pages/Auths/OrganizersComponent/OrganizersResults.tsx')),
'14': React.lazy(() => import(/* webpackChunkName: "p__Auths__OrganizersComponent__OrganizersList" */'@/pages/Auths/OrganizersComponent/OrganizersList.tsx')),
'15': React.lazy(() => import(/* webpackChunkName: "p__Auths__OrganizersComponent__OrganizersResults" */'@/pages/Auths/OrganizersComponent/OrganizersResults.tsx')),
'16': React.lazy(() => import(/* webpackChunkName: "p__Auths__Admin" */'@/pages/Auths/Admin.tsx')),
'17': React.lazy(() => import(/* webpackChunkName: "p__Auths__AdminComponent__Users" */'@/pages/Auths/AdminComponent/Users.tsx')),
'18': React.lazy(() => import('./EmptyRoute')),
'19': React.lazy(() => import(/* webpackChunkName: "p__Tools__SQ1Draw" */'@/pages/Tools/SQ1Draw.tsx')),
'20': React.lazy(() => import(/* webpackChunkName: "p__Tools__MinxDraw" */'@/pages/Tools/MinxDraw.tsx')),
'21': React.lazy(() => import(/* webpackChunkName: "p__Tools__SkDraw" */'@/pages/Tools/SkDraw.tsx')),
'22': React.lazy(() => import(/* webpackChunkName: "p__Static__Static" */'@/pages/Static/Static.tsx')),
'23': React.lazy(() => import(/* webpackChunkName: "p__Events__Events" */'@/pages/Events/Events.tsx')),
'24': React.lazy(() => import(/* webpackChunkName: "p__Competition__Competitions" */'@/pages/Competition/Competitions.tsx')),
'25': React.lazy(() => import(/* webpackChunkName: "p__Competition__Competition" */'@/pages/Competition/Competition.tsx')),
'26': React.lazy(() => import(/* webpackChunkName: "p__Player__Players" */'@/pages/Player/Players.tsx')),
'27': React.lazy(() => import(/* webpackChunkName: "p__Player__Player" */'@/pages/Player/Player.tsx')),
'28': React.lazy(() => import(/* webpackChunkName: "p__Static__Static" */'@/pages/Static/Static.tsx')),
'29': React.lazy(() => import(/* webpackChunkName: "p__Events__Events" */'@/pages/Events/Events.tsx')),
'30': React.lazy(() => import(/* webpackChunkName: "p__Competition__Competitions" */'@/pages/Competition/Competitions.tsx')),
'31': React.lazy(() => import(/* webpackChunkName: "p__Competition__Competition" */'@/pages/Competition/Competition.tsx')),
'32': React.lazy(() => import(/* webpackChunkName: "p__Player__Players" */'@/pages/Player/Players.tsx')),
'33': React.lazy(() => import(/* webpackChunkName: "p__Player__Player" */'@/pages/Player/Player.tsx')),
'ant-design-pro-layout': React.lazy(() => import(/* webpackChunkName: "umi__plugin-layout__Layout" */'/home/guojia/worker/code/cube/cubing.pro/src/.umi/plugin-layout/Layout.tsx')),
'umi/plugin/openapi': React.lazy(() => import(/* webpackChunkName: "umi__plugin-openapi__openapi" */'/home/guojia/worker/code/cube/cubing.pro/src/.umi/plugin-openapi/openapi.tsx')),
},
  };
}
