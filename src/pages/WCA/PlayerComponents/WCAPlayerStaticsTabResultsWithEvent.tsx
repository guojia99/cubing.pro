import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { eventOrder } from '@/pages/WCA/utils/events';
import { Tabs } from 'antd';
import React from 'react';
import ResultDetailWithEvent from './ResultDetailWithEvent';
import { StaticWithTimerRank, WCACompetition, WCAResult } from '@/services/cubing-pro/wca/types';

const { TabPane } = Tabs;

interface WCAPlayerStaticsTabResultsWithEventProps {
  wcaResults: WCAResult[];
  comps: WCACompetition[];
  wcaRankTimer: StaticWithTimerRank[]
}

const WCAPlayerStaticsTabResultsWithEvent: React.FC<WCAPlayerStaticsTabResultsWithEventProps> = ({
  wcaResults,
  comps,
                                                                                                   wcaRankTimer
}) => {
  // 按 event_id 分组成绩
  const resultsByEvent = new Map<string, WCAResult[]>();

  wcaResults.forEach((result) => {
    if (!resultsByEvent.has(result.event_id)) {
      resultsByEvent.set(result.event_id, []);
    }
    resultsByEvent.get(result.event_id)!.push(result);
  });
  console.log(resultsByEvent)

  // 获取选手实际参加过的项目，并按 eventOrder 排序
  const userEvents = Array.from(resultsByEvent.keys())
    .filter((event) => eventOrder.includes(event))
    .sort((a, b) => eventOrder.indexOf(a) - eventOrder.indexOf(b))

  if (userEvents.length === 0) {
    return <div>暂无历史成绩</div>;
  }

  return (
    <Tabs defaultActiveKey={userEvents[0]} size="large" tabPosition="top" centered={true}>
      {userEvents.map((eventId) => (
        <TabPane tab={<strong>{CubeIcon(eventId, eventId, {})}</strong>} key={eventId}>
          {/* 将分类好的数据传递给展示组件 */}
          <ResultDetailWithEvent
            eventID={eventId}
            wcaResults={resultsByEvent.get(eventId)!}
            comps={comps}
            wcaRankTimer={wcaRankTimer}
          />
        </TabPane>
      ))}
    </Tabs>
  );
};

export default WCAPlayerStaticsTabResultsWithEvent;
