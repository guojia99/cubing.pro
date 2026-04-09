import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { eventRouteM } from '@/components/Data/cube_result/event_route';
import { Result, resultString, resultTimeString } from '@/components/Data/types/result';
import { WCALink } from '@/components/Link/Links';
import { rowClassNameWithStyleLines } from '@/components/Table/table_style';
import { AvatarURL } from '@/pages/Admin/AvatarDropdown';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { ProColumns } from '@ant-design/pro-table/es/typing';
import { Avatar, Card, Table, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from '@/pages/Player/playerPage.less';
import '@/components/Data/table_fixed_column.css';

interface PlayerDetailProps {
  player?: PlayersAPI.Player;
}

const detailCol = [
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
    title: '比赛场次',
    dataIndex: 'compNum',
    key: 'compNum',
    align: 'center',
    width: 130,
  },
  {
    title: '还原次数',
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
  const color = dom <= 1 ? '#cf1322' : 'var(--ant-color-text)';
  return (
    <h4 style={{ textAlign: 'center', color, margin: 0, fontWeight: 600 }}>{dom}</h4>
  );
};

const bestCol: ProColumns<BestTableRow>[] = [
  {
    title: '项目',
    dataIndex: 'event',
    key: 'event',
    fixed: 'left',
    render: (value: any) => {
      return (
        <strong>
          {CubeIcon(value, value + '_best_col', {})} {CubesCn(value)}
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
    title: '单次',
    dataIndex: 'bestResult',
    key: 'bestResult',
    align: 'center',
    width: 180,
  },
  {
    title: '平均',
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
  const [events, setEvents] = useState<EventsAPI.EventsResponse>();
  const fetchResult = () => {
    apiEvents().then((value) => {
      setEvents(value);
    });
  };
  useEffect(() => {
    fetchResult();
  }, [player]);

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
      tags.push(<Tag color="red">大满贯</Tag>);
    }
  }

  return (
    <div className={styles.playerDetailWrap}>
      <Card style={{ marginBottom: '30px', maxWidth: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          {player?.Avatar && (
            <Avatar size={100} src={AvatarURL(player?.Avatar)} style={{ marginBottom: '20px' }} />
          )}
          <h2 style={{ fontWeight: '700', wordBreak: 'break-word' }}>{player?.Name}</h2>
          <>{tags}</>

          <div className={styles.playerTableScroll}>
            <Table
              // @ts-ignore
              columns={detailCol}
              dataSource={[
                {
                  cubeId: player?.CubeID,
                  wcaId: player?.WcaID,
                  compNum: player?.Detail.Matches,
                  resultNum: '' + player?.Detail.SuccessesNum + ' / ' + player?.Detail.RestoresNum,
                  topNum: player?.Detail.PodiumNum,
                },
              ]}
              pagination={false}
              className="cube-player-detail-meta-table"
              scroll={{ x: 'max-content' }}
            />
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          {wcaBestCols.length > 0 && (
            <>
              <h3 style={{ fontWeight: '700', textAlign: 'center', marginTop: '30px' }}>
                最佳记录
              </h3>
              <div className={styles.playerTableScroll}>
                <Table
                  // @ts-ignore
                  columns={bestCol}
                  rowClassName={rowClassNameWithStyleLines}
                  dataSource={wcaBestCols}
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
              <h3 style={{ fontWeight: '700', textAlign: 'center', marginTop: '30px' }}>
                趣味项目
              </h3>
              <div className={styles.playerTableScroll}>
                <Table
                  // @ts-ignore
                  columns={bestCol}
                  rowClassName={rowClassNameWithStyleLines}
                  dataSource={bestCols}
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
