import React from "react";
import ReactECharts from "echarts-for-react";
import { useI18n } from "@/contexts/I18nProvider";
import { formatRoundName } from '@/i18n/messages/domain';

import {
  getChartAxisStyle,
  getChartSeriesColors,
  getChartTooltipStyle,
} from "@/theme/chartColors";

type ScoreType = "best" | "average";

interface ScoreData {
  index: number;
  value: number | null;
  type: ScoreType;
  round: string;
  competition?: string;
  valueStr?: string;
}

interface Props {
  data: ScoreData[];
  renderScore?: (value: number) => string;
}

const ScoreLineChart: React.FC<Props> = ({ data, renderScore }) => {
  const { t, locale } = useI18n();
  const seriesColors = getChartSeriesColors(2);
  const axisStyle = getChartAxisStyle();
  const tooltipStyle = getChartTooltipStyle();
  const bestData = data.filter((item) => item.type === "best");
  const averageData = data.filter((item) => item.type === "average");

  // const rounds = [...new Set(data.map((item) => item.round))];

  // 构建横轴（index）与对应round映射
  const xAxisData = bestData.map((item) => ({
    value: item.index,
    round: item.round,
  }));

  // 渲染函数：优先用 valueStr，然后 fallback 到 renderScore，再 fallback 到 DNF
  const getLabel = (val: ScoreData) => {
    if (val.valueStr) return val.valueStr;
    if (val.value === null) return "DNF";
    return renderScore ? renderScore(val.value) : val.value.toString();
  };

  const getSeries = () => {
    const formatSeriesData = (arr: ScoreData[]) =>
      arr.map((item) => ({
        value: item.value,
        // 不再显示 label 标签
        label: { show: false },
      }));

    const series = [
      {
        name: t('competitionAdmin.best'),
        type: "line",
        data: formatSeriesData(bestData),
        itemStyle: { color: seriesColors[0] },
        symbol: "circle",
        symbolSize: 8,
      },
    ];

    if (averageData.length > 0) {
      series.push({
        name: t('competitionAdmin.average'),
        type: "line",
        data: formatSeriesData(averageData),
        itemStyle: { color: seriesColors[1] },
        symbol: "triangle",
        symbolSize: 8,
      });
    }

    return series;
  };


  const option = {
    title: {
      text: t('competitionAdmin.trajectory'),
    },
    tooltip: {
      trigger: "axis",
      ...tooltipStyle,
      formatter: (params: any[]) => {
        const idx = params[0].dataIndex;
        const round = formatRoundName(bestData[idx]?.round || averageData[idx]?.round || '', locale);

        const best = bestData[idx];
        const avg = averageData[idx];

        const competition = bestData[idx]?.competition || averageData[idx]?.competition || '';
        const lines: string[] = [`${t('competitionAdmin.round')}: ${competition}${round}`];

        if (best) {
          lines.push(`${t('competitionAdmin.best')}: ${getLabel(best)}`);
        }
        if (avg) {
          lines.push(`${t('competitionAdmin.average')}: ${getLabel(avg)}`);
        }

        return lines.join("<br/>");
      },
    },

    legend: {
      data: [t('competitionAdmin.best'), ...(averageData.length > 0 ? [t('competitionAdmin.average')] : [])],
    },
    xAxis: {
      type: "category",
      data: xAxisData.map((x) => `#${x.value}`),
      name: t('competitionAdmin.index'),
      ...axisStyle,
    },
    yAxis: {
      type: "value",
      name: t('competitionAdmin.result'),
      ...axisStyle,
    },
    series: getSeries(),
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default ScoreLineChart;
