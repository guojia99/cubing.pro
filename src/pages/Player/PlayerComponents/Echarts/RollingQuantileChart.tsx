import { Select } from 'antd';
import ReactECharts from 'echarts-for-react';
import React, { useMemo, useState } from 'react';
import { resultTimeString } from '@/components/Data/types/result';

const { Option } = Select;

interface RollingQuantileChartProps {
  inputData: number[];
  baseWindowSize?: number;
}

export const getQuantile = (sorted: number[], p: number): number => {
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
};

const RollingQuantileChart: React.FC<RollingQuantileChartProps> = ({ inputData, baseWindowSize=50 }) => {
  const data = inputData.filter((n) => n >= 0).reverse();


  // 计算最佳成绩点
  const bestPoints = useMemo(() => {
    let minSoFar = Infinity;
    return data.map((value, index) => {
      if (value < minSoFar) {
        minSoFar = value;
        return {
          xAxis: index ,
          yAxis: value,
          symbolSize: 10,
          itemStyle: { color: 'red' },
          name: '最佳成绩',
        };
      }
      return null;
    }).filter(point => point !== null);
  }, [data]);


  const [windowSize, setWindowSize] = useState(baseWindowSize);

  // 通过 useMemo 缓存计算，windowSize 和 data 变化时重新计算
  const { q25, q50, q75 } = useMemo(() => {
    const q25Arr: (number | null)[] = [];
    const q50Arr: (number | null)[] = [];
    const q75Arr: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < windowSize - 1) {
        q25Arr.push(null);
        q50Arr.push(null);
        q75Arr.push(null);
      } else {
        const window = data.slice(i - windowSize + 1, i + 1).sort((a, b) => a - b);
        q25Arr.push(getQuantile(window, 0.25));
        q50Arr.push(getQuantile(window, 0.5));
        q75Arr.push(getQuantile(window, 0.75));
      }
    }
    return { q25: q25Arr, q50: q50Arr, q75: q75Arr };
  }, [data, windowSize]);

  const option = {
    title: {
      text: `滚动分位线`,
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => {
        const index = params[0].dataIndex + 1;

        return `
          ${index}<br/>
          ${params
          .map(
            (item) => {
              if (!item.value){
                return '';
              }
              return  `<span>${item.marker} ${item.seriesName}: ${resultTimeString(item.value)}</span><br/>`
            }
          )
          .join('')}
        `;
      },
    },
    legend: {
      data: ['成绩', '25%', '50%', '75%'],
      top: 30,
    },
    xAxis: {
      type: 'category',
      data: data.map((_, i) => i + 1),
      name: '',
    },
    yAxis: {
      type: 'value',
      name: '成绩',
      inverse: false,
      axisLabel: {
        formatter: (value: number) => resultTimeString(value),
      },
    },
    dataZoom: [
      {
        type: 'slider',
        start: 0,
        end: 100,
        bottom: 10,
      },
      { type: 'inside' },
    ],
    series: [
      {
        name: '成绩',
        type: 'line',
        data,
        symbol: 'circle',
        lineStyle: { color: 'rgba(65,214,139,0.35)' },
        markPoint: {
          symbolSize: 40,
          label: {
            show: false,
          },
          data: bestPoints, // 使用最佳成绩点
        },
      },
      {
        name: '25%',
        type: 'line',
        data: q25,
        showSymbol: false,
        lineStyle: { type: 'dashed', color: '#111dff' },
      },
      {
        name: '50%',
        type: 'line',
        data: q50,
        showSymbol: false,
        lineStyle: { type: 'dashed', color: '#f89600' },
      },
      {
        name: '75%',
        type: 'line',
        data: q75,
        showSymbol: false,
        lineStyle: { type: 'dashed', color: '#EE6666' },
      },
    ],
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <span>选择百分位成绩计入数: </span>
        <Select
          value={windowSize}
          onChange={(value) => setWindowSize(value)}
          style={{ width: 120 }}
        >
          {[12, 50, 75, 100, 200].map((size) => (
            <Option key={size} value={size}>
              {size}
            </Option>
          ))}
        </Select>
      </div>
      <ReactECharts option={option} style={{ height: 400 }} />
    </div>
  );
};

export default RollingQuantileChart;
