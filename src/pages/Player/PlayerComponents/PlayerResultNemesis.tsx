import '@/components/Data/table_fixed_column.css';
import { PlayerLink } from '@/components/Link/Links';
import styles from '@/pages/Player/playerPage.less';
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
      fixed: 'left' as const,
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
      <div className={styles.playerTableScroll}>
        <Table
          dataSource={nemesis}
          // @ts-ignore
          columns={columns}
          pagination={false}
          size="small"
          className="cube-player-nemesis-table"
          scroll={{ x: 'max-content' }}
        />
      </div>
    </>
  );
};

export default PlayerResultsNemesis;
