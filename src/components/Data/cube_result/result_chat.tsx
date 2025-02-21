import { Record } from '@/components/Data/types/record';
import { DAvg, DBest, Result } from '@/components/Data/types/result';

import {eventRouteM} from "@/components/Data/cube_result/event_route";
import {generateRecordMap} from "@/components/Data/cube_record/record_utils";

export const ResultChat = (
  eventID: string,
  dataSource: Result[],
  records: Record[] | undefined,
) => {
  if (dataSource.length === 0) {
    return <></>;
  }
  const ev = eventRouteM(dataSource[0].EventRoute)

  let recordsMap = generateRecordMap(records); // map[resultsID]Record
  const data = [];
  for (let i = dataSource.length - 1; i > 0; i--) {
    let best = null;
    let avg = null;
    const round = dataSource[i].CompetitionName + dataSource[i].Round;

    if (!DBest(dataSource[i])) {
      best = dataSource[i].Best;
    }
    data.push({ index: i + 1, value: best, type: 'best', round: round });
    if (ev.repeatedly || ev.rounds === 1){
      continue;
    }

    if (!DAvg(dataSource[i])) {
      avg = dataSource[i].Average;
    }
    data.push({ index: i + 1, value: avg, type: 'average', round: round });
  }
  console.log(data, recordsMap);
  return (
    <>
      <div style={{ marginBottom: 20 }}></div>
    </>
  );
};
