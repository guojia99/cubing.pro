import React from "react";
import { RecordsTable } from "@/components/Data/cube_record/record_tables";
import { MergeRecords } from "@/components/Data/cube_record/record_utils";
const PlayerResultsRecord = ({ record }) => {
    let records = MergeRecords(record).reverse();
    for (let i = 0; i < records.length; i++) {
        records[i].Index = records.length - i;
    }
    return (<>
      {RecordsTable(records, ["Index", "EventId", "Best", "Average", "CompsName"])}
    </>);
};
export default PlayerResultsRecord;
//# sourceMappingURL=PlayerResultRecord.jsx.map