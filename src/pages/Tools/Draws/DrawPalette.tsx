import ColorPalette from '@/pages/Tools/Draws/ColorPalette';
import { getIntl } from '@@/exports';
import { DownloadOutlined, FileImageOutlined, FileJpgOutlined } from '@ant-design/icons';
import { Card, Col, Divider, Input, Row, Slider } from 'antd';
import html2canvas from 'html2canvas';
import React, { useEffect, useRef, useState } from 'react';

const intl = getIntl();
export type pathSvg = {
  key: string;

  d?: string; // path
  points?: string; // polygon
  line?: {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  };

  disableStrokeWidth?: boolean;

  type?: string; // path, polygon
  disableDrawing?: boolean;

  baseRotate?: number; // 初始角度
  rotate?: number; // 额外添加的角度
  rotatePoint?: string; // 角度旋转矛点
  translate?: number[]; // 平移

  transformStr?: string; // 强制使用字符串，以上均无效

  // 绑定的反色文字
  unColorBindKey?: string; // 使用该key，可以让绑定该key内容反色

  // 文字
  text?: string;
  textSize?: number;
  textPoint?: number[];
  textRouteResetPoint?: number[];

  disShow?: boolean; // 隐藏
};

interface DrawPaletteProps {
  presetColors?: string[];
  storageKey?: string;
  svgPoints: pathSvg[];
  viewBox: string;
  strokeWidthNum: number;

  buttons?: JSX.Element;

  width?: number;
  height?: number;
}

const getFormattedDate = (): string => {
  const now = new Date();

  const year = now.getFullYear().toString().slice(2); // 获取年份的最后两位
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 获取月份，补充为2位
  const day = now.getDate().toString().padStart(2, '0'); // 获取日期，补充为2位
  const hours = now.getHours().toString().padStart(2, '0'); // 获取小时，补充为2位
  const minutes = now.getMinutes().toString().padStart(2, '0'); // 获取分钟，补充为2位
  const seconds = now.getSeconds().toString().padStart(2, '0'); // 获取秒，补充为2位

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
};

const DrawPalette: React.FC<DrawPaletteProps> = ({
  presetColors = [],
  storageKey = 'color-history',
  svgPoints = [],
  viewBox,
  strokeWidthNum = 1,
  buttons = [],
  width = 400,
  height = 400,
}) => {
  const [colors, setColors] = useState({});
  const [keys, setKeys] = useState<string[]>([]);
  const svgRef = useRef(null);
  const [downloadName, setDownloadName] = useState<string>();
  const [strokeWidth, setStrokeWidth] = useState(1);
  const handleColrChange = (key: string, color: string) => {
    console.log(key, color);
    setColors((prevColors) => ({
      ...prevColors,
      [key]: color,
    }));
  };

  useEffect(() => {
    console.log('colors', colors);
  }, [colors]);

  const handleSvgDownload = () => {
    const svg = svgRef.current;
    // @ts-ignore
    const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const a = document.createElement('a');
    a.href = svgUrl;
    if (downloadName) {
      a.download = downloadName + '.svg';
    } else {
      a.download = storageKey + '_' + getFormattedDate() + '.svg';
    }
    a.click();
    URL.revokeObjectURL(svgUrl);
  };

  const handleImageDownload = async (format: string = 'png') => {
    // if (!svgRef.current) return;

    // 克隆 SVG 并放入 wrapper
    const wrapper = document.createElement('div');
    // @ts-ignore
    const clonedSvg = svgRef.current.cloneNode(true) as SVGElement;
    wrapper.appendChild(clonedSvg);
    document.body.appendChild(wrapper);

    // 获取 SVG 的实际尺寸
    const { width, height } = clonedSvg.getBoundingClientRect();

    // 生成 canvas，移除背景色
    const canvas = await html2canvas(wrapper, {
      backgroundColor: null, // 透明背景
      width, // 只截取 SVG 的宽度
      height, // 只截取 SVG 的高度
      scale: 2, // 提高图片质量
    });

    document.body.removeChild(wrapper); // 清理 DOM

    // 生成下载链接
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/' + format);
    link.download = `${downloadName || `${storageKey}_${getFormattedDate()}`}.${format}`;
    link.click();
  };

  useEffect(() => {
    const keys: string[] = [];
    for (let i = 0; i < svgPoints.length; i++) {
      const key = storageKey + '-' + svgPoints[i].key;
      let cs = '#777';
      // @ts-ignore
      if (colors[key] === undefined) {
        if (key.includes('fonts')) {
          cs = '#000';
        }
        // @ts-ignore
        colors[key] = cs;
      }
      keys.push(key);
    }
    setColors(colors);
    setKeys(keys);
    console.log(keys);
  }, [JSON.stringify(svgPoints)]);

  const buildTransform = (elem: pathSvg) => {
    if (elem.transformStr) return elem.transformStr;
    const parts: string[] = [];
    if (elem.translate?.length) parts.push(`translate(${elem.translate.join(' ')})`);
    if (elem.rotatePoint) {
      const angle = (elem.baseRotate ?? 0) + (elem.rotate ?? 0);
      parts.push(`rotate(${angle} ${elem.rotatePoint})`);
    }
    return parts.join(' ');
  };

  return (
    <div>
      <Row gutter={24} align="middle">
        <Col xs={24} sm={24} md={24} lg={16} xl={16} style={{ paddingRight: 16 }}>
          <Card>
            {/*save button*/}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Input
                value={downloadName}
                onChange={(e) => setDownloadName(e.target.value)}
                placeholder={intl.formatMessage({ id: 'draws.palette.input' })}
                style={{ width: 175 }}
              />
              <DownloadOutlined
                onClick={() => handleSvgDownload()}
                style={{ cursor: 'pointer', fontSize: 24 }}
                size={30}
              />
              <FileJpgOutlined
                onClick={() => handleImageDownload('jpg')}
                style={{ cursor: 'pointer', fontSize: 24 }}
                size={30}
              />
              <FileImageOutlined
                onClick={() => handleImageDownload('png')}
                style={{ cursor: 'pointer', fontSize: 24 }}
                size={30}
              />
            </div>

            {/*svg*/}
            <div
              style={{
                padding: 20,
                display: 'flex',
                justifyContent: 'center', // 水平居中
                alignItems: 'center', // 垂直居中（可选）

                marginTop: 20,
                borderRadius: '8px',
                backgroundColor: '#fbf2f290',
                boxShadow: '0 2px 8px rgba(255, 77, 79, 0.2)',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={width}
                height={height}
                viewBox={viewBox}
                ref={svgRef}
                // style={{border: 'red 1px solid'}}
              >
                {svgPoints.map((elem: pathSvg) => {
                  let key = storageKey + '-' + elem.key;
                  const transform = buildTransform(elem);

                  if (elem.disableDrawing) {
                    key += '_disable';
                  }

                  let curStrokeWidth = strokeWidth * strokeWidthNum;
                  if (elem.disableStrokeWidth) {
                    curStrokeWidth = 0;
                  }

                  if (elem.text) {
                    const angle = (elem.baseRotate ?? 0) + (elem.rotate ?? 0);
                    const baseTransform = buildTransform(elem);

                    // 只对 text 特殊：加一个反向旋转
                    // @ts-ignore
                    const textTransform = `${baseTransform} rotate(${-angle} ${
                      // @ts-ignore
                      elem.textPoint?.[0] + elem.textRouteResetPoint?.[0]
                      // @ts-ignore
                    } ${elem.textPoint?.[1] + elem.textRouteResetPoint?.[1]})`;

                    return (
                      <text
                        // @ts-ignore
                        fill={colors[key]}
                        key={key}
                        data-key={key}
                        textAnchor="start"
                        fontFamily={'Noto Sans JP'}
                        fontSize={elem.textSize}
                        // @ts-ignore
                        x={elem.textPoint[0]}
                        // @ts-ignore
                        y={elem.textPoint[1]}
                        transform={textTransform}
                        opacity={elem.disShow ? 0 : 1}
                      >
                        {elem.text}
                      </text>
                    );
                  }

                  if (elem.d) {
                    return (
                      <path
                        // @ts-ignore
                        fill={colors[key]}
                        key={key}
                        data-key={key}
                        /* eslint-disable-next-line react/no-unknown-property */
                        uncolor-data-key={elem.unColorBindKey}
                        d={elem.d}
                        stroke={'black'}
                        strokeWidth={curStrokeWidth}
                        strokeLinejoin={'round'}
                        style={{ cursor: 'pointer' }}
                        transform={transform}
                      ></path>
                    );
                  }

                  if (elem.points) {
                    return (
                      <polygon
                        // @ts-ignore
                        fill={colors[key]}
                        key={key}
                        data-key={key}
                        points={elem.points}
                        stroke={'black'}
                        strokeWidth={curStrokeWidth}
                        strokeLinejoin={'round'}
                        style={{ cursor: 'pointer' }}
                        transform={transform}
                      ></polygon>
                    );
                  }

                  if (elem.line) {
                    return (
                      <line
                        // @ts-ignore
                        // fill={colors[key]}

                        x1={elem.line.x1}
                        x2={elem.line.x2}
                        y1={elem.line.y1}
                        y2={elem.line.y2}
                        key={key}
                        data-key={key}
                        stroke={'black'}
                        strokeWidth={curStrokeWidth}
                        strokeLinejoin={'round'}
                        style={{ cursor: 'pointer' }}
                        transform={transform}
                      ></line>
                    );
                  }

                  return <></>;
                })}
              </svg>
            </div>

            {/*add - remove*/}
            <div style={{ textAlign: 'center', marginTop: 30 }}>
              <>{buttons}</>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={24} md={24} lg={8} xl={8}>
          <div
            style={{
              padding: 20,
              display: 'flex',
              justifyContent: 'center', // 水平居中
              alignItems: 'center', // 垂直居中（可选）
            }}
          >
            <Card style={{ minWidth: 400, width: 400 }}>
              <Divider style={{ borderColor: '#7cb305' }} dashed>
                {intl.formatMessage({ id: 'draws.palette.thickness' })}
              </Divider>
              <Slider
                defaultValue={1}
                min={1}
                max={10}
                onChange={(v: number) => {
                  setStrokeWidth(v);
                }}
              />
              <Divider style={{ borderColor: '#7cb305' }} dashed>
                {intl.formatMessage({ id: 'draws.palette.color_setting' })}
              </Divider>
              <ColorPalette
                onSelectColor={handleColrChange}
                presetColors={presetColors}
                storageKey={storageKey}
                allKeys={keys}
              />
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default DrawPalette;
