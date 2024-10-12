import { Auth, hasAuth } from '@/pages/User/AuthComponents';
import { history, useModel } from '@@/exports';
import { Link } from '@umijs/max';
import { Card, Col, Row, message } from 'antd';
import Meta from 'antd/es/card/Meta';
import React from 'react';
import {FcAddDatabase, FcFinePrint, FcGenealogy, FcLineChart, FcList, FcOrgUnit, FcReddit} from 'react-icons/fc';


export const MetaCards = (groups: any) => {
  let bodys: JSX.Element[] = [];
  for (let i = 0; i < groups.length; i++) {
    let body: JSX.Element[] = [];
    for (let j = 0; j < groups[i].children.length; j++) {
      let data = groups[i].children[j];
      body.push(
        <>
          <Col span={8} style={{ marginTop: 16 }}>
            <Link to={data.to}>
              <Card type="inner" bordered={true}>
                <Meta avatar={data.avatar} title={data.title} description={data.description} />
              </Card>
            </Link>
          </Col>
        </>,
      );
    }

    bodys.push(
      <>
        <Card title={groups[i].title} style={{ marginBottom: 16 }}>
          <Row gutter={16}>{body}</Row>
        </Card>
      </>,
    );
  }
  return bodys
}


const Organizers: React.FC = () => {
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
  if (!hasAuth(user.data.Auth, Auth.AuthOrganizers)) {
    return <>无权限</>; // todo 未来设计一个页面
  }

  let groups = [
    {
      title: '主办管理',
      children: [
        {
          title: '主办团队',
          description: '主办列表',
          to: '/',
          avatar: <FcGenealogy style={{fontSize: 40}}/>,
        },
        {
          title: '群组管理',
          description: '管理你的群组、QQ群等设置',
          to: '/',
          avatar: <FcOrgUnit style={{fontSize: 40}}/>,
        },
        {
          title: '机器人设置',
          description: '自定义你的机器人',
          to: '/',
          avatar: <FcReddit style={{fontSize: 40}}/>,
        },
      ],
    },
    {
      title: '比赛管理',
      children: [
        {
          title: '比赛列表',
          description: '展示你的比赛列表，进行操作等',
          to: '/user/organizers/comps',
          avatar:<FcList style={{fontSize: 40}}/>,
        },
        {
          title: '创建比赛',
          description: '新建一个比赛',
          to: '/user/organizers/comps/create',
          avatar: <FcAddDatabase style={{fontSize: 40}}/>,
        },
        {
          title: '成绩录入',
          description: '录入一个新成绩',
          to: '/', // todo
          avatar: <FcLineChart style={{fontSize: 40}}/>,
        },
        {
          title: '成绩审批',
          description: '审批你群组的成绩',
          to: '/', // todo
          avatar: <FcFinePrint style={{fontSize: 40}}/>,
        },
      ],
    },
  ];



  return <>{MetaCards(groups)}</>;
};

export default Organizers;
