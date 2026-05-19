import { RecordsTable, RecordsTableKeys } from '@/components/Data/cube_record/record_tables';
import { Divider, Skeleton } from 'antd';
import React from 'react';
import { MergeRecords } from "@/components/Data/cube_record/record_utils";
const CompetitionResultsWithRecord = ({ comp, events, records, }) => {
    if (events === undefined) {
        return <Skeleton active/>;
    }
    if (records === null || records === undefined || records.length === 0) {
        return (<>
        <Divider style={{ borderColor: '#7cb305' }}>本场比赛无记录产生</Divider>
      </>);
    }
    // eslint-disable-next-line no-param-reassign
    records = MergeRecords(records);
    const recordMap = records.reduce((map, record) => {
        const eventId = record.EventId;
        if (!map.has(eventId)) {
            map.set(eventId, []);
        }
        map.get(eventId)?.push(record);
        return map;
    }, new Map());
    let sortRecords = [];
    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        const data = recordMap.get(e.id);
        if (data === undefined) {
            continue;
        }
        for (let j = 0; j < data.length; j++) {
            sortRecords.push(data[j]);
        }
    }
    return <>{RecordsTable(sortRecords, RecordsTableKeys)}</>;
};
export default CompetitionResultsWithRecord;
//# sourceMappingURL=CompetitionResultsWithRecord.jsx.map