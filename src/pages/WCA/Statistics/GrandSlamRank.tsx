import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CubesCn } from '@/components/CubeIcon/cube';
import { WCALinkWithCnName } from '@/components/Link/Links';
import { eventOrder, EXCLUDED_EVENTS } from '@/pages/WCA/utils/events';
import { resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { CountryList } from '@/services/cubing-pro/wca/country';
import { GetAllEventChampionshipsPodium } from '@/services/cubing-pro/wca/static';
import { AllEventChampionshipsPodium, Country } from '@/services/cubing-pro/wca/types';
import { Input, Modal, Select, Table, Spin, Space, Switch, Button, Tag } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from '@@/plugin-locale';
import './GrandSlamRank.less';

const WORLD_KEY = '__world__';

/** 奖牌对应的 RGB 色值 */
const MEDAL_COLORS: Record<number, [number, number, number]> = {
  1: [255, 215, 0],   // 金
  2: [192, 192, 192], // 银
  3: [205, 127, 50],  // 铜
};

/** 按锦标赛层级区分透明度：世界最深，洲际加透明度，国家再加透明度 */
const TYPE_ALPHA: Record<string, number> = {
  world: 0.35,
  continent: 0.2,
  country: 0.12,
};

/** 根据奖牌和锦标赛类型计算 Tag 背景色 */
function getTagBgColor(rank: number, type: 'world' | 'continent' | 'country'): string {
  const rgb = MEDAL_COLORS[rank];
  if (!rgb) return 'rgba(0, 0, 0, 0.06)';
  const alpha = TYPE_ALPHA[type] ?? 0.15;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/** 根据排名返回奖牌图标 */
function getMedalIcon(rank: number): React.ReactNode {
  const sizeStyle = { fontSize: '1.35em' };
  if (rank === 1) return <span style={{ ...sizeStyle, color: '#FFD700' }}>🥇</span>;
  if (rank === 2) return <span style={{ ...sizeStyle, color: '#C0C0C0' }}>🥈</span>;
  if (rank === 3) return <span style={{ ...sizeStyle, color: '#CD7F32' }}>🥉</span>;
  return null;
}

/** 渲染锦标赛名称+奖牌 */
function renderChampionshipWithMedal(
  name: string,
  rank: number,
  type: 'world' | 'continent' | 'country',
): React.ReactNode {
  const icon = getMedalIcon(rank);
  const bgColor = getTagBgColor(rank, type);
  return (
    <Tag className="championship-tag" style={{ backgroundColor: bgColor, borderColor: 'transparent' }}>
      <span className="championship-name">{name || '-'}</span>
      {icon && <span style={{ marginLeft: 4, flexShrink: 0 }}>{icon}</span>}
    </Tag>
  );
}

interface PlayerGrandSlamSummary {
  wcaID: string;
  wcaName: string;
  country: string;
  count: number;
  displayRank: number;
  items: AllEventChampionshipsPodium[];
}

/** 为达成数相同的选手分配并列排名，下一名次顺延 */
function assignRanks(items: PlayerGrandSlamSummary[]): PlayerGrandSlamSummary[] {
  const result: PlayerGrandSlamSummary[] = [];
  let currentRank = 1;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const prev = items[i - 1];
    const isTied = prev && item.count === prev.count;
    if (!isTied) {
      currentRank = i + 1;
    }
    result.push({ ...item, displayRank: currentRank });
  }
  return result;
}

const GrandSlamRank: React.FC = () => {
  const intl = useIntl();
  const [showTable1, setShowTable1] = useState<boolean>(true);
  const [filterGrandSlamOnly, setFilterGrandSlamOnly] = useState<boolean>(true);
  const [filterHasWR, setFilterHasWR] = useState<boolean>(true);
  const [countryFilter, setCountryFilter] = useState<string>(WORLD_KEY);
  const [eventFilter, setEventFilter] = useState<string>('');
  const [nameFilter, setNameFilter] = useState<string>('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [data, setData] = useState<AllEventChampionshipsPodium[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRecord, setModalRecord] = useState<PlayerGrandSlamSummary | null>(null);

  useEffect(() => {
    CountryList().then(setCountries).catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    GetAllEventChampionshipsPodium()
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const countryIdsInData = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      if (r.country) set.add(r.country);
    });
    return set;
  }, [data]);

  const countryIdToName = useMemo(() => {
    const map = new Map<string, string>();
    countries.forEach((c) => {
      if (countryIdsInData.has(c.id)) {
        map.set(c.id, c.name || c.id);
      }
    });
    return map;
  }, [countries, countryIdsInData]);

  const countryOptions = useMemo(() => {
    const list = countries
      .filter((c) => c?.id && countryIdsInData.has(c.id) && !c.name?.includes('Multiple Countries'))
      .map((c) => ({
        value: c.id,
        label: c.name || c.id,
      }))
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    return [
      { value: WORLD_KEY, label: intl.formatMessage({ id: 'wca.historicalRank.worldwide' }) },
      ...list,
    ];
  }, [countries, countryIdsInData, intl]);

  const filteredData = useMemo(() => {
    let result = data.filter((r) => !EXCLUDED_EVENTS.includes(r.eventID));
    if (filterGrandSlamOnly) {
      result = result.filter(
        (r) =>
          r.worldChampionshipRank === 1 &&
          r.continentChampionshipRank === 1 &&
          r.countryChampionshipRank === 1,
      );
    }
    if (filterHasWR) {
      result = result.filter((r) => r.hasWR === true);
    }
    if (countryFilter !== WORLD_KEY) {
      result = result.filter((r) => r.country === countryFilter);
    }
    if (eventFilter) {
      result = result.filter((r) => r.eventID === eventFilter);
    }
    if (nameFilter.trim()) {
      const kw = nameFilter.trim().toLowerCase();
      result = result.filter(
        (r) =>
          (r.wcaName || '').toLowerCase().includes(kw) ||
          (r.wcaID || '').toLowerCase().includes(kw),
      );
    }
    return result;
  }, [data, filterGrandSlamOnly, filterHasWR, countryFilter, eventFilter, nameFilter]);

  const playerSummaryList = useMemo((): PlayerGrandSlamSummary[] => {
    const map = new Map<string, AllEventChampionshipsPodium[]>();
    const validData = data.filter((r) => !EXCLUDED_EVENTS.includes(r.eventID));
    for (const item of validData) {
      const key = item.wcaID;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    }
    const sorted = Array.from(map.entries())
      .map(([wcaID, items]) => {
        const first = items[0];
        return {
          wcaID,
          wcaName: first.wcaName,
          country: first.country,
          count: items.length,
          displayRank: 0,
          items,
        };
      })
      .sort((a, b) => b.count - a.count);
    return assignRanks(sorted);
  }, [data]);

  const eventOptions = [
    { value: '', label: intl.formatMessage({ id: 'wca.grandSlam.allEvents' }) },
    ...eventOrder
      .map((ev) => ({
        value: ev,
        label: (
          <Space>
            {CubeIcon(ev, `event_${ev}`, {})}
            {CubesCn(ev)}
          </Space>
        ),
      })),
  ];

  const table1Columns = [
    {
      title: '#',
      key: 'idx',
      width: 56,
      render: (_: unknown, __: AllEventChampionshipsPodium, index: number) => index + 1,
    },
    {
      title: intl.formatMessage({ id: 'wca.players.wcaId' }),
      dataIndex: 'wcaID',
      key: 'wcaID',
      width: 100,
      render: (_: string, record: AllEventChampionshipsPodium) =>
        WCALinkWithCnName(record.wcaID, record.wcaID),
    },
    {
      title: intl.formatMessage({ id: 'wca.players.name' }),
      dataIndex: 'wcaName',
      key: 'wcaName',
      width: 100,
      ellipsis: true,
      render: (_: string, record: AllEventChampionshipsPodium) =>
        WCALinkWithCnName(record.wcaID, record.wcaName),
    },
    {
      title: intl.formatMessage({ id: 'wca.grandSlam.event' }),
      dataIndex: 'eventID',
      key: 'eventID',
      width: 100,
      render: (val: string) => (
        <Space size={4}>
          {CubeIcon(val, `event_${val}`, {})}
          {CubesCn(val)}
        </Space>
      ),
    },
    {
      title: intl.formatMessage({ id: 'wca.resultTable.single' }),
      key: 'best',
      width: 90,
      render: (_: unknown, record: AllEventChampionshipsPodium) =>
        resultsTimeFormat(record.best, record.eventID, false),
    },
    {
      title: intl.formatMessage({ id: 'wca.resultTable.average' }),
      key: 'average',
      width: 90,
      render: (_: unknown, record: AllEventChampionshipsPodium) =>
        record.eventID === '333mbf' ? '—' : resultsTimeFormat(record.average, record.eventID, true),
    },
    {
      title: 'WR',
      key: 'hasWR',
      width: 56,
      render: (_: unknown, record: AllEventChampionshipsPodium) =>
        record.hasWR ? (
          <Tag style={{ backgroundColor: 'rgba(139, 0, 0, 0.25)', borderColor: '#8B0000', color: '#8B0000' }}>
            WR
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: intl.formatMessage({ id: 'wca.grandSlam.worldChampionship' }),
      key: 'world',
      minWidth: 180,
      render: (_: unknown, record: AllEventChampionshipsPodium) =>
        renderChampionshipWithMedal(record.worldChampionshipName, record.worldChampionshipRank, 'world'),
    },
    {
      title: intl.formatMessage({ id: 'wca.grandSlam.continentChampionship' }),
      key: 'continent',
      minWidth: 180,
      render: (_: unknown, record: AllEventChampionshipsPodium) =>
        renderChampionshipWithMedal(
          record.continentChampionshipName,
          record.continentChampionshipRank,
          'continent',
        ),
    },
    {
      title: intl.formatMessage({ id: 'wca.grandSlam.countryChampionship' }),
      key: 'countryChamp',
      minWidth: 180,
      render: (_: unknown, record: AllEventChampionshipsPodium) =>
        renderChampionshipWithMedal(
          record.countryChampionshipName,
          record.countryChampionshipRank,
          'country',
        ),
    },
    {
      title: intl.formatMessage({ id: 'wca.grandSlam.playerCountry' }),
      dataIndex: 'country',
      key: 'playerCountry',
      width: 120,
      render: (val: string) => countryIdToName.get(val) || val,
    },
  ];

  const table2Columns = [
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_: unknown, record: PlayerGrandSlamSummary) => (
        <Button
          type="link"
          size="small"
          icon={<RightOutlined />}
          onClick={() => {
            setModalRecord(record);
            setModalOpen(true);
          }}
        >
          {intl.formatMessage({ id: 'wca.grandSlam.viewDetail' })}
        </Button>
      ),
    },
    {
      title: intl.formatMessage({ id: 'wca.historicalRank.rank' }),
      dataIndex: 'displayRank',
      key: 'rank',
      width: 56,
    },
    {
      title: intl.formatMessage({ id: 'wca.players.wcaId' }),
      dataIndex: 'wcaID',
      key: 'wcaID',
      width: 100,
      render: (val: string) => val?.toUpperCase?.() || val,
    },
    {
      title: intl.formatMessage({ id: 'wca.players.name' }),
      dataIndex: 'wcaName',
      key: 'wcaName',
      width: 130,
      ellipsis: true,
      render: (_: string, record: PlayerGrandSlamSummary) =>
        WCALinkWithCnName(record.wcaID, record.wcaName),
    },
    {
      title: intl.formatMessage({ id: 'wca.grandSlam.achievedCount' }),
      dataIndex: 'count',
      key: 'count',
      width: 120,
      render: (val: number) => (
        <span style={{ fontWeight: 600 }}>
          {val} {intl.formatMessage({ id: 'wca.grandSlam.events' })}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'wca.players.country' }),
      dataIndex: 'country',
      key: 'country',
      width: 120,
      render: (val: string) => countryIdToName.get(val) || val,
    },
  ];

  return (
    <div className="grand-slam-rank">
      <p className="grand-slam-definition">
        {intl.formatMessage({ id: 'wca.grandSlam.definitionContent' })}
      </p>

      <div className="filter-row">
        <div className="filter-item filter-item-switch">
          <span className="filter-label">{intl.formatMessage({ id: 'wca.allEventsAchievement.viewMode' })}:</span>
          <Switch
            checked={showTable1}
            onChange={setShowTable1}
            checkedChildren={intl.formatMessage({ id: 'wca.grandSlam.viewResults' })}
            unCheckedChildren={intl.formatMessage({ id: 'wca.grandSlam.viewRank' })}
          />
        </div>
        {showTable1 && (
          <>
            <div className="filter-item filter-item-switch">
              <span className="filter-label">{intl.formatMessage({ id: 'wca.grandSlam.filterGrandSlamOnly' })}:</span>
              <Switch
                size="small"
                checked={filterGrandSlamOnly}
                onChange={setFilterGrandSlamOnly}
                checkedChildren={intl.formatMessage({ id: 'wca.grandSlam.filterGrandSlamOnlyOn' })}
                unCheckedChildren={intl.formatMessage({ id: 'wca.grandSlam.filterGrandSlamOnlyOff' })}
              />
            </div>
            <div className="filter-item filter-item-switch">
              <span className="filter-label">{intl.formatMessage({ id: 'wca.grandSlam.filterHasWR' })}:</span>
              <Switch
                size="small"
                checked={filterHasWR}
                onChange={setFilterHasWR}
                checkedChildren={intl.formatMessage({ id: 'wca.grandSlam.filterHasWROn' })}
                unCheckedChildren={intl.formatMessage({ id: 'wca.grandSlam.filterHasWROff' })}
              />
            </div>
            <div className="filter-item">
              <span className="filter-label">{intl.formatMessage({ id: 'wca.players.country' })}:</span>
              <Select
                size="small"
                value={countryFilter}
                onChange={setCountryFilter}
                options={countryOptions}
                className="filter-select"
                showSearch
                optionFilterProp="label"
                filterOption={(input, opt) =>
                  (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                style={{ minWidth: 140 }}
              />
            </div>
            <div className="filter-item">
              <span className="filter-label">{intl.formatMessage({ id: 'wca.grandSlam.event' })}:</span>
              <Select
                size="small"
                value={eventFilter}
                onChange={setEventFilter}
                options={eventOptions}
                className="filter-select"
                style={{ minWidth: 140 }}
              />
            </div>
            <div className="filter-item">
              <span className="filter-label">{intl.formatMessage({ id: 'wca.players.name' })}:</span>
              <Input
                size="small"
                placeholder={intl.formatMessage({ id: 'wca.grandSlam.namePlaceholder' })}
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                allowClear
                className="filter-input"
                style={{ width: 140 }}
              />
            </div>
          </>
        )}
      </div>

      <div className="table-section">
        <Spin spinning={loading}>
          <div className="table-wrapper">
            {showTable1 ? (
              <Table
                dataSource={filteredData}
                columns={table1Columns}
                rowKey={(r) => `${r.wcaID}-${r.eventID}`}
                size="small"
                tableLayout="auto"
                scroll={{ x: 'max-content' }}
                pagination={false}
              />
            ) : (
              <Table
                dataSource={playerSummaryList}
                columns={table2Columns}
                rowKey="wcaID"
                size="small"
                tableLayout="fixed"
                scroll={{ x: 600 }}
                pagination={false}
              />
            )}
          </div>
        </Spin>
      </div>

      <Modal
        title={
          modalRecord
            ? `${modalRecord.wcaName} (${modalRecord.wcaID}) - ${intl.formatMessage({ id: 'wca.grandSlam.viewDetail' })}`
            : ''
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setModalRecord(null);
        }}
        footer={null}
        width={800}
      >
        {modalRecord && (
          <Table
            dataSource={modalRecord.items}
            columns={table1Columns}
            rowKey={(r) => `${r.wcaID}-${r.eventID}`}
            size="small"
            tableLayout="auto"
            pagination={false}
            showHeader
          />
        )}
      </Modal>
    </div>
  );
};

export default GrandSlamRank;
