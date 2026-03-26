import React from 'react';
import { Card, Tabs } from 'antd';
import './WCAPlayerStaticsTab.less';
import { useIntl } from '@@/plugin-locale';
import WCAPlayerStaticsTabResults from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTabResults';
import CompetitionTable from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTabComps';
import MilestoneTimelines from '@/pages/WCA/PlayerComponents/Milestone';
import WCAPlayerEventStatsTab from '@/pages/WCA/PlayerComponents/WCAPlayerEventStatsTab';
import { StaticWithTimerRank, WCACompetition, WcaProfile, WCAResult } from '@/services/cubing-pro/wca/types';
const { TabPane } = Tabs;
interface WCAPlayerStaticsTabProps {
  wcaProfile: WcaProfile;
  wcaResults: WCAResult[];
  comps: WCACompetition[];
  wcaRankTimer: StaticWithTimerRank[]
}

const WCAPlayerStaticsTab: React.FC<WCAPlayerStaticsTabProps> = ({ wcaProfile, wcaResults, comps, wcaRankTimer }) => {
  const intl = useIntl();
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
        defaultActiveKey="results"
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

        {/*<TabPane tab="年度总结" key="years">*/}
        {/*  <></>*/}
        {/*</TabPane>*/}

      </Tabs>
    </Card>
  );
};

export default WCAPlayerStaticsTab;
