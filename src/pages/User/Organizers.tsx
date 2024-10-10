import { NavTabs } from '@/components/Tabs/nav_tabs';
import React from 'react';

const Organizers: React.FC = () => {

  let items = [
    {
      key: 'comps',
      label: '比赛管理',
      children: (<>比赛管理</>),
      icon: <></>
    },
    {
      key: 'pre_result',
      label: '成绩管理',
      children: (<>成绩管理</>),
      icon: <></>
    },
    {
      key: 'group',
      label: '群组管理',
      children: (<>群组管理</>),
      icon: <></>
    },
    {
      key: ''
    }

  ]

  return (
    <>
      {' '}
      <NavTabs
        type="line"
        tabPosition={'left'}
        centered={true}
        items={items}
        tabsKey="organizers_tab"
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
};

export default Organizers;
