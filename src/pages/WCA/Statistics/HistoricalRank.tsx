import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CubesCn } from '@/components/CubeIcon/cube';
import { WCALinkWithCnName } from '@/components/Link/Links';
import { getCountryNameByIso2 } from '@/pages/WCA/PlayerComponents/region/all_contiry';
import { resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { eventOrder } from '@/pages/WCA/utils/events';
import { CountryList } from '@/services/cubing-pro/wca/country';
import { GetEventRankTimers } from '@/services/cubing-pro/wca/static';
import { Country, StaticWithTimerRank } from '@/services/cubing-pro/wca/types';
import { Select, Table, Spin, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useIntl } from '@@/plugin-locale';
import './HistoricalRank.less';

const { Title } = Typography;

const WORLD_KEY = '__world__';
const DEFAULT_PAGE_SIZE = 100;
const PAGE_SIZE_OPTIONS = [20, 50, 100];

const HistoricalRank: React.FC = () => {
  const intl = useIntl();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2006 }, (_, i) => 2007 + i).reverse();

  const [year, setYear] = useState<number>(currentYear);
  const [country, setCountry] = useState<string>(WORLD_KEY);
  const [eventId, setEventId] = useState<string>('333');
  const [isAvg, setIsAvg] = useState<boolean>(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [data, setData] = useState<StaticWithTimerRank[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    CountryList().then(setCountries).catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const countryParam = country === WORLD_KEY ? '' : country;
    GetEventRankTimers(eventId, year, countryParam, isAvg, page, pageSize)
      .then((res) => {
        setData(res.data || []);
        setTotal(res.total || 0);
      })
      .catch(() => {
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [year, country, eventId, isAvg, page, pageSize]);

  const isWorld = country === WORLD_KEY;
  const rankKey = isAvg ? 'avgWorldRank' : 'singleWorldRank';
  const countryRankKey = isAvg ? 'avgCountryRank' : 'singleCountryRank';

  const singleCol = {
    title: intl.formatMessage({ id: 'wca.resultTable.single' }),
    key: 'single',
    width: 100,
    render: (_: unknown, record: StaticWithTimerRank) => (
      <span style={{ fontWeight: !isAvg ? 600 : 400 }}>
        {resultsTimeFormat(record.single, eventId, false)}
      </span>
    ),
  };

  const avgCol =
    eventId !== '333mbf'
      ? {
          title: intl.formatMessage({ id: 'wca.resultTable.average' }),
          key: 'average',
          width: 100,
          render: (_: unknown, record: StaticWithTimerRank) => (
            <span style={{ fontWeight: isAvg ? 600 : 400 }}>
              {resultsTimeFormat(record.average, eventId, true)}
            </span>
          ),
        }
      : null;

  const columns = [
    {
      title: intl.formatMessage({ id: 'wca.historicalRank.rank' }),
      key: 'rank',
      width: 70,
      render: (_: unknown, record: StaticWithTimerRank) =>
        isWorld ? record[rankKey as keyof StaticWithTimerRank] : record[countryRankKey as keyof StaticWithTimerRank],
    },
    {
      title: intl.formatMessage({ id: 'wca.players.wcaId' }),
      dataIndex: 'wcaId',
      key: 'wcaId',
      width: 120,
    },
    {
      title: intl.formatMessage({ id: 'wca.players.name' }),
      dataIndex: 'wcaName',
      key: 'wcaName',
      width: 200,
      ellipsis: true,
      render: (_: string, record: StaticWithTimerRank) =>
        WCALinkWithCnName(record.wcaId, record.wcaName),
    },
    singleCol,
    ...(avgCol ? [avgCol] : []),
    ...(isWorld
      ? [
          {
            title: intl.formatMessage({ id: 'wca.players.country' }),
            dataIndex: 'country',
            key: 'country',
            width: 120,
            render: (val: string) => getCountryNameByIso2(val) || val,
          },
        ]
      : []),
  ];

  const eventOptions = eventOrder.map((ev) => ({
    value: ev,
    label: (
      <Space>
        {CubeIcon(ev, `event_${ev}`, {})}
        {CubesCn(ev)}
      </Space>
    ),
  }));

  const filteredCountries = countries
    .filter((c) => c?.iso2 && !c.name?.includes('Multiple Countries'))
    .map((c) => ({
      value: c.iso2,
      label: getCountryNameByIso2(c.iso2) || c.name,
    }));
  const cnOption = filteredCountries.find((c) => c.value === 'CN');
  const otherOptions = filteredCountries.filter((c) => c.value !== 'CN');
  const countryOptions = [
    { value: WORLD_KEY, label: intl.formatMessage({ id: 'wca.historicalRank.worldwide' }) },
    ...(cnOption ? [cnOption] : []),
    ...otherOptions,
  ];

  return (
    <div className="historical-rank">
      <Title level={3} className="page-title">
        {intl.formatMessage({ id: 'wca.historicalRank.title' })}
      </Title>

      <div className="filter-row">
        <div className="filter-item">
          <span className="filter-label">{intl.formatMessage({ id: 'wca.historicalRank.year' })}:</span>
          <Select
            size="small"
            value={year}
            onChange={setYear}
            options={years.map((y) => ({ value: y, label: String(y) }))}
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

      <Spin spinning={loading}>
        <div className="table-wrapper">
          <Table
            dataSource={data}
            columns={columns}
            rowKey="wcaId"
            size="small"
            scroll={{ x: 600 }}
            pagination={{
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
    </div>
  );
};

export default HistoricalRank;
