import DrawPalette, { pathSvg } from '@/pages/Tools/DrawPalette';
import { Button, Form, message, Select, Slider, Space } from 'antd';
import React, {useEffect, useRef, useState} from 'react';

const cspMap = new Map([
  ['星 Star', 'cccccc'],
  ['风筝 Kite', 'ececcece'],
  ['方 Square', 'ecececec'],
  ['贝壳 Scallop', 'eecceecc'],
  ['蘑菇 Mushroom', 'ecceccee'],
  ['右爪 R Paw', 'eecccece'],
  ['左爪 L Paw', 'ececccee'],
  ['右拳 R Fist', 'ececceec'],
  ['左拳 L Fist', 'ceeccece'],
  ['盾 Shield', 'eeccceec'],
  ['桶 Barrel', 'ceecceec'],
  ['对 Twins', 'cceeccc'],

  ['8', 'eeeeceeeec'],
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

console.log(cspMap.get('星 Star')); // 输出: 'cccccc'

const Sq1Draw: React.FC = () => {
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

  const lineSvgs = 'M 44.84834 1.38492 L 25.17810 74.79528';

  const cornerSvgs = [
    'm35.01322,38.09014l-5.1493,-19.21651l-14.06721,0l0,14.06721l19.21651,5.1493z',
    'm15.79671,18.87363l-4.8037,-4.8037l17.58351,0l1.2874,4.8037l-14.06721,0z',
    'm15.79671,18.87363l-4.8037,-4.8037l0,17.58351l4.8037,1.2874l0,-14.06721z',
  ];

  const edgeSvgs = [
    'm35.01322,38.09014l5.1485,-19.21651l-10.2978,0l5.1493,19.21651z',
    'm40.16172,18.87363l1.2874,-4.8037l-12.8726,0l1.2874,4.8037l10.2978,0z',
  ];

  const rotatePoint = '35.01322 38.0901';

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

  const defaultValRef = useRef(defaultVal)


  const addEdge = () => {
    if (reg + 30 > 360) {
      message.warning('可用角度已满').then();
      return;
    }

    if (edge >= 8) {
      message.warning('最多只能有8个棱块').then();
      return;
    }

    for (let i = 0; i < edgeSvgs.length; i++) {
      svgPoints.push({
        key: 'edge' + num + '_' + i,
        d: edgeSvgs[i],
        baseRotate: reg + 30,
        transform: baseReg,
        transformPoint: rotatePoint,
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
      message.warning('可用角度已满').then();
      return;
    }

    if (corner >= 6) {
      message.warning('最多只能有6个角块').then();
      return;
    }
    for (let i = 0; i < cornerSvgs.length; i++) {
      svgPoints.push({
        key: 'corner' + num + '_' + i,
        d: cornerSvgs[i],
        baseRotate: reg + 90,
        transform: baseReg,
        transformPoint: rotatePoint,
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
    setDefaultVal('')
  };

  const resetBaseReg = (e: number) => {
    setBaseReg(e);
    for (let i = 0; i < svgPoints.length; i++) {
      svgPoints[i].transform = e;
    }
    setSvgPoints(svgPoints);
  };

  const removeHandler = () => {
    if (!cubes || cubes.length === 0) {
      message.warning('无可用删除').then();
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
    setDefaultVal('')
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
            transformPoint: rotatePoint,
            transform: 0,
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

    let curNum = num
    for (let i = 0; i < v.length; i++) {
      const d = v[i];
      if (d === 'e') {
        for (let i = 0; i < edgeSvgs.length; i++) {
          newSvgPoints.push({
            key: 'edge' + curNum + '_' + i,
            d: edgeSvgs[i],
            baseRotate: curReg + 30,
            transform: baseReg,
            transformPoint: rotatePoint,
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
            transform: baseReg,
            transformPoint: rotatePoint,
          });
        }
        curReg += 60;
        curCorner += 1;
        curCubes.push('corner');
      }
      curNum += 1
    }

    setReg(curReg);
    setSvgPoints(newSvgPoints)
    setEdge(curEdge);
    setCorner(curCorner);
    setCubes(curCubes);
    setNum(curNum)
    setDefaultVal(e)
  };

  useEffect(() => {
    resetLineReg(30);

    let opt: any[] = [];
    opt.push({value: '', label: '-无-'})
    cspMap.forEach((value: string, key: string) => {
      opt.push({
        value: key,
        label: key,
      });
    });
    setCpsOpt(opt);

    setDefault('星 Star');

    console.log(svgPoints)
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
              <Form.Item label="旋转">
                <Slider defaultValue={0} step={30} min={0} max={180} onChange={resetBaseReg} />
              </Form.Item>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Space>
                <Form.Item label="中轴线" style={{ marginBottom: 0 }}>
                  <Select
                    defaultValue={30}
                    onChange={resetLineReg}
                    options={[
                      { value: 0, label: '无' },
                      { value: 30, label: '正15度' },
                      { value: -30, label: '负15度' },
                    ]}
                    style={{width: 100}}
                  />
                </Form.Item>

                <Form.Item label="预设值" style={{ marginBottom: 0 }}>
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
                重置
              </Button>
              <Button
                onClick={removeHandler}
                key={'removeHandler_button'}
                style={{ marginLeft: 10 }}
                disabled={!(cubes.length > 0)}
              >
                删除
              </Button>
              <Button
                onClick={addCorner}
                key={'addCorner_button'}
                style={{ marginLeft: 10 }}
                disabled={!(corner < 6 && reg + 60 <= 360)}
              >
                添加角
              </Button>
              <Button
                onClick={addEdge}
                style={{ marginLeft: 10 }}
                key={'addEdge_button'}
                disabled={!(edge < 8 && reg + 30 <= 360)}
              >
                添加棱
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default Sq1Draw;
