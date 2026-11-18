import { resultTimeString } from '@/components/Data/types/result';
import { getChartAxisStyle, getChartTooltipStyle } from '@/theme/chartColors';
import { useThemeColors } from '@/theme/useThemeColors';
import ReactECharts from 'echarts-for-react';
import React, { useState } from 'react';
import { Select } from 'antd';
import { useI18n } from '@/contexts/I18nProvider';

interface ScoreRangeChartProps {
  inputData: number[];
}

const ScoreRangeChart: React.FC<ScoreRangeChartProps> = ({ inputData }) => {
  const { t, tf } = useI18n();
  const theme = useThemeColors();
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
    textStyle: { color: theme.foreground },
    title: {
      textStyle: { color: theme.foreground, fontSize: 16 },
      text: tf('competitionAdmin.distribution', { seconds: selectedInterval }),
      left: 'center',
    },
    tooltip: {
      ...getChartTooltipStyle(),
      trigger: 'axis',
      formatter: t('competitionAdmin.frequencyTooltip'),
    },
    xAxis: {
      ...getChartAxisStyle(),
      type: 'category',
      data: ranges.map(([min, max]) => `${resultTimeString(min)} - ${resultTimeString(max)}`),
    },
    yAxis: {
      ...getChartAxisStyle(),
      min: 0,
      nameTextStyle: { color: theme.mutedForeground },
      type: 'value',
      name: t('competitionAdmin.frequency'),
    },
    series: [
      {
        name: t('competitionAdmin.players'),
        data: rangeCounts.map((count, idx) => ({
          value: count,
          itemStyle: topThreeIndices.includes(idx)
            ? { color: theme.destructive }
            : { color: theme.signalSuccess },
        })),
        type: 'bar',
      },
    ],
  };

  return (
    <div>
      <div className="competition-toolbar">
      <label htmlFor="interval-select">{t('competitionAdmin.interval')}</label>
      <Select
        id="interval-select"
        value={selectedInterval}
        onChange={(e) => setSelectedInterval(Number(e))}
        style={{minWidth: 120}}
      >
        {intervalOptions.map((option) => (
          <Select.Option key={option} value={option}>
            {tf('competitionAdmin.seconds', { count: option })}
          </Select.Option>
        ))}
      </Select>
      </div>

      <ReactECharts option={option} style={{ height: 400 }} />
    </div>
  );
};

export default ScoreRangeChart;
