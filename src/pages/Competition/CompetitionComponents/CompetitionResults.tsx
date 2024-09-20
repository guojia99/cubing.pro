import { NavTabs } from '@/components/Tabs/nav_tabs';
import CompetitionResultsWithEvents from '@/pages/Competition/CompetitionComponents/CompetitionResultsWithEvents';
import CompetitionResultsWithPlayers from '@/pages/Competition/CompetitionComponents/CompetitionResultsWithPlayers';
import CompetitionResultsWithTop from '@/pages/Competition/CompetitionComponents/CompetitionResultsWithTop';
import { apiCompResult } from '@/services/cubing-pro/comps/result';
import { CompAPI, CompResultAPI } from '@/services/cubing-pro/comps/typings';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { Result } from '@/utils/cube_result/result';
import { ProductOutlined, TrophyOutlined } from '@ant-design/icons';
import { ProDescriptions } from '@ant-design/pro-components';
import { Card } from 'antd';
import React, { useEffect, useState } from 'react';
import { BsPeople } from 'react-icons/bs';
import { SiBytedance, SiCodeforces } from 'react-icons/si';

// 定义组件的属性类型
interface CompetitionResultProps {
  comp?: CompAPI.CompResp;
  results?: Result[];
  events?: EventsAPI.Event[];
}

const CompetitionResult: React.FC<CompetitionResultProps> = ({ comp }) => {
  const [result, setResult] = useState<CompResultAPI.CompResultResp>();
  const [events, setEvents] = useState<EventsAPI.EventsResponse>();
  const fetchResult = () => {
    if (comp !== undefined) {
      apiEvents().then((value) => {
        setEvents(value);
      });
      apiCompResult(comp.data.id).then((value) => {
        setResult(value);
      });
    }
  };

  // 动态加载数据
  useEffect(() => {
    fetchResult();
  }, [comp]);

  const items = [];
  if (result !== undefined) {
    if (comp?.data.IsDone) {
      items.push(
        {
          key: 'trophy',
          label: '冠军',
          children: (
            <CompetitionResultsWithTop
              comp={comp}
              results={result.data}
              events={events?.data.Events}
              topRank={1}
              event_divider={false}
            />
          ),
          icon: <TrophyOutlined />,
        },
        {
          key: 'top3',
          label: '前三',
          children: (
            <CompetitionResultsWithTop
              comp={comp}
              results={result.data}
              events={events?.data.Events}
              topRank={3}
              event_divider={true}
            />
          ),
          icon: <SiCodeforces />,
        },
        {
          key: 'record',
          label: '记录',
          children: <>记录</>,
          icon: <ProductOutlined />,
        },
      );
    }

    items.push(
      {
        key: 'events',
        label: '各项',
        children: (
          <CompetitionResultsWithEvents
            comp={comp}
            results={result.data}
            events={events?.data.Events}
          />
        ),
        icon: <SiBytedance />,
      },
      {
        key: 'players',
        label: '玩家',
        children: (
          <CompetitionResultsWithPlayers
            comp={comp}
            results={result.data}
            events={events?.data.Events}
          />
        ),
        icon: <BsPeople />,
      },
    );
  }

  return (
    <>
      <ProDescriptions
        column={1}
        title="成绩"
        tooltip={!comp?.data.IsDone ? '比赛任在进行中,不代表最终结果' : ''}
      >
        <Card style={{ borderRadius: 8, minWidth: '100%' }}>
          <NavTabs
            type="card"
            items={items}
            tabsKey="comp_results_tabs"
            style={{}}
            indicator={{}}
          />
        </Card>
      </ProDescriptions>
    </>
  );
};

export default CompetitionResult;
