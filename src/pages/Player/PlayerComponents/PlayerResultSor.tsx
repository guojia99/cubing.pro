import '@/components/Data/table_fixed_column.css';
import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import styles from '@/pages/Player/playerPage.less';
import { KinChSorResult } from '@/services/cubing-pro/statistics/typings';
import { Button, Popover, Table } from 'antd';
import React from 'react';

interface PlayerResultsSorProps {
  kinchSor?: KinChSorResult;
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
      fixed: 'left' as const,
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
      fixed: 'left' as const,
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
      Event: kinchSor.Results[i].Event,
      Value: kinchSor.Results[i].Result,
    });
  }


  const content = (
    <div>
      <p>计时项目: (全网最佳 / 最佳分) × 100 </p>
      <p>多盲等多次尝试项目: 多盲分+(60-用时)/60</p>
    </div>
  );

  return (
    <>
      <Popover content={content} title="KinChSor 算法说明" trigger="hover">
        <Button style={{fontSize: 10, width: "4em", padding: 0, height: "2.5em", background: "#d8e7e6"}}>说明</Button>
      </Popover>


      <h3 style={{ marginTop: '20px', marginBottom: '20px' }}>
        <strong>总分</strong>
      </h3>

      <div className={styles.playerTableScroll}>
        <Table
          // @ts-ignore
          columns={kinchSorCol}
          dataSource={[
            {
              Rank: kinchSor.Rank,
              Value: kinchSor.Result,
            },
          ]}
          pagination={false}
          className="cube-player-sor-table"
          scroll={{ x: 'max-content' }}
        />
      </div>

      <h3 style={{ marginTop: '20px', marginBottom: '20px' }}>
        <strong>项目分</strong>
      </h3>
      <div className={styles.playerTableScroll}>
        <Table
          // @ts-ignore
          columns={kinchSorWithCol}
          dataSource={withEvent}
          pagination={false}
          className="cube-player-sor-table"
          scroll={{ x: 'max-content' }}
        />
      </div>
    </>
  );
};

export default PlayerResultsSor;
