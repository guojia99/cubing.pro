import { NavTabs } from '@/components/Tabs/NavTabs';

import { Record } from '@/components/Data/types/record';
import { Result } from '@/components/Data/types/result';
import { apiCompRecord } from '@/services/cubing-pro/comps/comp';
import { apiCompResult } from '@/services/cubing-pro/comps/result';
import { CompAPI, CompResultAPI } from '@/services/cubing-pro/comps/typings';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { ProductOutlined, TrophyOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Typography } from 'antd';
import React, { lazy, useEffect, useState } from 'react';
import { BsPeople } from 'react-icons/bs';
import { SiBytedance, SiCodeforces } from 'react-icons/si';
import { useCompetitionPublicI18n } from '../i18n';

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
  const { t, p } = useCompetitionPublicI18n();
  const [result, setResult] = useState<CompResultAPI.CompResultResp>();
  const [events, setEvents] = useState<EventsAPI.EventsResponse>();
  const [records, setRecords] = useState<Record[]>();
  const [failed, setFailed] = useState(false);
  const [request, setRequest] = useState(0);
  const compId = comp?.data.id;

  // 动态加载数据
  useEffect(() => {
    if (compId === undefined) return;
    let active = true;
    setFailed(false);
    setResult(undefined);
    setEvents(undefined);
    setRecords(undefined);
    void Promise.all([apiEvents(), apiCompResult(compId), apiCompRecord(compId)])
      .then(([nextEvents, nextResult, nextRecords]) => {
        if (!active) return;
        setEvents(nextEvents);
        setResult(nextResult);
        setRecords(nextRecords.data);
      })
      .catch((error) => {
        console.error('Competition results failed', error);
        if (active) setFailed(true);
      });
    return () => { active = false; };
  }, [compId, request]);

  const items = [];
  if (result !== undefined) {
    if (comp?.data.IsDone) {
      items.push(
        {
          key: 'trophy',
          label: t('competitionAdmin.champion'),
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
          label: t('competitionAdmin.topThree'),
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
          label: t('competitionAdmin.records'),
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
        label: t('competitionAdmin.byEvent'),
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
        label: t('competitionAdmin.bestByEvent'),
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
        label: t('competitionAdmin.user'),
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
        label: t('competitionAdmin.bestTopThree'),
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
      {failed ? <Alert type="error" title={p('competitionPublic.resultsFailed')} action={<Button onClick={() => setRequest((n) => n + 1)}>{t('competitionAdmin.retry')}</Button>} /> : null}
      <Typography.Title level={5}>
        {t('competitionAdmin.result')}
        {!comp?.data.IsDone ? (
          <Typography.Text type="secondary" style={{ fontSize: 14, fontWeight: 400, marginLeft: 8 }}>
            {t('competitionAdmin.provisional')}
          </Typography.Text>
        ) : null}
      </Typography.Title>
      <Card className="competition-results-card">
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
