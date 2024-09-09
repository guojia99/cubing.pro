
// 定义组件的属性类型
import {CompAPI} from "@/services/cubing-pro/comps/typings";
import {Result} from "@/utils/cube_result/result";
import {EventsAPI} from "@/services/cubing-pro/events/typings";
import React, {useEffect} from "react";
import {resultsToMap} from "@/utils/cube_result/result_detail";
import {useNavigate} from "@@/exports";
import {Divider} from "antd";
import {playerResultKeys, ResultsTable} from "@/utils/cube_result/result_tables";

interface CompetitionResultsWithPlayersProps {
  comp?: CompAPI.CompResp;
  results?: Result[];
  events?: EventsAPI.Event[];
}

const CompetitionResultsWithPlayers: React.FC<CompetitionResultsWithPlayersProps> = ({comp, results, events}) => {
  useEffect(() => {
    // 获取查询参数中的 player_name_key
    const searchParams = new URLSearchParams(location.search);
    const playerNameKey = searchParams.get('player_name_key');

    if (playerNameKey) {
      const element = document.getElementById(playerNameKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.search]);

  if (!events || events.length === 0) {
    return <></>
  }


  let body: React.JSX.Element[] = []
  let resultData = results as Result[]

  let resultMap = resultsToMap(resultData)
  resultMap.withPlayer.forEach((results, key) => {
    // 1. 将所有的项目分类一下， 按项目分好，并且按round num排序
    // 2. todo 展示破r的
    // 3.
    results.sort((a: Result, b: Result) => {
      const evA = events.find(event =>
        event.name === a.EventID ||
        event.otherNames.split(';').includes(a.EventID)
      );
      const evB = events.find(event =>
        event.name === b.EventID ||
        event.otherNames.split(';').includes(b.EventID)
      );

      if (evA && evB) {
        const evIA = events.indexOf(evA)
        const evIB = events.indexOf(evB)
        if (evIA !== evIB) {
          return evIA - evIB
        }
      }
      return a.RoundNumber - b.RoundNumber
    })


    const navigate = useNavigate();
    const handleClick = () => {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set("player_name_key", key)
      navigate(`${location.pathname}?${searchParams.toString()}`);
    };

    body.push(
      <>
        <Divider orientation="left">
          <h4>
            <strong onClick={handleClick} id={key} style={{cursor: 'pointer'}}>{key}</strong>
          </h4>
        </Divider>
        {ResultsTable(results, playerResultKeys)}
        <div style={{marginTop: "40px"}}></div>
      </>
    )
  })


  return (<>{body}</>)
}

export default CompetitionResultsWithPlayers;
