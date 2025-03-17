import GroupPlayerManager from '@/pages/Tools/TeamMatch/step1_player';
import Step2MatchNow from '@/pages/Tools/TeamMatch/step3_comps';
import { Context, TableData } from '@/pages/Tools/TeamMatch/types';
import { Button, Card, Steps } from 'antd';
import React, { useRef, useState } from 'react';

const TeamMatch: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const divRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<Context>({
    Name: '',
    ShowFullScreen: false,
    Step1TableData: [],
  });

  const setStep1tableData: React.Dispatch<React.SetStateAction<TableData>> = (value) => {
    setContext((prevContext) => ({
      ...prevContext,
      Step1TableData: typeof value === 'function' ? value(prevContext.Step1TableData) : value,
    }));
  };

  const steps = [
    // {
    //   title: '基础信息',
    //   content: (
    //     <Base
    //       name={context.Name}
    //       setName={(v: string) => {
    //         setContext({ ...context, Name: v });
    //       }}
    //     />
    //   ),
    // },
    {
      title: '选手名单配置',
      content: (
        <GroupPlayerManager tableData={context.Step1TableData} setTableData={setStep1tableData} />
      ),
    },
    {
      title: '赛程',
      content: <Step2MatchNow context={context} setContext={setContext} />,
    },
    {
      title: '赛果',
      content: 'Last-content',
    },
  ];

  const items = steps.map((item) => ({
    key: item.title,
    title: item.title,
  }));

  const canGoPrev = current > 0;
  const canGoNext = current < steps.length - 1;

  const next = () => {
    if (canGoNext) {
      setCurrent(current + 1);
    }
  };

  const prev = () => {
    if (canGoPrev) {
      setCurrent(current - 1);
    }
  };

  return (
    <>
      {!context.ShowFullScreen && (
        <Card style={{ marginBottom: 50 }}>
          <div>
            <Steps current={current} items={items} />
          </div>
          <div style={{ width: '100%', marginTop: 50 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 20,
                marginBottom: 20,
              }}
            >
              <Button disabled={!canGoPrev} onClick={prev}>
                上一步
              </Button>
              <Button type="primary" disabled={!canGoNext} onClick={next}>
                下一步
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div ref={divRef} style={{ minHeight: '100vh' }}>
        <Card style={{ minHeight: '100vh' }}>
          <div>{steps[current].content}</div>
        </Card>
      </div>
    </>
  );
};

export default TeamMatch;
