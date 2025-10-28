import { getRecordColor, roundColorMap, roundNameMap, roundSortOrder } from '@/pages/WCA/utils/events';
import { formatAttempts, resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { WCACompetition } from '@/services/wca/player';
import { WCAResult } from '@/services/wca/playerResults';
import { Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

interface ResultDetailWithEventProps {
  eventID: string;
  wcaResults: WCAResult[];
  comps: WCACompetition[];
}


// 解析日期范围
const formatDateRange = (start: string, end: string): string => {
  return start === end ? start : `${start} ~ ${end}`;
};

interface ResultDetailWithEventProps {
  eventID: string;
  wcaResults: WCAResult[];
  comps: WCACompetition[];
}

const ResultDetailWithEvent: React.FC<ResultDetailWithEventProps> = ({
  eventID,
  wcaResults,
  comps,
}) => {
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

  // 表格列定义
  const columns: ColumnsType<(typeof dataSource)[0]> = [
    {
      title: '比赛',
      key: 'competition',
      width: 200,
      render: (_, record) => {
        if (record.showCompName) {
          return (
            <div>
              <div>
                <strong>{record.compName}</strong>
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
      title: '轮次',
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
      title: '排名',
      dataIndex: 'pos',
      key: 'pos',
      width: 80,
      render: (pos: number) => (
        <span
          style={{
            fontWeight: pos === 1 ? 'bold' : 'normal',
            color: pos === 1 ? '#cf1322' : 'inherit', // 红色：Ant Design 的 error 主色
          }}
        >
          {pos}
        </span>
      ),
    },
    {
      title: '单次',
      dataIndex: 'best',
      key: 'best',
      width: 120,
      render: (best, record) => {
        return (
          <Space
            direction="horizontal"
            size={4}
            style={{
              display: 'flex',
              whiteSpace: 'nowrap'
            }}
          >

            <span>{resultsTimeFormat(best, record.event_id, false)}</span>
            {record.regional_single_record && (
              <Tag
                color={getRecordColor(record.regional_single_record)}
                style={{
                  margin: 0,
                  fontSize: '10px',
                  padding: '0 6px',
                  height: '18px',
                  lineHeight: '18px'
                }}
              >
                {record.regional_single_record}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '平均',
      dataIndex: 'average',
      key: 'average',
      width: 120,
      render: (avg, record) => {
        if (avg === 0) return '';

        return (
          <Space
            direction="horizontal"
            size={4}
            style={{
              display: 'flex',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{resultsTimeFormat(avg, record.event_id, true)}</span>
            {record.regional_average_record && (
              <Tag
                color={getRecordColor(record.regional_average_record)}
                style={{
                  margin: 0,
                  fontSize: '10px',
                  padding: '0 6px',
                  height: '18px',
                  lineHeight: '18px'
                }}
              >
                {record.regional_average_record}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '详细成绩',
      key: 'attempts',
      width: 300,
      render: (_, record) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          {formatAttempts(record.attempts, record.event_id)}
        </span>
      ),
    },
  ];

  if (dataSource.length === 0) {
    return <div style={{ color: '#999', fontStyle: 'italic' }}>暂无 {eventID} 项目成绩</div>;
  }

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey={(record) => `${record.competition_id}-${record.round_id}`}
      pagination={false}
      scroll={{ x: 'max-content' }}
      size="middle"
      bordered={false}
      style={{ marginTop: 8 }}
    />
  );
};

export default ResultDetailWithEvent;
