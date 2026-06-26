import React from "react";

import {Record} from "@/components/Data/types/record";
import {RecordsTable} from "@/components/Data/cube_record/record_tables";
import {MergeRecords} from "@/components/Data/cube_record/record_utils";
interface PlayerResultsRecordProps {
  record: Record[];
}


const PlayerResultsRecord: React.FC<PlayerResultsRecordProps> = ({ record}) => {
  let records = MergeRecords(record).reverse()

  for (let i = 0; i < records.length; i++){
    records[i].Index = records.length - i
  }

  return (
    <>
      {RecordsTable(records, ["Index", "EventId", "Best", "Average", "CompsName"])}
    </>
  )
}

export default PlayerResultsRecord;
