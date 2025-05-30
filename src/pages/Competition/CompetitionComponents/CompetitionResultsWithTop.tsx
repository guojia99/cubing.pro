import CopyButton from '@/components/Buttons/copy_btn';
import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { RouteMaps } from '@/components/Data/cube_result/event_route';
import { resultsToMap } from '@/components/Data/cube_result/result_detail';
import { ResultsTable } from '@/components/Data/cube_result/result_tables';
import { Record } from '@/components/Data/types/record';
import { DBest, DNF, Result, resultToBest, sortResults } from '@/components/Data/types/result';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { Divider } from 'antd';
import React from 'react';

interface CompetitionResultsWithTopProps {
  comp?: CompAPI.CompResp;
  results?: Result[];
  events?: EventsAPI.Event[];
  topRank: number;
  event_divider: boolean;
  records?: Record[];
  with_best: boolean;
}

const CompetitionResultsWithTop: React.FC<CompetitionResultsWithTopProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  comp,
  results,
  events,
  topRank,
  event_divider,
  records,
  with_best,
}) => {
  if (events === undefined) {
    return <></>;
  }

  let resultData = results as Result[];
  let resultMap = resultsToMap(resultData);
  let dataSource: Result[] = [];

  // eslint-disable-next-line array-callback-return
  events.map((value) => {
    let res = resultMap.withEvent.get(value.id);

    if (res === undefined || res.length === 0) {
      // eslint-disable-next-line array-callback-return
      return
    }

    if (!with_best) {
      let maxRound = undefined;

      for (let i = 0, len = res.length; i < len; ++i) {
        if (maxRound === undefined) {
          maxRound = res[i].RoundNumber;
          continue;
        }
        if (maxRound < res[i].RoundNumber) {
          maxRound = res[i].RoundNumber;
        }
      }
      res = res.filter((value) => {
        return value.RoundNumber === maxRound;
      });
    }

    res = sortResults(res);

    if (with_best) {
      const cubeIDSet = new Set<string>();
      res = res.filter((value) => {
        if (cubeIDSet.has(value.CubeID)){
          return false
        }
        cubeIDSet.add(value.CubeID);
        return true;
      })
      res = sortResults(res);
    }

    let best = res[0];
    if (DBest(best)) {
      // eslint-disable-next-line array-callback-return
      return;
    }
    dataSource.push(best);
    for (let i = 1; i < res.length; i++) {
      if (RouteMaps.get(res[i].EventRoute)?.repeatedly && res[i].BestRepeatedlyTime <= DNF) {
        break;
      }
      if (DBest(res[i]) || res[i].Rank >= topRank) {
        break;
      }
      dataSource.push(res[i]);
    }
  });

  if (!event_divider) {
    return (
      <>
        {ResultsTable(
          dataSource,
          ['EventName', 'Best', 'Average', 'PersonName', 'Result'],
          records,
        )}
      </>
    );
  }

  let body: JSX.Element[] = [];
  let last_idx = 0;
  let copyMsg = comp?.data.Name + ' 各项目排名: \n';

  // 这里处理的是上一个项目
  const push_body = (idx: number) => {
    console.log("push_body", idx,  dataSource[last_idx].EventID);
    let key = 'CompetitionResultsWithTop_' + dataSource[last_idx].EventID;
    body.push(
      <div key={key}>
        <Divider orientation="left">
          <h4>
            <strong>
              {CubeIcon(dataSource[last_idx].EventID, key + 'icon', {})}{' '}
              {CubesCn(dataSource[last_idx].EventID)}
            </strong>
          </h4>
        </Divider>
        {ResultsTable(
          dataSource.slice(last_idx, idx),
          ['Rank', 'PersonName', 'Best', 'Average', 'Result'],
          records,
        )}
      </div>,
    );

    let this_msg = '';
    let cut = dataSource.slice(last_idx, idx);
    this_msg += CubesCn(cut[0].EventID) + ':\t';
    for (let i = 0; i < cut.length; i++) {
      this_msg += cut[i].PersonName + '(' + resultToBest(cut[i]) + ') \t';
    }
    copyMsg += this_msg + '\n';
  };

  for (let idx = 1; idx < dataSource.length; idx++) {
    if (dataSource[idx].EventID !== dataSource[last_idx].EventID) {
      push_body(idx);
      last_idx = idx;
    }
  }
  push_body(dataSource.length);

  return (
    <>
      <CopyButton textToCopy={copyMsg} />
      {body}
    </>
  );
};

export default CompetitionResultsWithTop;
