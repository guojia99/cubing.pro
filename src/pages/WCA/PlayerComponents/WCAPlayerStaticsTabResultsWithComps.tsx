
import React from 'react';
import { Tag, Space, Card, Typography, Table } from 'antd';
import { roundNameMap, roundSortOrder } from '@/pages/WCA/utils/events';
import { ColumnsType } from 'antd/es/table';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CubesCn } from '@/components/CubeIcon/cube';
import { formatAttempts, resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { WCACompetition, WCAResult } from '@/services/wca/types';

const { Title } = Typography



interface WCAPlayerStaticsTabResultsWithCompProps {
  wcaResults: WCAResult[];
  comps: WCACompetition[]
}

const formatDate = (date: string): string => {
  return date.split('T')[0];
};

const WCAPlayerStaticsTabResultsWithComp: React.FC<WCAPlayerStaticsTabResultsWithCompProps> = ({ wcaResults, comps }) => {
  if (!wcaResults || wcaResults.length === 0) {
    return <div style={{ color: '#999', textAlign: 'center', padding: '16px' }}>暂无比赛成绩</div>;
  }

  // 按比赛分组
  const resultsByComp = new Map<string, WCAResult[]>();
  wcaResults.forEach(result => {
    if (!resultsByComp.has(result.competition_id)) {
      resultsByComp.set(result.competition_id, []);
    }
    resultsByComp.get(result.competition_id)!.push(result);
  });

  // 获取比赛信息
  const getCompInfo = (id: string) => {
    return comps.find(c => c.id === id) || null;
  };

  // 构建比赛列表：按日期倒序
  const sortedComps = Array.from(resultsByComp.entries())
    .map(([compId, results]) => {
      const compInfo = getCompInfo(compId);
      if (!compInfo) return null;

      // 按 event_id 分组所有轮次
      const groupedByEvent: Record<string, WCAResult[]> = {};
      results.forEach(result => {
        if (!groupedByEvent[result.event_id]) {
          groupedByEvent[result.event_id] = [];
        }
        groupedByEvent[result.event_id].push(result);
      });

      // 对每个项目内的轮次排序：从决赛 → 初赛
      const sortedResults: WCAResult[] = [];
      Object.entries(groupedByEvent).forEach(([eventId, eventResults]) => {
        const sortedEventResults = eventResults.sort(
          (a, b) => (roundSortOrder[a.round_type_id] || 99) - (roundSortOrder[b.round_type_id] || 99),
        );

        // 标记第一轮（决赛）显示项目，其余不显示
        sortedEventResults.forEach((result, index) => {
          (result as any).showEvent = index === 0;
          (result as any).eventId = eventId;
        });

        sortedResults.push(...sortedEventResults);
      });

      return {
        compId,
        name: compInfo.name,
        startDate: compInfo.start_date,
        endDate: compInfo.end_date,
        city: compInfo.city,
        country: compInfo.city,
        results: sortedResults,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (!a || !b) return 0;
      return b.startDate.localeCompare(a.startDate);
    }) as Array<{
    compId: string;
    name: string;
    startDate: string;
    endDate: string;
    city: string;
    country: string;
    results: (WCAResult & { showEvent?: boolean; eventId?: string })[];
  }>;

  // 表格列定义
  const columns: ColumnsType<WCAResult & { showEvent?: boolean; eventId?: string }> = [
    {
      title: '项目',
      key: 'event',
      width: 200,
      render: (_, record) => {
        if (record.showEvent) {
          const eventId = record.eventId || record.event_id;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {CubeIcon(eventId, eventId, {})}
              <strong>{CubesCn(eventId)}</strong>
            </div>
          );
        }
        // 非决赛轮次显示 ⋮
        return (<></>);
      },
    },
    {
      title: '轮次',
      dataIndex: 'round_type_id',
      key: 'round',
      width: 100,
      render: (id) => {
        const name = roundNameMap[id] || id;
        const color = ['f', 'c', 'b'].includes(id) ? 'geekblue' : 'default';
        return <Tag color={color} style={{ margin: 0 }}>{name}</Tag>;
      },
    },
    {
      title: '排名',
      dataIndex: 'pos',
      key: 'pos',
      width: 80,
      render: (pos) => (
        <span style={{
          color: pos === 1 ? '#cf1322' : 'inherit'
        }}>
          {pos}
        </span>
      ),
    },
    {
      title: '单次',
      dataIndex: 'best',
      key: 'best',
      width: 120,
      render: (best, record) => (
        <Space direction="horizontal" size={4} style={{ justifyContent: 'flex-end' }}>
          <span>{resultsTimeFormat(best, record.event_id, false)}</span>
          {record.regional_single_record && (
            <Tag
              color={
                record.regional_single_record.includes('WR') ? 'red' :
                  record.regional_single_record.includes('NR') ? 'green' :
                    record.regional_single_record.includes('AsR') ? 'orange' : 'gold'
              }
              style={{ fontSize: '10px', padding: '0 4px', height: '18px', lineHeight: '18px' }}
            >
              {record.regional_single_record}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '平均',
      dataIndex: 'average',
      key: 'average',
      width: 120,
      render: (avg, record) => {
        if (avg <= 0) return '-';
        return (
          <Space direction="horizontal" size={4} style={{ justifyContent: 'flex-end' }}>
            <span>{resultsTimeFormat(avg, record.event_id, true)}</span>
            {record.regional_average_record && (
              <Tag
                color={
                  record.regional_average_record.includes('WR') ? 'red' :
                    record.regional_average_record.includes('NR') ? 'green' :
                      record.regional_average_record.includes('AsR') ? 'orange' : 'gold'
                }
                style={{ fontSize: '10px', padding: '0 4px', height: '18px', lineHeight: '18px' }}
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
      width: 360,
      render: (_, record) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          {formatAttempts(record.attempts, record.event_id, record.best_index, record.worst_index)}
        </span>
      ),
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      {sortedComps.length === 0 ? (
        <div>暂无有效比赛数据</div>
      ) : (
        sortedComps.map((comp) => (
          <Card
            key={comp.compId}
            bordered={false}
            style={{ marginBottom: 24, backgroundColor: '#fafafa' }}
            headStyle={{ backgroundColor: '#e6f7ff', borderBottom: '1px solid #91d5ff' }}
            title={
              <div>
                <Title level={4} style={{ margin: 0 }}>{comp.name}</Title>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {formatDate(comp.startDate)} ~ {formatDate(comp.endDate)} | {comp.city}, {comp.country}
                </div>
              </div>
            }
          >
            <Table
              columns={columns}
              dataSource={comp.results}
              rowKey="round_id"
              pagination={false}
              size="small"
              bordered={false}
              showHeader={true}
            />
          </Card>
        ))
      )}
    </div>
  );
};

export default WCAPlayerStaticsTabResultsWithComp;
