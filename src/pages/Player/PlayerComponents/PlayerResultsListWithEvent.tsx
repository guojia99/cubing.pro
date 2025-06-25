import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { RouteMaps } from '@/components/Data/cube_result/event_route';
import { ResultGraphChart } from '@/components/Data/cube_result/result_chat';
import { ResultsTable } from '@/components/Data/cube_result/result_tables';
import { Comp } from '@/components/Data/types/comps';
import { Record } from '@/components/Data/types/record';
import { Result } from '@/components/Data/types/result';
import { NavTabs } from '@/components/Tabs/nav_tabs';
import { BOBestGroup, BORecentGroup } from '@/pages/Player/PlayerComponents/BestBoGroup';
import RollingQuantileChart from '@/pages/Player/PlayerComponents/Echarts/RollingQuantileChart';
import ScoreRangeChart from '@/pages/Player/PlayerComponents/Echarts/ScoreRangeChart';
import SuccessRateBox from '@/pages/Player/PlayerComponents/SuccessRateBox';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { Tabs } from 'antd';
import React from 'react';

interface PlayerEventResultPanelProps {
  event: EventsAPI.Event;
  results: Result[];
  records: Record[];
}

export const PlayerEventResultPanel: React.FC<PlayerEventResultPanelProps> = ({
  event,
  results,
  records,
}) => {
  const eventId = event.id;
  const resultNums: number[] = [];
  const m = RouteMaps.get(event.base_route_typ);
  const res = [...results]; // 避免修改原数组
  res.sort((a, b) => {
    if (a.CompetitionID === b.CompetitionID) {
      return a.RoundNumber > b.RoundNumber ? -1 : 1;
    }
    return a.CompetitionID > b.CompetitionID ? -1 : 1;
  });

  const avgResultNums: number[] = []

  let last_comp_name = '';
  for (let j = 0; j < res.length; j++) {
    for (let k = 0; k < res[j].Result.length; k++) {
      resultNums.push(res[j].Result[k]);
    }
    avgResultNums.push(res[j].Average)
    if (res[j].CompetitionName !== last_comp_name) {
      last_comp_name = res[j].CompetitionName;
    } else {
      res[j].CompetitionName = '';
    }
  }

  return (
    <>
      <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
        <strong>{CubesCn(eventId)}</strong>
      </h3>

      {ResultGraphChart(eventId, res, records)}



      {!m?.repeatedly && (
        <div style={{ marginBottom: 24, marginTop: 16 }}>
          <h2>
            <strong>统计</strong>
          </h2>
          <Tabs
            defaultActiveKey="success"
            items={[
              {
                key: 'success',
                label: '成功率',
                children: (
                  <div style={{ padding: 16 }}>
                    <SuccessRateBox data={resultNums} />
                  </div>
                )
              },
              {
                key: 'recent_chart',
                label: '成绩分位(单次)',
                children: (
                  <div style={{ padding: 16 }}>
                    <RollingQuantileChart inputData={resultNums} baseWindowSize={50} />
                  </div>
                ),
              },
              {
                key: 'recent_chart_avg',
                label: '成绩分位(平均)',
                children: (
                  <div style={{ padding: 16 }}>
                    <RollingQuantileChart inputData={avgResultNums} baseWindowSize={12} />
                  </div>
                ),
              },
              {
                key: 'result_ton',
                label: '成绩分布',
                children: (
                  <div style={{ padding: 16 }}>
                    <ScoreRangeChart inputData={resultNums} />
                  </div>
                ),
              },
              {
                key: 'recent',
                label: '平均成绩',
                children: (
                  <div style={{ padding: 16 }}>
                    <BORecentGroup data={resultNums} />
                    <BOBestGroup data={resultNums} />
                  </div>
                ),
              },
            ]}
            tabBarStyle={{
              margin: 0,
            }}
            type="line"
          />
        </div>
      )}
      {m?.repeatedly
        ? ResultsTable(res, ['CompetitionName', 'Round', 'Result_with_repeatedly'], records)
        : ResultsTable(res, ['CompetitionName', 'Round', 'Best', 'Average', 'Result'], records)}
    </>
  );
};

interface PlayerResultsListWithEventProps {
  events: EventsAPI.Event[];
  results: Result[];
  records: Record[];
  comps: Comp[];
}

const PlayerResultsListWithEvent: React.FC<PlayerResultsListWithEventProps> = ({
  events,
  results,
  records,
  comps,
}) => {
  let items = [];

  // 1. 从成绩列表中迭代推出每个event的数据
  // 2. 按events列表对所有数据按顺序拿，然后排序按照compId + roundNum
  // 3. 渲染图表

  const compsMap = new Map<number, string>();
  for (let i = 0; i < comps.length; i++) {
    compsMap.set(comps[i].id, comps[i].Name);
  }

  const resultMap = new Map<string, Result[]>();
  results.forEach((result) => {
    const eventId = result.EventID;
    if (!resultMap.has(eventId)) {
      resultMap.set(eventId, []);
    }
    resultMap.get(eventId)!.push(result);
  });

  for (let i = 0; i < events.length; i++) {
    const eventId = events[i].id;
    const res = resultMap.get(eventId);
    if (!res) continue;

    items.push({
      key: eventId,
      children: <PlayerEventResultPanel event={events[i]} results={res} records={records} />,
      icon: <>{CubeIcon(eventId, eventId, {})}</>,
    });
  }

  return (
    <>
      <NavTabs
        type="line"
        centered={true}
        items={items}
        tabsKey="player_result_result_list_with_events_tabs"
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
};

export default PlayerResultsListWithEvent;
