import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { RouteMaps } from '@/components/Data/cube_result/event_route';
import { ResultGraphChart } from '@/components/Data/cube_result/result_chat';
import { ResultsTable } from '@/components/Data/cube_result/result_tables';
import { Comp } from '@/components/Data/types/comps';
import { Record } from '@/components/Data/types/record';
import { Result } from '@/components/Data/types/result';
import { NavTabs } from '@/components/Tabs/nav_tabs';
import BOGroup from '@/pages/Player/PlayerComponents/BestBoGroup';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import React from 'react';
import SuccessRateBox from "@/pages/Player/PlayerComponents/SuccessRateBox";

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
    const resultNums: number[] = [];

    let res = resultMap.get(eventId);
    if (res === undefined) {
      continue;
    }
    res.sort((a: Result, b: Result) => {
      if (a.CompetitionID === b.CompetitionID) {
        return a.RoundNumber > b.RoundNumber ? -1 : 1;
      }
      return a.CompetitionID > b.CompetitionID ? -1 : 1;
    });

    let last_comp_name = '';
    for (let j = 0; j < res.length; j++) {
      for (let k = 0; k < res[j].Result.length; k++) {
        resultNums.push(res[j].Result[k]);
      }

      if (res[j].CompetitionName !== last_comp_name) {
        last_comp_name = res[j].CompetitionName;
        continue;
      }
      res[j].CompetitionName = '';
    }

    const m = RouteMaps.get(events[i].base_route_typ);

    items.push({
      key: eventId,
      children: (
        <>
          <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
            <strong>{CubesCn(eventId)}</strong>
          </h3>

          {!m?.repeatedly && (
            <>
              <SuccessRateBox data={resultNums} />
              <BOGroup data={resultNums} />
            </>
          )}
          {/*{chat}*/}
          {ResultGraphChart(eventId, res, records)}

          {m?.repeatedly
            ? ResultsTable(res, ['CompetitionName', 'Round', 'Result_with_repeatedly'], records)
            : ResultsTable(res, ['CompetitionName', 'Round', 'Best', 'Average', 'Result'], records)}
        </>
      ),
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
