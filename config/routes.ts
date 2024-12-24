/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 Auths
 * @doc https://umijs.org/docs/guides/routes
 */
// import { lazy } from 'react';
//
// const Welcome = lazy(() => import('@/pages/Welcome'));
// const Settings = lazy(() => import('@/pages/Settings'));
// const Static = lazy(() => import('@/pages/Static'));
// const Events = lazy(() => import('@/pages/Events/Events'));
//
// const Login = lazy(() => import('@/pages/Auths/Login'));
// const Register = lazy(() => import('@/pages/Auths/Register'));
// const Profile = lazy(() => import('@/pages/Auths/Profile'));
// const Organizers = lazy(() => import('@/pages/Auths/Organizers'));
// const Competitions = lazy(() => import('@/pages/Competition/Competitions'));
// const Competition = lazy(() => import('@/pages/Competition/Competition'));
// const Players = lazy(() => import('@/pages/Player/Players'));
// const Player = lazy(() => import('@/pages/Player/Player'));
//
// const OrganizersComps = lazy(() => import('@/pages/Auths/OrganizersComponent/OrganizersComps'));
// const CreateComps = lazy(() => import('@/pages/Auths/OrganizersComponent/OrganizersDetails'));
// const OrganizersGroup = lazy(() => import('@/pages/Auths/OrganizersComponent/OrganizersGroup'));
//
// const OrganizersResults = lazy(() => import('@/pages/Auths/OrganizersComponent/OrganizersResults'));
// const OrganizersList = lazy(() => import('@/pages/Auths/OrganizersComponent/OrganizersList'));
//
// const Admin = lazy(() => import('@/pages/Auths/Admin'));



const reXRoutes = () => {
  const xRoutes = [
    // 标题主页栏
    {name: '统计', path: '/static', component: './Static/Static'},
    {name: "项目", path: "/events", component: "./Events/Events"},
    // 比赛网页
    {name: "比赛",path: "/competitions", component: "./Competition/Competitions"},
    {path: "/competition/:id", component: "./Competition/Competition"},
    // 选手
    {name:"选手", path: "/players", component: "./Player/Players" },
    {path: '/player/:id', component: './Player/Player'},
  ]

  const out = []
  for (let x of xRoutes) {
    let newC = {...x}
    newC.path = "/x" + x.path
    out.push(newC)
  }
  return [...xRoutes, ...out]
}


export default [
  {path: '/welcome',component: './Welcome',},
  {path: '/', redirect: '/welcome',},
  {path: '*', component: './404',},

  {path: 'settings', component: './Settings'},



  // 用户相关
  {path: '/login', component: "./Auths/Login", hidden: true}, // 登录
  {path: '/register', component: "./Auths/Register", hidden: true}, // 注册
  {path: '/user/profile', component: './Auths/Profile'}, // 个人中心
  // {path: '/user',  component: './Auths/UserInfo'}, // 用户个人信息
  // {path: '/user/settings', component: './Auths/Settings'}, // 个人设置
  // {path: '/user/messages', component: './Auths/Messages'}, // 消息中心
  // {path: '/user/like', component: './Auths/Like'}, // 收藏
  {path: 'user/organizers', component: "./Auths/Organizers",},


  // 主办相关
  {path: 'user/organizers/comps', component: "./Auths/OrganizersComponent/OrganizersComps",}, // 比赛页面
  {path: 'user/organizers/comps/create', component: "./Auths/OrganizersComponent/CreateComps",}, // 创建比赛页面

  {path: 'user/organizers/details', component: "./Auths/OrganizersComponent/OrganizersDetails",}, // 详情
  {path: 'user/organizers/group', component: "./Auths/OrganizersComponent/OrganizersGroup",}, // 群组
  {path: 'user/organizers/result', component: "./Auths/OrganizersComponent/OrganizersResults",}, // 成绩管理
  {path: 'user/organizers/list', component: "./Auths/OrganizersComponent/OrganizersList",}, // 我的主办团队列表
  {path: 'user/organizers/:orgId/comp/:compId/result', component: './Auths/OrganizersComponent/OrganizersResults'}, // 录入成绩

  {path: 'user/admins', component: "./Auths/Admin"},
  {path: 'user/admin/users', component: './Auths/AdminComponent/Users'},

  ...reXRoutes(),
];

