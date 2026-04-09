import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { RecordsTable } from '@/components/Data/cube_record/record_tables';
import { Record } from '@/components/Data/types/record';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { apiRecords } from '@/services/cubing-pro/statistics/records';
import { Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { apiPublicCompGroups } from '@/services/cubing-pro/public/orgs';

export type RecordsWithEventsProps = {
  groupId: number;
  eventId: string;
  onGroupIdChange: (id: number) => void;
  onEventIdChange: (id: string) => void;
};

const RecordsWithEvents: React.FC<RecordsWithEventsProps> = ({
  groupId,
  eventId,
  onGroupIdChange,
  onEventIdChange,
}) => {
  const [events, setEvents] = useState<EventsAPI.Event[]>([]);

  const [orgItems, setOrgItems] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [records, setRecords] = useState<Record[]>([]);
  const fetchRecords = () => {
    setLoading(true);
    apiRecords({
      GroupId: groupId === 0 ? '' : String(groupId),
      EventId: eventId || '333',
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
    });

    apiPublicCompGroups().then((value) => {
      const ite = [
        {
          label: 'CubingPro',
          key: 'CubingPro',
          value: 0,
        },
      ];

      if (value.data && value.data.items) {
        for (let i = 0; i < value.data.items.length; i++) {
          ite.push({
            label: value.data.items[i].name,
            key: value.data.items[i].name,
            value: value.data.items[i].id,
          });
        }
      }
      setOrgItems(ite);
    });
  }, []);

  useEffect(() => {
    if (events.length === 0) {
      return;
    }
    const comp = events.filter((e) => e.isComp);
    if (comp.length === 0) {
      return;
    }
    if (!comp.some((e) => e.id === eventId)) {
      onEventIdChange(comp[0].id);
    }
  }, [events, eventId, onEventIdChange]);

  useEffect(() => {
    if (orgItems.length === 0) {
      return;
    }
    if (!orgItems.some((o) => o.value === groupId)) {
      onGroupIdChange(0);
    }
  }, [orgItems, groupId, onGroupIdChange]);

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

  useEffect(() => {
    fetchRecords();
  }, [eventId, groupId]);

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

  // api接口


  // let rc = MergeRecords(records).reverse();
  let rc = records;
  for (let i = 0; i < rc.length; i++) {
    rc[i].Index = rc.length - i;
  }

  return (
    <>
      <h3 style={{ textAlign: 'center' }}>
        <strong>历史记录</strong>
      </h3>

      <Select
        value={eventId}
        style={{ marginBottom: '20px', width: '150px' }}
        loading={loading}
        options={items}
        onChange={(value) => onEventIdChange(value)}
      />

      <Select
        value={groupId}
        style={{ marginBottom: '20px', marginLeft: '20px', width: '150px' }}
        loading={loading}
        options={orgItems}
        onChange={(value) => onGroupIdChange(value)}
      />

      {RecordsTable(rc, ['Index', 'UserName', 'Best', 'Average', 'ResultTime', 'CompsName'])}
    </>
  );
};

export default RecordsWithEvents;
