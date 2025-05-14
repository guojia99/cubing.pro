import React from "react";
import ReactECharts from "echarts-for-react";

type ScoreType = "best" | "average";

interface ScoreData {
  index: number;
  value: number | null;
  type: ScoreType;
  round: string;
  valueStr?: string;
}

interface Props {
  data: ScoreData[];
  renderScore?: (value: number) => string;
}

const ScoreLineChart: React.FC<Props> = ({ data, renderScore }) => {
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
        name: "Best",
        type: "line",
        data: formatSeriesData(bestData),
        itemStyle: { color: "#5470C6" },
        symbol: "circle",
        symbolSize: 8,
      },
    ];

    if (averageData.length > 0) {
      series.push({
        name: "Average",
        type: "line",
        data: formatSeriesData(averageData),
        itemStyle: { color: "#91CC75" },
        symbol: "triangle",
        symbolSize: 8,
      });
    }

    return series;
  };


  const option = {
    title: {
      text: "成绩折线图",
    },
    tooltip: {
      trigger: "axis",
      formatter: (params: any[]) => {
        const idx = params[0].dataIndex;
        const round = bestData[idx]?.round || averageData[idx]?.round;

        const best = bestData[idx];
        const avg = averageData[idx];

        const lines: string[] = [`场次: ${round}`];

        if (best) {
          lines.push(`Best: ${getLabel(best)}`);
        }
        if (avg) {
          lines.push(`Average: ${getLabel(avg)}`);
        }

        return lines.join("<br/>");
      },
    },

    legend: {
      data: ["Best", ...(averageData.length > 0 ? ["Average"] : [])],
    },
    xAxis: {
      type: "category",
      data: xAxisData.map((x) => `#${x.value}`),
      name: "Index",
    },
    yAxis: {
      type: "value",
      name: "成绩",
    },
    series: getSeries(),
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default ScoreLineChart;
