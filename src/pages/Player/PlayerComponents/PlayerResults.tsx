import { NavTabs } from '@/components/Tabs/nav_tabs';
import PlayerResultsList from '@/pages/Player/PlayerComponents/PlayerResultsList';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import {
  apiPlayerComps,
  apiPlayerNemesis,
  apiPlayerRecords,
  apiPlayerResults, apiPlayerSor
} from '@/services/cubing-pro/players/players';
import { PlayersAPI} from '@/services/cubing-pro/players/typings';
import { Result } from '@/components/Data/types/result';
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
import {Record} from "@/components/Data/types/record";
import PlayerResultsComps from "@/pages/Player/PlayerComponents/PlayerResultsComps";
import {Comp} from "@/components/Data/types/comps";
import PlayerResultsRecord from "@/pages/Player/PlayerComponents/PlayerResultRecord";
import PlayerResultsNemesis from "@/pages/Player/PlayerComponents/PlayerResultNemesis";
import PlayerResultsSor from "@/pages/Player/PlayerComponents/PlayerResultSor";

interface PlayerResultsProps {
  player?: PlayersAPI.Player;
}

const PlayerResults: React.FC<PlayerResultsProps> = ({ player }) => {
  const [events, setEvents] = useState<EventsAPI.Event[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [nemesis, setNemesis] = useState<PlayersAPI.BestResults[]>([])
  const [records, setRecords] = useState< Record[]>([])
  const [comps, setComps] = useState<Comp[]>([])
  const [sor, setSor] = useState<PlayersAPI.KinChSorResult>()


  const fetchResult = () => {
    apiEvents().then((value) => {
      setEvents(value.data.Events);
    });

    if (player?.CubeID) {
      apiPlayerResults(player.CubeID).then((value) => {
        setResults(value.data.All);
      });
      apiPlayerRecords(player.CubeID).then((value) => {
        setRecords(value.data)
      })
      apiPlayerNemesis(player.CubeID).then((value) => {
        setNemesis(value.data)
      })
      apiPlayerComps(player.CubeID).then((value) => {
        setComps(value.data.items)
      })
      apiPlayerSor(player.CubeID).then((value) => {
        setSor(value.data)
      })
    }
  };
  useEffect(() => {
    fetchResult();
  }, [player]);

  if (results && results.length === 0) {
    return null;
  }

  const items = [
    {
      key: 'result',
      label: '成绩',
      children: (
        <PlayerResultsList events={events} results={results} records={records} comps={comps} />
      ),
      icon:<ProjectOutlined />,
    },
    {
      key: 'comps',
      label: '比赛',
      children: <PlayerResultsComps comps={comps}/>,
      icon: <ProfileOutlined />,
    },
  ]


  // todo 查询领奖台
  // items.push(
  //   {
  //     key: 'prod',
  //     label: '领奖台',
  //     children: <>领奖台</>,
  //     icon: <TrophyOutlined />,
  //   }
  // )

  if (records && records.length > 0){
    items.push(
      {
        key: 'record',
        label: '记录',
        children: <PlayerResultsRecord record={records}/>,
        icon: <OrderedListOutlined />,
      },
    )
  }

  items.push(
    {
      key: 'nemesis',
      label: '宿敌',
      children: <PlayerResultsNemesis player={player} nemesis={nemesis}/>,
      icon: <TeamOutlined />,
    },
    {
      key: "power",
      label: "能力图表",
      children: <>能力</>,
      icon: <RadarChartOutlined />
    },
    {
      key: "kin_ch_sor",
      label: "排位分",
      children: <PlayerResultsSor kinchSor={sor}/>,
      icon: <BarChartOutlined />
    }
  )

  return (
    <>
      <Card>
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
