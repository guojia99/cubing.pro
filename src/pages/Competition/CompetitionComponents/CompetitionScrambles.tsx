import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { eventRouteM } from '@/components/Data/cube_result/event_route';
import { NavTabs } from '@/components/Tabs/nav_tabs';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { Grid, Select, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import './CompetitionScrambles.css';

import cstimer from 'cstimer_module';

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
    return <div className="scramble-image-loading">Loading...</div>;
  }

  return (
    <div className={'svg-container'}>
      <img src={pngData} alt={sc} />
    </div>
  );
};

type ScrambleTableRow = {
  Index: string;
  Scramble: React.ReactNode;
  ScrambleImage: React.ReactNode;
};

type ScrambleGroupDef = {
  label: string;
  tb: ScrambleTableRow[];
};

type ScheduleRoundDef = {
  roundKey: string;
  roundTitle: string;
  groups: ScrambleGroupDef[];
};

interface ScrambleEventRoundsProps {
  eventKey: string;
  rounds: ScheduleRoundDef[];
  rowClassName: (data: { Index: string }) => string;
  isCompact: boolean;
}

const ScrambleEventRounds: React.FC<ScrambleEventRoundsProps> = ({
  eventKey,
  rounds,
  rowClassName,
  isCompact,
}) => {
  const [roundIndex, setRoundIndex] = useState(0);
  const [groupIndex, setGroupIndex] = useState(0);

  useEffect(() => {
    setRoundIndex(0);
    setGroupIndex(0);
  }, [eventKey]);

  useEffect(() => {
    setGroupIndex(0);
  }, [roundIndex]);

  const safeRoundIdx = rounds.length === 0 ? 0 : Math.min(roundIndex, rounds.length - 1);
  const currentRound = rounds[safeRoundIdx];
  const groups = currentRound?.groups ?? [];
  const safeGroupIdx = groups.length === 0 ? 0 : Math.min(groupIndex, groups.length - 1);
  const currentGroup = groups[safeGroupIdx];

  const showRoundSelect = rounds.length > 1;
  const showGroupSelect = groups.length > 1;
  const showToolbar = showRoundSelect || showGroupSelect;

  const renderTableOrMobile = (tb: ScrambleTableRow[]) =>
    isCompact ? (
      <div className="scramble-mobile-list">
        {tb.map((row, idx) => (
          <div key={`${row.Index}-${idx}`} className="scramble-mobile-item">
            <div className="scramble-mobile-item__index">序号：{row.Index}</div>
            <div className={`scramble-pair-frame scramble-pair-frame--stack ${rowClassName(row)}`.trim()}>
              <div className="scramble-pair-frame__text">
                <span className="scramble-pair-frame__label">打乱</span>
                {row.Scramble}
              </div>
              <div className="scramble-pair-frame__image">{row.ScrambleImage}</div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <Table
        style={{ marginTop: 0, marginBottom: 0 }}
        dataSource={tb}
        rowKey={(record, index) => `${record.Index}-${index}`}
        size={'small'}
        rowClassName={rowClassName}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            title: '序号',
            dataIndex: 'Index',
            key: 'index',
            width: 60,
            minWidth: 60,
            onCell: () => ({ style: { verticalAlign: 'top' } }),
          },
          {
            title: '打乱',
            key: 'scramblePair',
            minWidth: 400,
            onCell: () => ({ style: { verticalAlign: 'top' } }),
            render: (_, record) => (
              <div className="scramble-pair-frame">
                <div className="scramble-pair-frame__text">{record.Scramble}</div>
                <div className="scramble-pair-frame__image">{record.ScrambleImage}</div>
              </div>
            ),
          },
        ]}
        pagination={false}
      />
    );

  return (
    <div className="scramble-round-block">
      {showToolbar ? (
        <div className="scramble-group-toolbar scramble-toolbar-combo">
          {showRoundSelect ? (
            <>
              <span className="scramble-group-toolbar__label">赛程</span>
              <Select
                className="scramble-group-toolbar__select"
                value={safeRoundIdx}
                onChange={setRoundIndex}
                options={rounds.map((r, i) => ({ label: r.roundTitle, value: i }))}
                popupMatchSelectWidth={false}
              />
            </>
          ) : null}
          {showGroupSelect ? (
            <>
              <span className="scramble-group-toolbar__label scramble-toolbar-combo__gap">打乱组</span>
              <Select
                className="scramble-group-toolbar__select"
                value={safeGroupIdx}
                onChange={setGroupIndex}
                options={groups.map((g, i) => ({ label: g.label, value: i }))}
                popupMatchSelectWidth={false}
              />
            </>
          ) : null}
        </div>
      ) : null}
      {currentRound ? (
        <h3 className="scramble-round-title">
          <strong>{currentRound.roundTitle}</strong>
        </h3>
      ) : null}
      {currentGroup ? (
        <div className="scramble-group-panel">{renderTableOrMobile(currentGroup.tb)}</div>
      ) : null}
    </div>
  );
};

const CompetitionScrambles: React.FC<CompetitionScramblesProps> = ({ comp }) => {
  const [baseEvents, setBaseEvents] = useState<EventsAPI.Event[]>([]);
  const screens = Grid.useBreakpoint();
  const isCompact = screens.md === false;

  useEffect(() => {
    apiEvents().then((value) => {
      setBaseEvents(value.data.Events);
    });
  }, []);
  if (!comp) {
    return <p>没有找到比赛信息。</p>;
  }

  const scrambleValue = (sc: string, compact: boolean) => {
    return (
      <p
        className={compact ? 'scramble-text scramble-text--compact' : 'scramble-text'}
        style={{
          whiteSpace: 'pre-line',
          ...(compact ? {} : { width: 500 }),
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
    const m = eventRouteM(ev.EventRoute);

    const rowClassName = (data: { Index: string }) => {
      if (data.Index.indexOf('Ex') !== -1) {
        return 'highlight-row';
      }
      return '';
    };

    const buildGroupRows = (ssc: string[]): ScrambleTableRow[] | 'skip' => {
      const tb: ScrambleTableRow[] = [];

      if (m.repeatedly) {
        for (let evIdx = 0; evIdx < ssc.length; evIdx++) {
          tb.push({
            Index: '#' + (evIdx + 1),
            Scramble: scrambleValue(ssc[evIdx], isCompact),
            ScrambleImage: <ScrambleImage sc={ssc[evIdx]} ev={baseEvent?.puzzleId} />,
          });
        }
      }

      if (baseEvent?.scrambleValue) {
        const sp = baseEvent.scrambleValue.split(',');
        if (sp.length >= 2) {
          if (sp.length !== ssc.length) {
            return 'skip';
          }
          for (let evIdx = 0; evIdx < sp.length; evIdx++) {
            tb.push({
              Index: sp[evIdx],
              Scramble: scrambleValue(ssc[evIdx], isCompact),
              ScrambleImage: <ScrambleImage sc={ssc[evIdx]} ev={sp[evIdx]} />,
            });
          }
        }
      }

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
            Scramble: scrambleValue(ssc[evIdx], isCompact),
            ScrambleImage: <ScrambleImage sc={ssc[evIdx]} ev={baseEvent?.puzzleId} />,
          });
        }
      }

      return tb;
    };

    const scheduleRounds: ScheduleRoundDef[] = [];
    for (let i = 0; i < ev.Schedule.length; i++) {
      const sc = ev.Schedule[i];

      if (!sc.Scrambles) {
        continue;
      }

      const groups: ScrambleGroupDef[] = [];
      for (let j = 0; j < sc.Scrambles.length; j++) {
        const ssc = sc.Scrambles[j];
        const built = buildGroupRows(ssc);
        if (built === 'skip') {
          continue;
        }
        groups.push({
          label: '打乱组' + (j + 1),
          tb: built,
        });
      }

      if (groups.length === 0) {
        continue;
      }

      scheduleRounds.push({
        roundKey: `${ev.EventID}-${i}-${sc.Round}`,
        roundTitle: sc.Round,
        groups,
      });
    }

    if (scheduleRounds.length === 0) {
      return <>暂无打乱</>;
    }

    return (
      <ScrambleEventRounds
        key={ev.EventID}
        eventKey={ev.EventID}
        rounds={scheduleRounds}
        rowClassName={rowClassName}
        isCompact={isCompact}
      />
    );
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
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
};

export default CompetitionScrambles;
