import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { WCALink } from '@/components/Link/Links';
import { NavTabs } from '@/components/Tabs/nav_tabs';
import {
  apiDiyRanking,
  apiGetAllDiyRankingKey,
} from '@/services/cubing-pro/statistics/diy_ranking';
import { StaticAPI } from '@/services/cubing-pro/statistics/typings';
import { OrderedListOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Table, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
//
// const eventList = [
//   ['3x3x3Cube', '333'],
//   ['2x2x2Cube', '222'],
//   ['4x4x4Cube', '444'],
//   ['5x5x5Cube', '555'],
//   ['6x6x6Cube', '666'],
//   ['7x7x7Cube', '777'],
//   ['3x3x3Blindfolded', '333bf'],
//   ['3x3x3FewestMoves', '333fm'],
//   ['3x3x3One-Handed', '333oh'],
//   ['Clock', 'clock'],
//   ['Megaminx', 'minx'],
//   ['Pyraminx', 'pyram'],
//   ['Skewb', 'skewb'],
//   ['Square-1', 'sq1'],
//   ['4x4x4Blindfolded', '444bf'],
//   ['5x5x5Blindfolded', '555bf'],
// ];

const eventList = [
  ['333', '333'],
  ['222', '222'],
  ['444', '444'],
  ['555', '555'],
  ['666', '666'],
  ['777', '777'],
  ['333bf', '333bf'],
  ['333fm', '333fm'],
  ['333oh', '333oh'],
  ['clock', 'clock'],
  ['minx', 'minx'],
  ['pyram', 'pyram'],
  ['skewb', 'skewb'],
  ['sq1', 'sq1'],
  ['444bf', '444bf'],
  ['555bf', '555bf'],
  ['333mbf', '333mbf'],
];

interface DiyRanksProps {
  keys: string;
}

const DiyRanks: React.FC<DiyRanksProps> = ({ keys }) => {
  // const actionRef = useRef();
  const [diyRankResp, setDiyRankResp] = useState<StaticAPI.DiyRankWCAResultStaticsResponse>();
  // const keys = 'diy_rankings_guangdong_gaoxiao';
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

    if (data === undefined || data === null) {
      return <Table dataSource={[]} pagination={false} size={'small'} />;
    }
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
      <NavTabs
        type="line"
        items={eventItems}
        tabsKey={keys}
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
};

const DiyRankView: React.FC = () => {
  // @ts-ignore
  const [items, setItems] = useState<[]>([]);

  useEffect(() => {
    apiGetAllDiyRankingKey().then((res) => {
      console.log('apiGetAllDiyRankingKey -> ', res);

      let it = [];
      for (let i = 0; i < res.data.length; i++) {
        it.push({
          key: res.data[i].id,
          label: res.data[i].Description,
          children: <DiyRanks keys={res.data[i].id} />,
          icon: <OrderedListOutlined />,
        });
      }
      // @ts-ignore
      setItems(it)
      console.log(it)
    });

  }, []);

  return (
    <>
      <h2 style={{ textAlign: 'center' }}>
        WCA成绩统计排行&nbsp;
        <Tooltip title="该榜单基于WCA官方比赛成绩进行统计排名，包含各项目选手的最新纪录。如果你没有在榜单上，需要记录到榜单当中，请联系管理员。">
          <QuestionCircleOutlined style={{fontSize: 14}} />
        </Tooltip>
      </h2>
      {items && items.length > 0 && (
        <NavTabs
          type="line"
          items={items}
          tabsKey="wca_tabs"
          indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
        />
      )}
    </>
  );
};

export default DiyRankView;
