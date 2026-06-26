import { NavTabs } from '@/components/Tabs/NavTabs';

import { Record } from '@/components/Data/types/record';
import { Result } from '@/components/Data/types/result';
import { apiCompRecord } from '@/services/cubing-pro/comps/comp';
import { apiCompResult } from '@/services/cubing-pro/comps/result';
import { CompAPI, CompResultAPI } from '@/services/cubing-pro/comps/typings';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { ProductOutlined, TrophyOutlined } from '@ant-design/icons';
import { Card, Typography } from 'antd';
import React, { lazy, useEffect, useState } from 'react';
import { BsPeople } from 'react-icons/bs';
import { SiBytedance, SiCodeforces } from 'react-icons/si';

const CompetitionResultsWithEvents = lazy(
  () => import('@/views/Competition/CompetitionComponents/CompetitionResultsWithEvents'),
);
const CompetitionResultsWithPlayers = lazy(
  () => import('@/views/Competition/CompetitionComponents/CompetitionResultsWithPlayers'),
);
const CompetitionResultsWithRecord = lazy(
  () => import('@/views/Competition/CompetitionComponents/CompetitionResultsWithRecord'),
);
const CompetitionResultsWithTop = lazy(
  () => import('@/views/Competition/CompetitionComponents/CompetitionResultsWithTop'),
);

// 定义组件的属性类型
interface CompetitionResultProps {
  comp?: CompAPI.CompResp;
  results?: Result[];
  events?: EventsAPI.Event[];
}

const CompetitionResult: React.FC<CompetitionResultProps> = ({ comp }) => {
  const [result, setResult] = useState<CompResultAPI.CompResultResp>();
  const [events, setEvents] = useState<EventsAPI.EventsResponse>();
  const [records, setRecords] = useState<Record[]>();
  const fetchResult = () => {
    if (comp !== undefined) {
      apiEvents().then((value) => {
        setEvents(value);
      });
      apiCompResult(comp.data.id).then((value) => {
        setResult(value);
      });
      apiCompRecord(comp.data.id).then((value) => {
        setRecords(value.data);
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
              records={records}
              with_best={false}
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
              records={records}
              with_best={false}
            />
          ),
          icon: <SiCodeforces />,
        },
        {
          key: 'record',
          label: '记录',
          children: (
            <CompetitionResultsWithRecord
              comp={comp}
              events={events?.data.Events}
              records={records}
            />
          ),
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
            records={records}
          />
        ),
        icon: <SiBytedance />,
      },
      {
        key: 'best_events',
        label: '最佳各项',
        children: (
          <CompetitionResultsWithTop
            comp={comp}
            results={result.data}
            events={events?.data.Events}
            topRank={999}
            event_divider={true}
            records={records}
            with_best={true}
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
            records={records}
          />
        ),
        icon: <BsPeople />,
      },
      {
        key: 'best_top3',
        label: '最佳前三',
        children: (
          <CompetitionResultsWithTop
            comp={comp}
            results={result.data}
            events={events?.data.Events}
            topRank={3}
            event_divider={true}
            records={records}
            with_best={true}
          />
        ),
        icon: <SiCodeforces />,
      },
    );
  }

  return (
    <>
      <Typography.Title level={5}>
        成绩
        {!comp?.data.IsDone ? (
          <Typography.Text type="secondary" style={{ fontSize: 14, fontWeight: 400, marginLeft: 8 }}>
            比赛任在进行中,不代表最终结果
          </Typography.Text>
        ) : null}
      </Typography.Title>
      <Card style={{ borderRadius: 8, minWidth: '100%' }}>
        <NavTabs
          type="card"
          items={items}
          tabsKey="comp_results_tabs"
          style={{}}
          indicator={{}}
        />
      </Card>
    </>
  );
};

export default CompetitionResult;
