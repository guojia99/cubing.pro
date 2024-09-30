import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { Table } from 'antd';
import React from 'react';

interface PlayerResultsSorProps {
  kinchSor?: PlayersAPI.KinChSorResult;
}

const PlayerResultsSor: React.FC<PlayerResultsSorProps> = ({ kinchSor }) => {
  if (!kinchSor) {
    return null;
  }
  const kinchSorCol = [
    {
      title: '排名',
      dataIndex: 'Rank',
      key: 'Rank',
      width: 60,
    },
    {
      title: '分数',
      dataIndex: 'Value',
      key: 'Value',
      width: 200,
    },
  ];

  const kinchSorWithCol = [
    {
      title: '项目',
      dataIndex: 'Event',
      key: 'Event',
      render: (value: string) => {
        return (
          <>
            {CubeIcon(value, value, {})} {CubesCn(value)}{' '}
          </>
        );
      },
      width: 150,
    },
    {
      title: '分数',
      dataIndex: 'Value',
      key: 'Value',
      width: 200,
    },
  ];

  let withEvent = [];
  for (let i = 0; i < kinchSor.Results.length; i++) {
    withEvent.push({
      Event: kinchSor.Results[i].Event.id,
      Value: kinchSor.Results[i].Result,
    });
  }

  return (
    <>
      <h3 style={{ marginTop: '20px', marginBottom: '20px' }}>
        <strong>总分</strong>
      </h3>

      <Table
        style={{ maxWidth: 350 }}
        // @ts-ignore
        columns={kinchSorCol}
        dataSource={[
          {
            Rank: kinchSor.Rank,
            Value: kinchSor.Result,
          },
        ]}
        pagination={false}
      />

      <h3 style={{ marginTop: '20px', marginBottom: '20px' }}>
        <strong>项目分</strong>
      </h3>
      <Table
        style={{ maxWidth: 350 }}
        // @ts-ignore
        columns={kinchSorWithCol}
        dataSource={withEvent}
        pagination={false}
      />
    </>
  );
};

export default PlayerResultsSor;
