import { roundNameMap } from '@/pages/WCA/utils/events';
import {
  get333MBFResult,
  resultsTimeFormat,
  secondTimeFormat,
} from '@/pages/WCA/utils/wca_results';
import { Card, Select, Slider, Space, Tabs, Tooltip } from 'antd';
import ReactECharts from 'echarts-for-react';
import React, { useMemo, useState } from 'react';
import { useIntl } from '@@/plugin-locale';
import { WCACompetition, WCAResult } from '@/services/cubing-pro/wca/types';

export interface WCAResultChartProps {
  eventId: string;
  data: WCAResult[];
  comps: WCACompetition[];
}

// ===== 工具函数 =====
function getQuantile(arr: number[], q: number, TrimHeadAndTail: number = 0): number {
  if (arr.length === 0) return 0;

  // 对数组进行排序
  const sorted = [...arr].sort((a, b) => a - b);

  // 计算需要去除的元素数量
  const trimPercentage = TrimHeadAndTail / 100; // 转换为小数
  const trimCount = Math.floor(sorted.length * trimPercentage);

  // 如果去除的数量超过了数组长度的一半，则不进行去除
  if (trimCount * 2 >= sorted.length) {
    // 如果去除的数量过大，返回原数组的分位数
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    // @ts-ignore
    return sorted[base + 1] !== undefined
      ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
      : sorted[base];
  }

  // 去除头尾数据
  const trimmedArray = sorted.slice(trimCount, sorted.length - trimCount);

  // 如果去头尾后数组为空，则返回原数组的分位数
  if (trimmedArray.length === 0) {
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    // @ts-ignore
    return sorted[base + 1] !== undefined
      ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
      : sorted[base];
  }

  // 在去头尾后的数组上计算分位数
  const pos = (trimmedArray.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  // @ts-ignore
  return trimmedArray[base + 1] !== undefined
    ? trimmedArray[base] + rest * (trimmedArray[base + 1] - trimmedArray[base])
    : trimmedArray[base];
}

const WCAResultChart: React.FC<WCAResultChartProps> = ({ data, eventId, comps }) => {
  const intl = useIntl();
  const [recentCount, setRecentCount] = useState<number>(20);
  const [recentHeadNum, setRecentHeadNum] = useState<number>(0);
  const [recentMin, setRecentMin] = useState<number>(0);
  const [recentMax, setRecentMax] = useState<number>(15);

  // ===== 数据预处理 =====
  const seriesName = (() => {
    if (eventId === '333mbf') {
      return intl.formatMessage({ id: 'wca.chart.score' });
    }
    if (eventId === '333fm') {
      return intl.formatMessage({ id: 'wca.chart.moves' });
    }
    return intl.formatMessage({ id: 'wca.chart.time' });
  })();
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
    const allAttempts: { data: number; comp: string }[] = [];

    for (const r of reversedData) {
      // 单次平均
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
      }
      if (eventId === '333fm') {
        singles.push(single);
        averages.push(average / 100.0);
      } else {
        singles.push(single);
        averages.push(average);
      }

      // 比赛名
      let compsAndRound = '';
      const comp = getCompInfo(r.competition_id);
      if (comp) {
        compsAndRound += comp.name;
      }
      compsAndRound += ' | ';
      compsAndRound += roundNameMap[r.round_type_id];
      compWithNameRound.push(compsAndRound);

      // 所有单次
      for (let i = 0; i < r.attempts.length; ++i) {
        if ((!r.attempts[i]) || r.attempts[i] === null) {
          continue;
        }
        if (r.attempts[i] <= 0) {
          continue;
        }

        let dd = r.attempts[i];
        if (eventId === '333fm') {
          dd = dd * 100;
        }
        allAttempts.push({
          data: dd,
          comp: `${compsAndRound}-${intl.formatMessage({ id: 'wca.chart.attemptN' }, { n: i + 1 })}`,
        });
      }
    }

    return { singles, averages, compWithNameRound, allAttempts };
  }, [reversedData, eventId, intl]);

  const combinedOption = useMemo(() => {
    // ===== 多盲专用逻辑 =====
    if (eventId === '333mbf') {
      let bestScore = -Infinity;
      let bestTimeForScore: Record<number, number> = {};

      console.log(chartData, reversedData)

      const singlePoints = chartData.allAttempts.map((result, i) => {
        const parsed = get333MBFResult(result.data);
        const { solved, attempted, seconds } = parsed;
        const compName = result.comp

        // 当前得分
        const score = (solved - (attempted - solved))

        const isPR =
          score > bestScore ||
          (score === bestScore && (!bestTimeForScore[score] || seconds < bestTimeForScore[score]));


        const  prType =  isPR ? (score > bestScore? 'score' : 'time') : null
        if (score > bestScore) {
          bestScore = score;
          bestTimeForScore[score] = seconds;
        } else if (isPR) {
          bestTimeForScore[score] = seconds;
        }



        return {
          value: [i, score],
          itemStyle: isPR ? { color: 'red' } : undefined,
          prType,
          extra: { solved, attempted, seconds, compName, prType },
        };
      });

      const singleLabel = intl.formatMessage({ id: 'wca.chart.singleLabel' });
      const unknownComp = intl.formatMessage({ id: 'wca.chart.unknownComp' });
      const solvedAttempted = intl.formatMessage({ id: 'wca.chart.solvedAttempted' });
      const timeUsed = intl.formatMessage({ id: 'wca.chart.timeUsed' });
      const newBest = intl.formatMessage({ id: 'wca.chart.newBest' });
      const sameScoreFaster = intl.formatMessage({ id: 'wca.chart.sameScoreFaster' });

      return {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any[]) => {
            const p = params[0];
            const data = p.data;
            if (!data || !data.extra) return `${p.marker}${singleLabel}: DNF`;

            const { solved, attempted, seconds, compName, prType } = data.extra;
            const score = solved - (attempted - solved);
            const timeStr = secondTimeFormat(seconds, true);
            const prStr = prType
              ? `（<strong style="color:red;">${newBest}${prType === 'time' ? `,${sameScoreFaster}` : ''}</strong>）`
              : '';

            return `
            <strong>${compName || unknownComp}</strong><br/>
            ${p.marker}${singleLabel}: ${score}<br/>
            ${solvedAttempted}: ${solved}/${attempted}<br/>
            ${timeUsed}: ${timeStr}<br/>
            ${prStr}
          `.replace(/\n/g, '');
          },
        },
        grid: { left: 60, right: 40, bottom: 50, top: 40 },
        xAxis: {
          type: 'category',
          name: intl.formatMessage({ id: 'wca.chart.compResult' }),
          data: singlePoints.map((_, i) => i),
        },
        yAxis: {
          type: 'value',
          min: 0,
          name: intl.formatMessage({ id: 'wca.chart.mbfScore' }),
        },
        series: [
          {
            name: intl.formatMessage({ id: 'wca.chart.singleScore' }),
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
        progress = ((bestSingle - v) / bestSingle) * 100;
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
        progress = ((bestAvg - v) / bestAvg) * 100;
        bestAvg = v;
      }
      return {
        value: [i, v],
        itemStyle: progress ? { color: 'red' } : undefined,
        progress,
        extra: { compName },
      };
    });

    const singleLabel = intl.formatMessage({ id: 'wca.chart.single' });
    const avgLabel = intl.formatMessage({ id: 'wca.chart.avg' });
    const unknownComp = intl.formatMessage({ id: 'wca.chart.unknownComp' });
    const progressLabel = intl.formatMessage({ id: 'wca.chart.progress' });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          if (!params.length) return '';
          const compName = params[0]?.data?.extra?.compName || unknownComp;

          const lines = params.map((p) => {
            const data = p.data;
            if (!data || data.value[1] === null || data.value[1] === undefined) {
              return `${p.marker}${p.seriesName}: DNF`;
            }
            const rawHundredths = data.value[1];
            const formatted = resultsTimeFormat(rawHundredths, eventId, p.seriesName === avgLabel);
            const extra = data.progress ? `（${progressLabel} ${data.progress.toFixed(3)}%）` : '';
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
        name: intl.formatMessage({ id: 'wca.chart.solves' }),
        data: Array.from({ length: Math.max(singlePoints.length, avgPoints.length) }, (_, i) => i),
      },
      yAxis: {
        type: 'value',
        min: 0,
        name: seriesName,
        axisLabel: {
          formatter: (value: number) => {
            if (eventId === '333mbf') {
              // mbf 得分不需要格式化为时间
              return String(value);
            }
            // 其他项目使用 resultsTimeFormat 格式化为时间字符串
            return resultsTimeFormat(value, eventId, false);
          },
        },
      },
      series: [
        {
          name: singleLabel,
          type: 'line',
          showSymbol: true,
          data: singlePoints,
        },
        {
          name: avgLabel,
          type: 'line',
          showSymbol: true,
          data: avgPoints,
        },
      ],
      dataZoom: [
        {
          type: 'slider', // 使用滑动条进行缩放
          xAxisIndex: 0, // 应用于第一个x轴
          start: 0, // 数据窗口范围的起始百分比
          end: 100, // 数据窗口范围的结束百分比
        },
        {
          type: 'inside', // 支持鼠标滚轮和拖拽进行缩放和平移
          xAxisIndex: 0,
          start: 0,
          end: 100,
        },
      ],
    };
  }, [chartData, eventId, reversedData, intl]);

  // 生成标记点，只显示头尾和当前选中值
  const generateMarks = () => {
    const marks = {
      [recentMin]: `${recentMin}%`,
      [recentMax]: `${recentMax}%`,
    };

    // 如果当前值不是头尾，则添加当前选中值的标记
    if (recentHeadNum !== recentMin && recentHeadNum !== recentMax) {
      // @ts-ignore
      marks[recentHeadNum] = {
        style: { color: '#ff4d4f', fontWeight: 'bold' },
        label: `${recentHeadNum}%`,
      };
    } else {
      // 如果当前值是头尾，也需要特殊样式
      if (recentHeadNum === recentMin) {
        // @ts-ignore
        marks[recentMin] = {
          style: { color: '#ff4d4f', fontWeight: 'bold' },
          label: `${recentMin}%`,
        };
      }
      if (recentHeadNum === recentMax) {
        // @ts-ignore
        marks[recentMax] = {
          style: { color: '#ff4d4f', fontWeight: 'bold' },
          label: `${recentMax}%`,
        };
      }
    }

    return marks;
  };

  // ===== 单次分布图 =====
  const maWindow = 12;
  const resultSeriesName = intl.formatMessage({ id: 'wca.chart.resultSeries' });
  const quartileRangeName = intl.formatMessage({ id: 'wca.chart.quartileRange' });
  const stdDevName = intl.formatMessage({ id: 'wca.chart.stdDev' });
  const compLabel = intl.formatMessage({ id: 'wca.chart.compLabel' });
  const maName = intl.formatMessage({ id: 'wca.chart.maN' }, { n: maWindow });

  const distributionOption = useMemo(() => {
    const singles = chartData.allAttempts;
    if (singles.length === 0) return {};

    // === 四分位数 ===
    const q25: number[] = [];
    const q50: number[] = [];
    const q75: number[] = [];

    // === 移动平均 & 标准差 ===
    const ma: number[] = [];
    const stdUpper: number[] = [];
    const stdLower: number[] = [];

    for (let i = 0; i < singles.length; i++) {
      // --- 四分位 ---
      const startQ = Math.max(0, i - recentCount);
      const sliceQ = singles.slice(startQ, i + 1).map((item) => item.data);
      q25.push(getQuantile(sliceQ, 0.25, recentHeadNum));
      q50.push(getQuantile(sliceQ, 0.5, recentHeadNum));
      q75.push(getQuantile(sliceQ, 0.75, recentHeadNum));

      // --- 移动平均 & 标准差 ---
      const startMA = Math.max(0, i - maWindow + 1);
      const sliceMA = singles.slice(startMA, i + 1).map((item) => item.data);
      const mean = sliceMA.reduce((a, b) => a + b, 0) / sliceMA.length;
      ma.push(mean);

      // 标准差
      const variance = sliceMA.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / sliceMA.length;
      const std = Math.sqrt(variance);
      stdUpper.push(mean + std);
      stdLower.push(mean - std);
    }

    return {
      legend: {
        show: true,
        top: 10,
        type: 'scroll', // 支持滚动，防止图例过多溢出
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          const lines = params
            .filter((p) => {
              // 排除显式关闭 tooltip 的系列
              if (p.series?.tooltip?.show === false) return false;
              // 或者也可以根据数据结构判断：只有 length >= 3 的才处理为区间
              return true;
            })
            .map((p) => {
              if (p.seriesName === resultSeriesName) {
                const attemptIndex = p.dataIndex;
                const originalData = singles[attemptIndex];
                const rawHundredths = Array.isArray(p.value) ? p.value[1] : p.value;
                return `
               ${originalData ? `${compLabel}: ${originalData.comp}` : ''} <br/>
                ${p.marker}${p.seriesName}: ${resultsTimeFormat(rawHundredths, eventId, false)}`;
              } else if (p.seriesName === stdDevName || p.seriesName === quartileRangeName) {
                // 检查是否包含 [x, lower, upper]
                if (Array.isArray(p.value) && p.value.length >= 3) {
                  const lower = p.value[1];
                  const upper = p.value[2];
                  return `${p.marker}${p.seriesName}: ${resultsTimeFormat(
                    lower,
                    eventId,
                    true,
                  )} ~ ${resultsTimeFormat(upper, eventId, true)}`;
                } else {
                  // 安全兜底：如果误入，显示原始值（但理论上不会）
                  const val = Array.isArray(p.value) ? p.value[1] : p.value;
                  return `${p.marker}${p.seriesName}: ${resultsTimeFormat(val, eventId, true)}`;
                }
              } else {
                // 其他普通线（如中位数、移动平均等）
                const rawHundredths = Array.isArray(p.value) ? p.value[1] : p.value;
                return `${p.marker}${p.seriesName}: ${resultsTimeFormat(
                  rawHundredths,
                  eventId,
                  true,
                )}`;
              }
            });
          return lines.join('<br/>');
        },
      },
      grid: { left: 60, right: 40, bottom: 50, top: 40 },
      xAxis: {
        type: 'category',
        name: intl.formatMessage({ id: 'wca.chart.solves' }),
        data: singles.map((_, i) => i),
      },
      yAxis: {
        type: 'value',
        min: 0,
        name: seriesName,
        axisLabel: {
          formatter: (value: number) => {
            if (eventId === '333mbf') return String(value);
            return resultsTimeFormat(value, eventId, false);
          },
        },
      },
      series: [
        {
          name: resultSeriesName,
          type: 'line',
          showSymbol: false,
          data: singles.map((v, i) => [i, v.data]),
        },
        // --- 四分位线 ---
        {
          name: '25%',
          type: 'line',
          data: q25.map((v, i) => [i, v]),
          lineStyle: { type: 'dashed', opacity: 0.7 },
        },
        {
          name: '50%',
          type: 'line',
          data: q50.map((v, i) => [i, v]),
          lineStyle: { type: 'dashed', opacity: 0.7 },
        },
        {
          name: '75%',
          type: 'line',
          data: q75.map((v, i) => [i, v]),
          lineStyle: { type: 'dashed', opacity: 0.7 },
        },
        // --- 四分线 区间（填充）---
        // 第一个 series：下界（基底）
        {
          name: quartileRangeName,
          type: 'line',
          // data 格式: [x, lower, upper] —— 第三个值用于 tooltip
          data: q25.map((lower, i) => [i, lower, q75[i]]),
          lineStyle: { opacity: 0 },
          areaStyle: { opacity: 0 },
          stack: '四分线',
          showInLegend: false,
          z: -1,
          // 关键：只让这个 series 显示 tooltip
        },
        {
          name: quartileRangeName,
          type: 'line',
          // 注意：这里 data 是差值，但 tooltip 不显示
          data: q25.map((_, i) => [i, q75[i] - q25[i]]),
          lineStyle: { opacity: 0 },
          areaStyle: { color: 'rgba(100, 100, 255, 0.15)' },
          stack: '四分线',
          z: -1,
          // 👇 关键：禁止 tooltip
          tooltip: { show: false },
        },
        // --- 移动平均线 ---
        {
          name: maName,
          type: 'line',
          data: ma.map((v, i) => [i, v]),
          smooth: true,
          lineStyle: { width: 2, color: '#FF7F0E' },
          showSymbol: false,
        },
        // --- 标准差 边界线 ---
        // --- 标准差 上边界线 ---
        {
          name: stdDevName,
          type: 'line',
          data: stdUpper.map((v, i) => [i, v]),
          lineStyle: { type: 'dotted', color: '#2CA02C', width: 1 },
          showSymbol: false,
          tooltip: { show: false }, // 👈 不参与 tooltip
        },
        // --- 标准差 下边界线 ---
        {
          name: stdDevName,
          type: 'line',
          data: stdLower.map((v, i) => [i, v]),
          lineStyle: { type: 'dotted', color: '#2CA02C', width: 1 },
          showSymbol: false,
          showInLegend: false,
          tooltip: { show: false }, // 👈 不参与 tooltip
        },
        // --- 填充：基底（携带完整数据）---
        {
          name: stdDevName,
          type: 'line',
          data: stdLower.map((lower, i) => [i, lower, stdUpper[i]]), // [x, lower, upper]
          lineStyle: { opacity: 0 },
          areaStyle: { opacity: 0 },
          stack: 'std',
          showInLegend: false,
          z: -2,
          // ✅ 这个 series 负责 tooltip，所以不要关闭
        },
        // --- 填充：增量（仅用于渲染高度）---
        {
          name: stdDevName,
          type: 'line',
          data: stdLower.map((_, i) => [i, stdUpper[i] - stdLower[i]]),
          lineStyle: { opacity: 0 },
          areaStyle: { color: 'rgba(44, 160, 44, 0.1)' },
          stack: 'std',
          z: -2,
          tooltip: { show: false }, // 👈 隐藏
        },
      ],
      dataZoom: [
        { type: 'slider', xAxisIndex: 0, start: 0, end: 100 },
        { type: 'inside', xAxisIndex: 0, start: 0, end: 100 },
      ],
    };
  }, [chartData, recentCount, eventId, recentHeadNum, intl, resultSeriesName, quartileRangeName, stdDevName, compLabel, maName]);

  const getTrimMax = (count: number) => {
    if (count <= 20) return 10; // 最多去除25% (5/20)
    if (count <= 50) return 12; // 最多去除20% (10/50)
    if (count <= 100) return 15; // 最多去除15% (15/100)
    return 20; // 最多去除10% (20/200及更多)
  };
  // 更新recentMax当recentCount变化时
  const handleRecentCountChange = (value: number) => {
    setRecentMin(0);
    setRecentCount(value);
    const newMax = getTrimMax(value);
    setRecentMax(newMax);
    // 重置recentHeadNum如果超出了新范围
    if (recentHeadNum > newMax) {
      setRecentHeadNum(newMax);
    }
  };

  // ===== Tabs 渲染 =====
  const tabs = [
    {
      key: '1',
      label: intl.formatMessage({ id: 'wca.chart.bestResult' }),
      children: <ReactECharts option={combinedOption} style={{ height: 400 }} />,
    },
  ];

  if (eventId !== '333mbf') {
    tabs.push({
      key: '2',
      label: intl.formatMessage({ id: 'wca.chart.singleDistribution' }),
      children: (
        <>
          <div
            style={{
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* 四分线数选择器 */}
            <Tooltip
              title={
                <div style={{ maxWidth: 500, lineHeight: 1.6 }}>
                  <p>
                    <b>25%（Q1）</b>：25% 的成绩比它快，代表较好成绩边界。
                  </p>
                  <p>
                    <b>50%（中位数）</b>：一半成绩比它快，反映典型水平。
                  </p>
                  <p>
                    <b>75%（Q3）</b>：75% 的成绩比它快，代表较差成绩边界。
                  </p>
                  <p style={{ fontSize: 12, color: '#999' }}>
                    用于评估魔方成绩的稳定性与分布趋势。
                  </p>
                </div>
              }
            >
              <Space style={{ display: 'flex', alignItems: 'center' }}>
                <label htmlFor="recentCountSelect" style={{ marginRight: 8 }}>
                  {intl.formatMessage({ id: 'wca.chart.quartileCount' })}:
                </label>
                <Select
                  id="recentCountSelect"
                  value={recentCount}
                  onChange={handleRecentCountChange}
                  style={{ width: 120 }}
                  options={[
                    { label: intl.formatMessage({ id: 'wca.chart.recent20' }), value: 20 },
                    { label: intl.formatMessage({ id: 'wca.chart.recent50' }), value: 50 },
                    { label: intl.formatMessage({ id: 'wca.chart.recent100' }), value: 100 },
                    { label: intl.formatMessage({ id: 'wca.chart.recent200' }), value: 200 },
                  ]}
                />
              </Space>
            </Tooltip>

            {/* 去头尾比例滑块 */}
            <Space style={{ display: 'flex', alignItems: 'center' }}>
              <label htmlFor="recentHeadSlider" style={{ marginRight: 8 }}>
                {intl.formatMessage({ id: 'wca.chart.trimRatio' })}:
              </label>
              <Slider
                id="recentHeadSlider"
                min={recentMin}
                max={recentMax}
                step={1}
                value={recentHeadNum}
                onChange={setRecentHeadNum}
                tooltip={{ formatter: (value) => `${value}%` }}
                marks={generateMarks()}
                style={{ flex: 1, minWidth: 200 }}
              />
            </Space>
          </div>
          <ReactECharts option={distributionOption} style={{ height: 400 }} />
        </>
      ),
    });
  }

  return (
    <Card bordered={false} style={{ marginBottom: 32 }}>
      <Tabs items={tabs} />
    </Card>
  );
};

export default WCAResultChart;
