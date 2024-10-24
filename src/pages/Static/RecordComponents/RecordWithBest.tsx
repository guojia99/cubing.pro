import { RecordsTable } from '@/components/Data/cube_record/record_tables';
import { MRecord, Record } from '@/components/Data/types/record';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { apiRecords } from '@/services/cubing-pro/statistics/records';
import React, { useEffect, useState } from 'react';

const RecordsWithBest: React.FC = () => {
  const [events, setEvents] = useState<EventsAPI.Event[]>([]);
  const [bestRecords, setBestRecords] = useState<any>();
  const [avgRecords, setAvgRecords] = useState<any>();

  useEffect(() => {
    apiEvents().then((value) => {
      setEvents(value.data.Events);
    });

    apiRecords().then((value) => {
      console.log(value);
      setAvgRecords(value.data.Average);
      setBestRecords(value.data.Best);
    });
  }, []);

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

      {RecordsTable(records, ['MEventId', 'BestUserName', 'Best', 'Average', 'AvgUserName'], false)}
    </>
  );
};

export default RecordsWithBest;