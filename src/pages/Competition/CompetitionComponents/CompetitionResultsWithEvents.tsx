import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { Result, sortResults } from '@/utils/cube_result/result';
import { resultsToMap } from '@/utils/cube_result/result_detail';
import { ResultsTable } from '@/utils/cube_result/result_tables';
import { useNavigate } from '@@/exports';
import { Card, Divider, Space } from 'antd';
import React, { useEffect } from 'react';
import {Record as CubeRecord} from "@/utils/cube_record/record";

interface CompetitionResultsWithEventsProps {
  comp?: CompAPI.CompResp;
  results?: Result[];
  events?: EventsAPI.Event[];
  records?: CubeRecord[];
}

const CompetitionResultsWithEvents: React.FC<CompetitionResultsWithEventsProps> = ({
  comp,
  results,
  events,
  records,
}) => {
  useEffect(() => {
    // 获取查询参数中的 player_name_key
    const searchParams = new URLSearchParams(location.search);
    const playerNameKey = searchParams.get('events_name_key');

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

  events.forEach((event) => {
    const results = resultMap.withEvent.get(event.id);
    if (results === undefined || results.length === 0) {
      return;
    }
    // todo
    // @ts-ignore
    const resultWithRoundMap = results.reduce((group: Record<number, Result[]>, item: Result) => {
      if (!group[item.RoundNumber]) {
        group[item.RoundNumber] = [];
      }
      group[item.RoundNumber].push(item);
      return group;
    }, {} as Record<number, Result[]>) as Record<number, Result[]>;

    const handleClick = () => {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('events_name_key', event.id);
      navigate(`${location.pathname}?${searchParams.toString()}`);
    };

    let tables = [];

    for (let i = 1; i < 255; i++) {
      let data = resultWithRoundMap[i];
      if (data === null || data === undefined) {
        break;
      }
      data = data as Result[];
      data = sortResults(data);

      let key: string[] = ['Rank', 'PersonName', 'Best', 'Average', 'Result'];
      tables.push(
        <Card title={data[0].Round} size="small">
          {ResultsTable(data, key, records)}
        </Card>,
      );
    }

    body.push(
      <>
        <Divider orientation="left">
          <h4>
            <strong onClick={handleClick} id={event.id} style={{ cursor: 'pointer' }}>
              {CubeIcon(event.id, event.id + 'icon', {})} {CubesCn(event.id)}
            </strong>
          </h4>
        </Divider>
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          {tables}
        </Space>
        <div style={{marginBottom: "50px"}}></div>
      </>,
    );
  });

  return <>{body}</>;
};

export default CompetitionResultsWithEvents;
