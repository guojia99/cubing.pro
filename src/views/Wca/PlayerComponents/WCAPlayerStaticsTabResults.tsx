import WCAPlayerStaticsTabResultsWithComp from '@/views/Wca/PlayerComponents/WCAPlayerStaticsTabResultsWithComps';
import WCAPlayerStaticsTabResultsWithEvent from '@/views/Wca/PlayerComponents/WCAPlayerStaticsTabResultsWithEvent';

import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import React, { useMemo } from 'react';
import { useIntl } from '@/hooks/useIntlMessage';
import { StaticWithTimerRank, WCACompetition, WCAResult } from '@/services/cubing-pro/wca/types';

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

  const tabItems: TabsProps['items'] = useMemo(
    () => [
      {
        key: 'with_event',
        label: intl.formatMessage({ id: 'wca.tabs.byEvent' }),
        children: (
          <WCAPlayerStaticsTabResultsWithEvent
            wcaResults={wcaResults}
            comps={comps}
            wcaRankTimer={wcaRankTimer}
          />
        ),
      },
      {
        key: 'with_comps',
        label: intl.formatMessage({ id: 'wca.tabs.byCompetition' }),
        children: (
          <WCAPlayerStaticsTabResultsWithComp wcaResults={wcaResults} comps={comps} />
        ),
      },
    ],
    [intl, wcaResults, comps, wcaRankTimer],
  );

  return (
    <Tabs
      defaultActiveKey="with_event"
      size="large"
      tabBarStyle={{ fontSize: 16, fontWeight: 'bold', paddingLeft: 16 }}
      animated
      items={tabItems}
    />
  );
};

export default WCAPlayerStaticsTabResults;
