import { Record } from '@/components/Data/types/record';

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


export function MergeRecords(records: Record[]): Record[] {
  const recordMap: { [key: number]: Record } = {}; // 用 ResultId 作为 key
  const mergedRecords: Record[] = [];

  records.forEach((record) => {
    const resultId = record.ResultId;
    if (recordMap[resultId]) {
      // 如果已存在同 ResultId 的记录，则合并
      const existingRecord = recordMap[resultId];

      // 合并逻辑，这里保留了新记录的值（可以根据需求调整逻辑）
      recordMap[resultId] = {
        ...existingRecord,
        Index: existingRecord.Index, // 保留原有顺序
        id: record.id || existingRecord.id,
        createdAt: record.createdAt || existingRecord.createdAt,
        updatedAt: record.updatedAt || existingRecord.updatedAt,
        EventId: record.EventId || existingRecord.EventId,
        EventRoute: record.EventRoute || existingRecord.EventRoute,
        UserId: record.UserId || existingRecord.UserId,
        UserName: record.UserName || existingRecord.UserName,
        CompsId: record.CompsId || existingRecord.CompsId,
        CompsName: record.CompsName || existingRecord.CompsName,
        CompsGenre: record.CompsGenre || existingRecord.CompsGenre,
        Best: record.Best || existingRecord.Best,
        Average: record.Average || existingRecord.Average,
        Repeatedly: record.Repeatedly || existingRecord.Repeatedly,
        ThisResults: record.ThisResults || existingRecord.ThisResults,
        Type: record.Type || existingRecord.Type,
      };
    } else {
      // 不存在相同 ResultId 时，直接加入 map
      recordMap[resultId] = { ...record };
    }
  });

  // 按照原顺序将结果恢复为数组
  Object.values(recordMap).forEach((record) => {
    mergedRecords.push(record);
  });

  return mergedRecords.sort((a, b) => a.Index - b.Index); // 按照原有的 Index 排序
}
