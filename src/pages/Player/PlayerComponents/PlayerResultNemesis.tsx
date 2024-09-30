import { PlayerLink } from '@/components/Link/Links';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { Divider, Table } from 'antd';
import React from 'react';

interface PlayerResultsNemesisProps {
  nemesis: PlayersAPI.BestResults[];
  player?: PlayersAPI.Player;
}

const PlayerResultsNemesis: React.FC<PlayerResultsNemesisProps> = ({ nemesis, player }) => {
  if (!nemesis || nemesis.length === 0) {
    return (
      <>
        <Divider style={{ borderColor: '#ff078f' }}>{player?.Name} 无宿敌!</Divider>
      </>
    );
  }

  for (let i = 0; i < nemesis.length; i++) {
    nemesis[i].Index = nemesis.length - i
  }

  const columns = [
    {
      title: '序号',
      dataIndex: 'Index',
      key: 'Index',
      width: 80,
    },
    {
      title: '宿敌',
      dataIndex: 'PlayerName',
      key: 'PlayerName',
      render: (value: string, nemesis: PlayersAPI.BestResults) => {
        return PlayerLink(nemesis.CubeId, nemesis.PlayerName, '');
      },
    },
  ];

  return (
    <>
      <Table
        dataSource={nemesis}
        // @ts-ignore
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }} // 启用横向滚动
      />
    </>
  );
};

export default PlayerResultsNemesis;
