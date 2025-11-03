import { get333MBFResult, resultsTimeFormat, secondTimeFormat } from '@/pages/WCA/utils/wca_results';
import { Card, Select, Tabs } from 'antd';
import ReactECharts from 'echarts-for-react';
import React, { useMemo, useState } from 'react';
import { roundNameMap } from '@/pages/WCA/utils/events';
import { WCACompetition, WCAResult } from '@/services/wca/types';
interface WCAResultChartProps {
  eventId: string;
  data: WCAResult[];
  comps: WCACompetition[];
}

// ===== 工具函数 =====
function getQuantile(arr: number[], q: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

export const WCAResultChart: React.FC<WCAResultChartProps> = ({ data, eventId, comps }) => {
  const [recentCount, setRecentCount] = useState<number>(20);

  // ===== 数据预处理 =====
  const reversedData = useMemo(() => [...data].reverse(), [data]);

 // 获取比赛信息
  const getCompInfo = (id: string) => {
    const comp = comps.find((c) => c.id === id);
    if (!comp) return null;
    return {
      name: comp.name,
    };
  };

  const chartData = useMemo(() => {
    const singles: number[] = [];
    const averages: number[] = [];
    const compWithNameRound: string[] = [];

    for (const r of reversedData) {
      const single = r.best;
      const average = r.average;
      if (eventId === '333mbf') {
        const parsed = get333MBFResult(single);

        // 计算多盲得分：成功数 - 失败数
        const score = parsed.solved - (parsed.attempted - parsed.solved);

        // 过滤无效成绩（DNF/DNS/0分）
        if (score > 0 && parsed.seconds > 0) {
          singles.push(score);
        }
      } else {
        singles.push(single);
        averages.push(average);
      }


      let compsAndRound = '';
      const comp = getCompInfo(r.competition_id)
      if (comp){
        compsAndRound += comp.name
      }
      compsAndRound += " | "
      compsAndRound += roundNameMap[r.round_type_id]
      compWithNameRound.push(compsAndRound);
    }

    return { singles, averages, compWithNameRound };
  }, [reversedData, eventId]);

  const combinedOption = useMemo(() => {
    // ===== 多盲专用逻辑 =====
    if (eventId === '333mbf') {
      let bestScore = -Infinity;
      let bestTimeForScore: Record<number, number> = {};

      const singlePoints = chartData.singles.map((score, i) => {
        const rawResult = reversedData[i];
        const parsed = get333MBFResult(rawResult.best);
        const { solved, attempted, seconds } = parsed;
        const compName = chartData.compWithNameRound[i]; // ✅ 比赛名

        const isPR =
          score > bestScore ||
          (score === bestScore &&
            (!bestTimeForScore[score] || seconds < bestTimeForScore[score]));

        if (score > bestScore) {
          bestScore = score;
          bestTimeForScore[score] = seconds;
        } else if (isPR) {
          bestTimeForScore[score] = seconds;
        }

        return {
          value: [i, score],
          itemStyle: isPR ? { color: 'red' } : undefined,
          prType: isPR
            ? score > bestScore - 1
              ? 'score'
              : 'time'
            : null,
          extra: { solved, attempted, seconds, compName },
        };
      });

      return {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any[]) => {
            const p = params[0];
            const data = p.data;
            if (!data || !data.extra) return `${p.marker}单次: DNF`;

            const { solved, attempted, seconds, compName, prType } = data.extra;
            const score = solved - (attempted - solved);
            const timeStr = secondTimeFormat(seconds, true);
            const prStr = prType
              ? `（<strong style="color:red;">新纪录${prType === 'time' ? '(同分更快)' : ''}</strong>）`
              : '';

            return `
            <strong>${compName || '未知比赛'}</strong><br/>
            ${p.marker}单次: ${score}<br/>
            成功/尝试: ${solved}/${attempted}<br/>
            用时: ${timeStr}<br/>
            ${prStr}
          `.replace(/\n/g, '');
          },
        },
        grid: { left: 60, right: 40, bottom: 50, top: 40 },
        xAxis: {
          type: 'category',
          name: '比赛成绩',
          data: singlePoints.map((_, i) => i),
        },
        yAxis: {
          type: 'value',
          min: 0,
          name: '多盲得分',
        },
        series: [
          {
            name: '单次得分',
            type: 'line',
            showSymbol: true,
            data: singlePoints,
          },
        ],
      };
    }

    // ===== 普通项目逻辑 =====
    let bestSingle = Infinity;
    let bestAvg = Infinity;

    const singlePoints = chartData.singles.map((v, i) => {
      const compName = chartData.compWithNameRound[i]; // ✅ 比赛名
      let progress: number | null = null;
      if (v <= 0) return { value: [i, null], extra: { compName } };
      if (v < bestSingle) {
        progress = ((bestSingle - v) / bestSingle);
        bestSingle = v;
      }
      return {
        value: [i, v],
        itemStyle: progress ? { color: 'red' } : undefined,
        progress,
        extra: { compName },
      };
    });

    const avgPoints = chartData.averages.map((v, i) => {
      const compName = chartData.compWithNameRound[i];
      let progress: number | null = null;
      if (v <= 0) return { value: [i, null], extra: { compName } };
      if (v < bestAvg) {
        progress = ((bestAvg - v) / bestAvg);
        bestAvg = v;
      }
      return {
        value: [i, v],
        itemStyle: progress ? { color: 'red' } : undefined,
        progress,
        extra: { compName },
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          if (!params.length) return '';
          // ✅ 所有点的 i 一致，所以取第一个即可
          const compName = params[0]?.data?.extra?.compName || '未知比赛';

          const lines = params.map((p) => {
            const data = p.data;
            if (!data || data.value[1] === null || data.value[1] === undefined) {
              return `${p.marker}${p.seriesName}: DNF`;
            }
            const rawHundredths = data.value[1];
            const formatted = resultsTimeFormat(rawHundredths, eventId, p.seriesName === '平均');
            const extra = data.progress ? `（进步 ${data.progress.toFixed(3)}%）` : '';
            return `${p.marker}${p.seriesName}: ${formatted}${extra}`;
          });

          return `
          <strong>${compName}</strong><br/>
          ${lines.join('<br/>')}
        `.replace(/\n/g, '');
        },
      },
      grid: { left: 60, right: 40, bottom: 50, top: 40 },
      xAxis: {
        type: 'category',
        name: '次数',
        data: Array.from(
          { length: Math.max(singlePoints.length, avgPoints.length) },
          (_, i) => i
        ),
      },
      yAxis: {
        type: 'value',
        min: 0,
        name: '时间（秒）',
      },
      series: [
        {
          name: '单次',
          type: 'line',
          showSymbol: true,
          data: singlePoints,
        },
        {
          name: '平均',
          type: 'line',
          showSymbol: true,
          data: avgPoints,
        },
      ],
    };
  }, [chartData, eventId, reversedData]);


  // ===== 单次分布图 =====
  const distributionOption = useMemo(() => {
    const singles = chartData.singles.filter((v) => v > 0);
    if (singles.length === 0) return {};

    const q25: number[] = [];
    const q50: number[] = [];
    const q75: number[] = [];

    for (let i = 0; i < singles.length; i++) {
      const start = Math.max(0, i - recentCount);
      const slice = singles.slice(start, i + 1);
      q25.push(getQuantile(slice, 0.25));
      q50.push(getQuantile(slice, 0.5));
      q75.push(getQuantile(slice, 0.75));
    }

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          const lines = params.map((p) => {
            const rawHundredths = Array.isArray(p.value) ? p.value[1] : p.value;
            return `${p.marker}${p.seriesName}: ${resultsTimeFormat(
              rawHundredths,
              eventId,
              false,
            )}`;
          });
          return lines.join('<br/>');
        },
      },
      grid: { left: 60, right: 40, bottom: 50, top: 40 },
      xAxis: {
        type: 'category',
        name: '次数',
        data: singles.map((_, i) => i),
      },
      yAxis: {
        type: 'value',
        min: 0,
        name: eventId === '333mbf' ? '得分' : '时间（秒）',
      },
      series: [
        {
          name: '成绩',
          type: 'line',
          showSymbol: false,
          data: singles.map((v, i) => [i, v]),
        },
        {
          name: '25%',
          type: 'line',
          data: q25.map((v, i) => [i, v]),
          lineStyle: { type: 'dashed' },
        },
        {
          name: '50%',
          type: 'line',
          data: q50.map((v, i) => [i, v]),
          lineStyle: { type: 'dashed' },
        },
        {
          name: '75%',
          type: 'line',
          data: q75.map((v, i) => [i, v]),
          lineStyle: { type: 'dashed' },
        },
      ],
    };
  }, [chartData, recentCount, eventId]);

  // ===== Tabs 渲染 =====
  const tabs = [
    {
      key: '1',
      label: '最佳成绩',
      children: <ReactECharts option={combinedOption} style={{ height: 400 }} />,
    },
  ];

  if (eventId !== '333mbf') {
    tabs.push({
      key: '2',
      label: '单次成绩分布',
      children: (
        <>
          <div style={{ marginBottom: 8 }}>
            <Select
              value={recentCount}
              onChange={setRecentCount}
              style={{ width: 120 }}
              options={[
                { label: '最近 20 次', value: 20 },
                { label: '最近 50 次', value: 50 },
                { label: '最近 100 次', value: 100 },
              ]}
            />
          </div>
          <ReactECharts option={distributionOption} style={{ height: 400 }} />
        </>
      ),
    });
  }

  return (
    <Card bordered={false} style={{ marginBottom: 16 }}>
      <Tabs items={tabs} />
    </Card>
  );
};

export default WCAResultChart;
