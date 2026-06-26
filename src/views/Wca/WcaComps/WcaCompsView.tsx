"use client";

import "antd/dist/reset.css";

import {
  AppstoreOutlined,
  ReloadOutlined,
  TableOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import { useIntlMessage } from "@/hooks/useIntlMessage";
import {
  fetchWcaCompetitionIndex,
  type WcaCompetitionIndexItem,
} from "@/services/cubing-pro/wca/competition_index";
import { CountryList, getWcaCountryLabel } from "@/services/cubing-pro/wca/country";
import type { Country } from "@/services/cubing-pro/wca/types";
import EventSelectorEventsOnly from "@/views/Static/EventSelectorEventsOnly";
import {
  CountryAvatar,
  getCountryNameByIso2,
} from "@/views/Wca/PlayerComponents/region/all_contiry";
import { eventOrder } from "@/views/Wca/utils/events";

import { DEFAULT_COUNTRY_ISO2, NEARBY_COUNTRY_ISO2 } from "./constants";
import {
  compDurationDays,
  extractVenue,
  filterCompsByEvents,
  formatCompDateRange,
  formatToBeijingTime,
  getRegistrationStatus,
  sortCompsByStartDate,
  wcaCompetitionUrl,
} from "./utils";
import "./WcaComps.css";

const { Title, Text, Link } = Typography;

type CountryScope = "nearby" | "all";
type ViewMode = "table" | "card";

const REGISTRATION_TAG_COLOR: Record<string, string> = {
  notStarted: "orange",
  open: "green",
  closed: "red",
  unknown: "default",
};

function countryOptionLabel(iso2: string, countries: Country[]): string {
  const fromList = countries.find((c) => (c.iso2 || "").toUpperCase() === iso2.toUpperCase());
  if (fromList) {
    return getWcaCountryLabel(fromList.id, countries);
  }
  return getCountryNameByIso2(iso2) || iso2;
}

export function WcaCompsView() {
  const intl = useIntlMessage();

  const [countryScope, setCountryScope] = useState<CountryScope>("nearby");
  const [countryIso2, setCountryIso2] = useState(DEFAULT_COUNTRY_ISO2);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [comps, setComps] = useState<WcaCompetitionIndexItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    CountryList()
      .then(setAllCountries)
      .catch(() => setAllCountries([]));
  }, []);

  const countryOptions = useMemo(() => {
    const isoList =
      countryScope === "nearby"
        ? [...NEARBY_COUNTRY_ISO2]
        : allCountries
            .filter((c) => c.iso2 && !c.name?.includes("Multiple Countries"))
            .map((c) => (c.iso2 || "").toUpperCase())
            .filter(Boolean);

    const unique = [...new Set(isoList)];
    if (countryScope === "all") {
      unique.sort((a, b) =>
        countryOptionLabel(a, allCountries).localeCompare(countryOptionLabel(b, allCountries)),
      );
    }

    return unique.map((iso2) => ({
      value: iso2,
      label: countryOptionLabel(iso2, allCountries),
    }));
  }, [countryScope, allCountries]);

  const loadComps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWcaCompetitionIndex({
        countryIso2,
        events: selectedEvents,
      });
      setComps(filterCompsByEvents(data, selectedEvents));
    } catch {
      setComps([]);
      message.error(intl.formatMessage({ id: "wca.comps.loadError" }));
    } finally {
      setLoading(false);
    }
  }, [countryIso2, selectedEvents, intl]);

  useEffect(() => {
    void loadComps();
  }, [loadComps]);

  const handleScopeChange = (scope: CountryScope) => {
    setCountryScope(scope);
    if (scope === "nearby") {
      const nearby = NEARBY_COUNTRY_ISO2 as readonly string[];
      if (!nearby.includes(countryIso2)) {
        setCountryIso2(DEFAULT_COUNTRY_ISO2);
      }
    }
  };

  const sortedComps = useMemo(() => sortCompsByStartDate(comps), [comps]);

  const registrationLabel = (status: ReturnType<typeof getRegistrationStatus>) =>
    intl.formatMessage({ id: `wca.comps.registration.${status}` });

  const columns: ColumnsType<WcaCompetitionIndexItem> = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: "wca.competition.index" }),
        key: "index",
        width: 56,
        align: "center",
        render: (_v, _r, index) => index + 1,
      },
      {
        title: intl.formatMessage({ id: "wca.competition.time" }),
        key: "date",
        width: 180,
        render: (_, record) => formatCompDateRange(record.start_date, record.end_date),
      },
      {
        title: intl.formatMessage({ id: "wca.competition.name" }),
        dataIndex: "name",
        key: "name",
        ellipsis: true,
        render: (name: string, record) => (
          <a href={wcaCompetitionUrl(record.id)} target="_blank" rel="noopener noreferrer">
            {name}
          </a>
        ),
      },
      {
        title: intl.formatMessage({ id: "wca.competition.city" }),
        dataIndex: "city",
        key: "city",
        width: 140,
        ellipsis: true,
      },
      {
        title: intl.formatMessage({ id: "wca.competition.events" }),
        key: "events",
        width: 220,
        render: (_, record) => (
          <Space size={4} wrap className="wca-comps-events">
            {(record.event_ids ?? []).map((eid) => CubeIcon(eid, eid, {}))}
          </Space>
        ),
      },
      {
        title: intl.formatMessage({ id: "wca.comps.registrationStatus" }),
        key: "registration",
        width: 120,
        render: (_, record) => {
          const status = getRegistrationStatus(
            record.registration_open,
            record.registration_close,
          );
          return (
            <Tag color={REGISTRATION_TAG_COLOR[status]}>
              {registrationLabel(status)}
            </Tag>
          );
        },
      },
      {
        title: intl.formatMessage({ id: "wca.comps.venue" }),
        key: "venue",
        ellipsis: true,
        render: (_, record) => {
          const venue = extractVenue(record.venue || "");
          return venue.url ? (
            <Link href={venue.url} target="_blank" rel="noopener noreferrer">
              {venue.text}
            </Link>
          ) : (
            venue.text
          );
        },
      },
    ],
    [intl],
  );

  const renderCardItem = (item: WcaCompetitionIndexItem) => {
    const days = compDurationDays(item.start_date, item.end_date);
    const venueParsed = extractVenue(item.venue || "");
    const regStatus = getRegistrationStatus(item.registration_open, item.registration_close);

    return (
      <Card
        className="wca-comps-card"
        size="small"
        title={
          <span className="wca-comps-card-title">
            <a href={wcaCompetitionUrl(item.id)} target="_blank" rel="noopener noreferrer">
              {item.name}
            </a>
          </span>
        }
      >
        <div className="wca-comps-card-row">
          <Text strong>{intl.formatMessage({ id: "wca.competition.city" })}：</Text>
          {item.city}
        </div>
        <div className="wca-comps-card-row">
          <Text strong>{intl.formatMessage({ id: "wca.comps.compDates" })}：</Text>
          {formatCompDateRange(item.start_date, item.end_date)}{" "}
          <Tag color="blue">
            {intl.formatMessage({ id: "wca.comps.days" }, { count: days })}
          </Tag>
        </div>
        <div className="wca-comps-card-row">
          <Text strong>{intl.formatMessage({ id: "wca.comps.venue" })}：</Text>
          {venueParsed.url ? (
            <Link href={venueParsed.url} target="_blank" rel="noopener noreferrer">
              {venueParsed.text}
            </Link>
          ) : (
            venueParsed.text
          )}
        </div>
        <div className="wca-comps-card-row">
          <Text strong>{intl.formatMessage({ id: "wca.competition.events" })}：</Text>
          <span className="wca-comps-events">
            {(item.event_ids ?? []).map((eid) => CubeIcon(eid, eid, {}))}
          </span>
        </div>
        {item.registration_open && item.registration_close ? (
          <div className="wca-comps-card-row">
            <Text strong>{intl.formatMessage({ id: "wca.comps.registrationWindow" })}：</Text>
            {formatToBeijingTime(item.registration_open)} ~{" "}
            {formatToBeijingTime(item.registration_close)}
          </div>
        ) : null}
        <div className="wca-comps-card-row">
          <Text strong>{intl.formatMessage({ id: "wca.comps.registrationStatus" })}：</Text>
          <Tag color={REGISTRATION_TAG_COLOR[regStatus]}>{registrationLabel(regStatus)}</Tag>
        </div>
      </Card>
    );
  };

  return (
    <div className="wca-comps-page">
      <div className="wca-comps-header">
        <Title level={3} style={{ marginBottom: 4 }}>
          {intl.formatMessage({ id: "wca.comps.title" })}
        </Title>
        <Text type="secondary">{intl.formatMessage({ id: "wca.comps.subtitle" })}</Text>
      </div>

      <Card size="small" className="wca-comps-filter-card">
        <div className="wca-comps-filter-row">
          <div className="wca-comps-filter-item">
            <span className="wca-comps-filter-label">
              {intl.formatMessage({ id: "wca.comps.countryScope" })}：
            </span>
            <Segmented<CountryScope>
              className="wca-comps-scope-segmented"
              value={countryScope}
              onChange={handleScopeChange}
              options={[
                {
                  label: intl.formatMessage({ id: "wca.comps.scopeNearby" }),
                  value: "nearby",
                },
                {
                  label: intl.formatMessage({ id: "wca.comps.scopeAll" }),
                  value: "all",
                },
              ]}
            />
          </div>
          <div className="wca-comps-filter-item">
            <span className="wca-comps-filter-label">
              {intl.formatMessage({ id: "wca.players.country" })}：
            </span>
            <Select
              className="wca-comps-country-select"
              value={countryIso2}
              onChange={setCountryIso2}
              options={countryOptions}
              showSearch
              optionFilterProp="label"
              popupMatchSelectWidth={false}
              optionRender={(option) => (
                <span>
                  {CountryAvatar(String(option.value))}
                  {option.label}
                </span>
              )}
              labelRender={(props) => (
                <span>
                  {CountryAvatar(String(props.value))}
                  {props.label}
                </span>
              )}
            />
          </div>
          <div className="wca-comps-filter-item wca-comps-view-toggle">
            <Segmented<ViewMode>
              value={viewMode}
              onChange={setViewMode}
              options={[
                {
                  value: "card",
                  icon: <AppstoreOutlined />,
                  label: intl.formatMessage({ id: "wca.comps.viewCard" }),
                },
                {
                  value: "table",
                  icon: <TableOutlined />,
                  label: intl.formatMessage({ id: "wca.comps.viewTable" }),
                },
              ]}
            />
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void loadComps()}
            loading={loading}
          >
            {intl.formatMessage({ id: "wca.comps.refresh" })}
          </Button>
        </div>
      </Card>

      <EventSelectorEventsOnly events={eventOrder} onConfirm={setSelectedEvents} />

      <div className="wca-comps-result-meta">
        {intl.formatMessage(
          { id: "wca.comps.resultCount" },
          { count: sortedComps.length },
        )}
        {selectedEvents.length > 0
          ? ` · ${intl.formatMessage(
              { id: "wca.comps.filteredByEvents" },
              { count: selectedEvents.length },
            )}`
          : null}
      </div>

      <Spin spinning={loading}>
        {sortedComps.length === 0 && !loading ? (
          <div className="wca-comps-empty">
            <Empty description={intl.formatMessage({ id: "wca.comps.empty" })} />
            <Button type="primary" style={{ marginTop: 16 }} onClick={() => void loadComps()}>
              {intl.formatMessage({ id: "wca.comps.refresh" })}
            </Button>
          </div>
        ) : viewMode === "table" ? (
          <Table
            columns={columns}
            dataSource={sortedComps}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20, showSizeChanger: true }}
            scroll={{ x: "max-content" }}
          />
        ) : (
          <div className="wca-comps-card-grid">
            {sortedComps.map((item) => (
              <div key={item.id} className="wca-comps-card-grid-item">
                {renderCardItem(item)}
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
}
