import { resultTimeString } from '@/components/Data/types/result';
import {
  getChartAxisStyle,
  getChartSeriesColors,
  getChartTooltipStyle,
  mixCssColors,
} from '@/theme/chartColors';
import { useThemeColors } from '@/theme/useThemeColors';
import { Card, Col, Row, Typography } from 'antd';
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useI18n } from '@/contexts/I18nProvider';

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
      variant="borderless"
      hoverable
      style={{
        width: 160,
        maxWidth: '100%',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
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

function buildBoPastelMap(counts: number[], theme: ReturnType<typeof useThemeColors>): Record<number, string> {
  const series = getChartSeriesColors(counts.length);
  return Object.fromEntries(
    counts.map((count, i) => [
      count,
      mixCssColors(series[i]!, theme.background, 92),
    ]),
  );
}

export const BOBestGroup: React.FC<BOGroupProps> = ({ data }) => {
  const { t } = useI18n();
  const theme = useThemeColors();
  const boColors = buildBoPastelMap(boList, theme);
  const validData = data.filter((n) => n >= 0);
  return (
    <Card style={{ marginTop: 24, marginBottom: 24 }}>
      <h3>
        <strong>{t('competitionExtra.bestAverages')}</strong>
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

export const BORecentGroup: React.FC<BOGroupProps> = ({data}) => {
  const { t } = useI18n();
  const theme = useThemeColors();
  const boRecentColors = buildBoPastelMap(boRecentList, theme);

  const maxLen = data.length;
  const validData = data.filter((n) => n >= 0).slice(0, maxLen > 100 ? 100: maxLen)

  return (
    <Card style={{ marginTop: 24, marginBottom: 24 }}>
      <h3>
        <strong>{t('competitionExtra.recentValidResults')}</strong>
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
  const { t } = useI18n();
  const theme = useThemeColors();
  const barColor = theme.accent;
  // 统计每个区间的个数
  const rangeCounts = ranges.map(([min, max]) =>
    data.filter((score) => score >= min && score < max).length
  );

  const option = {
    textStyle: { color: theme.foreground },
    title: {
      textStyle: { color: theme.foreground },
      text: t('competitionExtra.scoreRanges'),
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
      data: ranges.map(([min, max]) => `${min} - ${max}`),
    },
    yAxis: {
      ...getChartAxisStyle(),
      nameTextStyle: { color: theme.mutedForeground },
      type: 'value',
      name: t('competitionAdmin.frequency'),
    },
    series: [
      {
        data: rangeCounts,
        type: 'bar',
        itemStyle: {
          color: barColor,
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};
