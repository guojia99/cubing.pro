import WCAPlayerStaticsTabResultsWithComp from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTabResultsWithComps';
import WCAPlayerStaticsTabResultsWithEvent from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTabResultsWithEvent';

import { Tabs } from 'antd';
import React from 'react';
import { useIntl } from '@@/plugin-locale';
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
  const intl = useIntl();
  return (
    <Tabs
      defaultActiveKey="results"
      size="large"
      tabBarStyle={{ fontSize: 16, fontWeight: 'bold', paddingLeft: 16 }}
      animated
    >
      <TabPane tab={intl.formatMessage({ id: 'wca.tabs.byEvent' })} key="with_event">
        <WCAPlayerStaticsTabResultsWithEvent wcaResults={wcaResults} comps={comps} wcaRankTimer={wcaRankTimer}/>
      </TabPane>
      <TabPane tab={intl.formatMessage({ id: 'wca.tabs.byCompetition' })} key="with_comps">
        <WCAPlayerStaticsTabResultsWithComp wcaResults={wcaResults} comps={comps} />
      </TabPane>
    </Tabs>
  );
};

export default WCAPlayerStaticsTabResults;
