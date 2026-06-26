// 定义组件的属性类型
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { Result } from '@/components/Data/types/result';
import { resultsToMap } from '@/components/Data/cube_result/result_detail';
import { playerResultKeys, ResultsTable } from '@/components/Data/cube_result/result_tables';
import { usePathname, useRouter } from 'next/navigation';
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
  const pathname = usePathname() ?? '/';
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const playerNameKey = searchParams.get('player_name_key');

    if (playerNameKey) {
      const element = document.getElementById(playerNameKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname]);

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
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('player_name_key', key);
      router.replace(`${pathname}?${searchParams.toString()}`);
    };

    body.push(
      <div key={key}>
        <Divider titlePlacement="left">
          <h4>
            <strong onClick={handleClick} id={key} style={{ cursor: 'pointer' }}>
              {key}
            </strong>
          </h4>
        </Divider>
        {ResultsTable(results, playerResultKeys, records)}
        <div style={{ marginTop: '40px' }} />
      </div>,
    );
  });

  return <>{body}</>;
};

export default CompetitionResultsWithPlayers;
