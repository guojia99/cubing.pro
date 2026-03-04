import { resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { Button, Card, Checkbox, message, Spin, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { useIntl } from '@@/plugin-locale';

import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CopyOutlined } from '@ant-design/icons';
import { eventOrder, roundSortOrder } from '../utils/events';
import './WCAPlayerResultTable.less';
import {
  getPersonBestRanks,
} from '@/services/cubing-pro/wca/player';
import {
  PersonBestRank,
  PersonBestRanks,
  PersonResult,
  WcaProfile,
  WCAResult,
} from '@/services/cubing-pro/wca/types';

interface WCAPlayerResultTableProps {
  wcaProfile: WcaProfile;
  wcaResults: WCAResult[];
}

interface TableData {
  key: string;
  eventId: string;
  countryRankSingle?: number | string | undefined;
  continentRankSingle?: number | string | undefined;
  worldRankSingle?: number | string | undefined;
  single?: string;
  singleTimes?: string;
  average?: string;
  averageTimes?: string;
  worldRankAverage?: number | string | undefined;
  continentRankAverage?: number | string | undefined;
  countryRankAverage?: number | string | undefined;
  // best 模式：NR/CR/WR 各自的排名与时间
  singleNRRank?: number;
  singleNRTimes?: string;
  singleCRRank?: number;
  singleCRTimes?: string;
  singleWRRank?: number;
  singleWRTimes?: string;
  avgNRRank?: number;
  avgNRTimes?: string;
  avgCRRank?: number;
  avgCRTimes?: string;
  avgWRRank?: number;
  avgWRTimes?: string;
  solvesAttempted: string;
  podiumCount: JSX.Element | null;
}

type ViewMode = 'current' | 'historical';
type HistoricalSortMode = 'withNR' | 'withCR' | 'withWR' | 'best';

// 排名转带样式的节点
const renderRank = (rank: number | string) => {
  if (rank === undefined || rank === 0) {
    return <></>;
  }
  if (rank === '-' || typeof rank !== 'number') {
    return <Tag color="default"></Tag>;
  }

  let tagColor: string;
  let textColor: string | undefined = undefined;

  if (rank <= 3) {
    tagColor = '#cf1322';
    textColor = '#fff';
  } else if (rank <= 10) {
    tagColor = '#52c41a';
    textColor = '#fff';
  } else if (rank <= 100) {
    tagColor = '#1890ff';
    textColor = '#fff';
  } else {
    return <Tag color="default">{rank}</Tag>;
  }

  return (
    <Tag
      color={tagColor}
      style={{
        color: textColor,
        fontWeight: 'bold',
        border: 'none',
        padding: '0 6px',
        fontSize: '12px',
        lineHeight: '20px',
        height: '20px',
      }}
    >
      {rank}
    </Tag>
  );
};

// 主模式切换：当前 / 历史
const ViewModeToggle: React.FC<{
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  loading?: boolean;
}> = ({ mode, onChange, loading }) => {
  const intl = useIntl();
  return (
    <div className="view-mode-toggle">
      <button
        type="button"
        className={`toggle-option ${mode === 'current' ? 'active' : ''}`}
        onClick={() => onChange('current')}
        disabled={loading}
      >
        {intl.formatMessage({ id: 'wca.resultTable.currentView' })}
      </button>
      <button
        type="button"
        className={`toggle-option ${mode === 'historical' ? 'active' : ''}`}
        onClick={() => onChange('historical')}
        disabled={loading}
      >
        {loading ? (
          <Spin size="small" style={{ marginRight: 4 }} />
        ) : null}
        {intl.formatMessage({ id: 'wca.resultTable.historicalBest' })}
      </button>
    </div>
  );
};

// 历史模式下的排序方式切换：NR / CR / WR / 最佳
const HistoricalSortToggle: React.FC<{
  mode: HistoricalSortMode;
  onChange: (mode: HistoricalSortMode) => void;
}> = ({ mode, onChange }) => {
  const intl = useIntl();
  const options: HistoricalSortMode[] = ['best', 'withNR', 'withCR', 'withWR'];
  return (
    <div className="view-mode-toggle historical-sort-toggle">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`toggle-option ${mode === opt ? 'active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt === 'best'
            ? intl.formatMessage({ id: 'wca.resultTable.sortBest' })
            : intl.formatMessage({ id: `wca.resultTable.sort${opt.replace('with', '')}` })}
        </button>
      ))}
    </div>
  );
};

// 构建当前视图表格数据
function buildCurrentTableData(
  wcaProfile: WcaProfile,
  wcaResults: WCAResult[],
  intl: ReturnType<typeof useIntl>,
): { data: TableData[]; copyResult: string } {
  const resultsMap: Record<string, WCAResult[]> = {};
  wcaResults.forEach((result) => {
    if (!resultsMap[result.event_id]) {
      resultsMap[result.event_id] = [];
    }
    resultsMap[result.event_id].push(result);
  });

  const getBestSingle = (eventId: string): number =>
    wcaProfile.personal_records[eventId]?.single?.best || 0;
  const getBestAverage = (eventId: string): number =>
    wcaProfile.personal_records[eventId]?.average?.best || 0;
  const getRank = (
    eventId: string,
    type: 'single' | 'average',
    rankType: 'world_rank' | 'continent_rank' | 'country_rank',
  ): number | string | undefined =>
    wcaProfile.personal_records[eventId]?.[type]?.[rankType];

  const renderSolvesAttempted = (eventId: string): string => {
    const results = resultsMap[eventId];
    if (!results || results.length === 0) return '';
    let totalSolves = 0;
    let totalAttempts = 0;
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      for (let j = 0; j < res.attempts.length; j++) {
        if (res.attempts[j] === 0) continue;
        totalAttempts += 1;
        if (res.attempts[j] > 0) totalSolves += 1;
      }
    }
    return `${totalSolves} / ${totalAttempts}`;
  };

  const renderPodiumCount = (eventId: string): JSX.Element | null => {
    const results = resultsMap[eventId];
    if (!results || results.length === 0) return null;
    let gold = 0, silver = 0, bronze = 0;
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (roundSortOrder[res.round_type_id] !== 1) continue;
      if (res.pos === 1) gold += 1;
      else if (res.pos === 2) silver += 1;
      else if (res.pos === 3) bronze += 1;
    }
    if (gold + silver + bronze === 0) return null;
    return (
      <span style={{ display: 'inline-flex', gap: 6 }}>
        <span style={{ color: '#bbb205' }}>🥇{gold}</span>
        <span style={{ color: '#C0C0C0' }}>🥈{silver}</span>
        <span style={{ color: '#ff860e' }}>🥉{bronze}</span>
      </span>
    );
  };

  const tableData: TableData[] = [];
  let copyResult = `${wcaProfile.name}
${wcaProfile.wcaId}
${intl.formatMessage({ id: 'wca.resultTable.competitionCount' })}: ${wcaProfile.competition_count}
================
`;

  for (let i = 0; i < eventOrder.length; i++) {
    const eventId = eventOrder[i];
    if (getBestSingle(eventId) === undefined || getBestSingle(eventId) === 0) continue;

    const single = resultsTimeFormat(getBestSingle(eventId), eventId, false);
    const average = resultsTimeFormat(getBestAverage(eventId), eventId, true);

    copyResult += `${CubesCn(eventId)} ${single}`;
    if (average) copyResult += `  || ${average}`;
    copyResult += `\n`;

    tableData.push({
      key: eventId,
      eventId,
      countryRankSingle: getRank(eventId, 'single', 'country_rank'),
      continentRankSingle: getRank(eventId, 'single', 'continent_rank'),
      worldRankSingle: getRank(eventId, 'single', 'world_rank'),
      single,
      average,
      worldRankAverage: getRank(eventId, 'average', 'world_rank'),
      continentRankAverage: getRank(eventId, 'average', 'continent_rank'),
      countryRankAverage: getRank(eventId, 'average', 'country_rank'),
      solvesAttempted: renderSolvesAttempted(eventId),
      podiumCount: renderPodiumCount(eventId),
    });
  }

  return { data: tableData, copyResult };
}

// 从 PersonBestRank 构建单排序模式表格数据
function buildSingleSortTableData(
  rankData: PersonBestRank,
  _intl: ReturnType<typeof useIntl>,
): TableData[] {
  const { best, average } = rankData;
  const tableData: TableData[] = [];

  for (let i = 0; i < eventOrder.length; i++) {
    const eventId = eventOrder[i];
    const singleRecord = best[eventId];
    const avgRecord = average[eventId];

    if (!singleRecord && !avgRecord) continue;

    const singlePart = singleRecord
      ? {
          single: resultsTimeFormat(singleRecord.best, eventId, false),
          singleTimes: singleRecord.times,
          worldRankSingle: singleRecord.world_rank,
          continentRankSingle: singleRecord.continent_rank,
          countryRankSingle: singleRecord.country_rank,
        }
      : {
          single: '',
          singleTimes: '',
          worldRankSingle: undefined as number | undefined,
          continentRankSingle: undefined as number | undefined,
          countryRankSingle: undefined as number | undefined,
        };

    const avgPart = avgRecord
      ? {
          average: resultsTimeFormat(avgRecord.best, eventId, true),
          averageTimes: avgRecord.times,
          worldRankAverage: avgRecord.world_rank,
          continentRankAverage: avgRecord.continent_rank,
          countryRankAverage: avgRecord.country_rank,
        }
      : {
          average: '',
          averageTimes: '',
          worldRankAverage: undefined as number | undefined,
          continentRankAverage: undefined as number | undefined,
          countryRankAverage: undefined as number | undefined,
        };

    tableData.push({
      key: eventId,
      eventId,
      ...singlePart,
      ...avgPart,
      solvesAttempted: '',
      podiumCount: null,
    });
  }

  return tableData;
}

// 构建「最佳」模式表格数据：综合 NR/CR/WR 各自最佳排名
function buildBestModeTableData(
  personBestRanks: PersonBestRanks,
  _intl: ReturnType<typeof useIntl>,
): TableData[] {
  const { withNR, withCR, withWR } = personBestRanks;
  const tableData: TableData[] = [];

  const pickRank = (r: PersonResult | undefined, rankType: 'country_rank' | 'continent_rank' | 'world_rank') => {
    if (!r) return { rank: undefined as number | undefined, times: '' };
    return {
      rank: r[rankType],
      times: r.times || '',
    };
  };

  for (let i = 0; i < eventOrder.length; i++) {
    const eventId = eventOrder[i];
    const nrSingle = withNR.best[eventId];
    const nrAvg = withNR.average[eventId];
    const crSingle = withCR.best[eventId];
    const crAvg = withCR.average[eventId];
    const wrSingle = withWR.best[eventId];
    const wrAvg = withWR.average[eventId];

    const hasAny = nrSingle || nrAvg || crSingle || crAvg || wrSingle || wrAvg;
    if (!hasAny) continue;

    const snr = pickRank(nrSingle, 'country_rank');
    const sanr = pickRank(nrAvg, 'country_rank');
    const scr = pickRank(crSingle, 'continent_rank');
    const sacr = pickRank(crAvg, 'continent_rank');
    const swr = pickRank(wrSingle, 'world_rank');
    const sawr = pickRank(wrAvg, 'world_rank');

    tableData.push({
      key: eventId,
      eventId,
      singleNRRank: snr.rank,
      singleNRTimes: snr.times,
      singleCRRank: scr.rank,
      singleCRTimes: scr.times,
      singleWRRank: swr.rank,
      singleWRTimes: swr.times,
      avgNRRank: sanr.rank,
      avgNRTimes: sanr.times,
      avgCRRank: sacr.rank,
      avgCRTimes: sacr.times,
      avgWRRank: sawr.rank,
      avgWRTimes: sawr.times,
      solvesAttempted: '',
      podiumCount: null,
    });
  }

  return tableData;
}

// 构建历史最佳视图表格数据
function buildHistoricalTableData(
  personBestRanks: PersonBestRanks,
  sortMode: HistoricalSortMode,
  intl: ReturnType<typeof useIntl>,
): TableData[] {
  if (sortMode === 'best') {
    return buildBestModeTableData(personBestRanks, intl);
  }
  const rankData = personBestRanks[sortMode];
  return buildSingleSortTableData(rankData, intl);
}

const WCAPlayerResultTable: React.FC<WCAPlayerResultTableProps> = ({
  wcaProfile,
  wcaResults,
}) => {
  const intl = useIntl();
  const [viewMode, setViewMode] = useState<ViewMode>('current');
  const [historicalSortMode, setHistoricalSortMode] = useState<HistoricalSortMode>('best');
  const [showRank, setShowRank] = useState(true);
  const [showPodium, setShowPodium] = useState(true);
  const [personBestRanks, setPersonBestRanks] = useState<PersonBestRanks | null>(null);
  const [historicalLoading, setHistoricalLoading] = useState(false);

  const { data: currentData, copyResult } = useMemo(
    () => buildCurrentTableData(wcaProfile, wcaResults, intl),
    [wcaProfile, wcaResults, intl],
  );

  const fetchPersonBestRanks = useCallback(async () => {
    if (personBestRanks) return;
    setHistoricalLoading(true);
    try {
      const data = await getPersonBestRanks(wcaProfile.wcaId);
      setPersonBestRanks(data);
    } catch (err) {
      console.error('getPersonBestRanks failed:', err);
      message.error(intl.formatMessage({ id: 'wca.resultTable.copyFailed' }));
    } finally {
      setHistoricalLoading(false);
    }
  }, [wcaProfile.wcaId, personBestRanks, intl]);

  const handleModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      if (mode === 'historical') {
        fetchPersonBestRanks();
      }
    },
    [fetchPersonBestRanks],
  );

  const historicalData = useMemo(() => {
    if (!personBestRanks) return [];
    return buildHistoricalTableData(personBestRanks, historicalSortMode, intl);
  }, [personBestRanks, historicalSortMode, intl]);

  const tableData = viewMode === 'current' ? currentData : historicalData;
  const isHistorical = viewMode === 'historical';
  const isBestMode = isHistorical && historicalSortMode === 'best';
  const effectiveShowRank = isHistorical ? true : showRank;

  const columns: ColumnsType<TableData> = useMemo(() => {
    const cols: ColumnsType<TableData> = [
      {
        title: intl.formatMessage({ id: 'wca.resultTable.event' }),
        dataIndex: 'eventId',
        key: 'eventId',
        width: 88,
        fixed: 'left',
        render: (text: string) => (
          <>
            {CubeIcon(text, text, {})} {CubesCn(text)}
          </>
        ),
      },
    ];

    // 最佳模式：NR/CR/WR 各自最佳排名+达成时间（排名、时间分别居中对齐）
    if (isBestMode) {
      const bestColAlign = { align: 'center' as const };
      cols.push({
        title: intl.formatMessage({ id: 'wca.resultTable.single' }),
        children: [
          {
            title: intl.formatMessage({ id: 'wca.resultTable.sortNR' }),
            key: 'singleNR',
            width: 110,
            ...bestColAlign,
            render: (_: unknown, r: TableData) => (
              <span className="best-rank-cell">
                <span className="best-rank-value">
                  {(r.singleNRRank != null && r.singleNRRank > 0) ? renderRank(r.singleNRRank) : '—'}
                </span>
                {r.singleNRTimes && <span className="times-cell">{r.singleNRTimes}</span>}
              </span>
            ),
          },
          {
            title: intl.formatMessage({ id: 'wca.resultTable.sortCR' }),
            key: 'singleCR',
            width: 110,
            ...bestColAlign,
            render: (_: unknown, r: TableData) => (
              <span className="best-rank-cell">
                <span className="best-rank-value">
                  {(r.singleCRRank != null && r.singleCRRank > 0) ? renderRank(r.singleCRRank) : '—'}
                </span>
                {r.singleCRTimes && <span className="times-cell">{r.singleCRTimes}</span>}
              </span>
            ),
          },
          {
            title: intl.formatMessage({ id: 'wca.resultTable.sortWR' }),
            key: 'singleWR',
            width: 110,
            ...bestColAlign,
            render: (_: unknown, r: TableData) => (
              <span className="best-rank-cell">
                <span className="best-rank-value">
                  {(r.singleWRRank != null && r.singleWRRank > 0) ? renderRank(r.singleWRRank) : '—'}
                </span>
                {r.singleWRTimes && <span className="times-cell">{r.singleWRTimes}</span>}
              </span>
            ),
          },
        ],
      });
      cols.push({
        title: intl.formatMessage({ id: 'wca.resultTable.average' }),
        children: [
          {
            title: intl.formatMessage({ id: 'wca.resultTable.sortWR' }),
            key: 'avgWR',
            width: 110,
            ...bestColAlign,
            render: (_: unknown, r: TableData) => (
              <span className="best-rank-cell">
                <span className="best-rank-value">
                  {(r.avgWRRank != null && r.avgWRRank > 0) ? renderRank(r.avgWRRank) : '—'}
                </span>
                {r.avgWRTimes && <span className="times-cell">{r.avgWRTimes}</span>}
              </span>
            ),
          },
          {
            title: intl.formatMessage({ id: 'wca.resultTable.sortCR' }),
            key: 'avgCR',
            width: 110,
            ...bestColAlign,
            render: (_: unknown, r: TableData) => (
              <span className="best-rank-cell">
                <span className="best-rank-value">
                  {(r.avgCRRank != null && r.avgCRRank > 0) ? renderRank(r.avgCRRank) : '—'}
                </span>
                {r.avgCRTimes && <span className="times-cell">{r.avgCRTimes}</span>}
              </span>
            ),
          },
          {
            title: intl.formatMessage({ id: 'wca.resultTable.sortNR' }),
            key: 'avgNR',
            width: 110,
            ...bestColAlign,
            render: (_: unknown, r: TableData) => (
              <span className="best-rank-cell">
                <span className="best-rank-value">
                  {(r.avgNRRank != null && r.avgNRRank > 0) ? renderRank(r.avgNRRank) : '—'}
                </span>
                {r.avgNRTimes && <span className="times-cell">{r.avgNRTimes}</span>}
              </span>
            ),
          },
        ],
      });
      return cols;
    }

    if (effectiveShowRank) {
      cols.push({
        title: intl.formatMessage({ id: 'wca.resultTable.single' }),
        children: [
          {
            title: intl.formatMessage({ id: 'wca.resultTable.world' }),
            dataIndex: 'worldRankSingle',
            key: 'worldRankSingle',
            width: 72,
            render: (rank: number) => renderRank(rank),
          },
          {
            title: intl.formatMessage({ id: 'wca.resultTable.continent' }),
            dataIndex: 'continentRankSingle',
            key: 'continentRankSingle',
            width: 72,
            render: (rank: number) => renderRank(rank),
          },
          {
            title: intl.formatMessage({ id: 'wca.resultTable.region' }),
            dataIndex: 'countryRankSingle',
            key: 'countryRankSingle',
            width: 72,
            render: (rank: number) => renderRank(rank),
          },
          ...(isHistorical
            ? [
                {
                  title: intl.formatMessage({ id: 'wca.resultTable.achievedAt' }),
                  dataIndex: 'singleTimes',
                  key: 'singleTimes',
                  width: 88,
                  render: (t: string) => (t ? <span className="times-cell">{t}</span> : '—'),
                },
                {
                  title: intl.formatMessage({ id: 'wca.resultTable.result' }),
                  dataIndex: 'single',
                  key: 'single',
                  width: 100,
                  align: 'right' as const,
                  render: (text: string) => (text ? <strong>{text}</strong> : '—'),
                },
              ]
            : [
                {
                  title: intl.formatMessage({ id: 'wca.resultTable.result' }),
                  dataIndex: 'single',
                  key: 'single',
                  width: 100,
                  align: 'right' as const,
                  render: (text: string) => (text ? <strong>{text}</strong> : '—'),
                },
              ]),
        ],
      });
      cols.push({
        title: intl.formatMessage({ id: 'wca.resultTable.average' }),
        children: [
          {
            title: intl.formatMessage({ id: 'wca.resultTable.result' }),
            dataIndex: 'average',
            key: 'average',
            width: 100,
            align: 'right',
            render: (text: string) => (text ? <strong>{text}</strong> : '—'),
          },
          ...(isHistorical
            ? [
                {
                  title: intl.formatMessage({ id: 'wca.resultTable.achievedAt' }),
                  dataIndex: 'averageTimes',
                  key: 'averageTimes',
                  width: 88,
                  render: (t: string) => (t ? <span className="times-cell">{t}</span> : '—'),
                },
              ]
            : []),
          {
            title: intl.formatMessage({ id: 'wca.resultTable.world' }),
            dataIndex: 'worldRankAverage',
            key: 'worldRankAverage',
            width: 72,
            render: (rank: number) => renderRank(rank),
          },
          {
            title: intl.formatMessage({ id: 'wca.resultTable.continent' }),
            dataIndex: 'continentRankAverage',
            key: 'continentRankAverage',
            width: 72,
            render: (rank: number) => renderRank(rank),
          },
          {
            title: intl.formatMessage({ id: 'wca.resultTable.region' }),
            dataIndex: 'countryRankAverage',
            key: 'countryRankAverage',
            width: 72,
            render: (rank: number) => renderRank(rank),
          },
        ],
      });
    } else {
      cols.push({
        title: intl.formatMessage({ id: 'wca.resultTable.single' }),
        dataIndex: 'single',
        key: 'single',
        width: 100,
        render: (text: string) => <strong>{text}</strong>,
      });
      cols.push({
        title: intl.formatMessage({ id: 'wca.resultTable.average' }),
        dataIndex: 'average',
        key: 'average',
        width: 100,
        render: (text: string) => <strong>{text}</strong>,
      });
    }

    if (!isHistorical) {
      for (let i = 0; i < currentData.length; i++) {
        if (currentData[i].podiumCount && showPodium) {
          cols.push({
            title: intl.formatMessage({ id: 'wca.resultTable.podium' }),
            dataIndex: 'podiumCount',
            key: 'podiumCount',
            width: 96,
          });
          break;
        }
      }
      cols.push({
        title: intl.formatMessage({ id: 'wca.resultTable.solvesAttempts' }),
        dataIndex: 'solvesAttempted',
        key: 'solvesAttempted',
        width: 96,
      });
    }

    return cols;
  }, [
    effectiveShowRank,
    isHistorical,
    isBestMode,
    showPodium,
    currentData,
    intl,
  ]);

  const handleCopy = async () => {
    if (isHistorical) return;
    try {
      await navigator.clipboard.writeText(copyResult);
      message.success(intl.formatMessage({ id: 'wca.resultTable.copySuccess' }));
    } catch (err) {
      console.error('复制失败:', err);
      message.error(intl.formatMessage({ id: 'wca.resultTable.copyFailed' }));
    }
  };

  return (
    <Card
      hoverable
      style={{ width: '100%', margin: '0 auto', borderRadius: 16 }}
      bordered={false}
      className="wca-result-table-card"
    >
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <ViewModeToggle
          mode={viewMode}
          onChange={handleModeChange}
          loading={historicalLoading}
        />
        {isHistorical && personBestRanks && (
          <HistoricalSortToggle
            mode={historicalSortMode}
            onChange={setHistoricalSortMode}
          />
        )}
        <Tooltip title={intl.formatMessage({ id: 'wca.resultTable.copyTooltip' })}>
          <Button
            type="default"
            icon={<CopyOutlined />}
            size="small"
            onClick={handleCopy}
            disabled={isHistorical}
          />
        </Tooltip>
      </div>

      <div className="wca-player-result-table">
        <Table
          columns={columns as ColumnsType<TableData>}
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 'max-content' }}
          rowClassName="wca-result-row"
          loading={isHistorical && historicalLoading}
        />
      </div>

      {!isHistorical && (
        <div className="wca-result-table-options">
          <Checkbox checked={showRank} onChange={(e) => setShowRank(e.target.checked)}>
            {intl.formatMessage({ id: 'wca.resultTable.showRank' })}
          </Checkbox>
          <Checkbox checked={showPodium} onChange={(e) => setShowPodium(e.target.checked)}>
            {intl.formatMessage({ id: 'wca.resultTable.showPodium' })}
          </Checkbox>
        </div>
      )}
    </Card>
  );
};

export default WCAPlayerResultTable;
