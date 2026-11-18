import { Card, Select } from 'antd';
import ReactECharts from 'echarts-for-react';
import React, { useMemo, useState } from 'react';
import { resultTimeString } from '@/components/Data/types/result';
import {
  getChartAxisStyle,
  getChartTooltipStyle,
  readCssVar,
} from '@/theme/chartColors';
import { useThemeColors } from '@/theme/useThemeColors';
import { useI18n } from '@/contexts/I18nProvider';

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
  const { t } = useI18n();
  const theme = useThemeColors();
  const q25Color = theme.signalInfo;
  const q50Color = theme.signalWarning;
  const q75Color = theme.destructive;
  const data = useMemo(() => inputData.filter((n) => n >= 0).reverse(), [inputData]);


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
          itemStyle: { color: theme.destructive },
          name: t('competitionAdmin.bestResult'),
        };
      }
      return null;
    }).filter(point => point !== null);
  }, [data, theme.destructive, t]);


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
    textStyle: { color: theme.foreground },
    title: {
      textStyle: { color: theme.foreground, fontSize: 16 },
      text: t('competitionAdmin.rollingQuantile'),
      left: 'center',
    },
    tooltip: {
      ...getChartTooltipStyle(),
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
      textStyle: { color: theme.mutedForeground },
      data: [t('competitionAdmin.result'), '25%', '50%', '75%'],
      top: 30,
    },
    xAxis: {
      ...getChartAxisStyle(),
      type: 'category',
      data: data.map((_, i) => i + 1),
      name: '',
    },
    yAxis: {
      ...getChartAxisStyle(),
      nameTextStyle: { color: theme.mutedForeground },
      type: 'value',
      name: t('competitionAdmin.result'),
      inverse: false,
      axisLabel: {
        color: theme.mutedForeground,
        formatter: (value: number) => resultTimeString(value),
      },
    },
    dataZoom: [
      {
        type: 'slider',
        borderColor: theme.border,
        textStyle: { color: theme.mutedForeground },
        start: 0,
        end: 100,
        bottom: 10,
      },
      { type: 'inside' },
    ],
    series: [
      {
        name: t('competitionAdmin.result'),
        type: 'line',
        data,
        symbol: 'circle',
        lineStyle: { color: theme.signalSuccess, opacity: .35 },
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
        lineStyle: { type: 'dashed', color: q25Color },
      },
      {
        name: '50%',
        type: 'line',
        data: q50,
        showSymbol: false,
        lineStyle: { type: 'dashed', color: q50Color },
      },
      {
        name: '75%',
        type: 'line',
        data: q75,
        showSymbol: false,
        lineStyle: { type: 'dashed', color: q75Color },
      },
    ],
  };

  return (
    <div>
      <div className="competition-toolbar">
        <span>{t('competitionAdmin.quantileWindow')}: </span>
        <Select
          aria-label={t('competitionAdmin.quantileWindow')}
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

      {(() => {
        const latestIndex = q25.length - 1;
        const latestQ25 = q25[latestIndex];
        const latestQ50 = q50[latestIndex];
        const latestQ75 = q75[latestIndex];

        if (latestQ25 === null || latestQ50 === null || latestQ75 === null) {
          return null;
        }

        return (
          <Card
            title={t('competitionAdmin.latestQuantiles')}
            style={{
              marginTop: 16,
              marginBottom: 16,
              background: readCssVar('--muted', theme.background),
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 16 }}>
              <div>
                <strong style={{ color: q25Color }}>25%</strong><br />
                {resultTimeString(latestQ25)}
              </div>
              <div>
                <strong style={{ color: q50Color }}>50%</strong><br />
                {resultTimeString(latestQ50)}
              </div>
              <div>
                <strong style={{ color: q75Color }}>75%</strong><br />
                {resultTimeString(latestQ75)}
              </div>
            </div>
          </Card>
        );
      })()}

      <ReactECharts option={option} style={{ height: 400 }} />
    </div>
  );
};

export default RollingQuantileChart;
