import { ResultsTable } from '@/components/Data/cube_result/result_tables';
import { Comp } from '@/components/Data/types/comps';
import { Record } from '@/components/Data/types/record';
import { Result } from '@/components/Data/types/result';
import { CompetitionLink } from '@/components/Link/Links';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import React from 'react';

interface PlayerResultsListWithCompsProps {
  events: EventsAPI.Event[];
  results: Result[];
  records: Record[];
  comps: Comp[];
}

const PlayerResultsListWithComps: React.FC<PlayerResultsListWithCompsProps> = ({
  events,
  results,
  records,
  comps,
}) => {
  const resultMap = new Map<number, Result[]>();

  // 按CompsId进行分组
  results.forEach((result) => {
    const compId = result.CompetitionID;
    if (!resultMap.has(compId)) {
      resultMap.set(compId, []);
    }
    resultMap.get(compId)!.push(result);
  });
  const eventOrderMap = new Map<string, number>();
  events.forEach((event, index) => {
    eventOrderMap.set(event.id, index);
  });
  resultMap.forEach((resultList, compId) => {
    resultMap.set(
      compId,
      resultList.sort((a, b) => {
        const ev =  (eventOrderMap.get(a.EventID) || 0) - (eventOrderMap.get(b.EventID) || 0);
        return ev === 0 ? a.RoundNumber - b.RoundNumber :ev
      }),
    );
  });

  let bodys: JSX.Element[] = [];
  for (let i = 0; i < comps.length; i++) {
    const comp = comps[i];
    const results = resultMap.get(comp.id);
    if (results === undefined || results.length === 0) {
      continue;
    }

    bodys.push(
      <>
        <div style={{ marginTop: '20px' }}></div>
        {CompetitionLink(comp.id, comp.Name)}
        <div style={{ marginBottom: '20px' }}></div>
        {ResultsTable(results, ['EventNameOnlyOne', 'Round', 'Best', 'Average', 'Result'], records)}
      </>,
    );
  }

  return <>{bodys}</>;
};

export default PlayerResultsListWithComps;
