"use client";

import "antd/dist/reset.css";

import {
  AppstoreOutlined,
  CalendarOutlined,
  CrownOutlined,
  HistoryOutlined,
  HourglassOutlined,
  RiseOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Typography } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useIntlMessage } from "@/hooks/useIntlMessage";

import AllEventsAchievementRank from "./AllEventsAchievementRank";
import CompYearRank from "./CompYearRank";
import DiyEventsRank from "./DiyEventsRank";
import FullRank from "./FullRank";
import GrandSlamRank from "./GrandSlamRank";
import HistoricalRank from "./HistoricalRank";
import SuccessRateRank from "./SuccessRateRank";
import YearlyFullRank from "./YearlyFullRank";
import "./index.css";

const { Title } = Typography;

type StatsTabKey =
  | "grandSlam"
  | "historical"
  | "full"
  | "yearlyFull"
  | "compYear"
  | "successRate"
  | "allEventsAchievement"
  | "multiEventRank";

const TAB_PARAM = "tab";
const VALID_TAB_KEYS: StatsTabKey[] = [
  "grandSlam",
  "historical",
  "full",
  "yearlyFull",
  "compYear",
  "successRate",
  "allEventsAchievement",
  "multiEventRank",
];

const getTabFromSearch = (search: string): StatsTabKey => {
  const params = new URLSearchParams(search);
  const tab = params.get(TAB_PARAM);
  return tab && VALID_TAB_KEYS.includes(tab as StatsTabKey)
    ? (tab as StatsTabKey)
    : "grandSlam";
};

export function WcaStatisticsView() {
  const intl = useIntlMessage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locationSearch = searchParams?.toString()
    ? `?${searchParams.toString()}`
    : "";

  // 固定初始 Tab，避免 SSR/静态导出与客户端读 window.location 不一致导致 hydration 报错
  const [activeKey, setActiveKey] = useState<StatsTabKey>("grandSlam");

  useEffect(() => {
    setActiveKey(getTabFromSearch(locationSearch));
  }, [locationSearch]);

  const handleTabChange = useCallback(
    (key: StatsTabKey) => {
      setActiveKey(key);
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set(TAB_PARAM, key);
      const qs = params.toString();
      const path = pathname ?? "/wca/statistics";
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const cards = useMemo(
    () => [
      {
        key: "grandSlam" as StatsTabKey,
        icon: <CrownOutlined />,
        title: intl.formatMessage({ id: "wca.stats.grandSlam" }),
        desc: intl.formatMessage({ id: "wca.stats.grandSlamDesc" }),
      },
      {
        key: "historical" as StatsTabKey,
        icon: <HistoryOutlined />,
        title: intl.formatMessage({ id: "wca.stats.historicalRank" }),
        desc: intl.formatMessage({ id: "wca.stats.historicalRankDesc" }),
      },
      {
        key: "full" as StatsTabKey,
        icon: <UnorderedListOutlined />,
        title: intl.formatMessage({ id: "wca.stats.fullRank" }),
        desc: intl.formatMessage({ id: "wca.stats.fullRankDesc" }),
      },
      {
        key: "yearlyFull" as StatsTabKey,
        icon: <CalendarOutlined />,
        title: intl.formatMessage({ id: "wca.stats.yearlyFullRank" }),
        desc: intl.formatMessage({ id: "wca.stats.yearlyFullRankDesc" }),
      },
      {
        key: "compYear" as StatsTabKey,
        icon: <HourglassOutlined />,
        title: intl.formatMessage({ id: "wca.stats.compYearRank" }),
        desc: intl.formatMessage({ id: "wca.stats.compYearRankDesc" }),
      },
      {
        key: "successRate" as StatsTabKey,
        icon: <RiseOutlined />,
        title: intl.formatMessage({ id: "wca.stats.successRate" }),
        desc: intl.formatMessage({ id: "wca.stats.successRateDesc" }),
      },
      {
        key: "allEventsAchievement" as StatsTabKey,
        icon: <TrophyOutlined />,
        title: intl.formatMessage({ id: "wca.stats.allEventsAchievement" }),
        desc: intl.formatMessage({ id: "wca.stats.allEventsAchievementDesc" }),
      },
      {
        key: "multiEventRank" as StatsTabKey,
        icon: <AppstoreOutlined />,
        title: intl.formatMessage({ id: "wca.stats.multiEventRank" }),
        desc: intl.formatMessage({ id: "wca.stats.multiEventRankDesc" }),
      },
    ],
    [intl],
  );

  return (
    <div className="stats-index">
      <Title level={3} className="stats-page-title">
        {intl.formatMessage({ id: "wca.stats.title" })}
      </Title>
      <div
        className="stats-tab-grid"
        role="tablist"
        aria-label={intl.formatMessage({ id: "wca.stats.title" })}
      >
        {cards.map((card) => {
          const selected = activeKey === card.key;
          return (
            <button
              key={card.key}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={0}
              className={`stats-tab-item ${selected ? "active" : ""}`}
              onClick={() => handleTabChange(card.key)}
            >
              <span className="stats-tab-item-head">
                <span className="stats-tab-icon" aria-hidden>
                  {card.icon}
                </span>
                <span className="stats-tab-title-text">{card.title}</span>
              </span>
              <span className="stats-tab-desc">{card.desc}</span>
            </button>
          );
        })}
      </div>
      <div className="stats-content">
        <h1 className="stats-tab-title">
          {cards.find((c) => c.key === activeKey)?.title}
        </h1>
        {activeKey === "grandSlam" && <GrandSlamRank />}
        {activeKey === "historical" && <HistoricalRank />}
        {activeKey === "full" && <FullRank />}
        {activeKey === "yearlyFull" && <YearlyFullRank />}
        {activeKey === "compYear" && <CompYearRank />}
        {activeKey === "successRate" && <SuccessRateRank />}
        {activeKey === "allEventsAchievement" && <AllEventsAchievementRank />}
        {activeKey === "multiEventRank" && <DiyEventsRank />}
      </div>
    </div>
  );
}

export default WcaStatisticsView;
