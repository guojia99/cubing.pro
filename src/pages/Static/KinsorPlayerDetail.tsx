// 玩家详细成绩弹窗组件
import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { PlayerLink, WCALinkWithCnName } from '@/components/Link/Links';
import { KinChSorResult } from '@/services/cubing-pro/statistics/typings';
import { Modal, Table, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

// getScoreColor 计算颜色，根据分数从绿色到红色渐变
export const getScoreColor = (score: number) => {
  if (score <= 0) return '#ccc'; // 无成绩显示灰色
  const normalizedScore = Math.min(100, Math.max(0, score)); // 限制在0-100之间
  const red = Math.round(180 * (normalizedScore / 100)); // 100分时为180（哑光红色）
  const green = Math.round(150 * (1 - normalizedScore / 100));
  const blue = Math.round(50 * (1 - normalizedScore / 100));
  return `rgb(${red}, ${green}, ${blue})`;
};





const KinchPlayerDetailModal: React.FC<{
  visible: boolean;
  onCancel: () => void;
  player: KinChSorResult;
  isSenior: boolean;
}> = ({ visible, onCancel, player, isSenior }) => {
  // 将玩家的成绩数据转换为表格数据
  const tableData = player.Results.map((result, index) => ({
    key: index,
    event: result.Event,
    eventResult: result.Result,
    bestResultString: result.ResultString || '-',
  }));

  const columns = [
    {
      title: '项目',
      dataIndex: 'event',
      key: 'event',
      align: 'center',
      render: (event: string) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {CubeIcon(event, `${event}_detail`, {})}
          <span style={{ marginLeft: 8 }}>{CubesCn(event)}</span>
        </div>
      ),
    },
    {
      title: '项目分数',
      dataIndex: 'eventResult',
      key: 'eventResult',
      align: 'center',
      render: (score: number) => (
        <Text style={{ color: getScoreColor(score), fontWeight: score > 0 ? 'bold' : 'normal' }}>
          {score > 0 ? score.toFixed(2) : '-'}
        </Text>
      ),
    },
    {
      title: '项目详细成绩',
      align: 'center',
      dataIndex: 'bestResultString',
      key: 'bestResultString',
      render: (result: string) => {
        return <strong>{result}</strong>;
      },
    },
  ];

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          {isSenior ? (
            WCALinkWithCnName(player.wca_id, player.WcaName)
          ) : (
            <>{PlayerLink(player.CubeId, player.PlayerName, 'rgb(29,177,236)')}</>
          )}
          <div style={{ marginTop: 8, fontSize: '16px', color: '#f23f3f' }}>
            总分: <strong>{player.Result.toFixed(3)}</strong>
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
    >
      <Table
        // @ts-ignore
        columns={columns}
        dataSource={tableData}
        pagination={false}
        size="small"
        rowKey="key"
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
};

export default KinchPlayerDetailModal;
