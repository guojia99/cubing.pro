import { NavTabs } from '@/components/Tabs/nav_tabs';
import KinCh from '@/pages/Static/Kinsor';
import { BarChartOutlined, OrderedListOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from '@umijs/max';
import React, { useEffect } from 'react';
import DiyRanks from "@/pages/Static/DiyRanks";
import DiyRankView from "@/pages/Static/DiyRanks";
import Statistics from '@/pages/WCA/Statistics';

const Static: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    if (sp.get('static_tabs') === 'records') {
      navigate('/groupCompetitions/records', { replace: true });
    }
  }, [location.search, navigate]);

  const items = [
    {
      key: 'kinch_sor',
      label: 'KinCh',
      children: <KinCh isSenior={false} otherDataFn={undefined}  isCountry={false}/>,
      icon: <OrderedListOutlined />,
    },
    {
      key: 'kinch_senior_sor',
      label: 'WCA大龄KinCh',
      children: <KinCh isSenior={true} otherDataFn={undefined} isCountry={true}/>,
      icon: <OrderedListOutlined />,
    },
    {
      // todo 做成不同的key
      key: "wca_view",
      label: 'WCA成绩榜单',
      children: <DiyRankView />,
      icon: <OrderedListOutlined />,
    },
    {
      key: 'stats',
      label: '统计',
      children: <Statistics />,
      icon: <BarChartOutlined />,
    },

  ];

  return (
    <>
      <h1 style={{textAlign: "center"}}> 成绩统计 </h1>
      <NavTabs
        type="line"
        items={items}
        tabsKey="static_tabs"
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
};

export default Static;
