import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { WCALinkWithCnName } from '@/components/Link/Links';
import { CountryList, getWcaCountryLabel } from '@/services/cubing-pro/wca/country';
import { GetNotPodiumRankWithDiyEvents, GetRankWithDiyEvents } from '@/services/cubing-pro/wca/static';
import { Country, RankEntry, RankWithEventsStatic } from '@/services/cubing-pro/wca/types';
import { eventOrder } from '@/pages/WCA/utils/events';
import EventSelectorEventsOnly from '@/pages/Static/EventSelectorEventsOnly';
import type { ColumnsType } from 'antd/es/table';
import { Button, Card, Select, Spin, Switch, Table } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from '@@/plugin-locale';
import './StatisticsRankLayout.less';
import './DiyEventsRank.less';

const WORLD_KEY = '__world__';
const DEFAULT_PAGE_SIZE = 50;
const PAGE_SIZE_OPTIONS = [20, 50, 100];

function isFullEventSet(selected: string[], all: readonly string[]): boolean {
  if (selected.length !== all.length) return false;
  const s = new Set(selected);
  return all.every((e) => s.has(e));
}

function eventsPayload(selected: string[]): string[] {
  return isFullEventSet(selected, eventOrder) ? [] : [...selected];
}

/** 与后端参与计算的项目列表一致（含「全选」与平均下剔除 333mbf） */
function getEffectiveEventList(applied: string[], isAvg: boolean): string[] {
  const useAll = isFullEventSet(applied, eventOrder) || applied.length === 0;
  const list = useAll ? [...eventOrder] : [...applied];
  if (isAvg) return list.filter((e) => e !== '333mbf');
  return list;
}

const DiyEventsRank: React.FC = () => {
  const intl = useIntl();
  const [country, setCountry] = useState<string>(WORLD_KEY);
  const [isAvg, setIsAvg] = useState(false);
  const [appliedEvents, setAppliedEvents] = useState<string[]>(() => [...eventOrder]);
  const [notPodiumOnly, setNotPodiumOnly] = useState(false);
  const [fourthPlaceKing, setFourthPlaceKing] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [data, setData] = useState<RankWithEventsStatic[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [eventColsCollapsed, setEventColsCollapsed] = useState(false);

  useEffect(() => {
    CountryList().then(setCountries).catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const countryParam = country === WORLD_KEY ? '' : country;
    const ev = eventsPayload(appliedEvents);
    const bestMisser = notPodiumOnly && fourthPlaceKing ? 4 : 0;

    const req = notPodiumOnly
      ? GetNotPodiumRankWithDiyEvents(ev, countryParam, bestMisser, isAvg, page, pageSize)
      : GetRankWithDiyEvents(ev, countryParam, isAvg, page, pageSize);

    req
      .then((res) => {
        setData(res.data || []);
        setTotal(res.total || 0);
      })
      .catch(() => {
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [country, isAvg, appliedEvents, notPodiumOnly, fourthPlaceKing, page, pageSize]);

  const columnEventIds = useMemo(() => {
    const first = data.find((r) => r.rankEntries && r.rankEntries.length > 0);
    if (first?.rankEntries?.length) {
      return first.rankEntries.map((e) => e.eventId);
    }
    return getEffectiveEventList(appliedEvents, isAvg);
  }, [data, appliedEvents, isAvg]);

  const columns: ColumnsType<RankWithEventsStatic> = useMemo(() => {
    const base: ColumnsType<RankWithEventsStatic> = [
      {
        title: intl.formatMessage({ id: 'wca.historicalRank.rank' }),
        dataIndex: 'rank',
        key: 'rank',
        width: 56,
        fixed: 'left',
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
        dataIndex: 'name',
        key: 'name',
        width: 130,
        ellipsis: true,
        render: (_: string, record: RankWithEventsStatic) => WCALinkWithCnName(record.wcaId, record.name),
      },
    ];

    if (country === WORLD_KEY) {
      base.push({
        title: intl.formatMessage({ id: 'wca.players.country' }),
        dataIndex: 'country',
        key: 'country',
        width: 100,
        ellipsis: true,
        render: (val: string | undefined) => getWcaCountryLabel(val, countries) || '–',
      });
    }

    if (!eventColsCollapsed && columnEventIds.length > 0) {
      for (const eventId of columnEventIds) {
        base.push({
          key: `ev_${eventId}`,
          align: 'center',
          width: 56,
          onHeaderCell: () => ({ className: 'diy-event-col-th' }),
          onCell: () => ({ className: 'diy-event-col-td' }),
          title: (
            <span className="diy-event-col-hdr" title={eventId}>
              {CubeIcon(eventId, `diy_hdr_${eventId}`, {})}
            </span>
          ),
          render: (_: unknown, record: RankWithEventsStatic) => {
            const entry = record.rankEntries?.find((x: RankEntry) => x.eventId === eventId);
            if (!entry) return '–';
            const { rank, missing } = entry;
            const cls = missing
              ? 'diy-event-rank-cell diy-event-rank-cell--missing'
              : rank > 0 && rank <= 10
                ? 'diy-event-rank-cell diy-event-rank-cell--top10'
                : 'diy-event-rank-cell';
            return <span className={cls}>{rank}</span>;
          },
        });
      }
    }

    base.push({
      title: intl.formatMessage({ id: 'wca.multiEventRank.rankSum' }),
      dataIndex: 'count',
      key: 'count',
      width: 100,
      align: 'right',
      fixed: 'right',
      render: (val: number) => <span style={{ fontWeight: 600 }}>{val}</span>,
    });

    return base;
  }, [intl, country, countries, eventColsCollapsed, columnEventIds]);

  const scrollX = useMemo(() => {
    if (eventColsCollapsed || columnEventIds.length === 0) {
      return country === WORLD_KEY ? 720 : 620;
    }
    return Math.min(2400, 420 + columnEventIds.length * 56 + (country === WORLD_KEY ? 100 : 0));
  }, [eventColsCollapsed, columnEventIds.length, country]);

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
    <div className="diy-events-rank">
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
          <div className="filter-item filter-item-switch">
            <span className="filter-label">{intl.formatMessage({ id: 'wca.multiEventRank.notPodiumOnly' })}:</span>
            <Switch
              checked={notPodiumOnly}
              onChange={(checked) => {
                setNotPodiumOnly(checked);
                if (!checked) setFourthPlaceKing(false);
                setPage(1);
              }}
            />
          </div>
          {notPodiumOnly && (
            <div className="filter-item filter-item-switch">
              <span className="filter-label">{intl.formatMessage({ id: 'wca.multiEventRank.fourthKing' })}:</span>
              <Switch
                checked={fourthPlaceKing}
                onChange={(checked) => {
                  setFourthPlaceKing(checked);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      </Card>

      <EventSelectorEventsOnly
        events={[...eventOrder]}
        onConfirm={(evs) => {
          setAppliedEvents([...evs]);
          setPage(1);
        }}
      />

      <Card size="small" bordered className="stats-rank-table-card">
        <div className="diy-events-table-toolbar">
          <Button size="small" type="default" onClick={() => setEventColsCollapsed((v) => !v)}>
            {eventColsCollapsed
              ? intl.formatMessage({ id: 'wca.multiEventRank.expandEventCols' })
              : intl.formatMessage({ id: 'wca.multiEventRank.collapseEventCols' })}
          </Button>
        </div>
        <Spin spinning={loading}>
          <div className="table-wrapper">
            <Table<RankWithEventsStatic>
              dataSource={data}
              columns={columns}
              rowKey={(r) => r.wcaId}
              size="small"
              tableLayout="fixed"
              scroll={{ x: scrollX }}
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

export default DiyEventsRank;
