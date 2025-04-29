import { NavTabs } from '@/components/Tabs/nav_tabs';
import KinCh from '@/pages/Static/Kinsor';
import { OrderedListOutlined, TrophyOutlined } from '@ant-design/icons';
import React from 'react';
import Records from "@/pages/Static/Record";
import DiyRanks from "@/pages/Static/DiyRanks";
import DiyRankView from "@/pages/Static/DiyRanks";

const Static: React.FC = () => {
  const items = [
    // {
    //   key: 'best',
    //   label: '最佳成绩',
    //   children: <Best />,
    //   icon: <TrophyOutlined />,
    // },
    {
      key: 'records',
      label: '记录',
      children: <Records />,
      icon: <TrophyOutlined />,
    },
    {
      key: 'kinch_sor',
      label: 'KinCh',
      children: <KinCh />,
      icon: <OrderedListOutlined />,
    },
    {
      // todo 做成不同的key
      key: "wca_view",
      label: 'WCA成绩榜单',
      children: <DiyRankView />,
      icon: <OrderedListOutlined />,
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
