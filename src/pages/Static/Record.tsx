import RecordsWithBest from '@/pages/Static/RecordComponents/RecordWithBest';
import RecordsWithEvents from '@/pages/Static/RecordComponents/RecordWithEvents';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { Switch } from 'antd';
import React, { useEffect, useState } from 'react';

const Records: React.FC = () => {
  // const [events, setEvents] = useState<EventsAPI.Event[]>([]);
  //
  // useEffect(() => {
  //   apiEvents().then((value) => {
  //     setEvents(value.data.Events);
  //   });
  // }, []);

  const [best, setBest] = useState<boolean>(true);

  // 切换模式的组件
  let comp = best ? <RecordsWithBest /> : <RecordsWithEvents />;

  return (
    <>
      <Switch
        checkedChildren="总榜"
        unCheckedChildren="历史"
        onChange={() => setBest(!best)}
        style={{float: "right"}}
        // defaultChecked
      />
      <br />
      {comp}
    </>
  );
};

export default Records;
