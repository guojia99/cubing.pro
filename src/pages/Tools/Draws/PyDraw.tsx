import { NavTabs } from '@/components/Tabs/nav_tabs';
import DrawPalette, { pathSvg } from '@/pages/Tools/Draws/DrawPalette';
import { FormattedMessage } from '@@/exports';
import { useEffect, useState } from 'react';

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
const SimplePyDraw = () => {
  const [pyPointsM, setPyPointsM] = useState<pathSvg[]>([]);

  const pyPoints = [
    // 左
    '87.65 463.25 4.75 420.25 79.08 304.24 87.65 463.25',
    '181.24 318.09 89.07 288.64 167 166.98 181.24 318.09',
    '292.7 167.89 177.59 150.43 270.9 4.75 292.7 167.89',
    '200.44 521.75 99.28 469.29 184 347.32 200.44 521.75',
    '350.42 599.54 211.29 527.39 321.78 385.34 350.42 599.54',
    '305.4 379.88 209.67 509.28 194.8 342.92 305.4 379.88',
    '175.64 336.52 98.08 448.17 90.16 307.95 175.64 336.52',
    '318.66 361.96 200.09 324.1 295.27 187.05 318.66 361.96',
    '280.97 184.82 192.1 312.81 179.24 168.9 280.97 184.82',

    // 右
    '436.49 444.34 436.49 444.36 404.9 501.3 378.98 339.57 436.49 444.34',
    '400.14 509.88 400.14 509.9 350.42 599.54 321.78 385.34 400.14 509.88',
    '432.7 421.58 379.23 324.67 411.03 291.1 432.7 421.58',
    '396.71 488.08 328.63 378.09 372.18 332.12 396.71 488.08',
    '367.73 303.84 301.65 184.08 345.68 163.61 367.73 303.84',
    '366.22 316.31 318.66 361.96 295.27 187.05 366.22 316.31',
    '466.54 390.14 440.89 436.4 414.46 287.56 466.54 390.14',
    '408.48 275.77 374.05 308.81 350.42 161.4 408.48 275.77',
    '343.05 146.87 292.72 167.89 292.7 167.89 270.9 4.75 343.05 146.87',
  ];

  // const lines: pathSvg[] = [
  //   {
  //     key: 'simple_py_lines_base1',
  //     d: 'm208.7,519.84l105.63-142.78-125.75-42.03,3.78,42.27-4.29-45.48-90.55,130.35-1.82-.94,88.65-127.6-96.83-32.36,3.91-6.1,96.07,30.69-14.85-157.51.89-1.4,14.42,161.45,102.53-147.65-114.33-17.89,4.13-6.45,109.8,16.66,4.84,4.84-103.6,149.18,128.77,41.12,50.18-48.15h0s0,0,0,0l.83,5.2-48.47,51.16-.4-.63-112.49,144.62-1.06-.55Zm-115.73-60.03l-5.42-100.53,5.69,100.67-.27-.14Zm282.15-144.4l31.82-30.54.84,1.66-31.91,33.69-.76-4.81Zm-76.9-143.85l42.24-17.64,2.49,4.9-44.74,20.8v-8.06Z',
  //     disableDrawing: true,
  //   },
  //   {
  //     key: 'simple_py_lines_base2',
  //     d: 'm343.05,146.87l-50.33,21.02v.02l-.02-.02-115.11-17.46-10.59,16.55,14.24,151.1-92.17-29.44-10,15.6,8.57,159.01,11.64,6.04,84.72-121.97,16.43,174.43,10.85,5.64,110.49-142.04,78.36,124.54,4.76-8.57v-.02l-25.92-161.73,57.51,104.77,4.4-7.92v-.02l-26.43-148.84-.02-.02v-.04l-5.96-11.73-34.43,33.04-23.63-147.41-7.37-14.51v-.02h0Zm24.68,156.97l-66.08-119.76,44.03-20.47,22.05,140.23h0Zm-175.63,8.97l-12.85-143.91,101.73,15.92-88.87,127.99h0Zm126.56,49.15l-118.56-37.86,95.18-137.05,70.95,129.26-47.57,45.65h0Zm114.05,59.62l-53.47-96.91,31.8-33.57,21.67,130.48h0Zm-334.62,26.58l-7.92-140.21,85.48,28.56-77.56,111.65h0Zm298.63,39.91l-68.08-109.99,43.55-45.97,24.53,155.96h0Zm-187.04,21.19l-14.87-166.36,110.6,36.96-95.73,129.4h0Z',
  //     disableDrawing: true,
  //   },
  //   {
  //     key: 'simple_py_line_base3',
  //     disableDrawing: true,
  //     line: { x1: 270.9, y1: 4.76, x2: 350.43, y2: 599.55 },
  //   },
  //   {
  //     key: 'simple_py_line_base4',
  //     disableDrawing: true,
  //     line: { x1: 4.76, y1: 420.26, x2: 350.43, y2: 599.55 },
  //   },
  //   {
  //     key: 'simple_py_line_base5',
  //     disableDrawing: true,
  //     line: { x1: 270.9, y1: 4.76, x2: 4.76, y2: 420.26 },
  //   },
  //   {
  //     key: 'simple_py_line_base6',
  //     disableDrawing: true,
  //     line: { x1: 350.43, y1: 599.55, x2: 466.55, y2: 390.15 },
  //   },
  //   {
  //     key: 'simple_py_line_base7',
  //     disableDrawing: true,
  //     line: { x1: 270.9, y1: 4.76, x2: 466.55, y2: 390.15 },
  //   },
  //
  // ];

  useEffect(() => {
    const v = [];
    for (let i = 0; i < pyPoints.length; i++) {
      v.push({
        key: 'simple_py_points' + i,
        points: pyPoints[i],
        // disableStrokeWidth: true,
      });
    }
    setPyPointsM(v);
  }, []);

  return (
    <div>
      <DrawPalette
        svgPoints={pyPointsM}
        presetColors={baseSkColor}
        storageKey={'SimplePyDraw'}
        viewBox={'0 0 471.31 604.31'}
        strokeWidthNum={10}
      />
    </div>
  );
};

const PyDraw = () => {
  const items = [
    {
      key: 'full_py',
      label: <FormattedMessage id="draws.expanded_view" />,
      children: <FormattedMessage id="development" />,
    },
    {
      key: 'full2_py',
      label: <FormattedMessage id="draws.top_view" />,
      children: <FormattedMessage id="development" />,
    },
    {
      key: 'full3_py',
      label: <FormattedMessage id="draws.front_view" />,
      children: <FormattedMessage id="development" />,
    },
  ];

  return (
    <>
      <NavTabs
        type="line"
        items={items}
        tabsKey="py_draw_tabs"
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
};

export default PyDraw;
