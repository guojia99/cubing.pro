import { Record } from '@/components/Data/types/record';
import { Result } from '@/components/Data/types/result';
import { NavTabs } from '@/components/Tabs/NavTabs';
import PlayerResultsList from '@/views/GroupCompetitions/Player/components/PlayerResultsList';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import {
  apiPlayerComps,
  apiPlayerNemesis,
  apiPlayerRecords,
  apiPlayerResults,
  apiPlayerSor,
} from '@/services/cubing-pro/players/players';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { isRequestCanceled } from '@/services/cubing-pro/request';
import {
  BarChartOutlined,
  OrderedListOutlined,
  ProfileOutlined,
  ProjectOutlined,
  RadarChartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Card } from 'antd';
import React, { useEffect, useState } from 'react';

import { Comp } from '@/components/Data/types/comps';
import { KinChSorResult } from '@/services/cubing-pro/statistics/typings';
import PlayerResultsComps from '@/views/GroupCompetitions/Player/components/PlayerResultsComps';
import PlayerResultsRecord from '@/views/GroupCompetitions/Player/components/PlayerResultRecord';
import PlayerResultsNemesis from '@/views/GroupCompetitions/Player/components/PlayerResultNemesis';
import PlayerResultsSor from '@/views/GroupCompetitions/Player/components/PlayerResultSor';

interface PlayerResultsProps {
  player?: PlayersAPI.Player;
}

const PlayerResults: React.FC<PlayerResultsProps> = ({ player }) => {
  const [events, setEvents] = useState<EventsAPI.Event[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [nemesis, setNemesis] = useState<PlayersAPI.BestResults[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [comps, setComps] = useState<Comp[]>([]);
  const [sor, setSor] = useState<KinChSorResult>();

  const cubeId = player?.CubeID;

  useEffect(() => {
    if (!cubeId) {
      return;
    }

    const controller = new AbortController();
    const requestConfig = { signal: controller.signal };

    void (async () => {
      try {
        const [eventsRes, resultsRes, recordsRes, nemesisRes, compsRes, sorRes] = await Promise.all([
          apiEvents(requestConfig),
          apiPlayerResults(cubeId, requestConfig),
          apiPlayerRecords(cubeId, requestConfig),
          apiPlayerNemesis(cubeId, requestConfig),
          apiPlayerComps(cubeId, requestConfig),
          apiPlayerSor(cubeId, requestConfig),
        ]);

        setEvents(eventsRes.data.Events);
        setResults(resultsRes.data.All);
        setRecords(recordsRes.data);
        setNemesis(nemesisRes.data);
        setComps(compsRes.data.items);
        setSor(sorRes.data);
      } catch (error) {
        if (!isRequestCanceled(error)) {
          console.error('Failed to load player results:', error);
        }
      }
    })();

    return () => controller.abort();
  }, [cubeId]);

  if (results && results.length === 0) {
    return null;
  }

  const items = [
    {
      key: 'result',
      label: '成绩',
      children: (
        <PlayerResultsList events={events} results={results} records={records} comps={comps} player={player} />
      ),
      icon: <ProjectOutlined />,
    },
    {
      key: 'comps',
      label: '比赛',
      children: <PlayerResultsComps comps={comps} />,
      icon: <ProfileOutlined />,
    },
  ];

  if (records && records.length > 0) {
    items.push({
      key: 'record',
      label: '记录',
      children: <PlayerResultsRecord record={records} />,
      icon: <OrderedListOutlined />,
    });
  }

  items.push(
    {
      key: 'nemesis',
      label: '宿敌',
      children: <PlayerResultsNemesis player={player} nemesis={nemesis} />,
      icon: <TeamOutlined />,
    },
    {
      key: 'power',
      label: '能力图表',
      children: <>能力</>,
      icon: <RadarChartOutlined />,
    },
    {
      key: 'kin_ch_sor',
      label: '排位分',
      children: <PlayerResultsSor kinchSor={sor} />,
      icon: <BarChartOutlined />,
    },
  );

  return (
    <>
      <Card style={{ maxWidth: '100%' }}>
        <NavTabs
          type="line"
          items={items}
          tabsKey="player_result_tabs"
          indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
        />
      </Card>
    </>
  );
};

export default PlayerResults;
