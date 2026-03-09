import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CubesCn } from '@/components/CubeIcon/cube';
import { WCALinkWithCnName } from '@/components/Link/Links';
import { getCountryNameByIso2 } from '@/pages/WCA/PlayerComponents/region/all_contiry';
import { eventOrder, EXCLUDED_EVENTS } from '@/pages/WCA/utils/events';
import { CountryList } from '@/services/cubing-pro/wca/country';
import { GetAllEventsAchievement } from '@/services/cubing-pro/wca/static';
import { AllEventAvgPersonResults, Country } from '@/services/cubing-pro/wca/types';
import { Select, Table, Spin, Switch, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from '@@/plugin-locale';
import './AllEventsAchievementRank.less';

const WORLD_KEY = '__world__';
const DEFAULT_PAGE_SIZE = 50;
const PAGE_SIZE_OPTIONS = [20, 50, 100];

/**
 * 从 record 中解析出已完成项目列表
 * 优先使用 doneEventList，若为空则尝试解析 doneEventJSON
 */
function parseCompletedEvents(record: AllEventAvgPersonResults): string[] {
  return record.doneEventList
}

/**
 * 根据已完成项目计算缺少的项目
 * 缺少 = 全项目 eventOrder 中不在已完成列表里的项目
 */
function getMissingEvents(completedEvents: string[]): string[] {
  const completedSet = new Set(completedEvents);
  return eventOrder.filter((eventId) => !completedSet.has(eventId) && !EXCLUDED_EVENTS.includes(eventId));
}

/** 为数据分配排名（按 useDate 升序，天数少的排前面，同天数并列） */
function assignRanks(
  items: AllEventAvgPersonResults[],
  offset: number,
): (AllEventAvgPersonResults & { displayRank: number })[] {
  const result: (AllEventAvgPersonResults & { displayRank: number })[] = [];
  let currentRank = offset + 1;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const prev = items[i - 1];
    const isTied = prev && item.useDate === prev.useDate;
    if (!isTied) {
      currentRank = offset + i + 1;
    }
    result.push({ ...item, displayRank: currentRank });
  }
  return result;
}

/** 仅分配序号（不做排行，用于缺少项目模式） */
function assignIndex(
  items: AllEventAvgPersonResults[],
  offset: number,
): (AllEventAvgPersonResults & { displayRank: number })[] {
  return items.map((item, i) => ({ ...item, displayRank: offset + i + 1 }));
}

const AllEventsAchievementRank: React.FC = () => {
  const intl = useIntl();
  const [country, setCountry] = useState<string>(WORLD_KEY);
  const [isFullAchievement, setIsFullAchievement] = useState<boolean>(true);
  const [lackNum, setLackNum] = useState<number>(1);
  const [countries, setCountries] = useState<Country[]>([]);
  const [data, setData] = useState<AllEventAvgPersonResults[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    CountryList().then(setCountries).catch(() => setCountries([]));
  }, []);

  const effectiveLackNum = isFullAchievement ? 0 : lackNum;

  useEffect(() => {
    setLoading(true);
    const countryParam = country === WORLD_KEY ? '' : country;
    GetAllEventsAchievement(effectiveLackNum, countryParam, page, pageSize)
      .then((res) => {
        setData(res.data || []);
        setTotal(res.total || 0);
      })
      .catch(() => {
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [country, effectiveLackNum, page, pageSize]);

  const rankedData = useMemo(
    () =>
      isFullAchievement
        ? assignRanks(data, (page - 1) * pageSize)
        : assignIndex(data, (page - 1) * pageSize),
    [data, page, pageSize, isFullAchievement],
  );

  const columns = [
    {
      title: intl.formatMessage({ id: 'wca.historicalRank.rank' }),
      key: 'rank',
      width: 56,
      render: (_: unknown, record: AllEventAvgPersonResults & { displayRank: number }) =>
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
      dataIndex: 'name',
      key: 'name',
      width: 130,
      ellipsis: true,
      render: (_: string, record: AllEventAvgPersonResults) =>
        WCALinkWithCnName(record.wcaId, record.name),
    },
    ...(isFullAchievement
      ? [
          {
            title: intl.formatMessage({ id: 'wca.allEventsAchievement.useDate' }),
            dataIndex: 'useDate',
            key: 'useDate',
            width: 90,
            align: 'right' as const,
            render: (val: number) => (
              <span style={{ fontWeight: 600 }}>
                {val !== null ? `${val} ${intl.formatMessage({ id: 'wca.allEventsAchievement.days' })}` : '-'}
              </span>
            ),
          },
        ]
      : []),
    ...(isFullAchievement
      ? [
          {
            title: intl.formatMessage({ id: 'wca.allEventsAchievement.achievedAt' }),
            key: 'allEventCompName',
            width: 180,
            ellipsis: true,
            render: (_: unknown, record: AllEventAvgPersonResults) =>
              record.allEventCompName ? (
                <Tag className="competition-tag">{record.allEventCompName}</Tag>
              ) : (
                '-'
              ),
          },
          {
            title: intl.formatMessage({ id: 'wca.allEventsAchievement.useCompNum' }),
            dataIndex: 'useCompNum',
            key: 'useCompNum',
            width: 90,
            align: 'right' as const,
          },
        ]
      : []),
    ...(!isFullAchievement
      ? [
          {
            title: intl.formatMessage({ id: 'wca.allEventsAchievement.missingEvents' }),
            key: 'missingEvents',
            width: 200,
            render: (_: unknown, record: AllEventAvgPersonResults) => {
              const completed = parseCompletedEvents(record);
              const missing = getMissingEvents(completed);
              return (
                <div className="missing-events-cell">
                  {missing.map((ev) => (
                    <Space key={ev} size={4} className="missing-event-tag">
                      {CubeIcon(ev, `event_${ev}`, {})}
                      {CubesCn(ev)}
                    </Space>
                  ))}
                </div>
              );
            },
          },
        ]
      : []),
    ...(country === WORLD_KEY
      ? [
          {
            title: intl.formatMessage({ id: 'wca.players.country' }),
            dataIndex: 'country',
            key: 'country',
            width: 90,
            render: (val: string) => getCountryNameByIso2(val) || val,
          },
        ]
      : []),
  ];

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
    <div className="all-events-achievement-rank">
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
        <div className="filter-item filter-item-switch">
          <span className="filter-label">{intl.formatMessage({ id: 'wca.allEventsAchievement.viewMode' })}:</span>
          <Switch
            checked={isFullAchievement}
            onChange={(checked) => {
              setIsFullAchievement(checked);
              setPage(1);
            }}
            checkedChildren={intl.formatMessage({ id: 'wca.allEventsAchievement.fullAchievement' })}
            unCheckedChildren={intl.formatMessage({ id: 'wca.allEventsAchievement.missingEventsMode' })}
          />
        </div>
        {!isFullAchievement && (
          <div className="filter-item">
            <span className="filter-label">{intl.formatMessage({ id: 'wca.allEventsAchievement.lackNum' })}:</span>
            <Select
              size="small"
              value={lackNum}
              onChange={(v) => {
                setLackNum(v);
                setPage(1);
              }}
              options={[1, 2, 3, 4].map((n) => ({
                value: n,
                label: String(n),
              }))}
              className="filter-select filter-select-lack"
            />
          </div>
        )}
      </div>

      <Spin spinning={loading}>
        <div className="table-wrapper">
          <Table
            dataSource={rankedData}
            columns={columns}
            rowKey="wcaId"
            size="small"
            tableLayout="fixed"
            scroll={{ x: 900 }}
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
    </div>
  );
};

export default AllEventsAchievementRank;
