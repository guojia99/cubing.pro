import { CubesCn } from '@/components/CubeIcon/cube';
import { useI18n } from '@/contexts/I18nProvider';
import { PageHeader, SectionHeader } from '@/components/ui/page';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { eventRouteM } from '@/components/Data/cube_result/event_route';
import { Result, resultString, resultTimeString } from '@/components/Data/types/result';
import { WCALink } from '@/components/Link/WcaLinks';
import { rowClassNameWithStyleLines } from '@/components/Table/table_style';
import { avatarUrl } from '@/lib/avatarUrl';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { isRequestCanceled } from '@/services/cubing-pro/request';
import { Avatar, Card, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import styles from '@/views/GroupCompetitions/Player/gc-player.module.css';
import '@/components/Data/table_fixed_column.css';

interface PlayerDetailProps {
  player?: PlayersAPI.Player;
}

const getDetailCol = (t: ReturnType<typeof useI18n>['t']): ColumnsType<{
  key: string;
  cubeId?: string;
  wcaId?: string;
  compNum?: number;
  resultNum: string;
  topNum?: number;
}> => [
  {
    title: 'CubeID',
    dataIndex: 'cubeId',
    key: 'cubeId',
    align: 'center',
    render: (value: any) => {
      return <strong>{value}</strong>;
    },
    width: 150,
  },
  {
    title: 'WcaID',
    dataIndex: 'wcaId',
    key: 'wcaId',
    align: 'center',
    render: (value: string) => {
      return WCALink(value);
    },
    width: 150,
  },
  {
    title: t('competitionExtra.matches'),
    dataIndex: 'compNum',
    key: 'compNum',
    align: 'center',
    width: 130,
  },
  {
    title: t('competitionExtra.solves'),
    dataIndex: 'resultNum',
    key: 'resultNum',
    align: 'center',
    // width: 130,
  },
  // {
  //   title: '领奖台',
  //   dataIndex: 'topNum',
  //   key: 'topNum',
  //   align: 'center',
  // },
];

type BestTableRow = {
  event: string;
  Route: number;
  bestCRRank: string;
  bestResult: string;
  avgResult: string;
  avgCRRank: string;
};

const rankRender = (dom: number) => {
  const color = dom <= 1 ? 'var(--destructive)' : 'var(--foreground)';
  return (
    <h4 style={{ textAlign: 'center', color, margin: 0, fontWeight: 600 }}>{dom}</h4>
  );
};

const getBestCol = (t: ReturnType<typeof useI18n>['t'], locale: ReturnType<typeof useI18n>['locale']): ColumnsType<BestTableRow> => [
  {
    title: t('competitionAdmin.event'),
    dataIndex: 'event',
    key: 'event',
    fixed: 'left',
    render: (value: any) => {
      return (
        <strong>
          {CubeIcon(value, value + '_best_col', {})} {CubesCn(value, locale)}
        </strong>
      );
    },
    width: 130,
  },
  {
    title: 'CR',
    dataIndex: 'bestCRRank',
    key: 'bestCRRank',
    align: 'center',
    // @ts-ignore
    render: rankRender,
  },
  {
    title: t('competitionAdmin.single'),
    dataIndex: 'bestResult',
    key: 'bestResult',
    align: 'center',
    width: 180,
  },
  {
    title: t('competitionAdmin.average'),
    dataIndex: 'avgResult',
    key: 'avgResult',
    align: 'center',
    width: 180,
  },
  {
    title: 'CR',
    dataIndex: 'avgCRRank',
    key: 'avgCRRank',
    align: 'center',

    // @ts-ignore
    render: rankRender,
  },
];

const PlayerDetail: React.FC<PlayerDetailProps> = ({ player }) => {
  const { t, locale } = useI18n();
  const detailCol = getDetailCol(t);
  const bestCol = getBestCol(t, locale);
  const [events, setEvents] = useState<EventsAPI.EventsResponse>();

  useEffect(() => {
    const controller = new AbortController();

    apiEvents({ signal: controller.signal })
      .then((value) => {
        setEvents(value);
      })
      .catch((error) => {
        if (!isRequestCanceled(error)) {
          console.error('Failed to load events:', error);
        }
      });

    return () => controller.abort();
  }, []);

  const wcaBestCols: BestTableRow[] = [];
  const bestCols: BestTableRow[] = [];

  const tags = [];

  let wcaEventsLen = 0;
  events?.data.Events.forEach((value: EventsAPI.Event) => {
    if (!value.isComp) {
      return;
    }
    if (value.isWCA) {
      wcaEventsLen += 1;
    }
    if (
      player?.BestResults === null ||
      player?.BestResults === undefined ||
      player?.BestResults.Single === null
    ) {
      return;
    }

    const best = player?.BestResults.Single[value.id] as Result;
    if (best === undefined) {
      return;
    }

    const m = eventRouteM(value.base_route_typ);

    let bestResult = resultTimeString(best.Best, m.integer);
    if (m.repeatedly) {
      bestResult = resultString(best.Result, best.EventRoute).join('');
    }

    let row: BestTableRow = {
      Route: value.base_route_typ,
      event: value.id,
      bestCRRank: best.Rank + '',
      bestResult: bestResult,
      avgResult: '-',
      avgCRRank: '-',
    };

    if (player?.BestResults.Avgs !== null) {
      const avg = player?.BestResults.Avgs[value.id] as Result;
      if (avg !== undefined) {
        row.avgCRRank = avg.Rank + '';
        row.avgResult = resultTimeString(avg.Average);
      }
    }
    if (value.isWCA) {
      wcaBestCols.push(row);
    } else {
      bestCols.push(row);
    }
  });

  if (wcaEventsLen === wcaBestCols.length) {
    let has = true;
    for (let i = 0; i < wcaBestCols.length; i++) {
      if (eventRouteM(wcaBestCols[i].Route).repeatedly) {
        continue;
      }
      if (wcaBestCols[i].avgResult === '-') {
        has = false;
      }
    }
    if (has) {
      tags.push(<Tag key="all-events-complete" color="red">{t('competitionExtra.allEventsComplete')}</Tag>);
    }
  }

  return (
    <div className={styles.playerDetailWrap}>
      <Card style={{ marginBottom: '30px', maxWidth: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          {player?.Avatar && (
            <Avatar size={100} src={avatarUrl(player?.Avatar)} style={{ marginBottom: '20px' }} />
          )}
          <PageHeader eyebrow={player?.CubeID} title={player?.Name} />
          <>{tags}</>

          <div className={styles.playerTableScroll}>
            <Table
              columns={detailCol}
              dataSource={[
                {
                  key: "player-meta",
                  cubeId: player?.CubeID,
                  wcaId: player?.WcaID,
                  compNum: player?.Detail.Matches,
                  resultNum: '' + player?.Detail.SuccessesNum + ' / ' + player?.Detail.RestoresNum,
                  topNum: player?.Detail.PodiumNum,
                },
              ]}
              rowKey="key"
              pagination={false}
              className="cube-player-detail-meta-table"
              scroll={{ x: 'max-content' }}
            />
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          {wcaBestCols.length > 0 && (
            <>
              <SectionHeader title={t('competitionExtra.bestRecords')} />
              <div className={styles.playerTableScroll}>
                <Table
                  columns={bestCol}
                  rowClassName={rowClassNameWithStyleLines}
                  dataSource={wcaBestCols}
                  rowKey="event"
                  pagination={false}
                  size="small"
                  className="cube-player-best-table"
                  scroll={{ x: 'max-content' }}
                />
              </div>
            </>
          )}

          {bestCols.length > 0 && (
            <>
              {' '}
              <SectionHeader title={t('competitionExtra.funEvents')} />
              <div className={styles.playerTableScroll}>
                <Table
                  columns={bestCol}
                  rowClassName={rowClassNameWithStyleLines}
                  dataSource={bestCols}
                  rowKey="event"
                  pagination={false}
                  size="small"
                  className="cube-player-best-table"
                  scroll={{ x: 'max-content' }}
                />
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
export default PlayerDetail;
