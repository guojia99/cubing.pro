import { Comp } from '@/components/Data/types/comps';
import { Record } from '@/components/Data/types/record';
import { Result } from '@/components/Data/types/result';
import { NavTabs } from '@/components/Tabs/NavTabs';
import DownloadExcelButton from '@/views/GroupCompetitions/Player/components/PlayerResultDownloadButton';
import PlayerResultsListWithComps from '@/views/GroupCompetitions/Player/components/PlayerResultsListWithComps';
import PlayerResultsListWithEvent from '@/views/GroupCompetitions/Player/components/PlayerResultsListWithEvent';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import React, { useEffect, useState } from 'react';

interface PlayerResultsListProps {
  events: EventsAPI.Event[];
  results: Result[];
  records: Record[];
  comps: Comp[];
  player?: PlayersAPI.Player;
}

const PlayerResultsList: React.FC<PlayerResultsListProps> = ({
  events,
  results,
  records,
  comps,
  player,
}) => {

  const [withResult, setWithResult] = useState<Result[]>([])
  const [withComps, setWithComps] = useState<Result[]>([])
  const [withDownloads, setWithDownloads] = useState<Result[]>([])


  useEffect(() => {
    setWithResult(structuredClone(results))
    setWithComps(structuredClone(results))
    setWithDownloads(structuredClone(results))
  }, [results]);


  const items = [
    {
      key: 'with_result',
      label: '按项目',
      children: (
        <PlayerResultsListWithEvent
          events={events}
          results={withResult}
          records={records}
          comps={comps}
        />
      ),
    },
    {
      key: 'with_comps',
      label: '按比赛',
      children: (
        <PlayerResultsListWithComps
          events={events}
          results={withComps}
          records={records}
          comps={comps}
        />
      ),
    },
  ];

  return (
    <div style={{ minWidth: 0, maxWidth: '100%' }}>
      {/*<h4 style={{textAlign:"center"}}><strong>成绩列表</strong></h4>*/}
      <DownloadExcelButton player={player} results={withDownloads} />
      <NavTabs
        type="line"
        items={items}
        tabsKey="player_result_result_list_tabs"
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </div>
  );
};

export default PlayerResultsList;
