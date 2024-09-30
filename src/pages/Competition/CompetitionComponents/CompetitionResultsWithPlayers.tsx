// 定义组件的属性类型
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { Result } from '@/components/Data/types/result';
import { resultsToMap } from '@/components/Data/cube_result/result_detail';
import { playerResultKeys, ResultsTable } from '@/components/Data/cube_result/result_tables';
import { useNavigate } from '@@/exports';
import { Divider } from 'antd';
import React, { useEffect } from 'react';
import {Record} from "@/components/Data/types/record";

interface CompetitionResultsWithPlayersProps {
  comp?: CompAPI.CompResp;
  results?: Result[];
  events?: EventsAPI.Event[];
  records?: Record[];
}

const CompetitionResultsWithPlayers: React.FC<CompetitionResultsWithPlayersProps> = ({
  comp,
  results,
  events,
  records,
}) => {
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

  const navigate = useNavigate();
  if (!events || events.length === 0) {
    return <></>;
  }

  let body: React.JSX.Element[] = [];
  let resultData = results as Result[];

  let resultMap = resultsToMap(resultData);
  resultMap.withPlayer.forEach((results, key) => {
    // 1. 将所有的项目分类一下， 按项目分好，并且按round num排序
    // 2. todo 展示破r的
    // 3.
    results.sort((a: Result, b: Result) => {
      const evA = events.find(
        (event) => event.name === a.EventID || event.otherNames.split(';').includes(a.EventID),
      );
      const evB = events.find(
        (event) => event.name === b.EventID || event.otherNames.split(';').includes(b.EventID),
      );

      if (evA && evB) {
        const evIA = events.indexOf(evA);
        const evIB = events.indexOf(evB);
        if (evIA !== evIB) {
          return evIA - evIB;
        }
      }
      return a.RoundNumber - b.RoundNumber;
    });

    const handleClick = () => {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('player_name_key', key);
      navigate(`${location.pathname}?${searchParams.toString()}`);
    };

    body.push(
      <>
        <Divider orientation="left">
          <h4>
            <strong onClick={handleClick} id={key} style={{ cursor: 'pointer' }}>
              {key}
            </strong>
          </h4>
        </Divider>
        {ResultsTable(results, playerResultKeys, records)}
        <div style={{ marginTop: '40px' }}></div>
      </>,
    );
  });

  return <>{body}</>;
};

export default CompetitionResultsWithPlayers;
