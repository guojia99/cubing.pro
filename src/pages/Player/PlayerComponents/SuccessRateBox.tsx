import React from 'react';
import { Card, Progress, Typography } from 'antd';

const { Text, Title } = Typography;

interface SuccessRateBoxProps {
  data: number[];
}

const calculateRate = (data: number[]) => {
  const total = data.length;
  const success = data.filter(n => n > 0).length;
  return total > 0 ? (success / total) * 100 : 0;
};

const SuccessRateBox: React.FC<SuccessRateBoxProps> = ({ data }) => {
  const totalCount = data.length;
  const successCount = data.filter(n => n > 0).length;
  const overallRate = calculateRate(data);

  const rate20 = data.length >= 20 ? calculateRate(data.slice(-20)) : null;
  const rate50 = data.length >= 50 ? calculateRate(data.slice(-50)) : null;
  const rate100 = data.length >= 100 ? calculateRate(data.slice(-100)) : null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Card
        bordered={false}
        style={{
          width: 260,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          padding: 24,
          background: '#fff',
        }}
      >
        <Title level={5}>成功率</Title>
        <Progress
          type="circle"
          percent={parseFloat(overallRate.toFixed(1))}
          strokeColor="#52c41a"
          width={100}
        />
        <div style={{ marginTop: 16 }}>
          <Text>{successCount} / {totalCount}</Text>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
          {rate20 !== null && <div>最近20把：{rate20.toFixed(0)}%</div>}
          {rate50 !== null && <div>最近50把：{rate50.toFixed(0)}%</div>}
          {rate100 !== null && <div>最近100把：{rate100.toFixed(0)}%</div>}
        </div>
      </Card>
    </div>
  );
};

export default SuccessRateBox;
