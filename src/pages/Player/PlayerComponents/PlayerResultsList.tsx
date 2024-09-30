import { Comp } from '@/components/Data/types/comps';
import { Record } from '@/components/Data/types/record';
import { Result } from '@/components/Data/types/result';
import { NavTabs } from '@/components/Tabs/nav_tabs';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import React, { Suspense } from 'react';

const PlayerResultsListWithEvent = React.lazy(() => import('./PlayerResultsListWithEvent'));
const PlayerResultsListWithComps = React.lazy(() => import('./PlayerResultsListWithComps'));

interface PlayerResultsListProps {
  events: EventsAPI.Event[];
  results: Result[];
  records: Record[];
  comps: Comp[];
}

const PlayerResultsList: React.FC<PlayerResultsListProps> = ({
  events,
  results,
  records,
  comps,
}) => {
  const items = [
    {
      key: 'with_result',
      label: '按项目',
      children: (
        <Suspense fallback={<div>Loading...</div>}>
          <PlayerResultsListWithEvent
            events={events}
            results={results}
            records={records}
            comps={comps}
          />
        </Suspense>
      ),
    },
    {
      key: 'with_comps',
      label: '按比赛',
      children: (
        <Suspense fallback={<div>Loading...</div>}>
          <PlayerResultsListWithComps
            events={events}
            results={results}
            records={records}
            comps={comps}
          />
        </Suspense>
      ),
    },
  ];

  return (
    <>
      {/*<h4 style={{textAlign:"center"}}><strong>成绩列表</strong></h4>*/}
      <NavTabs
        type="line"
        items={items}
        tabsKey="player_result_result_list_tabs"
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
};

export default PlayerResultsList;
