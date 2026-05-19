import { resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { Card } from 'antd';
import ReactECharts from 'echarts-for-react';
import React from 'react';
import { useIntl } from '@@/plugin-locale';
// 辅助函数：格式化年月
const formatYearMonth = (year, month) => {
    return `${year}-${String(month).padStart(2, '0')}`;
};
// 数据提取逻辑（同前）
function getEventWcaRankTimer(event, wcaRankTimer) {
    const out = [];
    for (const r of wcaRankTimer) {
        if (r.eventId === event) {
            out.push(r);
        }
    }
    return out.sort((a, b) => a.year - b.year || a.month - b.month);
}
const ResultDetailWithRankingTimers = ({ eventID, wcaRankTimer, }) => {
    const intl = useIntl();
    const rawData = getEventWcaRankTimer(eventID, wcaRankTimer);
    if (rawData.length === 0) {
        return (<Card title={intl.formatMessage({ id: 'wca.chart.rankCurve' })} bordered={false} style={{ marginBottom: 32 }}>
        {intl.formatMessage({ id: 'wca.chart.noRankData' }, { event: eventID })}
      </Card>);
    }
    // 构造 x 轴数据（时间）
    const xData = rawData.map((item) => formatYearMonth(item.year, item.month));
    // 构造系列数据（将 0 转为 null，ECharts 会跳过）
    // @ts-ignore
    const seriesData = (key) => 
    // @ts-ignore
    rawData.map((item) => (item[key] > 0 ? item[key] : null));
    // 控制 X 轴标签密度：当点太多时，只显示部分
    const interval = rawData.length > 12 ? Math.ceil(rawData.length / 10) : 0;
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                if (!params || params.length === 0)
                    return '';
                const dataIndex = params[0].dataIndex;
                let tip = `${params[0].name}<br/>`;
                // 成绩显示
                tip += `${intl.formatMessage({ id: 'wca.chart.result' })}: ${resultsTimeFormat(rawData[dataIndex].single, eventID, false)}`;
                if (rawData[dataIndex].average !== -1) {
                    tip += ` / ${resultsTimeFormat(rawData[dataIndex].average, eventID, true)}`;
                }
                tip += `<br/>`;
                // 辅助函数：获取上一个非 null 的值索引
                const getPrevValidIndex = (key, currIdx) => {
                    for (let i = currIdx - 1; i >= 0; i--) {
                        // @ts-ignore
                        if (rawData[i][key] !== null && rawData[i][key] > 0) {
                            return i;
                        }
                    }
                    return null;
                };
                // 遍历每个系列，计算变化
                const rankKeys = [
                    { key: 'singleCountryRank', label: intl.formatMessage({ id: 'wca.chart.singleNR' }) },
                    { key: 'singleContinentRank', label: intl.formatMessage({ id: 'wca.chart.singleCR' }) },
                    { key: 'singleWorldRank', label: intl.formatMessage({ id: 'wca.chart.singleWR' }) },
                    { key: 'avgCountryRank', label: intl.formatMessage({ id: 'wca.chart.avgNR' }) },
                    { key: 'avgContinentRank', label: intl.formatMessage({ id: 'wca.chart.avgCR' }) },
                    { key: 'avgWorldRank', label: intl.formatMessage({ id: 'wca.chart.avgWR' }) },
                ];
                rankKeys.forEach(({ key, label }) => {
                    const currentValue = rawData[dataIndex][key];
                    if (currentValue === null || currentValue <= 0)
                        return;
                    const prevIndex = getPrevValidIndex(key, dataIndex);
                    let changeText = '';
                    if (prevIndex !== null) {
                        const prevValue = rawData[prevIndex][key];
                        const diff = prevValue - currentValue; // 注意：排名数字越小越好
                        if (diff > 0) {
                            changeText = ` <span style="color:green">↑${diff}</span>`; // 上升（名次变好）
                        }
                        else if (diff < 0) {
                            changeText = ` <span style="color:red">↓${Math.abs(diff)}</span>`; // 下降（名次变差）
                        }
                    }
                    tip += `${params.find(p => p.seriesName === label)?.marker || ''} ${label}: ${currentValue}${changeText}<br/>`;
                });
                return tip;
            },
        },
        legend: {
            data: [
                intl.formatMessage({ id: 'wca.chart.singleNR' }),
                intl.formatMessage({ id: 'wca.chart.singleCR' }),
                intl.formatMessage({ id: 'wca.chart.singleWR' }),
                intl.formatMessage({ id: 'wca.chart.avgNR' }),
                intl.formatMessage({ id: 'wca.chart.avgCR' }),
                intl.formatMessage({ id: 'wca.chart.avgWR' }),
            ],
            bottom: 10,
            show: true,
            top: 10,
            type: 'scroll', // 支持滚动，防止图例过多溢出
            // ECharts 默认支持点击图例隐藏，无需额外配置
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '20%', // 给 dataZoom 留空间
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: xData,
            axisLabel: {
                rotate: -45,
                interval: interval,
            },
        },
        yAxis: {
            type: 'value',
            name: intl.formatMessage({ id: 'wca.chart.rank' }),
            inverse: false, // 👈 关键：不倒置！0 在底部，大数在顶部
            min: 0, // 从 0 开始
            // 可选：设置最大值为略大于最大排名
            max: function (value) {
                return Math.ceil(value.max * 1.1);
            },
        },
        // ✅ 新增：时间轴滑动（缩放和平移）
        dataZoom: [
            {
                type: 'inside', // 支持鼠标滚轮缩放、拖拽平移
                xAxisIndex: 0,
                start: 0,
                end: 100,
            },
            {
                type: 'slider', // 底部滑块
                xAxisIndex: 0,
                height: 20,
                bottom: 40,
                start: 0,
                end: 100,
                // handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                // handleSize: '80%',
            },
        ],
        series: [
            {
                name: intl.formatMessage({ id: 'wca.chart.singleNR' }),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                data: seriesData('singleCountryRank'),
            },
            {
                name: intl.formatMessage({ id: 'wca.chart.singleCR' }),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                data: seriesData('singleContinentRank'),
            },
            {
                name: intl.formatMessage({ id: 'wca.chart.singleWR' }),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                data: seriesData('singleWorldRank'),
            },
            {
                name: intl.formatMessage({ id: 'wca.chart.avgNR' }),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                data: seriesData('avgCountryRank'),
            },
            {
                name: intl.formatMessage({ id: 'wca.chart.avgCR' }),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                data: seriesData('avgContinentRank'),
            },
            {
                name: intl.formatMessage({ id: 'wca.chart.avgWR' }),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                data: seriesData('avgWorldRank'),
            },
        ],
    };
    return (<Card title={intl.formatMessage({ id: 'wca.chart.historyRankCurve' })} bordered={false} style={{ marginBottom: 32 }}>
      <div style={{ height: 400 }}>
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }}/>
      </div>
    </Card>);
};
export default ResultDetailWithRankingTimers;
//# sourceMappingURL=ResultWIthEventRankingTimers.jsx.map