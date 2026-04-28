import React, { useCallback, useEffect, useState } from 'react';
import { Card, Tabs } from 'antd';
import './WCAPlayerStaticsTab.less';
import { useIntl } from '@@/plugin-locale';
import { history, useLocation } from '@umijs/max';
import WCAPlayerStaticsTabResults from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTabResults';
import CompetitionTable from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTabComps';
import MilestoneTimelines from '@/pages/WCA/PlayerComponents/Milestone';
import WCAPlayerLitCitiesTab from '@/pages/WCA/PlayerComponents/WCAPlayerLitCitiesTab';
import WCAPlayerEventStatsTab from '@/pages/WCA/PlayerComponents/WCAPlayerEventStatsTab';
import { StaticWithTimerRank, WCACompetition, WcaProfile, WCAResult } from '@/services/cubing-pro/wca/types';

const { TabPane } = Tabs;

/** 与 TabPane key 一致，用于 URL `?tab=` */
const WCA_PLAYER_TAB_KEYS = ['results', 'competitions', 'eventStats', 'milestones', 'litCities'] as const;
type WcaPlayerTabKey = (typeof WCA_PLAYER_TAB_KEYS)[number];

function tabKeyFromSearch(search: string): WcaPlayerTabKey {
  const raw = new URLSearchParams(search).get('tab');
  if (raw && (WCA_PLAYER_TAB_KEYS as readonly string[]).includes(raw)) {
    return raw as WcaPlayerTabKey;
  }
  return 'results';
}

interface WCAPlayerStaticsTabProps {
  wcaProfile: WcaProfile;
  wcaResults: WCAResult[];
  comps: WCACompetition[];
  wcaRankTimer: StaticWithTimerRank[]
}

const WCAPlayerStaticsTab: React.FC<WCAPlayerStaticsTabProps> = ({ wcaProfile, wcaResults, comps, wcaRankTimer }) => {
  const intl = useIntl();
  const location = useLocation();

  const [activeKey, setActiveKey] = useState<WcaPlayerTabKey>(() =>
    typeof window !== 'undefined' ? tabKeyFromSearch(window.location.search) : 'results',
  );

  // 首次进入 / 刷新 / 更换选手 / 前进后退导致 search 变化时，与 URL 对齐（用户切换 tab 时由 onChange 直接改 state + replace，此处仅保证与地址栏一致）
  useEffect(() => {
    setActiveKey(tabKeyFromSearch(location.search));
  }, [wcaProfile.wcaId, location.search]);

  const onTabChange = useCallback(
    (key: string) => {
      if (!(WCA_PLAYER_TAB_KEYS as readonly string[]).includes(key)) return;
      const k = key as WcaPlayerTabKey;
      setActiveKey(k);
      const next = new URLSearchParams(location.search);
      next.set('tab', k);
      const qs = next.toString();
      history.replace({
        pathname: location.pathname,
        search: qs ? `?${qs}` : '',
      });
    },
    [location.pathname, location.search],
  );

  // 按比赛时间（start_date）从最新到最早排序，避免用 id 排序导致早年数据错位（如 2007 插在 2009 中）
  const compDateMap = new Map(comps.map((c) => [c.id, c.start_date]));
  const wcaResultsRes = [...wcaResults].sort((a, b) => {
    const dateA = compDateMap.get(a.competition_id) ?? '';
    const dateB = compDateMap.get(b.competition_id) ?? '';
    return dateB.localeCompare(dateA);
  });

  return (
    <Card
      hoverable
      style={{ width: '100%', margin: '0 auto', borderRadius: 16, marginTop: 16 }}
      bordered={false}
    >
      <Tabs
        className="wca-player-statics-tab"
        activeKey={activeKey}
        onChange={onTabChange}
        size="large"
        tabBarStyle={{ fontSize: 16, fontWeight: 'bold', paddingLeft: 16 }}
        animated
      >
        {/* 成绩 Tab */}
        <TabPane tab={intl.formatMessage({ id: 'wca.tabs.results' })} key="results">
          <WCAPlayerStaticsTabResults wcaResults={wcaResultsRes} comps={comps} wcaRankTimer={wcaRankTimer} />
        </TabPane>

        {/* 赛事 Tab */}
        <TabPane tab={intl.formatMessage({ id: 'wca.tabs.competitions' })} key="competitions">
          <CompetitionTable competitions={comps} wcaResults={wcaResultsRes} />
        </TabPane>

        {/* 项目统计 */}
        <TabPane tab={intl.formatMessage({ id: 'wca.tabs.eventStats' })} key="eventStats">
          <WCAPlayerEventStatsTab wcaResults={wcaResultsRes} comps={comps} />
        </TabPane>

        <TabPane tab={intl.formatMessage({ id: 'wca.tabs.milestones' })} key="milestones">
          <MilestoneTimelines comps={comps} wcaResults={wcaResultsRes} wcaProfile={wcaProfile} />
        </TabPane>

        <TabPane tab={intl.formatMessage({ id: 'wca.tabs.litCities' })} key="litCities">
          <WCAPlayerLitCitiesTab geos={wcaProfile.geos ?? []} playerDisplayName={wcaProfile.name} />
        </TabPane>

        {/*<TabPane tab="年度总结" key="years">*/}
        {/*  <></>*/}
        {/*</TabPane>*/}

      </Tabs>
    </Card>
  );
};

export default WCAPlayerStaticsTab;
