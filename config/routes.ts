﻿/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {path: '/welcome',component: './Welcome',},
  {path: '/', redirect: '/welcome',},
  {path: '*', component: './404',},

  {path: 'settings', component: './Settings'},

  // 标题主页栏
  {name: '统计', path: '/static', component: './Static/Static'},
  {name: "项目", path: "/events", component: "./Events/Events"},

  // 用户相关

  {path: '/login', component: "./User/Login", hidden: true}, // 登录
  {path: '/register', component: "./User/Register", hidden: true}, // 注册
  {path: '/user/profile', component: './User/Profile'}, // 个人中心
  // {path: '/user',  component: './User/UserInfo'}, // 用户个人信息
  // {path: '/user/settings', component: './User/Settings'}, // 个人设置
  // {path: '/user/messages', component: './User/Messages'}, // 消息中心
  // {path: '/user/like', component: './User/Like'}, // 收藏
  {path: 'user/organizers', component: "./User/Organizers",},


  // 主办相关
  {path: 'user/organizers/comps', component: "./User/OrganizersComponent/OrganizersComps",}, // 比赛页面
  {path: 'user/organizers/comps/create', component: "./User/OrganizersComponent/Comps/CreateComps",}, // 创建比赛页面

  {path: 'user/organizers/details', component: "./User/OrganizersComponent/OrganizersDetails",}, // 详情
  {path: 'user/organizers/group', component: "./User/OrganizersComponent/OrganizersGroup",}, // 群组
  {path: 'user/organizers/result', component: "./User/OrganizersComponent/OrganizersResults",}, // 成绩管理


  {path: 'user/admins', component: "./User/Admin"},



  // 比赛网页
  {name: "比赛",path: "/competitions", component: "./Competition/Competitions"},
  {path: "/competition/:id", component: "./Competition/Competition"},

  // 选手
  {name:"选手", path: "/players", component: "./Player/Players" },
  {path: '/player/:id', component: './Player/Player'},
];
