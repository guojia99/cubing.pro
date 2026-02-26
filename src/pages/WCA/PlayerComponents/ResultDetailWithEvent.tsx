import WCAResultChart from '@/pages/WCA/PlayerComponents/WCAResultChart';
import './ResultDetailWithEvent.less';
import {
  getRecordColor,
  roundColorMap,
  roundNameMap,
  roundSortOrder,
} from '@/pages/WCA/utils/events';
import { formatAttempts, resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { useIntl } from '@@/plugin-locale';
import { findCubingCompetitionByIdentifier } from '@/services/cubing-pro/cubing_china/cubing';

import ResultDetailWithRankingTimers from '@/pages/WCA/PlayerComponents/ResultWIthEventRankingTimers';
import { StaticWithTimerRank, WCACompetition, WCAResult } from '@/services/cubing-pro/wca/types';

interface ResultDetailWithEventProps {
  eventID: string;
  wcaResults: WCAResult[];
  comps: WCACompetition[];
  wcaRankTimer: StaticWithTimerRank[];
}

// 解析日期范围
const formatDateRange = (start: string, end: string): string => {
  return start === end ? start : `${start} ~ ${end}`;
};



const ResultDetailWithEvent: React.FC<ResultDetailWithEventProps> = ({
  eventID,
  wcaResults,
  comps,
  wcaRankTimer,
}) => {
  const intl = useIntl();
  // 按 competition_id 分组
  const resultsByComp = new Map<string, WCAResult[]>();

  wcaResults.forEach((result) => {
    if (!resultsByComp.has(result.competition_id)) {
      resultsByComp.set(result.competition_id, []);
    }
    resultsByComp.get(result.competition_id)!.push(result);
  });

  // 获取比赛信息
  const getCompInfo = (id: string) => {
    const comp = comps.find((c) => c.id === id);
    if (!comp) return null;
    return {
      name: comp.name,
      dateRange: formatDateRange(comp.start_date, comp.end_date),
    };
  };

  // 构建表格数据源
  const dataSource: (WCAResult & {
    showCompName?: boolean;
    compName?: string;
    compDate?: string;
  })[] = [];

  Array.from(resultsByComp.entries()).forEach(([compId, results]) => {
    // 按 roundSortOrder 排序
    const sortedResults = results.sort(
      (a, b) => (roundSortOrder[a.round_type_id] || 99) - (roundSortOrder[b.round_type_id] || 99),
    );

    sortedResults.forEach((result, index) => {
      const compInfo = getCompInfo(compId);

      dataSource.push({
        ...result,
        showCompName: index === 0,
        compName: compInfo?.name || compId,
        compDate: compInfo?.dateRange,
      });
    });
  });

  // 判断当前成绩是否为进步成绩
  const isProgress = (record: (typeof dataSource)[0], index: number, type: 'best' | 'average') => {
    const resultsForEvent = dataSource.filter((r) => r.event_id === record.event_id);
    // 当前成绩之后的成绩是历史成绩
    const historical = resultsForEvent.slice(index + 1);
    const prevBest = Math.min(...historical.map((r) => r[type]).filter((v) => v > 0), Infinity);
    return record[type] > 0 && record[type] < prevBest;
  };

  // 表格列定义
  const columns: ColumnsType<(typeof dataSource)[0]> = [
    {
      title: intl.formatMessage({ id: 'wca.results.competition' }),
      key: 'competition',
      width: 200,
      render: (_, record) => {
        if (record.showCompName) {

          let cpName = record.compName
          // 比赛id
          const findName = findCubingCompetitionByIdentifier(record.competition_id)
          if (findName){
            cpName = findName.name
          }
          return (
            <div>
              <div>
                <strong>{cpName}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>{record.compDate}</div>
            </div>
          );
        }
        // 非最后一轮：显示垂直省略号表示延续
        return <></>;
      },
    },
    {
      title: intl.formatMessage({ id: 'wca.results.round' }),
      dataIndex: 'round_type_id',
      key: 'round',
      width: 80,
      render: (id) => {
        const name = roundNameMap[id] || id;
        const color = roundColorMap[id] || 'default';
        return (
          <Tag color={color} style={{ margin: 0 }}>
            {name}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'wca.results.rank' }),
      dataIndex: 'pos',
      key: 'pos',
      width: 50,
      render: (pos: number) => (
        <span
          style={{
            fontWeight: pos === 0 ? 'bold' : 'normal',
            color: pos === 0 ? '#cf1322' : 'inherit', // 红色：Ant Design 的 error 主色
          }}
        >
          {pos}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'wca.results.single' }),
      dataIndex: 'best',
      key: 'best',
      width: 80,
      align: 'left',
      render: (best, record, index) => {
        const progress = isProgress(record, index, 'best');

        return (
          <Space direction="horizontal" size={4} style={{ display: 'flex', whiteSpace: 'nowrap' }}>
            <span style={{ color: progress ? 'red' : 'inherit', fontWeight: progress ? 600 : 400 }}>
              {resultsTimeFormat(best, record.event_id, false)}
            </span>
            {record.regional_single_record && (
              <Tag
                color={getRecordColor(record.regional_single_record)}
                style={{
                  margin: 0,
                  fontSize: '10px',
                  padding: '0 6px',
                  height: '18px',
                  lineHeight: '18px',
                }}
              >
                {record.regional_single_record}
              </Tag>
            )}
          </Space>
        );
      },
    },
  ];

  if (eventID !== '333mbf'){
    columns.push({
        title: intl.formatMessage({ id: 'wca.results.average' }),
        dataIndex: 'average',
        key: 'average',
        width: 80,
        align: 'left',
        render: (avg, record, index) => {
          if (avg === 0) return '';

          // 判断是否为进步成绩（比更旧成绩更好）
          const resultsForEvent = dataSource.filter((r) => r.event_id === record.event_id);
          const historical = resultsForEvent.slice(index + 1); // 更旧成绩
          const prevBestAvg = Math.min(
            ...historical.map((r) => r.average).filter((v) => v > 0),
            Infinity,
          );
          const isProgress = avg > 0 && avg < prevBestAvg;

          return (
            <Space direction="horizontal" size={4} style={{ display: 'flex', whiteSpace: 'nowrap' }}>
            <span
              style={{
                color: isProgress ? 'red' : 'inherit',
                fontWeight: isProgress ? 600 : 400,
              }}
            >
              {resultsTimeFormat(avg, record.event_id, true)}
            </span>
              {record.regional_average_record && (
                <Tag
                  color={getRecordColor(record.regional_average_record)}
                  style={{
                    margin: 0,
                    fontSize: '10px',
                    padding: '0 6px',
                    height: '18px',
                    lineHeight: '18px',
                  }}
                >
                  {record.regional_average_record}
                </Tag>
              )}
            </Space>
          );
        },
      })
  }
  columns.push(
    {
      title: intl.formatMessage({ id: 'wca.results.detailAttempts' }),
      key: 'attempts',
      width: 300,
      render: (_, record) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            // justifyContent: 'center',
            height: '100%',
            padding: '8px 0',
          }}
        >
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              padding: '4px 8px',
              borderRadius: '4px',
              textAlign: 'center',
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            {formatAttempts(
              record.attempts,
              record.event_id,
              record.best_index,
              record.worst_index,
            )}
          </span>
        </div>
      ),
    }
  )



  if (dataSource.length === 0) {
    return (
      <div style={{ color: '#999', fontStyle: 'italic' }}>
        {intl.formatMessage({ id: 'wca.results.noEventResults' }, { event: eventID })}
      </div>
    );
  }

  return (
    <>
      <div className="wca-chart-container">
        <div className="wca-chart-inner">
          <WCAResultChart data={wcaResults} eventId={eventID} comps={comps} />
          <ResultDetailWithRankingTimers eventID={eventID} wcaRankTimer={wcaRankTimer} />
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={(record) => `${record.id}`}
        pagination={false}
        size="small"
        bordered={false}
        style={{ marginTop: 8 }}
      />
    </>
  );
};

export default ResultDetailWithEvent;
