import React from 'react';
import { Card, Progress, Typography } from 'antd';

const { Text, Title } = Typography;

interface SuccessRateBoxProps {
  data: number[];
}

const SuccessRateBox: React.FC<SuccessRateBoxProps> = ({ data }) => {
  const validData = data.filter(n => n >= 0);
  const successCount = validData.filter(n => n > 0).length;
  const totalCount = data.length;
  const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

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
          width: 240,
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
          percent={parseFloat(successRate.toFixed(1))}
          strokeColor="#52c41a"
          width={100}
        />
        <div style={{ marginTop: 16 }}>
          <Text>{successCount} / {totalCount}</Text>
        </div>
      </Card>
    </div>

  );
};

export default SuccessRateBox
