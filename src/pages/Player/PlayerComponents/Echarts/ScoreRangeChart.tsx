import { resultTimeString } from '@/components/Data/types/result';
import { getQuantile } from '@/pages/Player/PlayerComponents/Echarts/RollingQuantileChart';
import ReactECharts from 'echarts-for-react';
import React from 'react';

interface ScoreRangeChartProps {
  inputData: number[];
}

const getQuartiles = (sorted: number[]) => {
  return {
    Q1: getQuantile(sorted, 0.25),
    Q2: getQuantile(sorted, 0.5),
    Q3: getQuantile(sorted, 0.75),
  };
};

const alignDown5 = (n: number) => Math.floor(n / 5) * 5;
const alignUp5 = (n: number) => Math.ceil(n / 5) * 5;

const generateRanges = (data: number[]): [number, number][] => {
  if (data.length === 0) return [];

  const intData = data.map((n) => Math.floor(n)); // 取整
  const sorted = [...intData].sort((a, b) => a - b);
  const { Q1, Q3 } = getQuartiles(sorted);
  const min = alignDown5(sorted[0]);
  const max = alignUp5(sorted[sorted.length - 1]);

  const ranges: [number, number][] = [];

  // 上段（好）：min ~ Q1，步长5
  for (let start = min; start < Q1; start += 5) {
    ranges.push([start, start + 5]);
  }

  // 中段：Q1 ~ Q3，步长10
  const midStart = alignDown5(Q1);
  for (let start = midStart; start < Q3; start += 10) {
    ranges.push([start, start + 10]);
  }

  // 下段（差）：Q3 ~ max，步长15
  const lowStart = alignDown5(Q3);
  for (let start = lowStart; start < max; start += 15) {
    ranges.push([start, start + 15]);
  }

  return ranges;
};

const ScoreRangeChart: React.FC<ScoreRangeChartProps> = ({ inputData }) => {
  const data = inputData.filter((n) => n >= 0);

  const intData = data.map((n) => Math.floor(n));
  const ranges = generateRanges(intData);

  const rangeCounts = ranges.map(
    ([min, max]) => intData.filter((score) => score >= min && score < max).length,
  );

  const option = {
    title: {
      text: '成绩分布图',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 次',
    },
    xAxis: {
      type: 'category',
      data: ranges.map(([min, max]) => `${resultTimeString(min)} - ${resultTimeString(max)}`),
    },
    yAxis: {
      type: 'value',
      name: '次数',
    },
    series: [
      {
        data: rangeCounts,
        type: 'bar',
        itemStyle: {
          color: '#4CAF50',
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default ScoreRangeChart;
