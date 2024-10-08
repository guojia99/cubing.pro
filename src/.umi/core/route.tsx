// @ts-nocheck
// This file is generated by Umi automatically
// DO NOT CHANGE IT MANUALLY!
import React from 'react';

export async function getRoutes() {
  const routes = {"1":{"path":"/welcome","parentId":"ant-design-pro-layout","id":"1"},"2":{"path":"/","redirect":"/welcome","parentId":"ant-design-pro-layout","id":"2"},"3":{"path":"*","parentId":"ant-design-pro-layout","id":"3"},"4":{"path":"settings","parentId":"ant-design-pro-layout","id":"4"},"5":{"name":"统计","path":"/static","parentId":"ant-design-pro-layout","id":"5"},"6":{"name":"项目","path":"/events","parentId":"ant-design-pro-layout","id":"6"},"7":{"path":"/login","hidden":true,"parentId":"ant-design-pro-layout","id":"7"},"8":{"path":"/register","hidden":true,"parentId":"ant-design-pro-layout","id":"8"},"9":{"path":"/user/profile","parentId":"ant-design-pro-layout","id":"9"},"10":{"path":"user/organizers","parentId":"ant-design-pro-layout","id":"10"},"11":{"path":"user/admins","parentId":"ant-design-pro-layout","id":"11"},"12":{"name":"比赛","path":"/competitions","parentId":"ant-design-pro-layout","id":"12"},"13":{"path":"/competition/:id","parentId":"ant-design-pro-layout","id":"13"},"14":{"name":"选手","path":"/players","parentId":"ant-design-pro-layout","id":"14"},"15":{"path":"/player/:id","parentId":"ant-design-pro-layout","id":"15"},"ant-design-pro-layout":{"id":"ant-design-pro-layout","path":"/","isLayout":true},"umi/plugin/openapi":{"path":"/umi/plugin/openapi","id":"umi/plugin/openapi"}} as const;
  return {
    routes,
    routeComponents: {
'1': React.lazy(() => import(/* webpackChunkName: "p__Welcome" */'@/pages/Welcome.tsx')),
'2': React.lazy(() => import('./EmptyRoute')),
'3': React.lazy(() => import(/* webpackChunkName: "p__404" */'@/pages/404.tsx')),
'4': React.lazy(() => import(/* webpackChunkName: "p__Settings" */'@/pages/Settings.tsx')),
'5': React.lazy(() => import(/* webpackChunkName: "p__Static__Static" */'@/pages/Static/Static.tsx')),
'6': React.lazy(() => import(/* webpackChunkName: "p__Events__Events" */'@/pages/Events/Events.tsx')),
'7': React.lazy(() => import(/* webpackChunkName: "p__User__Login" */'@/pages/User/Login.tsx')),
'8': React.lazy(() => import(/* webpackChunkName: "p__User__Register" */'@/pages/User/Register.tsx')),
'9': React.lazy(() => import(/* webpackChunkName: "p__User__Profile" */'@/pages/User/Profile.tsx')),
'10': React.lazy(() => import(/* webpackChunkName: "p__User__Organizers" */'@/pages/User/Organizers.tsx')),
'11': React.lazy(() => import(/* webpackChunkName: "p__User__Admin" */'@/pages/User/Admin.tsx')),
'12': React.lazy(() => import(/* webpackChunkName: "p__Competition__Competitions" */'@/pages/Competition/Competitions.tsx')),
'13': React.lazy(() => import(/* webpackChunkName: "p__Competition__Competition" */'@/pages/Competition/Competition.tsx')),
'14': React.lazy(() => import(/* webpackChunkName: "p__Player__Players" */'@/pages/Player/Players.tsx')),
'15': React.lazy(() => import(/* webpackChunkName: "p__Player__Player" */'@/pages/Player/Player.tsx')),
'ant-design-pro-layout': React.lazy(() => import(/* webpackChunkName: "umi__plugin-layout__Layout" */'/home/guojia/worker/code/cube/cubing.pro/src/.umi/plugin-layout/Layout.tsx')),
'umi/plugin/openapi': React.lazy(() => import(/* webpackChunkName: "umi__plugin-openapi__openapi" */'/home/guojia/worker/code/cube/cubing.pro/src/.umi/plugin-openapi/openapi.tsx')),
},
  };
}
