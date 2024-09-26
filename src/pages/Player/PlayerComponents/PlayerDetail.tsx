import { WCALink } from '@/components/Link/Links';
import { Avatar, Card, Table } from 'antd';
import React from 'react';

interface PlayerDetailProps {
  player?: PlayersAPI.Player;
}

const PlayerDetail: React.FC<PlayerDetailProps> = ({ player }) => {
  const tableCol = [
    {
      title: 'CubeID',
      dataIndex: 'cubeId',
      key: 'cubeId',
      align: 'center',
      render: (value: any) => {
        return <strong>{value}</strong>;
      },
    },
    {
      title: 'WcaID',
      dataIndex: 'wcaId',
      key: 'wcaId',
      align: 'center',
      render: (value: string) => {
        return WCALink(value);
      },
    },
    {
      title: '比赛场次',
      dataIndex: 'compNum',
      key: 'compNum',
      align: 'center',
    },
    {
      title: '还原次数',
      dataIndex: 'resultNum',
      key: 'resultNum',
      align: 'center',
    },
    {
      title: '领奖台',
      dataIndex: 'topNum',
      key: 'topNum',
      align: 'center',
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div style={{ textAlign: 'center' }}>
          {player?.Avatar && <Avatar size={100} src={player?.Avatar} style={{ marginBottom: '20px' }} />}
          <h2 style={{ fontWeight: '700' }}>{player?.Name}</h2>
          <Table
            // @ts-ignore
            columns={tableCol}
            dataSource={[
              {
                cubeId: player?.CubeID,
                wcaId: player?.WcaID,
                compNum: 114515,
                resultNum: '99999/114514',
                topNum: 10,
              },
            ]}
            pagination={false}
          />
        </div>
      </Card>
    </div>
  );
};
export default PlayerDetail;
