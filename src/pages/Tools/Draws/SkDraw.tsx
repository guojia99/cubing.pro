import { NavTabs } from '@/components/Tabs/nav_tabs';
import DrawPalette, { pathSvg } from '@/pages/Tools/Draws/DrawPalette';
import { FormattedMessage } from '@@/exports';
import { Button, Col, Row } from 'antd';
import React, { useEffect, useState } from 'react';

const baseSkColor = [
  '#00000000',
  '#033fff',
  '#f3ff00',
  '#d10707',
  '#ff8806',
  '#206606',

  '#3d3d3d',
  '#f5f3db',
  '#777',
];

const SimpleSkDraw = () => {
  const skPoints = [
    {
      d: 'M128.839 19.1399 128.839 37.6453 112.814 46.8948 128.839 19.1399Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M128.839 0.640989 128.839 19.1399 112.814 9.89047 128.839 0.640989Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M97.0129 19.1841 129.136 19.1841 129.136 37.7322 97.0129 37.7322Z',
      transform: 'matrix(0.498848 -0.872096 0.86403 0.503505 32.0788 112.942)',
    },
    {
      d: 'M112.814 9.89047 96.7894 37.6453 96.7894 19.1399 112.814 9.89047Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M112.814 46.8948 96.7894 56.1507 96.7894 37.6453 112.814 46.8948Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M96.7894 37.6453 96.7894 56.1507 80.7647 65.4001 96.7894 37.6453Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M96.7894 19.1399 96.7894 37.6453 80.7647 28.3958 96.7894 19.1399Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M64.8894 37.7322 97.0129 37.7322 97.0129 56.2803 64.8894 56.2803Z',
      transform: 'matrix(0.498848 -0.872096 0.86403 0.503505 0.0293102 94.2641)',
    },
    {
      d: 'M96.7894 19.1399 80.7647 28.3958 80.7647 9.89047 96.7894 19.1399Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M48.7152 9.89047 80.7647 9.89047 80.7647 28.3958 48.7152 28.3958Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M80.7647 28.3958 64.7399 56.1507 64.7399 37.6453 80.7647 28.3958Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M80.7647 9.89047 48.7152 9.89047 64.7399 0.640989 80.7647 9.89047Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M80.7647 28.3958 64.7399 37.6453 48.7152 28.3958 80.7647 28.3958Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M80.7647 65.4001 64.7399 74.656 64.7399 56.1507 80.7647 65.4001Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M64.7399 56.1507 64.7399 74.656 48.7152 65.4001 64.7399 56.1507Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M64.7399 37.6453 64.7399 56.1507 48.7152 28.3958 64.7399 37.6453Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M39.5581 30.9488 58.1068 30.9488 58.1068 63.0733 39.5581 63.0733Z',
      transform: 'matrix(0.864002 -0.503489 0.498832 0.872068 -16.6621 30.9253)',
    },
    {
      d: 'M48.7152 9.89047 48.7152 28.3958 32.6905 19.1399 48.7152 9.89047Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M32.6905 37.6453 48.7152 65.4001 32.6905 56.1507 32.6905 37.6453Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M48.7152 28.3958 32.6905 37.6453 32.6905 19.1399 48.7152 28.3958Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M32.6905 37.6453 32.6905 56.1507 16.6657 46.8948 32.6905 37.6453Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M32.6905 19.1399 32.6905 37.6453 16.6657 9.89047 32.6905 19.1399Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M7.43361 12.4001 25.9823 12.4001 25.9823 44.5246 7.43361 44.5246Z',
      transform: 'matrix(0.864002 -0.503489 0.498832 0.872068 -11.7008 12.2472)',
    },
    {
      d: 'M0.640989 19.1399 16.6657 46.8948 0.640989 37.6453 0.640989 19.1399Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M16.6657 9.89047 0.640989 19.1399 0.640989 0.640989 16.6657 9.89047Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M80.7647 9.89047 64.7399 0.640989 48.7152 9.89047',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M96.7894 19.1399 80.7647 9.89047',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M48.7152 9.89047 32.6905 19.1399',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M48.7152 9.89047 80.7647 9.89047 80.7647 28.3958 48.7152 28.3958Z',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M80.7647 28.3958 64.7399 37.6453',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M96.7894 19.1399 80.7647 28.3958',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M64.7399 74.656 80.7647 65.4001',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M80.7647 65.4001 96.7894 56.1507',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M64.8894 37.7322 97.0129 37.7322 97.0129 56.2803 64.8894 56.2803Z',
      transform: 'matrix(0.498848 -0.872096 0.86403 0.503505 0.0293102 94.2641)',
    },
    {
      d: 'M48.7152 28.3958 32.6905 19.1399',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M64.7399 56.1507 64.7399 37.6453 48.7152 28.3958',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M32.6905 56.1507 48.7152 65.4001',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M48.7152 65.4001 64.7399 74.656 64.7399 56.1507',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M39.5581 30.9488 58.1068 30.9488 58.1068 63.0733 39.5581 63.0733Z',
      transform: 'matrix(0.864002 -0.503489 0.498832 0.872068 -16.6621 30.9253)',
    },
    {
      d: 'M16.6657 9.89047 0.640989 0.640989 0.640989 19.1399',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M32.6905 37.6453 32.6905 19.1399 16.6657 9.89047',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M0.640989 19.1399 0.640989 37.6453 16.6657 46.8948',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M16.6657 46.8948 32.6905 56.1507 32.6905 37.6453',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M7.43361 12.4001 25.9823 12.4001 25.9823 44.5246 7.43361 44.5246Z',
      transform: 'matrix(0.864002 -0.503489 0.498832 0.872068 -11.7008 12.2472)',
    },
    {
      d: 'M112.814 9.89047 96.7894 19.1399 96.7894 37.6453',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M128.839 19.1399 128.839 0.640989 112.814 9.89047',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M96.7894 37.6453 96.7894 56.1507 112.814 46.8948',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M112.814 46.8948 128.839 37.6453 128.839 19.1399',
      transform: 'matrix(1 0 0 1.00934 0.260066 0)',
    },
    {
      d: 'M97.0129 19.1841 129.136 19.1841 129.136 37.7322 97.0129 37.7322Z',
      transform: 'matrix(0.498848 -0.872096 0.86403 0.503505 32.0788 112.942)',
    },
  ];

  const [skPointsM, setSkPointsM] = useState<pathSvg[]>([]);

  useEffect(() => {
    const v = [];
    for (let i = 0; i < skPoints.length; i++) {
      v.push({
        key: 'simple_sk' + i,
        d: skPoints[i].d,
        transformStr: skPoints[i].transform,
      });
    }
    setSkPointsM(v);
  }, []);

  return (
    <div>
      <DrawPalette
        svgPoints={skPointsM}
        presetColors={baseSkColor}
        storageKey={'simpleSkDraw'}
        viewBox={'0 0 130 76'}
        strokeWidthNum={0.2}
      />
    </div>
  );
};

const SK3DDraw = () => {
  const baseSvgs = [
    'm70.1,40.94l0,17.58l-15.22,8.8l15.22,-26.38z',
    'm70.1,23.35l0,17.59l-15.22,-8.8l15.22,-8.79z',
    'm39.66,58.53l15.22,-26.39l15.23,8.79l-15.23,26.38l-15.22,-8.78z',
    'm70.1,23.35l-15.22,8.79l0,-17.59l1.63,0.94l13.59,7.86z',
    'm24.44,14.55l30.44,0l0,17.59l-30.44,0l0,-17.59z',
    'm54.88,32.14l-15.22,26.38l0,-17.58l15.22,-8.8z',
    'm54.88,14.55l-30.44,0l15.22,-8.8l13.67,7.91l1.55,0.89z',
    'm54.88,32.14l-15.22,8.8l-15.22,-8.8l30.44,0z',
    'm54.88,67.32l-15.22,8.8l0,-17.6l15.22,8.8z',
    'm39.66,58.52l0,17.6l-15.22,-8.8l15.22,-8.8z',
    'm39.66,40.94l0,17.58l-15.22,-26.38l15.22,8.8z',
    'm9.21,40.94l15.22,-8.79l15.23,26.39l-15.23,8.78l-15.22,-26.38z',
    'm24.44,14.55l0,17.59l-15.23,-8.79l15.23,-8.8z',
    'm9.21,40.94l15.23,26.38l-15.23,-8.8l0,-17.58z',
    'm24.44,32.14l-15.23,8.8l0,-17.59l15.23,8.79z',
    'm54.88,14.55l-1.55,-0.89l-13.67,-7.91l-15.22,8.8',
    'm70.1,23.35l-13.59,-7.86l-1.63,-0.94',
    'm24.44,14.55l-15.23,8.8',
    'm24.44,14.55l30.44,0l0,17.59l-30.44,0l0,-17.59z',
    'm54.88,32.14l-15.22,8.8',
    'm70.1,40.94l0,-17.59l-15.22,8.79',
    'm39.66,76.12l15.22,-8.8',
    'm54.88,67.32l15.22,-8.8l0,-17.58',
    'm39.66,58.53l15.22,-26.39l15.23,8.79l-15.23,26.38l-15.22,-8.78z',
    'm24.44,32.14l-15.23,-8.79l0,17.59',
    'm39.66,58.52l0,-17.58l-15.22,-8.8',
    'm9.21,40.94l0,17.58l15.23,8.8',
    'm24.44,67.32l15.22,8.8l0,-17.6',
  ];

  const lineSvgs = [
    {
      // 左上角
      d: 'm21.86,14.06l-11.26,6.5c-1.27,0.9 -3.22,-2.52 -1.82,-3.16c0,0 11.24,-6.5 11.24,-6.5c1.31,-0.9 3.24,2.51 1.84,3.16z',
      transform: '',
      name: (
        <>
          <FormattedMessage id="draws.sk.top.left" /> 1
        </>
      ),
      key: 1,
    },
    {
      d: 'm36.48,5.21l-11.26,6.5c-1.27,0.9 -3.22,-2.52 -1.82,-3.16c0,0 11.24,-6.5 11.24,-6.5c1.31,-0.9 3.24,2.51 1.84,3.16z',
      transform: '',
      name: <><FormattedMessage id="draws.sk.top.left" />) 2</>,
      key: 2,
    },
    {
      d: 'm67.88,28.4l0,13.01c0.14,1.56 -3.79,1.54 -3.65,0l0,-13.01c-0.14,-1.53 3.79,-1.52 3.65,0z',
      transform: 'rotate(120 65.7926 16.1458)',
      name: <><FormattedMessage id="draws.sk.top.right" /> 1</>,
      key: 3,
    },
    {
      d: 'm67.5,9.63l0,13.01c0.14,1.56 -3.79,1.54 -3.65,0l0,-13.01c-0.14,-1.53 3.79,-1.52 3.65,0z',
      transform: 'rotate(120 65.5426 16.1458)',
      name: <><FormattedMessage id="draws.sk.top.right" /> 2</>,
      key: 4,
    },
    {
      d: 'm75.52,25.11l0,13.01c0.14,1.56 -3.79,1.54 -3.65,0l0,-13.01c-0.14,-1.53 3.79,-1.52 3.65,0z',
      transform: '',
      name: <><FormattedMessage id="draws.sk.right" /> 1</>,
      key: 5,
    },
    {
      d: 'm75.65,43.88l0,13.01c0.14,1.56 -3.79,1.54 -3.65,0l0,-13.01c-0.14,-1.53 3.79,-1.52 3.65,0z',
      transform: '',
      name: <><FormattedMessage id="draws.sk.right" /> 2</>,
      key: 6,
    },
    {
      d: 'm70.54,64.53l-11.26,6.5c-1.27,0.9 -3.22,-2.52 -1.82,-3.16c0,0 11.24,-6.5 11.24,-6.5c1.31,-0.9 3.24,2.51 1.84,3.16z',
      transform: '',
      name: <><FormattedMessage id="draws.sk.bottom.right" /> 1</>,
      key: 7,
    },
    {
      d: 'm55.92,72.88l-11.26,6.5c-1.27,0.9 -3.22,-2.52 -1.82,-3.16c0,0 11.24,-6.5 11.24,-6.5c1.31,-0.9 3.24,2.51 1.84,3.16z',
      transform: '',
      name: <><FormattedMessage id="draws.sk.bottom.right" /> 2</>,
      key: 8,
    },
    {
      d: 'm32.33,86.75l0,13.01c0.14,1.56 -3.79,1.54 -3.65,0l0,-13.01c-0.14,-1.53 3.79,-1.52 3.65,0z',
      transform: 'rotate(120 30.25 74.4902)',
      name: <><FormattedMessage id="draws.sk.bottom.left" /> 1</>,
      key: 9,
    },
    {
      d: 'm31.95,67.98l0,13.01c0.14,1.56 -3.79,1.54 -3.65,0l0,-13.01c-0.14,-1.53 3.79,-1.52 3.65,0z',
      transform: 'rotate(120 30 74.4902)',
      name: <><FormattedMessage id="draws.sk.bottom.left" /> 2</>,
      key: 10,
    },
    {
      d: 'm7.33,44l0,13.01c0.14,1.56 -3.79,1.54 -3.65,0l0,-13.01c-0.14,-1.53 3.79,-1.52 3.65,0z',
      transform: '',
      name: <><FormattedMessage id="draws.sk.left" /> 2</>,
      key: 11,
    },
    {
      d: 'm7.2,25.23l0,13.01c0.14,1.56 -3.79,1.54 -3.65,0l0,-13.01c-0.14,-1.53 3.79,-1.52 3.65,0z',
      transform: '',
      name: <><FormattedMessage id="draws.sk.left" /> 1</>,
      key: 12,
    },
  ];

  const [skPointsM, setSkPointsM] = useState<pathSvg[]>([]);

  const [lineMap, setLineMap] = useState(new Map<number, (typeof lineSvgs)[0]>()); //
  const [skLinePointsM, setSkLinePointsM] = useState<pathSvg[]>([]);
  const [skLineSelectMap, setSkLineSelectMap] = useState(new Map());

  const selectLine = (k: number) => {
    // 创建一个新的 Map 进行状态更新
    const newMap = new Map(skLineSelectMap);
    if (newMap.has(k)) {
      newMap.delete(k); // 取消选中
      setSkLinePointsM(
        skLinePointsM.filter((e) => {
          return e.key !== 'sk_3d_line' + k;
        }),
      );
    } else {
      newMap.set(k, k); // 设置为选中
      const svg = lineMap.get(k);
      if (!svg) {
        return;
      }
      skLinePointsM.push({
        d: svg.d,
        transformStr: svg.transform,
        key: 'sk_3d_line' + svg.key,
      });
      setSkLinePointsM(skLinePointsM);
    }
    setSkLineSelectMap(newMap); // 更新状态
  };

  useEffect(() => {
    const newMap = new Map(lineSvgs.map((item) => [item.key, item]));
    setLineMap(newMap);

    const v = [];
    for (let i = 0; i < baseSvgs.length; i++) {
      v.push({
        key: 'sk_3d_2_sk' + i,
        d: baseSvgs[i],
      });
    }
    setSkPointsM(v);
  }, []);

  return (
    <div>
      <DrawPalette
        svgPoints={[...skPointsM, ...skLinePointsM]}
        presetColors={baseSkColor}
        storageKey={'SK3DDraw'}
        viewBox={'0 0 78 82'}
        strokeWidthNum={0.2}
        buttons={
          <div style={{ textAlign: 'center' }}>
            <h2>
              <FormattedMessage id="draws.flank" />
            </h2>
            <div>
              <Row gutter={16}>
                {lineSvgs.map((btn, index) => (
                  <Col span={4} key={index} style={{ marginBottom: 10 }}>
                    <Button
                      type={skLineSelectMap.get(btn.key) ? 'primary' : undefined}
                      size={'small'}
                      onClick={() => selectLine(btn.key)}
                      block
                    >
                      {btn.name}
                    </Button>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        }
      />
    </div>
  );
};

const SKDraw: React.FC = () => {
  const items = [
    {
      key: 'simple_sk',
      label: <FormattedMessage id="draws.expanded_view" />,
      children: SimpleSkDraw(),
    },
    {
      key: '3d_2_sk',
      label: <FormattedMessage id="draws.stereogram" />,
      children: SK3DDraw(),
    },
  ];

  return (
    <>
      <NavTabs
        type="line"
        items={items}
        tabsKey="sk_draw_tabs"
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
};

export default SKDraw;
