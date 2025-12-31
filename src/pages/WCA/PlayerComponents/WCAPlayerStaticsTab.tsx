import React from 'react';
import { Card, Tabs } from 'antd';
import WCAPlayerStaticsTabResults from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTabResults';
import CompetitionTable from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTabComps';
import MilestoneTimelines from '@/pages/WCA/PlayerComponents/Milestone';
import { StaticWithTimerRank, WCACompetition, WcaProfile, WCAResult } from '@/services/cubing-pro/wca/types';
const { TabPane } = Tabs;
interface WCAPlayerStaticsTabProps {
  wcaProfile: WcaProfile;
  wcaResults: WCAResult[];
  comps: WCACompetition[];
  wcaRankTimer: StaticWithTimerRank[]
}

const WCAPlayerStaticsTab: React.FC<WCAPlayerStaticsTabProps> = ({ wcaProfile, wcaResults, comps,wcaRankTimer }) => {

  const wcaResultsRes = wcaResults.sort((a, b) => b.id - a.id);

  return (
    <Card
      hoverable
      style={{ minWidth: 900, margin: '0 auto', borderRadius: 16, marginTop: 16 }}
      bordered={false}
    >
      <Tabs
        defaultActiveKey="results"
        size="large"
        tabBarStyle={{ fontSize: 16, fontWeight: 'bold', paddingLeft: 16 }}
        animated
      >
        {/* 成绩 Tab */}
        <TabPane tab="成绩" key="results">
          <WCAPlayerStaticsTabResults wcaResults={wcaResultsRes} comps={comps} wcaRankTimer={wcaRankTimer} />
        </TabPane>

        {/* 赛事 Tab */}
        <TabPane tab="赛事" key="competitions">
          <CompetitionTable competitions={comps} wcaResults={wcaResultsRes} />
        </TabPane>

        <TabPane tab="里程碑" key="milestones">
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
