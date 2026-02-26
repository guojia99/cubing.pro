import React from 'react';
import { Tag, Space, Card, Typography, Table } from 'antd';
import { useIntl } from '@@/plugin-locale';
import { roundNameMap, roundSortOrder } from '@/pages/WCA/utils/events';
import { ColumnsType } from 'antd/es/table';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CubesCn } from '@/components/CubeIcon/cube';
import { formatAttempts, resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { findCubingCompetitionByIdentifier } from '@/services/cubing-pro/cubing_china/cubing';
import { WCACompetition, WCAResult } from '@/services/cubing-pro/wca/types';

const { Title } = Typography



interface WCAPlayerStaticsTabResultsWithCompProps {
  wcaResults: WCAResult[];
  comps: WCACompetition[]
}

const formatDate = (date: string): string => {
  return date.split('T')[0];
};

const WCAPlayerStaticsTabResultsWithComp: React.FC<WCAPlayerStaticsTabResultsWithCompProps> = ({ wcaResults, comps }) => {
  const intl = useIntl();
  if (!wcaResults || wcaResults.length === 0) {
    return (
      <div style={{ color: '#999', textAlign: 'center', padding: '16px' }}>
        {intl.formatMessage({ id: 'wca.results.noCompetitionResults' })}
      </div>
    );
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

  // 构建比赛列表：按日期倒序（最新在前）
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
        compID: compId,
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
    compID: string;
    name: string;
    startDate: string;
    endDate: string;
    city: string;
    country: string;
    results: (WCAResult & { showEvent?: boolean; eventId?: string })[];
  }>;

  // 判断是否为进步成绩：比该比赛之前的所有比赛中同项目的最好成绩更优（sortedComps 倒序，index 大=更早）
  const isProgress = (
    compIndex: number,
    eventId: string,
    value: number,
    type: 'best' | 'average',
  ): boolean => {
    if (value <= 0) return false;
    let prevBest = Infinity;
    for (let i = compIndex + 1; i < sortedComps.length; i++) {
      const eventResults = sortedComps[i].results.filter((r) => r.event_id === eventId);
      for (const r of eventResults) {
        const v = type === 'best' ? r.best : r.average;
        if (v > 0) prevBest = Math.min(prevBest, v);
      }
    }
    return value < prevBest;
  };

  // 判断某比赛是否有至少一个 PB（单次或平均）
  const compHasPB = (compIndex: number): boolean => {
    const comp = sortedComps[compIndex];
    for (const r of comp.results) {
      if (isProgress(compIndex, r.event_id, r.best, 'best')) return true;
      if (r.average > 0 && isProgress(compIndex, r.event_id, r.average, 'average')) return true;
    }
    return false;
  };

  // 计算 PR Streak 相关数据
  const prStreakData = (() => {
    const hasPBArr = sortedComps.map((_, i) => compHasPB(i));

    // 当前 streak：从最新比赛往前数（index 0 为最新）
    let currentStreak = 0;
    for (let i = 0; i < hasPBArr.length; i++) {
      if (hasPBArr[i]) currentStreak++;
      else break;
    }

    // 历史最长 streak
    let longestStreak = 0;
    let run = 0;
    for (let i = 0; i < hasPBArr.length; i++) {
      if (hasPBArr[i]) run++;
      else {
        longestStreak = Math.max(longestStreak, run);
        run = 0;
      }
    }
    longestStreak = Math.max(longestStreak, run);

    // 每个 streak 中断处：记录「中断的比赛」及「刚结束的 streak」信息
    const breaks: Array<{
      breakComp: (typeof sortedComps)[0];
      breakCompIndex: number;
      streakLength: number;
      streakStartComp: (typeof sortedComps)[0];
      streakEndComp: (typeof sortedComps)[0];
    }> = [];
    run = 0;
    let streakStartIdx = -1;
    for (let i = 0; i < hasPBArr.length; i++) {
      if (hasPBArr[i]) {
        if (run === 0) streakStartIdx = i;
        run++;
      } else {
        if (run > 0) {
          breaks.push({
            breakComp: sortedComps[i],
            breakCompIndex: i,
            streakLength: run,
            streakStartComp: sortedComps[streakStartIdx],
            streakEndComp: sortedComps[i - 1],
          });
        }
        run = 0;
      }
    }

    return { currentStreak, longestStreak, breaks, hasPBArr };
  })();

  // 表格列定义
  const columns: ColumnsType<WCAResult & { showEvent?: boolean; eventId?: string }> = [
    {
      title: intl.formatMessage({ id: 'wca.results.event' }),
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
      title: intl.formatMessage({ id: 'wca.results.round' }),
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
      title: intl.formatMessage({ id: 'wca.results.rank' }),
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
      title: intl.formatMessage({ id: 'wca.results.single' }),
      dataIndex: 'best',
      key: 'best',
      width: 120,
      render: (best, record) => {
        const progress = isProgress(
          (record as any).compIndex ?? 0,
          record.event_id,
          best,
          'best',
        );
        return (
          <Space direction="horizontal" size={4} style={{ justifyContent: 'flex-end' }}>
            <span
              style={{
                color: progress ? 'red' : 'inherit',
                fontWeight: progress ? 600 : 400,
              }}
            >
              {resultsTimeFormat(best, record.event_id, false)}
            </span>
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
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'wca.results.average' }),
      dataIndex: 'average',
      key: 'average',
      width: 120,
      render: (avg, record) => {
        if (avg <= 0) return '-';
        const progress = isProgress(
          (record as any).compIndex ?? 0,
          record.event_id,
          avg,
          'average',
        );
        return (
          <Space direction="horizontal" size={4} style={{ justifyContent: 'flex-end' }}>
            <span
              style={{
                color: progress ? 'red' : 'inherit',
                fontWeight: progress ? 600 : 400,
              }}
            >
              {resultsTimeFormat(avg, record.event_id, true)}
            </span>
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
      title: intl.formatMessage({ id: 'wca.results.detailAttempts' }),
      key: 'attempts',
      width: 360,
      render: (_, record) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          {formatAttempts(record.attempts, record.event_id, record.best_index, record.worst_index)}
        </span>
      ),
    },
  ];

  const getCompTitle = (comp: any) => {

    let cpName = comp.name
    let city = comp.city
    // 比赛id
    const findName = findCubingCompetitionByIdentifier(comp.compID)
    if (findName){
      cpName = findName.name
      city = findName.city
    }
    return <>
      <div>
        <Title level={4} style={{ margin: 0 }}>{cpName}</Title>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {formatDate(comp.startDate)} ~ {formatDate(comp.endDate)} | {city}
        </div>
      </div>
    </>

  }
  const getCompDisplayName = (c: (typeof sortedComps)[0]) => {
    const findName = findCubingCompetitionByIdentifier(c.compID);
    return findName ? findName.name : c.name;
  };

  return (
    <div style={{ marginTop: 16 }}>
      {sortedComps.length === 0 ? (
        <div>{intl.formatMessage({ id: 'wca.results.noValidData' })}</div>
      ) : (
        <>
          {/* PR Streak 信息 */}
          <Card
            size="small"
            style={{ marginBottom: 24, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
            title={intl.formatMessage({ id: 'wca.results.prStreakTitle' })}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <strong>{intl.formatMessage({ id: 'wca.results.prStreakCurrent' })}：</strong>
                {prStreakData.currentStreak > 0
                  ? intl.formatMessage(
                      { id: 'wca.results.prStreakCount' },
                      { count: prStreakData.currentStreak },
                    )
                  : intl.formatMessage({ id: 'wca.results.prStreakNone' })}
              </div>
              {prStreakData.longestStreak > 0 &&
                (prStreakData.currentStreak < sortedComps.length || prStreakData.breaks.length > 0) && (
                  <div>
                    <strong>{intl.formatMessage({ id: 'wca.results.prStreakLongest' })}：</strong>
                    {intl.formatMessage(
                      { id: 'wca.results.prStreakCount' },
                      { count: prStreakData.longestStreak },
                    )}
                  </div>
                )}
              {prStreakData.breaks.length > 0 && (
                <div>
                  <strong style={{ display: 'block', marginBottom: 8 }}>
                    {intl.formatMessage({ id: 'wca.results.prStreakBreaks' })}：
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {prStreakData.breaks.map((b, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#fff',
                          borderRadius: 8,
                          border: '1px solid #e8e8e8',
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        <div style={{ marginBottom: 6 }}>
                          {intl.formatMessage({ id: 'wca.results.prStreakBreakAt' })}
                          <Tag color="volcano" style={{ marginLeft: 4 }}>
                            {getCompDisplayName(b.breakComp)}
                          </Tag>
                          <Tag color="default">{formatDate(b.breakComp.startDate)}</Tag>
                          {intl.formatMessage({ id: 'wca.results.prStreakBreakAtSuffix' })}
                        </div>
                        <div>
                          {intl.formatMessage({ id: 'wca.results.prStreakBreakPrev' })}
                          <Tag color="green" style={{ marginLeft: 4 }}>
                            {intl.formatMessage(
                              { id: 'wca.results.prStreakCount' },
                              { count: b.streakLength },
                            )}
                          </Tag>
                          {intl.formatMessage({ id: 'wca.results.prStreakBreakPrevSuffix' })}
                          <Tag color="blue" style={{ marginLeft: 4 }}>
                            {formatDate(b.streakEndComp.startDate)} ~ {formatDate(b.streakStartComp.startDate)}
                          </Tag>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {sortedComps.map((comp, compIndex) => (
          <Card
            key={comp.compId}
            bordered={false}
            style={{ marginBottom: 24, backgroundColor: '#fafafa' }}
            headStyle={{ backgroundColor: '#e6f7ff', borderBottom: '1px solid #91d5ff' }}
            title={getCompTitle(comp)}
          >
            <Table
              columns={columns}
              dataSource={comp.results.map((r) => ({ ...r, compIndex }))}
              rowKey="round_id"
              pagination={false}
              size="small"
              bordered={false}
              showHeader={true}
            />
          </Card>
        ))}
        </>
      )}
    </div>
  );
};

export default WCAPlayerStaticsTabResultsWithComp;
