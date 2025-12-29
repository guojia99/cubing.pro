import WCAPlayerStaticsTabResultsWithComp from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTabResultsWithComps';
import WCAPlayerStaticsTabResultsWithEvent from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTabResultsWithEvent';

import { Tabs } from 'antd';
import React from 'react';
import { StaticWithTimerRank, WCACompetition, WCAResult } from '@/services/cubing-pro/wca/types';
const { TabPane } = Tabs;

interface WCAPlayerStaticsTabResultsProps {
  wcaResults: WCAResult[];
  comps: WCACompetition[];
  wcaRankTimer: StaticWithTimerRank[]
}

const WCAPlayerStaticsTabResults: React.FC<WCAPlayerStaticsTabResultsProps> = ({
  wcaResults,
  comps,
                                                                                 wcaRankTimer,
}) => {
  return (
    <Tabs
      defaultActiveKey="results"
      size="large"
      tabBarStyle={{ fontSize: 16, fontWeight: 'bold', paddingLeft: 16 }}
      animated
    >
      <TabPane tab="按项目" key="with_event">
        <WCAPlayerStaticsTabResultsWithEvent wcaResults={wcaResults} comps={comps} wcaRankTimer={wcaRankTimer}/>
      </TabPane>
      <TabPane tab="按比赛" key="with_comps">
        <WCAPlayerStaticsTabResultsWithComp wcaResults={wcaResults} comps={comps} />
      </TabPane>
    </Tabs>
  );
};

export default WCAPlayerStaticsTabResults;
