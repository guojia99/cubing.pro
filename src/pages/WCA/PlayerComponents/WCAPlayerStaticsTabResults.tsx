import WCAPlayerStaticsTabResultsWithComp from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTabResultsWithComps';
import WCAPlayerStaticsTabResultsWithEvent from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTabResultsWithEvent';
import { WCACompetition, WCAResult } from '@/services/wca/types';
import { Tabs } from 'antd';
import React from 'react';

const { TabPane } = Tabs;

interface WCAPlayerStaticsTabResultsProps {
  wcaResults: WCAResult[];
  comps: WCACompetition[];
}

const WCAPlayerStaticsTabResults: React.FC<WCAPlayerStaticsTabResultsProps> = ({
  wcaResults,
  comps,
}) => {
  return (
    <Tabs
      defaultActiveKey="results"
      size="large"
      tabBarStyle={{ fontSize: 16, fontWeight: 'bold', paddingLeft: 16 }}
      animated
    >
      <TabPane tab="按项目" key="with_event">
        <WCAPlayerStaticsTabResultsWithEvent wcaResults={wcaResults} comps={comps} />
      </TabPane>
      <TabPane tab="按比赛" key="with_comps">
        <WCAPlayerStaticsTabResultsWithComp wcaResults={wcaResults} comps={comps} />
      </TabPane>
    </Tabs>
  );
};

export default WCAPlayerStaticsTabResults;
