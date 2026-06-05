import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { eventOrder } from '@/views/Wca/utils/events';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import React, { useMemo } from 'react';
import './WCAPlayerStaticsTabResultsWithEvent.css';
import { useIntl } from '@/hooks/useIntlMessage';
import ResultDetailWithEvent from './ResultDetailWithEvent';
import { StaticWithTimerRank, WCACompetition, WCAResult } from '@/services/cubing-pro/wca/types';

interface WCAPlayerStaticsTabResultsWithEventProps {
  wcaResults: WCAResult[];
  comps: WCACompetition[];
  wcaRankTimer: StaticWithTimerRank[]
}

const WCAPlayerStaticsTabResultsWithEvent: React.FC<WCAPlayerStaticsTabResultsWithEventProps> = ({
  wcaResults,
  comps,
  wcaRankTimer,
}) => {
  const intl = useIntl();
  // 按 event_id 分组成绩
  const resultsByEvent = new Map<string, WCAResult[]>();

  wcaResults.forEach((result) => {
    if (!resultsByEvent.has(result.event_id)) {
      resultsByEvent.set(result.event_id, []);
    }
    resultsByEvent.get(result.event_id)!.push(result);
  });

  // 获取选手实际参加过的项目，并按 eventOrder 排序
  const userEvents = Array.from(resultsByEvent.keys())
    .filter((event) => eventOrder.includes(event))
    .sort((a, b) => eventOrder.indexOf(a) - eventOrder.indexOf(b))

  const tabItems: TabsProps['items'] = useMemo(
    () =>
      userEvents.map((eventId) => ({
        key: eventId,
        label: <strong>{CubeIcon(eventId, eventId, {})}</strong>,
        children: (
          <ResultDetailWithEvent
            eventID={eventId}
            wcaResults={resultsByEvent.get(eventId)!}
            comps={comps}
            wcaRankTimer={wcaRankTimer}
          />
        ),
      })),
    [userEvents, comps, wcaRankTimer, wcaResults],
  );

  if (userEvents.length === 0) {
    return <div>{intl.formatMessage({ id: 'wca.results.noHistory' })}</div>;
  }

  return (
    <Tabs
      className="wca-event-tabs"
      defaultActiveKey={userEvents[0]}
      size="large"
      tabPlacement="top"
      centered
      items={tabItems}
    />
  );
};

export default WCAPlayerStaticsTabResultsWithEvent;
