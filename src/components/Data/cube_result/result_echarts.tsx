// import {DNF, Result, resultTimeString} from '@/components/Data/types/result';
// import * as echarts from 'echarts';
// import ReactEcharts from 'echarts-for-react';
// import {CubesCn} from "@/components/CubeIcon/cube";
//
// // @ts-ignore
// export type Format = echarts.EChartOption.Tooltip.Format;
// // @ts-ignore
// export type EChartsOption = echarts.EChartOption;
//
// export type ScoreChatValue = {
//   Event: string;
//   CompsMap: Map<number, string>;
//   result: Result[];
// };
//
// export const ResultsChat = (v: ScoreChatValue) => {
//   let avg: number[] = [];
//   let single: number[] = [];
//
//   for (let i = 0; i < v.result.length; i++) {
//     let a = v.result[i].Average;
//     if (a <= DNF) {
//       a = NaN;
//     }
//     avg.push(a);
//     let b = v.result[i].Best;
//     if (b <= DNF) {
//       b = NaN;
//     }
//     single.push(b);
//   }
//
//   const FormatContest = (f: Format): string => {
//     const idx = f.dataIndex as number;
//     const r = v.result[idx];
//     return v.CompsMap.get(r.CompetitionID) || "";
//   };
//
//   const FormatValue = (f: Format, isBest: boolean): string => {
//     const idx = f.dataIndex as number;
//     const value = f.value as number;
//
//     const r = v.result[idx];
//     let baseOut = f.marker + ' ' + f.seriesName + ':' + resultTimeString(r.Best, false);
//
//     if (idx === 0) {
//       return baseOut;
//     }
//
//     // 成绩涨幅
//     let lastValue = v.result[idx - 1].Average;
//     if (isBest) {
//       lastValue = v.result[idx - 1].Best;
//     }
//
//     if (lastValue <= -10000 || lastValue === undefined || isNaN(value)) {
//       return baseOut;
//     }
//
//     const diff = ((value - lastValue) / value) * -100;
//     if (diff > 0) {
//       return baseOut + "<i style='color:red'>( +" + diff.toFixed(2) + '% )</i>';
//     }
//     return baseOut + "<i style='color:green'>(" + diff.toFixed(2) + '% )</i>';
//   };
//
//   const option: EChartsOption = {
//     animationDuration: 5000,
//     title: {
//       text: CubesCn(v.Event),
//     },
//     tooltip: {
//       trigger: 'axis',
//       formatter: function (
//         params: Format | Format[],
//         // @ts-ignore
//         ticket: string,
//         // @ts-ignore
//         callback: (ticket: string, html: string) => void,
//       ): string {
//         const param = params as Format[];
//         return (
//           FormatContest(param[0]) +
//           '<br/>' +
//           FormatValue(param[0], false) +
//           '<br/>' +
//           FormatValue(param[1], true)
//         );
//       },
//     },
//     legend: {
//       data: ['平均', '单次'],
//     },
//     grid: {
//       left: '3%',
//       right: '4%',
//       bottom: '3%',
//       containLabel: true,
//     },
//     toolbox: {
//       feature: {
//         saveAsImage: {},
//       },
//     },
//     backgroundColor: '#ffffff',
//     xAxis: {
//       type: 'category',
//       boundaryGap: false,
//     },
//     yAxis: {
//       type: 'value',
//       axisLabel: {
//         formatter: function (value: number, index: number) {
//           // todo
//           return resultTimeString(value, false);
//         },
//       },
//     },
//     series: [
//       {
//         name: '平均',
//         data: avg,
//         type: 'line',
//       },
//       {
//         name: '单次',
//         data: single,
//         type: 'line',
//       },
//     ],
//   };
//   return <ReactEcharts option={option} />
// };
