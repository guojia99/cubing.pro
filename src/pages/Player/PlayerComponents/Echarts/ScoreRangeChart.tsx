import { resultTimeString } from '@/components/Data/types/result';
import ReactECharts from 'echarts-for-react';
import React, { useState } from 'react';
import { Select } from 'antd';

interface ScoreRangeChartProps {
  inputData: number[];
}

const ScoreRangeChart: React.FC<ScoreRangeChartProps> = ({ inputData }) => {
  // 过滤掉负数
  const data = inputData.filter((n) => n >= 0);

  // 时间间隔选项
  const intervalOptions = [0.5, 1, 2, 3, 4, 5, 10];

  // 当前选择的时间间隔
  const [selectedInterval, setSelectedInterval] = useState<number>(5);

  // 动态生成区间范围
  const generateRanges = (data: number[], interval: number) => {
    const ranges = [];
    const min = Math.floor(Math.min(...data) / interval) * interval;
    const max = Math.ceil(Math.max(...data) / interval) * interval;

    for (let i = min; i < max; i += interval) {
      ranges.push([i, i + interval]);
    }
    return ranges;
  };

  const ranges = generateRanges(data, selectedInterval);
  const rangeCounts = ranges.map(([min, max]) =>
    data.filter((score) => score >= min && score < max).length,
  );

  // 找到成绩次数最多的三个柱的索引
  const topThreeIndices = rangeCounts
    .map((count, index) => ({ count, index }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(({ index }) => index);

  const option = {
    title: {
      text: `成绩分布图（每 ${selectedInterval} 秒）`,
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
        name: '人数',
        data: rangeCounts.map((count, idx) => ({
          value: count,
          itemStyle: topThreeIndices.includes(idx) ? { color: '#f47885' } : { color: '#4CAF50' },
        })),
        type: 'bar',
      },
    ],
  };

  return (
    <div>
      <label htmlFor="interval-select">选择时间间隔：</label>
      <Select
        id="interval-select"
        value={selectedInterval}
        onChange={(e) => setSelectedInterval(Number(e))}
        style={{minWidth: 120}}
      >
        {intervalOptions.map((option) => (
          <Select.Option key={option} value={option}>
            {option} 秒
          </Select.Option>
        ))}
      </Select>

      <ReactECharts option={option} style={{ height: 400 }} />
    </div>
  );
};

export default ScoreRangeChart;
