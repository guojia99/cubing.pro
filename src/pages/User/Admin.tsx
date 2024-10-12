import { Auth, hasAuth } from '@/pages/User/AuthComponents';
import { MetaCards } from '@/pages/User/Organizers';
import { history, useModel } from '@@/exports';
import { message } from 'antd';
import React from 'react';
import {
  FcApprove,
  FcCollaboration,
  FcComboChart, FcConferenceCall, FcDatabase,
  FcFlowChart,
  FcGenealogy, FcList,
  FcMindMap, FcParallelTasks,
  FcServices, FcTimeline, FcTodoList,
  FcVoicePresentation
} from 'react-icons/fc';

const Admin: React.FC = () => {
  const { initialState, setInitialState } = useModel('@@initialState');

  // @ts-ignore
  const { currentUser } = initialState;

  if (currentUser === null || currentUser === undefined) {
    message.warning('请先登陆帐号后访问').then();
    history.replace({ pathname: '/login' });
    return;
  }
  // @ts-ignore
  const user = currentUser as AuthAPI.CurrentUser;
  if (!(hasAuth(user.data.Auth, Auth.AuthAdmin) || hasAuth(user.data.Auth, Auth.AuthSuperAdmin))) {
    return <>无权限</>; // todo 未来设计一个页面
  }

  let superGroups = [
    {
      title: '网站管理',
      children: [
        {
          title: '网站设置',
          description: '设置网站主页内容、网站图标、网站名等',
          to: '/',
          avatar: <FcServices style={{ fontSize: 40 }} />,
        },
        {
          title: '报表',
          description: '网站使用详细报表',
          to: '/',
          avatar: <FcComboChart style={{ fontSize: 40 }} />,
        },
        {
          title: '机器人设置',
          description: '设置机器人权限、群组使用机器人情况',
          to: '/',
          avatar: <FcMindMap style={{ fontSize: 40 }} />,
        },
        {
          title: '通知管理',
          description: '发布网站通知、修改通知等',
          to: '/',
          avatar: <FcGenealogy style={{ fontSize: 40 }} />,
        },
        {
          title: '发言管理',
          description: '处理发言、禁言等',
          to: '/',
          avatar: <FcVoicePresentation style={{ fontSize: 40 }} />,
        },
        {
          title: '话题管理',
          description: '添加和修改话题等',
          to:'/',
          avatar: <FcCollaboration style={{ fontSize: 40 }} />,
        }
      ],
    },
  ];

  let groups = [
    {
      title: '申请列表',
      children: [
        {
          title: '比赛申请',
          description: '审批比赛申请',
          to: '/',
          avatar: <FcDatabase style={{ fontSize: 40 }} />,
        },
        {
          title: '主办申请',
          description: '审批主办团队申请',
          to: '/',
          avatar: <FcApprove style={{ fontSize: 40 }} />,
        },
      ],
    },
    {
      title: '资源管理',
      children: [
        {
          title: '用户管理',
          description: '管理用户',
          to: '/',
          avatar: <FcConferenceCall style={{ fontSize: 40 }} />,
        },
        {
          title: '比赛管理',
          description: '比赛列表、详情和修改',
          to: '/',
          avatar: <FcList style={{ fontSize: 40 }} />,
        },
        {
          title: '主办管理',
          description: '主办团队管理、详情与修改',
          to: '/',
          avatar: <FcGenealogy style={{ fontSize: 40 }} />,
        },
        {
          title: '群组管理',
          description: '群组修改、权限管理等',
          to: '/',
          avatar: <FcParallelTasks style={{ fontSize: 40 }} />,
        },
        {
          title: '项目管理',
          description: '新增和管理对应项目',
          to: '/',
          avatar: <FcTimeline style={{ fontSize: 40 }} />,
        },
        {
          title: '成绩管理',
          description: '管理你的成绩',
          to: '/',
          avatar: <FcTodoList style={{ fontSize: 40 }} />,
        },
      ],
    },
  ];

  return (
    <>
      {hasAuth(user.data.Auth, Auth.AuthSuperAdmin) && MetaCards(superGroups)}
      {MetaCards(groups)}
    </>
  );
};

export default Admin;
