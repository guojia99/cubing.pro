"use client";

import { Card, Tabs } from "antd";
import type { TabsProps } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useIntlMessage } from "@/hooks/useIntlMessage";
import MilestoneTimelines from "@/views/Wca/PlayerComponents/Milestone";
import CompetitionTable from "@/views/Wca/PlayerComponents/WCAPlayerStaticsTabComps";
import WCAPlayerEventStatsTab from "@/views/Wca/PlayerComponents/WCAPlayerEventStatsTab";
import WCAPlayerLitCitiesTab from "@/views/Wca/PlayerComponents/WCAPlayerLitCitiesTab";
import WCAPlayerStaticsTabResults from "@/views/Wca/PlayerComponents/WCAPlayerStaticsTabResults";
import type {
  StaticWithTimerRank,
  WCACompetition,
  WcaProfile,
  WCAResult,
} from "@/services/cubing-pro/wca/types";

import "./WCAPlayerStaticsTab.css";

const WCA_PLAYER_TAB_KEYS = [
  "results",
  "competitions",
  "eventStats",
  "milestones",
  "litCities",
] as const;
type WcaPlayerTabKey = (typeof WCA_PLAYER_TAB_KEYS)[number];

function tabKeyFromSearch(search: string): WcaPlayerTabKey {
  const raw = new URLSearchParams(search).get("tab");
  if (raw && (WCA_PLAYER_TAB_KEYS as readonly string[]).includes(raw)) {
    return raw as WcaPlayerTabKey;
  }
  return "results";
}

interface WCAPlayerStaticsTabProps {
  wcaProfile: WcaProfile;
  wcaResults: WCAResult[];
  comps: WCACompetition[];
  wcaRankTimer: StaticWithTimerRank[];
}

const WCAPlayerStaticsTab: React.FC<WCAPlayerStaticsTabProps> = ({
  wcaProfile,
  wcaResults,
  comps,
  wcaRankTimer,
}) => {
  const intl = useIntlMessage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locationSearch = searchParams?.toString()
    ? `?${searchParams.toString()}`
    : "";

  const [activeKey, setActiveKey] = useState<WcaPlayerTabKey>(() =>
    typeof window !== "undefined"
      ? tabKeyFromSearch(window.location.search)
      : "results",
  );

  useEffect(() => {
    setActiveKey(tabKeyFromSearch(locationSearch));
  }, [wcaProfile.wcaId, locationSearch]);

  const onTabChange = useCallback(
    (key: string) => {
      if (!(WCA_PLAYER_TAB_KEYS as readonly string[]).includes(key)) return;
      const k = key as WcaPlayerTabKey;
      setActiveKey(k);
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("tab", k);
      const qs = next.toString();
      const path = pathname ?? "";
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const compDateMap = new Map(comps.map((c) => [c.id, c.start_date]));
  const wcaResultsRes = [...wcaResults].sort((a, b) => {
    const dateA = compDateMap.get(a.competition_id) ?? "";
    const dateB = compDateMap.get(b.competition_id) ?? "";
    return dateB.localeCompare(dateA);
  });

  const tabItems: TabsProps["items"] = useMemo(
    () => [
      {
        key: "results",
        label: intl.formatMessage({ id: "wca.tabs.results" }),
        children: (
          <WCAPlayerStaticsTabResults
            wcaResults={wcaResultsRes}
            comps={comps}
            wcaRankTimer={wcaRankTimer}
          />
        ),
      },
      {
        key: "competitions",
        label: intl.formatMessage({ id: "wca.tabs.competitions" }),
        children: (
          <CompetitionTable competitions={comps} wcaResults={wcaResultsRes} />
        ),
      },
      {
        key: "eventStats",
        label: intl.formatMessage({ id: "wca.tabs.eventStats" }),
        children: (
          <WCAPlayerEventStatsTab wcaResults={wcaResultsRes} comps={comps} />
        ),
      },
      {
        key: "milestones",
        label: intl.formatMessage({ id: "wca.tabs.milestones" }),
        children: (
          <MilestoneTimelines
            comps={comps}
            wcaResults={wcaResultsRes}
            wcaProfile={wcaProfile}
          />
        ),
      },
      {
        key: "litCities",
        label: intl.formatMessage({ id: "wca.tabs.litCities" }),
        children: (
          <WCAPlayerLitCitiesTab
            geos={wcaProfile.geos ?? []}
            playerDisplayName={wcaProfile.name}
          />
        ),
      },
    ],
    [intl, wcaResultsRes, comps, wcaRankTimer, wcaProfile],
  );

  return (
    <Card
      hoverable
      style={{
        width: "100%",
        margin: "0 auto",
        borderRadius: 16,
        marginTop: 16,
      }}
      variant="borderless"
    >
      <Tabs
        className="wca-player-statics-tab"
        activeKey={activeKey}
        onChange={onTabChange}
        size="large"
        tabBarStyle={{ fontSize: 16, fontWeight: "bold", paddingLeft: 16 }}
        animated
        items={tabItems}
      />
    </Card>
  );
};

export default WCAPlayerStaticsTab;
