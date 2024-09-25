import { Record } from '@/utils/cube_record/record';

export function generateRecordMap(records: Record[] | undefined): Map<string, Record> {
  if (!records) {
    return new Map<string, Record>();
  }

  return records.reduce((map, record) => {
    if (record.Best) {
      map.set(record.ResultId + '_best_' + record.Type, record);
    }

    if (record.Average){
      map.set(record.ResultId + '_average_' + record.Type, record);
    }

    if (record.Repeatedly){
      map.set(record.ResultId + '_repeatedly_' + record.Type, record);
    }

    return map;
  }, new Map<string, Record>());
}


export function RecordMapWithRecordID(records: Record[] | undefined): Map<number, Record> {
  if (!records) {
    return new Map<number, Record>();
  }

  return records.reduce((map, record) => {
    map.set(record.id, record);
    return map
  }, new Map<number, Record>());
}
