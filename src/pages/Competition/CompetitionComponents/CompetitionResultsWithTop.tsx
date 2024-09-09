import {CompAPI} from "@/services/cubing-pro/comps/typings";
import {DBest, Result, sortResults} from "@/utils/cube_result/result";
import {EventsAPI} from "@/services/cubing-pro/events/typings";
import React from "react";
import {resultsToMap} from "@/utils/cube_result/result_detail";
import {ResultsTable} from "@/utils/cube_result/result_tables";
import {Divider} from "antd";
import {CubesCn} from "@/components/CubeIcon/cube";
import {CubeIcon} from "@/components/CubeIcon/cube_icon";

interface CompetitionResultsWithTopProps {
  comp?: CompAPI.CompResp;
  results?: Result[];
  events?: EventsAPI.Event[];
  topRank: number;
  event_divider: boolean;
}

const CompetitionResultsWithTop: React.FC<CompetitionResultsWithTopProps> = (
  {comp, results, events, topRank, event_divider}
) => {
  if (events === undefined) {
    return (<></>)
  }

  let resultData = results as Result[]
  let resultMap = resultsToMap(resultData)
  let dataSource: Result[] = []
  events.map((value) => {
    let res = resultMap.withEvent.get(value.id)
    if (res === undefined || res.length === 0) {
      return
    }

    let maxRound = undefined

    for (let i = 0, len = res.length; i < len; ++i) {
      if (maxRound === undefined) {
        maxRound = res[i].RoundNumber
        continue
      }
      if (maxRound < res[i].RoundNumber) {
        maxRound = res[i].RoundNumber
      }
    }

    res = res.filter((value) => {
      return value.RoundNumber === maxRound
    })
    res = sortResults(res)

    let best = res[0]
    if (DBest(best)) {
      return;
    }
    dataSource.push(best)
    for (let i = 1; i < res.length; i++) {
      if (DBest(res[i]) || res[i].Rank >= topRank) {
        break
      }
      dataSource.push(res[i])
    }
  })


  if (!event_divider) {
    return (<>{ResultsTable(dataSource, ["EventName", "Best", "Average", "PersonName", "Result"])}</>)
  }

  let body: JSX.Element[] = []
  let last_idx = 0
  for (let idx = 0; idx < dataSource.length; idx++) {
    if (dataSource[last_idx].EventID == dataSource[idx].EventID) {
      continue
    }
    // idx += 1
    let key = "CompetitionResultsWithTop_" + dataSource[last_idx].EventID
    body.push(
      <div key={key}>
        <Divider orientation="left"><h4><strong>{CubeIcon(dataSource[last_idx].EventID, key + "icon", {})} {CubesCn(dataSource[last_idx].EventID)}</strong></h4></Divider>
        {ResultsTable(dataSource.slice(last_idx, idx), ["Rank", "PersonName", "Best", "Average", "Result"])}
      </div>
    )
    last_idx = idx
  }

  return (<>{body}</>)
}

export default CompetitionResultsWithTop;
