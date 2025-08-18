import { NavTabs } from '@/components/Tabs/nav_tabs';
import DrawPalette, { pathSvg } from '@/pages/Tools/Draws/DrawPalette';
import { FormattedMessage, getIntl } from '@@/exports';
import { Button, Col, Form, Input, Row, Select, Slider, Space, Switch, message } from 'antd';
import React, { useEffect, useState } from 'react';

const intl = getIntl();
const cspMap = new Map([
  ['星 Star', 'cccccc'],
  ['风筝 Kite', 'ececcece'],
  ['方 Square', 'ecececec'],
  ['贝壳 Scallop', 'eeccccee'],
  ['蘑菇 Mushroom', 'ecceccee'],
  ['右爪 R Paw', 'eecccece'],
  ['左爪 L Paw', 'ececccee'],
  ['右拳 R Fist', 'ececceec'],
  ['左拳 L Fist', 'ceeccece'],
  ['盾 Shield', 'eeccceec'],
  ['桶 Barrel', 'ceecceec'],
  ['对 Twins', 'cceeccc'],

  ['8', 'eeeecceeee'],
  ['71', 'eeececeeee'],
  ['62', 'eeeceeceee'],
  ['53', 'eeceeeceee'],
  ['44', 'eeceeeecee'],
  ['6', 'eeccceeee'],
  ['51R', 'eeeeccece'],
  ['51L', 'ececceeee'],
  ['411', 'ecececeee'],
  ['42R', 'eeeecceec'],
  ['42L', 'ceecceeee'],
  ['33', 'eeeceeecc'],
  ['321', 'ececeeece'],
  ['312', 'eeececeec'],
  ['222', 'ceeceecee'],
  ['L', 'cececcc'],
  ['I', 'ecceccc'],
]);

const lineSvgs = 'M 44.84834 1.38492 L 25.17810 74.79528';

const cornerSvgs = [
  'm35.01322,38.09014l-5.1493,-19.21651l-14.06721,0l0,14.06721l19.21651,5.1493z',
  'm15.79671,18.87363l-4.8037,-4.8037l17.58351,0l1.2874,4.8037l-14.06721,0z',
  'm15.79671,18.87363l-4.8037,-4.8037l0,17.58351l4.8037,1.2874l0,-14.06721z',
];

const cornerFontPoint = [21.94057, 27.84965];
const edgeFontPoint = [33.4, 27.84965];

const edgeSvgs = [
  'm35.01322,38.09014l5.1485,-19.21651l-10.2978,0l5.1493,19.21651z',
  'm40.16172,18.87363l1.2874,-4.8037l-12.8726,0l1.2874,4.8037l10.2978,0z',
];

const rotatePoint = '35.01322 38.0901';

const baseMinxColor = [
  '#00000000',
  '#033fff',
  '#f3ff00',
  '#d10707',
  '#206606',
  '#ff8806',

  '#3d3d3d',
  '#f5f3db',
  '#777',
];

const SimpleSq1Draw = () => {
  const [num, setNum] = useState(0);
  const [corner, setCorner] = useState(0);
  const [edge, setEdge] = useState(0);
  const [reg, setReg] = useState(0); // 角度
  const [baseReg, setBaseReg] = useState(0);
  const [svgPoints, setSvgPoints] = useState<pathSvg[]>([]);
  const [linePoint, setLinePoint] = useState<pathSvg[]>([]);
  const [cubes, setCubes] = useState<string[]>([]);
  const [cpsOpt, setCpsOpt] = useState<any[]>([]);
  const [defaultVal, setDefaultVal] = useState<any>();

  const addEdge = () => {
    if (reg + 30 > 360) {
      message.warning(intl.formatMessage({ id: 'draws.sq1.error1.Available_full' })).then();
      return;
    }

    if (edge >= 8) {
      message.warning(intl.formatMessage({ id: 'draws.sq1.error2.full_edge' })).then();
      return;
    }

    for (let i = 0; i < edgeSvgs.length; i++) {
      svgPoints.push({
        key: 'edge' + num + '_' + i,
        d: edgeSvgs[i],
        baseRotate: reg + 30,
        rotate: baseReg,
        rotatePoint: rotatePoint,
      });
    }

    setNum(num + 1);
    setSvgPoints(svgPoints);
    setReg(reg + 30);
    setEdge(edge + 1);
    setCubes([...cubes, 'edge']);
  };

  const addCorner = () => {
    if (reg + 60 > 360) {
      message.warning(intl.formatMessage({ id: 'draws.sq1.error1.Available_full' })).then();
      return;
    }

    if (corner >= 6) {
      message.warning(intl.formatMessage({ id: 'draws.sq1.error3.full_corner' })).then();
      return;
    }
    for (let i = 0; i < cornerSvgs.length; i++) {
      svgPoints.push({
        key: 'corner' + num + '_' + i,
        d: cornerSvgs[i],
        baseRotate: reg + 90,
        rotate: baseReg,
        rotatePoint: rotatePoint,
      });
    }
    setNum(num + 1);
    setSvgPoints(svgPoints);
    setReg(reg + 60);
    setCorner(corner + 1);
    setCubes([...cubes, 'corner']);
  };

  const reset = () => {
    setReg(0);
    setEdge(0);
    setCorner(0);
    setSvgPoints([]);
    setCubes([]);
    setDefaultVal('');
  };

  const resetBaseReg = (e: number) => {
    setBaseReg(e);
    for (let i = 0; i < svgPoints.length; i++) {
      svgPoints[i].rotate = e;
    }
    setSvgPoints(svgPoints);
  };

  const removeHandler = () => {
    if (!cubes || cubes.length === 0) {
      message.warning(intl.formatMessage({ id: 'draws.sq1.error4.not_available_delete' })).then();
      return;
    }

    if (cubes.at(-1) === 'edge') {
      setReg(reg - 30);
      setEdge(edge - 1);
      svgPoints.splice(-2, 2); // 先删除最后2个元素
      setSvgPoints([...svgPoints]); // 传递修改后的完整数组
    } else if (cubes.at(-1) === 'corner') {
      setReg(reg - 60);
      setCorner(corner - 1);
      svgPoints.splice(-3, 3); // 先删除最后2个元素
      setSvgPoints([...svgPoints]); // 传递修改后的完整数组
    }
    cubes.splice(-1, 1);
    setCubes([...cubes]);
    setDefaultVal('');
  };

  const resetLineReg = (e: number) => {
    switch (e) {
      case 30:
        setLinePoint([
          {
            key: 'sq1_line',
            d: lineSvgs,
          },
        ]);
        return;
      case -30:
        setLinePoint([
          {
            key: 'sq1_line',
            d: lineSvgs,
            rotatePoint: rotatePoint,
            rotate: 0,
            baseRotate: -30,
          },
        ]);
        return;
      case 0:
        setLinePoint([]);
        return;
    }
  };

  const setDefault = (e: string) => {
    const v = cspMap.get(e);
    if (!v) {
      return;
    }

    let newSvgPoints = [];
    let curReg = 0;
    let curEdge = 0;
    let curCorner = 0;
    let curCubes = [];

    let curNum = num;
    for (let i = 0; i < v.length; i++) {
      const d = v[i];
      if (d === 'e') {
        for (let i = 0; i < edgeSvgs.length; i++) {
          newSvgPoints.push({
            key: 'edge' + curNum + '_' + i,
            d: edgeSvgs[i],
            baseRotate: curReg + 30,
            rotate: baseReg,
            rotatePoint: rotatePoint,
          });
        }
        curReg += 30;
        curEdge += 1;
        curCubes.push('edge');
      } else {
        for (let i = 0; i < cornerSvgs.length; i++) {
          newSvgPoints.push({
            key: 'corner' + curNum + '_' + i,
            d: cornerSvgs[i],
            baseRotate: curReg + 90,
            rotate: baseReg,
            rotatePoint: rotatePoint,
          });
        }
        curReg += 60;
        curCorner += 1;
        curCubes.push('corner');
      }
      curNum += 1;
    }

    setReg(curReg);
    setSvgPoints(newSvgPoints);
    setEdge(curEdge);
    setCorner(curCorner);
    setCubes(curCubes);
    setNum(curNum);
    setDefaultVal(e);
  };

  useEffect(() => {
    resetLineReg(30);

    let opt: any[] = [];
    opt.push({ value: '', label: `- ${intl.formatMessage({ id: 'draws.sq1.None' })} -` });
    cspMap.forEach((value: string, key: string) => {
      opt.push({
        value: key,
        label: key,
      });
    });
    setCpsOpt(opt);

    setDefault('星 Star');

    console.log(svgPoints);
  }, []);

  return (
    <div>
      <DrawPalette
        svgPoints={[...linePoint, ...svgPoints]}
        presetColors={baseMinxColor}
        storageKey={'sq1Draw'}
        viewBox={'0 0 75 75'}
        strokeWidthNum={0.2}
        buttons={
          <div>
            <div style={{ textAlign: 'center', width: '50%', marginLeft: '25%' }}>
              <Form.Item label={<FormattedMessage id="draws.sq1.Rotate" />}>
                <Slider defaultValue={0} step={30} min={0} max={180} onChange={resetBaseReg} />
              </Form.Item>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Space>
                <Form.Item
                  label={<FormattedMessage id="draws.sq1.Central_axis" />}
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    defaultValue={30}
                    onChange={resetLineReg}
                    options={[
                      { value: 0, label: <FormattedMessage id="draws.sq1.None" /> },
                      { value: 30, label: <FormattedMessage id="draws.sq1.Positive_15" /> },
                      { value: -30, label: <FormattedMessage id="draws.sq1.Negative_15" /> },
                    ]}
                    style={{ width: 100 }}
                  />
                </Form.Item>

                <Form.Item
                  label={<FormattedMessage id="draws.sq1.Default" />}
                  style={{ marginBottom: 0 }}
                >
                  {/*// @ts-ignore*/}
                  <Select
                    onChange={setDefault}
                    value={defaultVal}
                    options={cpsOpt}
                    defaultValue={'星 Star'}
                    style={{ width: 150 }}
                  />
                </Form.Item>
              </Space>
            </div>

            {/*按钮*/}
            <div>
              <Button
                onClick={reset}
                key={'reset_button'}
                style={{ marginLeft: 10 }}
                disabled={!(cubes.length > 0)}
              >
                <FormattedMessage id="draws.reset" />
              </Button>
              <Button
                onClick={removeHandler}
                key={'removeHandler_button'}
                style={{ marginLeft: 10 }}
                disabled={!(cubes.length > 0)}
              >
                <FormattedMessage id="draws.delete" />
              </Button>
              <Button
                onClick={addCorner}
                key={'addCorner_button'}
                style={{ marginLeft: 10 }}
                disabled={!(corner < 6 && reg + 60 <= 360)}
              >
                <FormattedMessage id="draws.sq1.add_corner" />
              </Button>
              <Button
                onClick={addEdge}
                style={{ marginLeft: 10 }}
                key={'addEdge_button'}
                disabled={!(edge < 8 && reg + 30 <= 360)}
              >
                <FormattedMessage id="draws.sq1.add_edge" />
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
};

const DoubleSq1Draw = () => {
  const [topReg, setTopReg] = useState(0);
  const [svgPointsTop, setSvgPointsTop] = useState<pathSvg[]>([]);
  const [linePointTop, setLinePointTop] = useState<pathSvg[]>([]);
  const [topCspOption, setTopCspOptions] = useState<any[]>([]);

  const [downReg, setDownReg] = useState(0);
  const [downDefaultVal, setDownDefaultVal] = useState<any>();
  const [svgPointsDown, setSvgPointsDown] = useState<pathSvg[]>([]);
  const [linePointDown, setLinePointDown] = useState<pathSvg[]>([]);
  const [downCspOption, setDownCspOptions] = useState<any[]>([]);

  // 输入文字
  const [useFont, setUseFont] = useState<boolean>();
  const [fontsTop, setFontsTop] = useState<string[]>([]);
  const [fontsDown, setFontsDown] = useState<string[]>([]);

  const handleSetFontSwitch = (showFont: boolean) => {
    console.log(showFont);
    setUseFont(showFont);

    svgPointsTop.map((v) => {
      if (v.key.includes('fonts_')) {
        v.disShow = !showFont;
      }
      return v;
    });
    setSvgPointsTop(svgPointsTop);

    svgPointsDown.map((v) => {
      if (v.key.includes('fonts_')) {
        v.disShow = !showFont;
      }
      return v;
    });
    setSvgPointsDown(svgPointsDown);
  };

  const handleTopFontChange = (index: number, value: string) => {
    const newFonts = [...fontsTop];
    newFonts[index] = value;
    setFontsTop(newFonts);

    svgPointsTop.map((v) => {
      if (!v.key.includes('fonts_')) {
        return v;
      }
      const key = '_' + 'top' + '_' + index + '_disable';
      if (v.key.includes(key)) {
        v.text = value;
      }
      return v;
    });
    setSvgPointsTop(svgPointsTop);
  };

  // 更新 fontsDown 中指定索引的字体
  const handleDownFontChange = (index: number, value: string) => {
    const newFonts = [...fontsDown];
    newFonts[index] = value;
    setFontsDown(newFonts);

    svgPointsDown.map((v) => {
      if (!v.key.includes('fonts_')) {
        return v;
      }
      const key = '_' + 'down' + '_' + index + '_disable';
      if (v.key.includes(key)) {
        v.text = value;
      }
      return v;
    });
    setSvgPointsDown(svgPointsDown);
  };

  const setDraws = (e: string, topDown: string) => {
    const v = cspMap.get(e);
    if (!v) {
      return;
    }
    let newSvgPoints = [];
    let curEdge = 0,
      curCorner = 0;
    const timestamp = Date.now();
    const baseReg = topDown === 'top' ? topReg : downReg;
    let translate = undefined;
    if (topDown !== 'top') {
      translate = [0, 75];
    }

    let curReg = 0;
    let fonts = [];
    for (let i = 0; i < v.length; i++) {
      const d = v[i];
      const font = `${i}`.toUpperCase();
      const textSize = 6;

      fonts.push(font);
      const fontKey = 'fonts_' + timestamp + '_' + topDown + '_' + i + '_disable';
      switch (d) {
        case 'e':
          for (let j = 0; j < edgeSvgs.length; j++) {
            newSvgPoints.push({
              key: timestamp + '_edge_' + topDown + '_' + i + '_' + j + '_' + curReg,
              unColorBindKey: j === 0 ? 'sq1DrawDouble-' + fontKey : undefined,
              d: edgeSvgs[j],
              baseRotate: curReg + 30,
              rotate: baseReg,
              rotatePoint: rotatePoint,
              translate: translate,
            });
          }
          newSvgPoints.push({
            disShow: !useFont,
            key: fontKey,
            baseRotate: curReg + 30,
            rotate: baseReg,
            rotatePoint: rotatePoint,
            translate: translate,
            text: font,
            textPoint: edgeFontPoint,
            textSize: textSize,
            textRouteResetPoint: [1.7, -2.5],
          });

          curReg += 30;
          curEdge += 1;
          break;
        case 'c':
          for (let j = 0; j < cornerSvgs.length; j++) {
            newSvgPoints.push({
              key: timestamp + '_corner_' + topDown + '_' + i + '_' + j + '_' + curReg,
              unColorBindKey: j === 0 ? 'sq1DrawDouble-' + fontKey : undefined,
              d: cornerSvgs[j],
              baseRotate: curReg + 90,
              rotate: baseReg,
              rotatePoint: rotatePoint,
              translate: translate,
            });
          }
          newSvgPoints.push({
            disShow: !useFont,
            key: fontKey,
            baseRotate: curReg + 90,
            rotate: baseReg,
            rotatePoint: rotatePoint,
            translate: translate,
            text: font,
            textPoint: cornerFontPoint,
            textSize: textSize,
            textRouteResetPoint: [1.7, -2.5],
          });

          curReg += 60;
          curCorner += 1;
          break;
      }
    }

    if (topDown === 'top') {
      setSvgPointsTop(newSvgPoints);
      setFontsTop(fonts);
      return [curEdge, curCorner];
    } else {
      setSvgPointsDown(newSvgPoints);
      setFontsDown(fonts);
    }
  };

  const resetLineReg = (e: number, top: boolean) => {
    let line: pathSvg = {
      key: 'sq1_line_top',
    };
    switch (e) {
      case 30:
        line = {
          key: 'sq1_line_top',
          d: lineSvgs,
        };
        break;
      case -30:
        line = {
          key: 'sq1_line_top',
          d: lineSvgs,
          rotatePoint: rotatePoint,
          rotate: 0,
          baseRotate: -30,
        };
        break;
      default:
        if (top) {
          setLinePointTop([]);
        } else {
          setLinePointDown([]);
        }
        return;
    }

    if (!top) {
      line.key = 'sq1_line_down';
      line.translate = [0, 75];
      setLinePointDown([line]);
      return;
    }
    setLinePointTop([line]);
  };

  const handleUpdateTopOpt = (e: string) => {
    const result = setDraws(e, 'top');
    if (!result) {
      return;
    }
    const [curE, curC] = result;
    let wantE = 8 - curE;
    let wantC = 8 - curC;
    let opt: any = [];
    cspMap.forEach((value: string, key: string) => {
      const eCount = value.split('e').length - 1;
      const cCount = value.split('c').length - 1;
      if (eCount === wantE && cCount === wantC) {
        opt.push({
          value: key,
          label: key,
        });
      }
    });
    setDownCspOptions(opt);
    setSvgPointsDown([]);
    setDownDefaultVal(opt[0].value);
    setDraws(opt[0].value, 'down');
  };

  const handleUpdateDownOpt = (e: string) => {
    setDraws(e, 'down');
    setDownDefaultVal(e);
  };

  useEffect(() => {
    // 初始化中轴线
    resetLineReg(30, true);
    resetLineReg(-30, false);

    // 初始化top配置
    let opt: any[] = [];
    cspMap.forEach((value: string, key: string) => {
      opt.push({ value: key, label: key });
    });
    setTopCspOptions(opt);
    setDownDefaultVal('8');

    setDraws('星 Star', 'top');
    setDraws('8', 'down');
  }, []);

  const resetBaseReg = (e: number, topDown: string) => {
    switch (topDown) {
      case 'top':
        for (let i = 0; i < svgPointsTop.length; i++) {
          svgPointsTop[i].rotate = e;
        }
        setTopReg(e);
        setSvgPointsTop(svgPointsTop);
        break;
      case 'down':
        for (let i = 0; i < svgPointsDown.length; i++) {
          svgPointsDown[i].rotate = e;
        }
        setDownReg(e);
        setSvgPointsDown(svgPointsDown);
        break;
    }
  };

  return (
    <div>
      <DrawPalette
        width={300}
        height={600}
        svgPoints={[...linePointTop, ...linePointDown, ...svgPointsTop, ...svgPointsDown]}
        presetColors={baseMinxColor}
        storageKey={'sq1DrawDouble'}
        viewBox={'0 0 75 150'}
        strokeWidthNum={0.2}
        buttons={
          <>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item label={<strong>文字</strong>}>
                <Switch onChange={handleSetFontSwitch} />
              </Form.Item>
            </div>

            {/*顶层*/}
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item label={<strong>顶层</strong>} style={{ marginBottom: 0 }}>
                {/* @ts-ignore */}
                <Select
                  onChange={handleUpdateTopOpt}
                  options={topCspOption}
                  defaultValue={'星 Star'}
                  style={{ width: 150 }}
                />
              </Form.Item>

              <Form.Item label={'中轴线'} style={{ marginBottom: 0 }}>
                <Select
                  defaultValue={30}
                  onChange={(e) => {
                    resetLineReg(e, true);
                  }}
                  options={[
                    { value: 0, label: <FormattedMessage id="draws.sq1.None" /> },
                    { value: 30, label: <FormattedMessage id="draws.sq1.Positive_15" /> },
                    { value: -30, label: <FormattedMessage id="draws.sq1.Negative_15" /> },
                  ]}
                  style={{ width: 100 }}
                />
              </Form.Item>
              <div style={{ textAlign: 'center', width: '50%' }}>
                <Form.Item label={<FormattedMessage id="draws.sq1.Rotate" />}>
                  <Slider
                    defaultValue={0}
                    step={30}
                    min={0}
                    max={180}
                    onChange={(e) => {
                      resetBaseReg(e, 'top');
                    }}
                  />
                </Form.Item>
              </div>
            </div>

            {useFont && fontsTop && fontsTop.length > 0 && (
              <>
                <Form.Item label={<strong>顶层文字</strong>} style={{ marginBottom: 0 }}>
                  <Row gutter={[8, 8]}>
                    {fontsTop.map((font, index) => (
                      <Col span={8} key={`top-font-${index}`}>
                        <Input
                          value={font}
                          maxLength={1}
                          onChange={(e) => handleTopFontChange(index, e.target.value)}
                          placeholder="Enter Value"
                        />
                      </Col>
                    ))}
                  </Row>
                </Form.Item>
              </>
            )}

            {/*底层*/}
            <div style={{ display: 'flex', gap: 16, marginTop: 15 }}>
              <Form.Item label={<strong>底层</strong>} style={{ marginBottom: 0 }}>
                {/* @ts-ignore */}
                <Select
                  onChange={handleUpdateDownOpt}
                  options={downCspOption}
                  value={downDefaultVal}
                  style={{ width: 150 }}
                />
              </Form.Item>

              <Form.Item label={'中轴线'} style={{ marginBottom: 0 }}>
                <Select
                  defaultValue={-30}
                  onChange={(e) => {
                    resetLineReg(e, false);
                  }}
                  options={[
                    { value: 0, label: <FormattedMessage id="draws.sq1.None" /> },
                    { value: 30, label: <FormattedMessage id="draws.sq1.Positive_15" /> },
                    { value: -30, label: <FormattedMessage id="draws.sq1.Negative_15" /> },
                  ]}
                  style={{ width: 100 }}
                />
              </Form.Item>

              <div style={{ textAlign: 'center', width: '50%' }}>
                <Form.Item label={<FormattedMessage id="draws.sq1.Rotate" />}>
                  <Slider
                    defaultValue={0}
                    step={30}
                    min={0}
                    max={180}
                    onChange={(e) => {
                      resetBaseReg(e, 'down');
                    }}
                  />
                </Form.Item>
              </div>
            </div>

            {useFont && fontsDown && fontsDown.length > 0 && (
              <>
                <Form.Item label={<strong>底层文字</strong>} style={{ marginBottom: 0 }}>
                  <Row gutter={[8, 8]}>
                    {fontsDown.map((font, index) => (
                      <Col span={8} key={`down-font-${index}`}>
                        <Input
                          value={font}
                          maxLength={1}
                          onChange={(e) => handleDownFontChange(index, e.target.value)}
                          placeholder="Enter Value"
                        />
                      </Col>
                    ))}
                  </Row>
                </Form.Item>
              </>
            )}
          </>
        }
      />
    </div>
  );
};

const Sq1Draw: React.FC = () => {
  const items = [
    {
      key: 'simple_sq',
      label: <FormattedMessage id="draws.top_view" />,
      children: SimpleSq1Draw(),
    },
    {
      key: 'double_sq',
      label: <FormattedMessage id="draws.double_view" />,
      children: DoubleSq1Draw(),
    },
  ];

  return (
    <>
      <NavTabs
        type="line"
        items={items}
        tabsKey="sq1_draw_tabs"
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
};

export default Sq1Draw;
