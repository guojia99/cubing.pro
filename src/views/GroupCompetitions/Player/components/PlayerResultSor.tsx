import '@/components/Data/table_fixed_column.css';
import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import styles from '@/views/GroupCompetitions/Player/gc-player.module.css';
import { KinChSorResult } from '@/services/cubing-pro/statistics/typings';
import { Button, Popover, Table } from 'antd';
import React from 'react';
import { SectionHeader } from '@/components/ui/page';
import { useI18n } from '@/contexts/I18nProvider';

interface PlayerResultsSorProps {
  kinchSor?: KinChSorResult;
}

const PlayerResultsSor: React.FC<PlayerResultsSorProps> = ({ kinchSor }) => {
  const { t, locale } = useI18n();
  if (!kinchSor) {
    return null;
  }
  const kinchSorCol = [
    {
      title: t('competitionAdmin.rank'),
      dataIndex: 'Rank',
      key: 'Rank',
      width: 60,
      fixed: 'left' as const,
    },
    {
      title: t('competitionExtra.score'),
      dataIndex: 'Value',
      key: 'Value',
      width: 200,
    },
  ];

  const kinchSorWithCol = [
    {
      title: t('competitionAdmin.event'),
      dataIndex: 'Event',
      key: 'Event',
      fixed: 'left' as const,
      render: (value: string) => {
        return (
          <>
            {CubeIcon(value, value, {})} {CubesCn(value, locale)}{' '}
          </>
        );
      },
      width: 150,
    },
    {
      title: t('competitionExtra.score'),
      dataIndex: 'Value',
      key: 'Value',
      width: 200,
    },
  ];

  let withEvent = [];
  for (let i = 0; i < kinchSor.Results.length; i++) {
    withEvent.push({
      key: kinchSor.Results[i].Event,
      Event: kinchSor.Results[i].Event,
      Value: kinchSor.Results[i].Result,
    });
  }


  const content = (
    <div>
      <p>{t('competitionExtra.sorTimed')}</p>
      <p>{t('competitionExtra.sorRepeated')}</p>
    </div>
  );

  return (
    <>
      <Popover content={content} title={t('competitionExtra.sorAlgorithm')} trigger="hover">
        <Button size="small" style={{ background: "var(--muted)", color: "var(--accent)" }}>{t('competitionExtra.explanation')}</Button>
      </Popover>


      <SectionHeader title={t('competitionExtra.totalScore')} />

      <div className={styles.playerTableScroll}>
        <Table
          // @ts-ignore
          columns={kinchSorCol}
          dataSource={[
            {
              key: "total",
              Rank: kinchSor.Rank,
              Value: kinchSor.Result,
            },
          ]}
          rowKey="key"
          pagination={false}
          className="cube-player-sor-table"
          scroll={{ x: 'max-content' }}
        />
      </div>

      <SectionHeader title={t('competitionExtra.eventScore')} />
      <div className={styles.playerTableScroll}>
        <Table
          // @ts-ignore
          columns={kinchSorWithCol}
          dataSource={withEvent}
          rowKey="Event"
          pagination={false}
          className="cube-player-sor-table"
          scroll={{ x: 'max-content' }}
        />
      </div>
    </>
  );
};

export default PlayerResultsSor;
