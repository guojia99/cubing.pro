import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CubesCn } from '@/components/CubeIcon/cube';
import { WCALinkWithCnName } from '@/components/Link/Links';
import { CountryList, getWcaCountryLabel } from '@/services/cubing-pro/wca/country';
import { GetStaticSuccessRateResult } from '@/services/cubing-pro/wca/static';
import { Country, StaticSuccessRateResult } from '@/services/cubing-pro/wca/types';
import { Select, Table, Spin, Space, InputNumber, Button, Card } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from '@@/plugin-locale';
import './SuccessRateRank.less';
import './StatisticsRankLayout.less';

const WORLD_KEY = '__world__';
const DEFAULT_PAGE_SIZE = 50;
const PAGE_SIZE_OPTIONS = [20, 50, 100];

/** 成功率仅支持的项目 */
const SUCCESS_RATE_EVENTS = ['333bf', '444bf', '555bf', '333fm', "clock"];

/** 最小尝试数快捷选项 */
const MIN_ATTEMPTED_PRESETS = [5, 12, 50, 100, 200, 500];

/** 为成功率数据分配排名，比例、复原数、尝试数一致时同排名 */
function assignRanks(
  items: StaticSuccessRateResult[],
  offset: number,
): (StaticSuccessRateResult & { displayRank: number })[] {
  const result: (StaticSuccessRateResult & { displayRank: number })[] = [];
  let currentRank = offset + 1;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const prev = items[i - 1];
    const isTied =
      prev &&
      item.percentage === prev.percentage &&
      item.solved === prev.solved &&
      item.attempted === prev.attempted;
    if (!isTied) {
      currentRank = offset + i + 1;
    }
    result.push({ ...item, displayRank: currentRank });
  }
  return result;
}

const SuccessRateRank: React.FC = () => {
  const intl = useIntl();
  const [country, setCountry] = useState<string>(WORLD_KEY);
  const [eventId, setEventId] = useState<string>(SUCCESS_RATE_EVENTS[0]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [data, setData] = useState<StaticSuccessRateResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [minAttempted, setMinAttempted] = useState(3);
  const [minAttemptedInput, setMinAttemptedInput] = useState<number | null>(3);
  const [loading, setLoading] = useState(false);

  const commitMinAttempted = (v: number | null) => {
    if (v != null && !Number.isNaN(v)) {
      const clamped = Math.min(500, Math.max(3, Math.floor(v)));
      setMinAttempted(clamped);
      setMinAttemptedInput(clamped);
      setPage(1);
    }
  };

  useEffect(() => {
    CountryList().then(setCountries).catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const countryParam = country === WORLD_KEY ? '' : country;
    GetStaticSuccessRateResult(eventId, countryParam, page, pageSize, minAttempted)
      .then((res) => {
        setData(res.data || []);
        setTotal(res.total || 0);
      })
      .catch(() => {
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [country, eventId, page, pageSize, minAttempted]);

  const rankedData = useMemo(
    () => assignRanks(data, (page - 1) * pageSize),
    [data, page, pageSize],
  );

  const columns = [
    {
      title: intl.formatMessage({ id: 'wca.historicalRank.rank' }),
      key: 'rank',
      width: 56,
      fixed: 'left',
      render: (_: unknown, record: StaticSuccessRateResult & { displayRank: number }) =>
        record.displayRank,
    },
    {
      title: intl.formatMessage({ id: 'wca.players.wcaId' }),
      dataIndex: 'wcaId',
      key: 'wcaId',
      width: 120,
      render: (val: string) => val?.toUpperCase?.() || val,
    },
    {
      title: intl.formatMessage({ id: 'wca.players.name' }),
      dataIndex: 'wcaName',
      key: 'name',
      width: 130,
      ellipsis: true,
      render: (_: string, record: StaticSuccessRateResult) =>
        WCALinkWithCnName(record.wcaId, record.wcaName),
    },
    {
      title: intl.formatMessage({ id: 'wca.successRate.solved' }),
      dataIndex: 'solved',
      key: 'solved',
      width: 90,
      align: 'right' as const,
    },
    {
      title: intl.formatMessage({ id: 'wca.successRate.attempted' }),
      dataIndex: 'attempted',
      key: 'attempted',
      width: 90,
      align: 'right' as const,
    },
    {
      title: intl.formatMessage({ id: 'wca.successRate.percentage' }),
      key: 'percentage',
      width: 100,
      align: 'right' as const,
      render: (_: unknown, record: StaticSuccessRateResult) => (
        <span style={{ fontWeight: 600 }}>
          {record.percentage != null ? `${(record.percentage * 100).toFixed(2)}%` : '-'}
        </span>
      ),
    },
    ...(country === WORLD_KEY
      ? [
          {
            title: intl.formatMessage({ id: 'wca.players.country' }),
            dataIndex: 'country',
            key: 'country',
            width: 90,
            render: (val: string) => getWcaCountryLabel(val, countries),
          },
        ]
      : []),
  ];

  const eventOptions = SUCCESS_RATE_EVENTS.map((ev) => ({
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

  return (
    <div className="success-rate-rank">
      <Card size="small" bordered className="stats-rank-filter-card">
        <div className="filter-row">
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
              setMinAttempted(3);
              setMinAttemptedInput(3);
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
        <div className="filter-item filter-item-min-attempted">
          <span className="filter-label">{intl.formatMessage({ id: 'wca.successRate.minAttempted' })}:</span>
          <InputNumber
            size="small"
            min={3}
            max={500}
            value={minAttemptedInput}
            onChange={(v) => setMinAttemptedInput(v)}
            onBlur={() => commitMinAttempted(minAttemptedInput ?? minAttempted)}
            onPressEnter={() => commitMinAttempted(minAttemptedInput ?? minAttempted)}
            className="filter-input-number"
            style={{ width: 72 }}
          />
          <Space size={4} className="filter-presets">
            {MIN_ATTEMPTED_PRESETS.map((n) => (
              <Button
                key={n}
                type={minAttempted === n ? 'primary' : 'default'}
                size="small"
                onClick={() => {
                  setMinAttempted(n);
                  setMinAttemptedInput(n);
                  setPage(1);
                }}
              >
                {n}
              </Button>
            ))}
          </Space>
        </div>
        </div>
      </Card>

      <Card size="small" bordered className="stats-rank-table-card">
        <Spin spinning={loading}>
          <div className="table-wrapper">
            <Table
              dataSource={rankedData}
              columns={columns}
              rowKey="wcaId"
              size="small"
              tableLayout="fixed"
              scroll={{ x: 800 }}
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

export default SuccessRateRank;
