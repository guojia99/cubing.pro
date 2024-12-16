import { NavTabs } from '@/components/Tabs/nav_tabs';
import KinCh from '@/pages/Static/Kinsor';
import { OrderedListOutlined, TrophyOutlined } from '@ant-design/icons';
import React from 'react';
import Records from "@/pages/Static/Record";

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
  ];

  return (
    <>
      <h2> 成绩统计 </h2>
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
