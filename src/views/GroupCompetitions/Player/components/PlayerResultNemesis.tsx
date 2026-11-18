import '@/components/Data/table_fixed_column.css';
import { PlayerLink } from '@/components/Link/GcLinks';
import styles from '@/views/GroupCompetitions/Player/gc-player.module.css';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { Divider, Table } from 'antd';
import React from 'react';
import { useI18n } from '@/contexts/I18nProvider';

interface PlayerResultsNemesisProps {
  nemesis: PlayersAPI.BestResults[];
  player?: PlayersAPI.Player;
}

const PlayerResultsNemesis: React.FC<PlayerResultsNemesisProps> = ({ nemesis, player }) => {
  const { t, tf } = useI18n();
  if (!nemesis || nemesis.length === 0) {
    return (
      <>
        <Divider style={{ borderColor: "var(--destructive)" }}>{tf('competitionExtra.noNemesis', { name: player?.Name ?? '' })}</Divider>
      </>
    );
  }

  for (let i = 0; i < nemesis.length; i++) {
    nemesis[i].Index = nemesis.length - i
  }

  const columns = [
    {
      title: t('competitionAdmin.index'),
      dataIndex: 'Index',
      key: 'Index',
      width: 80,
      fixed: 'left' as const,
    },
    {
      title: t('competitionAdmin.nemesis'),
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
          rowKey="CubeId"
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
