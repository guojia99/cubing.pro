import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CubesCn } from '@/components/CubeIcon/cube';
import { WCALinkWithCnName } from '@/components/Link/Links';
import { formatAttempts, get333MBFResult, get333MBOResult, resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { eventOrder } from '@/pages/WCA/utils/events';
import { CountryList, getWcaCountryLabel } from '@/services/cubing-pro/wca/country';
import { GetEventRankWithOnlyYear } from '@/services/cubing-pro/wca/static';
import { Country, WCAResult } from '@/services/cubing-pro/wca/types';
import { Select, Table, Spin, Space, Tag, Card } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from '@@/plugin-locale';
import './YearlyFullRank.less';
import './StatisticsRankLayout.less';

const WORLD_KEY = '__world__';
const DEFAULT_PAGE_SIZE = 50;
const PAGE_SIZE_OPTIONS = [20, 50, 100];

/** 判断 a1 是否优于或等于 a2（用于排序：a1 更好时返回 true） */
function isBestResult(event: string, a1: number, a2: number): boolean {
  if (a1 < 0 && a2 < 0) return true;
  if (a1 < 0 && a2 > 0) return false;
  if (a2 < 0 && a1 > 0) return true;

  switch (event) {
    case '333mbf': {
      const { solved: s1, attempted: at1, seconds: sec1 } = get333MBFResult(a1);
      const { solved: s2, attempted: at2, seconds: sec2 } = get333MBFResult(a2);
      const score1 = s1 - (at1 - s1);
      const score2 = s2 - (at2 - s2);
      if (score1 === score2) return sec1 <= sec2;
      return score1 >= score2;
    }
    case '333mbo': {
      const { solved: s1, attempted: at1, seconds: sec1 } = get333MBOResult(a1);
      const { solved: s2, attempted: at2, seconds: sec2 } = get333MBOResult(a2);
      const score1 = s1 - (at1 - s1);
      const score2 = s2 - (at2 - s2);
      if (score1 !== score2) return score1 > score2;
      if (sec1 === 99999 && sec2 === 99999) return true;
      if (sec1 === 99999) return false;
      if (sec2 === 99999) return true;
      return sec1 <= sec2;
    }
    default:
      return a1 <= a2;
  }
}

/** 为成绩列表分配排名，相同成绩同排名，后续按实际位置；offset 为分页偏移 */
function assignRanks(
  items: WCAResult[],
  eventId: string,
  isAvg: boolean,
  offset: number,
): (WCAResult & { displayRank: number })[] {
  const getValue = (r: WCAResult) => (isAvg ? r.average : r.best);

  const sorted = [...items].sort((a, b) => {
    const va = getValue(a);
    const vb = getValue(b);
    if (isBestResult(eventId, va, vb) && isBestResult(eventId, vb, va)) return 0;
    return isBestResult(eventId, va, vb) ? -1 : 1;
  });

  const result: (WCAResult & { displayRank: number })[] = [];
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    const vi = getValue(sorted[i]);
    const vPrev = i > 0 ? getValue(sorted[i - 1]) : undefined;
    if (i > 0 && !(isBestResult(eventId, vi, vPrev!) && isBestResult(eventId, vPrev!, vi))) {
      currentRank = i + 1;
    }
    result.push({ ...sorted[i], displayRank: currentRank + offset });
  }
  return result;
}

/** 单行显示成绩（收起态） */
function formatAttemptsSingleLine(
  attempts: number[],
  eventId: string,
  bestIndex: number,
  worstIndex: number,
): React.ReactNode {
  const validAttempts = attempts.filter((v) => v !== 0);
  const len = validAttempts.length;
  const parts: React.ReactNode[] = [];
  attempts.forEach((time, i) => {
    if (time === 0) return;
    const formatted = resultsTimeFormat(time, eventId, false);
    const displayText =
      len === 5 && (i === bestIndex || i === worstIndex) ? `(${formatted})` : formatted;
    if (parts.length > 0) parts.push(' ');
    parts.push(
      <span key={i} style={{ fontWeight: len === 5 && (i === bestIndex || i === worstIndex) ? 800 : 500 }}>
        {displayText}
      </span>,
    );
  });
  return <span className="attempts-single-line" style={{ fontFamily: 'monospace' }}>{parts}</span>;
}

function formatCompetitionTime(timeStr: string | undefined): string {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const parts = timeStr.trim().split(/[-/\s]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) return timeStr;
  const [y, m, d] = parts;
  const pad = (n: string) => n.padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
}

const YearlyFullRank: React.FC = () => {
  const intl = useIntl();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2002 }, (_, i) => 2003 + i).reverse();

  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(0);
  const [country, setCountry] = useState<string>(WORLD_KEY);
  const [eventId, setEventId] = useState<string>('333');
  const [isAvg, setIsAvg] = useState<boolean>(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [data, setData] = useState<WCAResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [expandedAttempts, setExpandedAttempts] = useState<Set<number>>(new Set());

  const toggleAttempts = useCallback((id: number) => {
    setExpandedAttempts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    CountryList().then(setCountries).catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const countryParam = country === WORLD_KEY ? '' : country;
    GetEventRankWithOnlyYear(eventId, year, countryParam, isAvg, page, pageSize, month)
      .then((res) => {
        setData(res.data || []);
        setTotal(res.total || 0);
      })
      .catch(() => {
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [year, month, country, eventId, isAvg, page, pageSize]);

  const rankedData = useMemo(
    () => assignRanks(data, eventId, isAvg, (page - 1) * pageSize),
    [data, eventId, isAvg, page, pageSize],
  );

  const singleCol = {
    title: intl.formatMessage({ id: 'wca.resultTable.single' }),
    key: 'single',
    width: eventId === '333mbf' ? 120 : 85,
    render: (_: unknown, record: WCAResult) => (
      <span style={{ fontWeight: 600 }}>
        {resultsTimeFormat(record.best, eventId, false)}
      </span>
    ),
  };

  const avgCol =
    eventId !== '333mbf'
      ? {
          title: intl.formatMessage({ id: 'wca.resultTable.average' }),
          key: 'average',
          width: 85,
          render: (_: unknown, record: WCAResult) => (
            <span style={{ fontWeight: 600 }}>
              {resultsTimeFormat(record.average, eventId, true)}
            </span>
          ),
        }
      : null;

  const columns = [
    {
      title: intl.formatMessage({ id: 'wca.historicalRank.rank' }),
      key: 'rank',
      width: 56,
      fixed: 'left',
      render: (_: unknown, record: WCAResult & { displayRank: number }) => record.displayRank,
    },
    {
      title: intl.formatMessage({ id: 'wca.players.wcaId' }),
      dataIndex: 'wca_id',
      key: 'wcaId',
      width: 120,
      render: (val: string) => val?.toUpperCase?.() || val,
    },
    {
      title: intl.formatMessage({ id: 'wca.players.name' }),
      dataIndex: 'name',
      key: 'name',
      width: 130,
      ellipsis: true,
      render: (_: string, record: WCAResult) =>
        WCALinkWithCnName(record.wca_id, record.name),
    },
    ...(isAvg && avgCol ? [avgCol] : [singleCol]),
    {
      title: intl.formatMessage({ id: 'wca.results.detailAttempts' }),
      key: 'attempts',
      onCell: () => ({ className: 'attempts-col' }),
      render: (_: unknown, record: WCAResult) => {
        const expanded = expandedAttempts.has(record.id);
        const attempts = record.attempts || [];
        const bestIdx = record.best_index ?? 0;
        const worstIdx = record.worst_index ?? 0;
        return (
          <div className={`attempts-cell ${expanded ? 'expanded' : ''}`}>
            <span
              className="attempts-toggle"
              onClick={() => toggleAttempts(record.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleAttempts(record.id)}
            >
              {expanded ? <DownOutlined /> : <RightOutlined />}
            </span>
            {expanded ? (
              <div className="attempts-detail">
                {formatAttempts(attempts, eventId, bestIdx, worstIdx, true)}
              </div>
            ) : (
              formatAttemptsSingleLine(attempts, eventId, bestIdx, worstIdx)
            )}
          </div>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'wca.competition.time' }),
      key: 'competition_time',
      width: 100,
      render: (_: unknown, record: WCAResult) =>
        formatCompetitionTime(record.competition_time) || '-',
    },
    {
      title: intl.formatMessage({ id: 'wca.results.competition' }),
      dataIndex: 'competition_name',
      key: 'competition',
      ellipsis: true,
      width: 180,
      render: (name: string) => name ? <Tag className="competition-tag">{name}</Tag> : '-',
    },
    ...(country === WORLD_KEY
      ? [
          {
            title: intl.formatMessage({ id: 'wca.players.country' }),
            dataIndex: 'country_iso2',
            key: 'country',
            width: 90,
            render: (val: string) => getWcaCountryLabel(val, countries),
          },
        ]
      : []),
  ];

  const eventOptions = eventOrder.map((ev) => ({
    value: ev,
    label: (
      <Space size="small">
        {CubeIcon(ev, `event_${ev}`, {})}
        {CubesCn(ev)}
      </Space>
    ),
  }));

  const filteredCountries = countries
    .filter((c) => c?.iso2 && !c.name?.includes('Multiple Countries'))
    .map((c) => ({
      value: c.iso2,
      label: getWcaCountryLabel(c.id, countries),
    }));
  const cnOption = filteredCountries.find((c) => c.value === 'CN');
  const otherOptions = filteredCountries.filter((c) => c.value !== 'CN');
  const countryOptions = [
    { value: WORLD_KEY, label: intl.formatMessage({ id: 'wca.historicalRank.worldwide' }) },
    ...(cnOption ? [cnOption] : []),
    ...otherOptions,
  ];

  const monthOptions = useMemo(
    () => [
      { value: 0, label: intl.formatMessage({ id: 'wca.historicalRank.monthWholeYear' }) },
      ...Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: String(i + 1),
      })),
    ],
    [intl],
  );

  return (
    <div className="yearly-full-rank">
      <Card size="small" bordered className="stats-rank-filter-card">
        <div className="filter-row">
        <div className="filter-item">
          <span className="filter-label">{intl.formatMessage({ id: 'wca.historicalRank.year' })}:</span>
          <Select
            size="small"
            value={year}
            onChange={(v) => {
              setYear(v);
              setPage(1);
            }}
            options={years.map((y) => ({ value: y, label: String(y) }))}
            className="filter-select"
          />
        </div>
        <div className="filter-item">
          <span className="filter-label">{intl.formatMessage({ id: 'wca.historicalRank.month' })}:</span>
          <Select
            size="small"
            value={month}
            onChange={(v) => {
              setMonth(v);
              setPage(1);
            }}
            options={monthOptions}
            className="filter-select"
          />
        </div>
        <div className="filter-item">
          <span className="filter-label">{intl.formatMessage({ id: 'wca.players.country' })}:</span>
          <Select
            size="small"
            value={country}
            onChange={(v) => {
              setCountry(v);
              setPage(1);
            }}
            options={countryOptions}
            className="filter-select"
            showSearch
            optionFilterProp="label"
            filterOption={(input, opt) =>
              (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
        <div className="filter-item">
          <span className="filter-label">{intl.formatMessage({ id: 'wca.resultTable.event' })}:</span>
          <Select
            size="small"
            value={eventId}
            onChange={(v) => {
              setEventId(v);
              if (v === '333mbf' && isAvg) setIsAvg(false);
              setPage(1);
            }}
            options={eventOptions}
            className="filter-select"
            showSearch
            optionFilterProp="value"
            filterOption={(input, opt) =>
              (opt?.value as string)?.toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
        {eventId !== '333mbf' && (
          <div className="filter-item">
            <span className="filter-label">{intl.formatMessage({ id: 'wca.historicalRank.type' })}:</span>
            <Select
              size="small"
              value={isAvg}
              onChange={(v) => {
                setIsAvg(v);
                setPage(1);
              }}
              options={[
                { value: false, label: intl.formatMessage({ id: 'wca.resultTable.single' }) },
                { value: true, label: intl.formatMessage({ id: 'wca.resultTable.average' }) },
              ]}
              className="filter-select"
            />
          </div>
        )}
        </div>
      </Card>

      <Card size="small" bordered className="stats-rank-table-card">
        <Spin spinning={loading}>
          <div className="table-wrapper">
            <Table
              dataSource={rankedData}
              columns={columns}
              rowKey="id"
              size="small"
              tableLayout="fixed"
              scroll={{ x: 1050 }}
              pagination={{
                size: 'small',
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                responsive: true,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                onChange: setPage,
                onShowSizeChange: (_, size) => {
                  setPageSize(size);
                  setPage(1);
                },
              }}
            />
          </div>
        </Spin>
      </Card>
    </div>
  );
};

export default YearlyFullRank;
