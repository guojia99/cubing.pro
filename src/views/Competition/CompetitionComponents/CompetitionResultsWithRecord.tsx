import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { Record } from '@/components/Data/types/record';
import { RecordsTable, RecordsTableKeys } from '@/components/Data/cube_record/record_tables';
import { Divider, Skeleton } from 'antd';
import React from 'react';
import {MergeRecords} from "@/components/Data/cube_record/record_utils";
import { useI18n } from '@/contexts/I18nProvider';

interface CompetitionResultsWithRecordProps {
  comp?: CompAPI.CompResp;
  events?: EventsAPI.Event[];
  records?: Record[];
}

const CompetitionResultsWithRecord: React.FC<CompetitionResultsWithRecordProps> = ({
  events,
  records,
}) => {
  const { t } = useI18n();
  if (events === undefined) {
    return <Skeleton active />;
  }
  if (records === null || records === undefined || records.length === 0) {
    return (
      <>
        <Divider style={{ borderColor: "var(--signal-success)" }}>{t('competitionAdmin.noRecords')}</Divider>
      </>
    );
  }

  records = MergeRecords(records)

  const recordMap = records.reduce<Map<string, Record[]>>((map, record) => {
    const eventId = record.EventId;

    if (!map.has(eventId)) {
      map.set(eventId, []);
    }

    map.get(eventId)?.push(record);
    return map;
  }, new Map<string, Record[]>());

  let sortRecords: Record[] = [];

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const data = recordMap.get(e.id)
    if (data === undefined){
      continue
    }
    for (let j = 0; j < data.length; j++) {
      sortRecords.push(data[j]);
    }
  }

  return <>{RecordsTable(sortRecords, RecordsTableKeys)}</>;
};

export default CompetitionResultsWithRecord;
