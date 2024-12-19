import Pagination from '@/components/Buttons/pagination_button';
import { P404 } from '@/components/Status/404';
import { NavTabs } from '@/components/Tabs/nav_tabs';
import UpdateTitle from '@/components/Title/Title';
import { IfLoading } from '@/components/Wait/wait';

import { apiComp } from '@/services/cubing-pro/comps/comp';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { useParams } from '@@/exports';
import { BuildOutlined, ProductOutlined, ProfileOutlined, TableOutlined } from '@ant-design/icons';
import React, { lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CompetitionDetail = lazy(
  () => import('@/pages/Competition/CompetitionComponents/CompetitionDetail'),
);
const CompetitionRegulations = lazy(
  () => import('@/pages/Competition/CompetitionComponents/CompetitionRegulations'),
);
const CompetitionResults = lazy(
  () => import('@/pages/Competition/CompetitionComponents/CompetitionResults'),
);

const Competition: React.FC = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [is404, setIs404] = useState(false);
  const [comp, setComp] = useState<CompAPI.CompResp>();

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: IfLoading(loading, <CompetitionDetail comp={comp} />),
      icon: <ProductOutlined />,
    },
    // {
    //   key: "schedule",
    //   label: "赛程",
    //   children: IfLoading(loading, <CompetitionSchedule comp={comp}/>),
    //   icon: <InsertRowAboveOutlined/>
    // },
    // {
    //   key: "competitors",
    //   label: "选手",
    //   children: IfLoading(loading, <CompetitionCompetitors comp={comp}/>),
    //   icon: <SolutionOutlined/>,
    // },
    {
      key: 'regulations',
      label: '规则',
      children: IfLoading(loading, <CompetitionRegulations comp={comp} />),
      icon: <ProfileOutlined />,
    },
    // {
    //   key: "registration",
    //   label: "报名",
    //   children: IfLoading(loading, <CompetitionRegistration comp={comp}/>),
    //   icon: <UserAddOutlined/>
    // },
    {
      key: 'results',
      label: '赛果',
      children: IfLoading(loading, <CompetitionResults comp={comp} />),
      icon: <TableOutlined />,
    },
    {
      key: 'scrambles',
      label: '打乱',
      children: <>打乱</>,
      icon: <BuildOutlined />,
    },
  ];

  const fetchComp = () => {
    if (id === undefined) {
      return;
    }
    apiComp(id)
      .then((value) => {
        setComp(value);
        setLoading(false);
      })
      .catch(() => {
        setIs404(true);
      });
  };

  // 动态加载数据
  useEffect(() => {
    fetchComp();
  }, [id]); // useParams中的id改变时重新调用fetchComp

  let Latest: JSX.Element | null = null;
  let Earliest: JSX.Element | null = null;

  const searchParams = new URLSearchParams(location.search);

  if (comp?.data.EarliestID !== 0) {
    Earliest = (
      <Link to={'/competition/' + comp?.data.EarliestID + '?' + searchParams.toString()}>
        {'<'} {comp?.data.EarliestName}{' '}
      </Link>
    );
  }
  if (comp?.data.LatestID !== 0) {
    Latest = (
      <Link to={'/competition/' + comp?.data.LatestID + '?' + searchParams.toString()}>
        {' '}
        {comp?.data.LatestName} {'>'}
      </Link>
    );
  }

  const tabs = (
    <>
      {/*</Watermark>*/}
      <h1 style={{ textAlign: 'center' }}>{comp ? comp.data.Name : '比赛加载中'}</h1>
      {IfLoading(loading, <UpdateTitle title={comp?.data.Name} />)}
      <NavTabs
        type="line"
        items={items}
        tabsKey="comps_tabs"
        // style={{ minHeight: '100vh' }}
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
      <Pagination Latest={Latest} Earliest={Earliest} />
    </>
  );

  // todo 一段时间没有的话需要报404
  return (
    <>
      {is404 && P404('比赛不存在')}
      {!is404 && tabs}
    </>
  );
};

export default Competition;
