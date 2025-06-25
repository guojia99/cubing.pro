import { resultTimeString } from '@/components/Data/types/result';
import { Card, Col, Row, Typography } from 'antd';
import React from 'react';
import ReactECharts from 'echarts-for-react';

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
      <br />
      <Text style={{ fontSize: 16, lineHeight: 1.4 }}>{resultTimeString(average)}</Text>
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
  3: '#e6f7ff', // 淡蓝
  5: '#f9f0ff', // 淡紫
  12: '#fffbe6', // 淡黄
  50: '#e6fffb', // 淡青
  100: '#f6ffed', // 淡绿
  200: '#fff0f6', // 淡粉
  500: '#fafafa', // 淡灰
  1000: '#f0f5ff', // 淡靛
};




export const BOBestGroup: React.FC<BOGroupProps> = ({ data }) => {
  // 过滤掉负数后的有效成绩
  const validData = data.filter((n) => n >= 0);
  return (
    <Card style={{ marginTop: 24, marginBottom: 24 }}>
      <h3>
        <strong>最佳平均成绩</strong>
      </h3>
      <Row gutter={[16, 16]} justify="center">
        {boList
          .filter((count) => validData.length >= count) // 满足数量才展示
          .map((count) => (
            <Col key={count}>
              <BOBox count={count} data={validData} backgroundColor={boColors[count]} />
            </Col>
          ))}
      </Row>
    </Card>
  );
};


const boRecentList = [12, 25, 50, 75, 100];

const boRecentColors: Record<number, string> = {
  12: '#fffbe6',  // 淡黄
  25: '#fff7e6',  // 淡橙（新加）
  50: '#e6fffb',  // 淡青
  75: '#f0f5e6',  // 淡橄榄绿（新加）
  100: '#f6ffed', // 淡绿
};

export const BORecentGroup: React.FC<BOGroupProps> = ({data}) => {

  const maxLen = data.length;
  const validData = data.filter((n) => n >= 0).slice(0, maxLen > 100 ? 100: maxLen)

  console.log(validData)
  return (
    <Card style={{ marginTop: 24, marginBottom: 24 }}>
      <h3>
        <strong>近期有效成绩</strong>
      </h3>
      <Row gutter={[16, 16]} justify="center">
        {boRecentList
          .filter((count) => validData.length >= count) // 满足数量才展示
          .map((count) => (
            <Col key={count}>
              <BOBox count={count} data={validData} backgroundColor={boRecentColors[count]} />
            </Col>
          ))}
      </Row>
    </Card>
  );
}




interface ScoreRangeChartProps {
  data: number[];
  ranges: [number, number][];
}

export const ScoreRangeChart: React.FC<ScoreRangeChartProps> = ({ data, ranges }) => {
  // 统计每个区间的个数
  const rangeCounts = ranges.map(([min, max]) =>
    data.filter((score) => score >= min && score < max).length
  );

  const option = {
    title: {
      text: '成绩区间统计',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 人',
    },
    xAxis: {
      type: 'category',
      data: ranges.map(([min, max]) => `${min} - ${max}`),
    },
    yAxis: {
      type: 'value',
      name: '成绩',
    },
    series: [
      {
        data: rangeCounts,
        type: 'bar',
        itemStyle: {
          color: '#73C0DE',
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};
