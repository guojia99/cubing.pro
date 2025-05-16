import React from 'react';
import {Card, Col, Row, Typography} from 'antd';
import {resultTimeString} from "@/components/Data/types/result";

const { Text } = Typography;

interface BOBoxProps {
  count: number;
  data: number[];
  backgroundColor?: string;
}

export const BOBox: React.FC<BOBoxProps> = ({ count, data, backgroundColor }) => {
  const validData = data.filter((n) => n >= 0).sort((a, b) => a - b); // 从小到大
  const best = validData.slice(0, count);
  const average = best.length > 0 ? best.reduce((a, b) => a + b, 0) / best.length : 0;

  return (
    <Card
      bordered={false}
      hoverable={true}
      style={{
        width: 160,
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        background: backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '16px 0',
      }}
    >
      <Text strong style={{ fontSize: 18, lineHeight: 1.4 }}>
        Bo{count}
      </Text>
      <br/>
      <Text style={{ fontSize: 16, lineHeight: 1.4 }}>
        {resultTimeString(average)}
      </Text>
    </Card>
  );
};

interface BOGroupProps {
  data: number[];
}

// 所有需要支持的 BO 数量
const boList = [3, 5, 12, 50, 100, 200, 500, 1000];
// 每个 BO 对应的淡色背景
const boColors: Record<number, string> = {
  3: '#e6f7ff',     // 淡蓝
  5: '#f9f0ff',     // 淡紫
  12: '#fffbe6',    // 淡黄
  50: '#e6fffb',    // 淡青
  100: '#f6ffed',   // 淡绿
  200: '#fff0f6',   // 淡粉
  500: '#fafafa',   // 淡灰
  1000: '#f0f5ff',  // 淡靛
};

const BOGroup: React.FC<BOGroupProps> = ({ data }) => {
  // 过滤掉负数后的有效成绩
  const validData = data.filter(n => n >= 0);
  return (
    <Card  style={{ marginTop: 24, marginBottom: 24 }} >
      <h3><strong>最佳平均成绩</strong></h3>
      <Row
        gutter={[16, 16]}
        justify="center"
      >
        {boList
          .filter(count => validData.length >= count) // 满足数量才展示
          .map((count) => (
            <Col key={count}>
              <BOBox count={count} data={validData} backgroundColor={boColors[count]} />
            </Col>
          ))}
      </Row>
    </Card>
  );
};

export default BOGroup;

