import { RecordsTable } from '@/components/Data/cube_record/record_tables';
import { MRecord, Record } from '@/components/Data/types/record';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { apiRecords } from '@/services/cubing-pro/statistics/records';
import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import { apiPublicCompGroups } from '@/services/cubing-pro/public/orgs';

export type RecordsWithBestProps = {
  groupId: number;
  onGroupIdChange: (id: number) => void;
};

const RecordsWithBest: React.FC<RecordsWithBestProps> = ({ groupId, onGroupIdChange }) => {
  const [events, setEvents] = useState<EventsAPI.Event[]>([]);
  const [bestRecords, setBestRecords] = useState<any>();
  const [avgRecords, setAvgRecords] = useState<any>();

  const [orgItems, setOrgItems] = useState<any[]>([]);


  const fetchRecords = () => {
    apiRecords({
      GroupId: groupId === 0 ? '' : String(groupId),
      EventId: '',
    }).then((value) => {
      setAvgRecords(value.data.Average);
      setBestRecords(value.data.Best);
    });
  }

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
    fetchRecords();
  }, [groupId]);

  useEffect(() => {
    if (orgItems.length === 0) {
      return;
    }
    if (!orgItems.some((o) => o.value === groupId)) {
      onGroupIdChange(0);
    }
  }, [orgItems, groupId, onGroupIdChange]);


  let records: MRecord[] = [];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (!ev.isComp) {
      continue;
    }

    if (bestRecords === undefined) {
      continue;
    }

    const best = bestRecords[ev.id];
    if (best === undefined) {
      continue;
    }
    const avg = avgRecords[ev.id];

    let maxLength = Math.max(best?.length ? best.length : 0, avg?.length ? avg.length : 0);

    for (let i = 0; i < maxLength; i++) {
      const b = best ? (best[i] as Record) : undefined;
      const a = avg ? (avg[i] as Record) : undefined;
      const record = b || a;

      // @ts-ignore
      const mRecord: MRecord = {
        ...record,
        MEventId: record?.EventId||"",

        BestUserName: b?.UserName||"",
        BestUserCudaId: b?.CubeId||"",
        BestRank: i + 1,
        Best: b?.Best|| null,

        Repeatedly: b?.Repeatedly || a?.Repeatedly|| null,

        AvgUserName: a?.UserName||"",
        AvgUserCudaId: a?.CubeId||"",
        Average: a?.Average||null,
        AvgRank: i + 1,
      };

      records.push(mRecord);
    }
  }

  return (
    <>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
        <strong>最佳记录</strong>
      </h3>

      <Select
        value={groupId}
        style={{ marginBottom: '20px', width: '150px' }}
        options={orgItems}
        onChange={(value) => onGroupIdChange(value)}
      />

      {RecordsTable(records, ['MEventId', 'BestUserName', 'Best', 'Average', 'AvgUserName'], false)}
    </>
  );
};

export default RecordsWithBest;
