import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { eventRouteM } from '@/components/Data/cube_result/event_route';
import { NavTabs } from '@/components/Tabs/nav_tabs';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { Table } from 'antd';
import React, { useEffect, useState } from 'react';
import './CompetitionScrambles.css';

import cstimer from 'cstimer_module';

// 定义组件的属性类型
interface CompetitionScramblesProps {
  comp?: CompAPI.CompResp;
}

const cstImageMap = new Map<string, string>([
  ['clock', 'clkwca'],
  ['minx', 'mgmo'],
  ['pyram', 'pyrm'],
  ['skewb', 'skb'],
]);

const svgToPngUrl = (svg: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pngBase64 = canvas.toDataURL('image/png');
        URL.revokeObjectURL(svgUrl);
        resolve(pngBase64);
      } else {
        reject('Canvas 2d context not available');
      }
    };
    img.onerror = (error) => {
      reject(`Error loading SVG image: ${error}`);
    };
    img.src = svgUrl;
  });
};


interface ScrambleImageProps {
  sc: string;
  ev: string;
}
// todo 这个写法可能有问题， 强行缩成png
const ScrambleImage: React.FC<ScrambleImageProps> = ({ sc, ev }) => {
  const [pngData, setPngData] = useState<string | null>(null);
  useEffect(() => {
    const cstEv = cstImageMap.get(ev) ? cstImageMap.get(ev) : ev;
    const svgString = cstimer.getImage(sc, cstEv);
    svgToPngUrl(svgString).then((data) => {
      setPngData(data);
    });
  }, [sc, ev]);

  if (!pngData) {
    return <div>Loading...</div>;
  }

  return (
    <div className={'svg-container'}>
      <img src={pngData} alt={sc}  style={{maxWidth: "100%", height: "auto"}} />
    </div>
  );
};


const CompetitionScrambles: React.FC<CompetitionScramblesProps> = ({ comp }) => {
  const [baseEvents, setBaseEvents] = useState<EventsAPI.Event[]>([]);
  useEffect(() => {
    apiEvents().then((value) => {
      setBaseEvents(value.data.Events);
    });
  }, []);
  if (!comp) {
    return <p>没有找到比赛信息。</p>;
  }


  const scrambleValue = (sc: string) => {
    return (
      <p
        style={{
          whiteSpace: 'pre-line',
          width: 500,
          wordWrap: 'break-word',
          wordBreak: 'break-word',
          fontSize: 18,
        }}
      >
        {sc}
      </p>
    );
  };

  const scrambleTable = (ev: CompAPI.Event) => {
    const baseEvent = baseEvents.find((value) => {
      return value.id === ev.EventID;
    });

    if (!baseEvent) {
      return <></>;
    }

    const m = eventRouteM(baseEvent.base_route_typ);

    const rowClassName = (data: { Index: string }) => {
      if (data.Index.indexOf('Ex') !== -1) {
        return 'highlight-row';
      }
      return '';
    };

    let bodys = [];
    for (let i = 0; i < ev.Schedule.length; i++) {
      const sc = ev.Schedule[i];

      const data: JSX.Element[] = [];
      if (sc.Scrambles) {
        for (let j = 0; j < sc.Scrambles.length; j++) {
          const ssc = sc.Scrambles[j];

          const tb = [];

          // 多盲等
          if (m.repeatedly) {
            for (let evIdx = 0; evIdx < ssc.length; evIdx++) {
              tb.push({
                Index: '#' + (evIdx + 1),
                Scramble: scrambleValue(ssc[evIdx]),
                ScrambleImage: <ScrambleImage sc={ssc[evIdx]} ev={baseEvent?.puzzleId} />,
              });
            }
          }

          // 多个项目的
          if (baseEvent?.scrambleValue) {
            const sp = baseEvent.scrambleValue.split(',');
            if (sp.length >= 2) {
              if (sp.length !== ssc.length) {
                continue;
              }
              for (let evIdx = 0; evIdx < sp.length; evIdx++) {
                tb.push({
                  Index: sp[evIdx],
                  Scramble: scrambleValue(ssc[evIdx]),
                  ScrambleImage:  <ScrambleImage sc={ssc[evIdx]} ev={sp[evIdx]} />,
                });
              }
            }
          }

          // 其他类型
          if (tb.length === 0) {
            let extNum = 1;
            for (let evIdx = 0; evIdx < ssc.length; evIdx++) {
              let indexStr = '#' + (evIdx + 1);
              if (evIdx + 1 > m.rounds) {
                indexStr = 'Ex#' + extNum;
                extNum += 1;
              }
              tb.push({
                Index: indexStr,
                Scramble: scrambleValue(ssc[evIdx]),
                ScrambleImage:  <ScrambleImage sc={ssc[evIdx]} ev={baseEvent?.puzzleId} />,
              });
            }
          }

          data.push(
            <>
              <strong>{'打乱组' + (j + 1)}</strong>
              <Table
                style={{ marginTop: 20, marginBottom: 20 }}
                dataSource={tb}
                size={'small'}
                rowClassName={rowClassName}
                columns={[
                  {
                    title: '序号',
                    dataIndex: 'Index',
                    key: 'index',
                    width: 60,
                  },
                  {
                    title: '打乱',
                    dataIndex: 'Scramble',
                    key: 'Scramble',
                  },
                  {
                    title: '打乱图',
                    width: 400,
                    dataIndex: 'ScrambleImage',
                    key: 'ScrambleImage',
                  },
                ]}
                pagination={false}
              />
            </>,
          );
        }
      } else {
        data.push(<>暂无打乱</>)
      }
      bodys.push(
        <>
          <h3 style={{ marginBottom: '10px' }}>
            <strong>{sc.Round}</strong>
          </h3>
          {data}
        </>,
      );
    }

    return <>{bodys}</>;
  };
  const items = [];

  for (let i = 0; i < comp?.data.comp_json.Events.length; i++) {
    const ev = comp?.data.comp_json.Events[i];
    if (!ev?.IsComp) {
      continue;
    }

    items.push({
      key: 's_' + ev?.EventID,
      label: <>{CubesCn(ev?.EventID)}</>,
      children: <>{scrambleTable(ev)}</>,
      icon: <>{CubeIcon(ev?.EventID, ev?.EventID, {})}</>,
    });
  }

  return (
    <>
      <NavTabs
        type="line"
        items={items}
        tabsKey="scrambles_key"
        // style={{ minHeight: '100vh' }}
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
};

export default CompetitionScrambles;
