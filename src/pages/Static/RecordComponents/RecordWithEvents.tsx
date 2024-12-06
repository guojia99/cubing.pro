import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { RecordsTable } from '@/components/Data/cube_record/record_tables';
import { MergeRecords } from '@/components/Data/cube_record/record_utils';
import { Record } from '@/components/Data/types/record';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { apiRecords } from '@/services/cubing-pro/statistics/records';
import { Select } from 'antd';
import React, { useEffect, useState } from 'react';

const RecordsWithEvents: React.FC = () => {
  const [events, setEvents] = useState<EventsAPI.Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [records, setRecords] = useState<Record[]>([]);
  const fetchRecords = (event: string) => {
    setLoading(true);
    apiRecords({
      GroupId: '',
      EventId: event || '333',
    })
      .then((value) => {
        if (value.data.Records) {
          setRecords(value.data.Records);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    apiEvents().then((value) => {
      setEvents(value.data.Events);
      if (value.data.Events.length > 0) {
        fetchRecords(value.data.Events[0].id);
      }
    });
  }, []);

  const GroupChildren = (list: EventsAPI.Event[]) => {
    if (list === null || list === undefined) {
      return [];
    }
    let out = [];
    for (let i = 0; i < list.length; i++) {
      out.push({
        key: list[i].id,
        value: list[i].id,
        label: (
          <>
            {CubeIcon(list[i].id, list[i].id + '__menu', {})} {CubesCn(list[i].id)}
          </>
        ),
      });
    }
    return out;
  };

  const handleMenuClick = (value: string) => {
    fetchRecords(value);
  };

  const items = [
    {
      label: 'WCA项目',
      title: 'WCA项目',
      options: GroupChildren(
        events.filter((value) => {
          return value.isWCA && value.isComp;
        }),
      ),
    },
    {
      label: '趣味项目',
      title: '趣味项目',
      options: GroupChildren(
        events.filter((value) => {
          return !value.isWCA && value.isComp;
        }),
      ),
    },
  ];

  let rc = MergeRecords(records).reverse();
  for (let i = 0; i < rc.length; i++) {
    rc[i].Index = rc.length - i;
  }

  return (
    <>
      <h3 style={{ textAlign: 'center' }}>
        <strong>历史记录</strong>
      </h3>

      <Select
        defaultValue="333"
        style={{ marginBottom: '20px', width: '200px' }}
        loading={loading}
        options={items}
        onChange={handleMenuClick}
      />

      {RecordsTable(rc, ['Index', 'UserName', 'Best', 'Average', 'ResultTime', 'CompsName'])}
    </>
  );
};

export default RecordsWithEvents;
