import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { WCALink } from '@/components/Link/Links';
import { NavTabs } from '@/components/Tabs/nav_tabs';
import { apiDiyRanking } from '@/services/cubing-pro/statistics/diy_ranking';
import { StaticAPI } from '@/services/cubing-pro/statistics/typings';
import { Table } from 'antd';
import React, { useEffect, useState } from 'react';

const eventList = [
  ['3x3x3Cube', '333'],
  ['2x2x2Cube', '222'],
  ['4x4x4Cube', '444'],
  ['5x5x5Cube', '555'],
  ['6x6x6Cube', '666'],
  ['7x7x7Cube', '777'],
  ['3x3x3Blindfolded', '333bf'],
  ['3x3x3FewestMoves', '333fm'],
  ['3x3x3One-Handed', '333oh'],
  ['Clock', 'clock'],
  ['Megaminx', 'minx'],
  ['Pyraminx', 'pyram'],
  ['Skewb', 'skewb'],
  ['Square-1', 'sq1'],
  ['4x4x4Blindfolded', '444bf'],
  ['5x5x5Blindfolded', '555bf'],
];

const wcaLink = 'https://www.worldcubeassociation.org/persons/';

const DiyRanks: React.FC = () => {
  // const actionRef = useRef();
  const [diyRankResp, setDiyRankResp] = useState<StaticAPI.DiyRankWCAResultStaticsResponse>();
  const keys = 'diy_rankings_guangdong_gaoxiao';
  // // todo 数据库拿出

  useEffect(() => {
    apiDiyRanking(keys).then((value) => {
      setDiyRankResp(value);
    });
  }, []);

  if (!diyRankResp) {
    return <>loading...</>;
  }

  const getRankTable = (eventKey: string) => {
    const data = diyRankResp.data[eventKey];

    const col = [
      {
        title: '排名',
        dataIndex: 'BestRank',
        key: 'BestRank',
        width: 100,
      },
      {
        title: '单次',
        dataIndex: 'BestPersonName',
        key: 'BestPersonName',
        render: (value: string, record: StaticAPI.DiyRankWCAResult) => {
          return <>{WCALink(record.BestPersonWCAID, record.BestPersonName)}</>;
        },
      },
      {
        title: '单次',
        dataIndex: 'BestStr',
        key: 'BestStr',
        width: 100,
      },
    ];

    if (eventKey) {
      col.push(
        // 平均
        {
          title: '平均',
          dataIndex: 'AvgStr',
          key: 'AvgStr',
          width: 100,
        },
        {
          title: '平均',
          dataIndex: 'BestPersonName',
          key: 'BestPersonName',
          render: (value: string, record: StaticAPI.DiyRankWCAResult) => {
            return <>{WCALink(record.AvgPersonWCAID, record.AvgPersonName)}</>;
          },
        },
        {
          title: '排名',
          dataIndex: 'AvgRank',
          key: 'AvgRank',
          width: 100,
        },
      );
    }

    return <Table dataSource={data} pagination={false} size={'small'} columns={col} />;
  };
  const eventItems = [];
  for (let i = 0; i < eventList.length; i++) {
    const eventKey = eventList[i][0];
    const eventValue = eventList[i][1];
    eventItems.push({
      key: eventKey,
      label: CubesCn(eventValue),
      icon: CubeIcon(eventValue, eventKey + 'icon', {}),
      children: getRankTable(eventKey),
    });
  }

  return (
    <>
      <h2>广东高校榜</h2>
      <NavTabs
        type="line"
        items={eventItems}
        tabsKey={keys}
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
};

export default DiyRanks;
