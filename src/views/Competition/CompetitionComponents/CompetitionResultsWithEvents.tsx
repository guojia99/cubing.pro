import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { Result, sortResults } from '@/components/Data/types/result';
import { resultsToMap } from '@/components/Data/cube_result/result_detail';
import { ResultsTable } from '@/components/Data/cube_result/result_tables';
import { usePathname, useRouter } from 'next/navigation';
import { Card, Divider, Space } from 'antd';
import React, { useEffect } from 'react';
import {Record as CubeRecord} from "@/components/Data/types/record";
import {RouteMaps} from "@/components/Data/cube_result/event_route";

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
  const pathname = usePathname() ?? '/';
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const playerNameKey = searchParams.get('events_name_key');

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
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('events_name_key', event.id);
      router.replace(`${pathname}?${searchParams.toString()}`);
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
      if (RouteMaps.get(data[0].EventRoute)?.repeatedly){
        key = ['Rank', 'PersonName', 'Best', "Result_with_repeatedly"]
      }

      tables.push(
        <Card key={`${event.id}-round-${i}`} title={data[0].Round} size="small">
          {ResultsTable(data, key, records)}
        </Card>,
      );
    }

    body.push(
      <div key={event.id}>
        <Divider titlePlacement="left">
          <h4>
            <strong onClick={handleClick} id={event.id} style={{ cursor: 'pointer' }}>
              {CubeIcon(event.id, event.id + 'icon', {})} {CubesCn(event.id)}
            </strong>
          </h4>
        </Divider>
        <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
          {tables}
        </Space>
        <div style={{ marginBottom: '50px' }} />
      </div>,
    );
  });

  return <>{body}</>;
};

export default CompetitionResultsWithEvents;
