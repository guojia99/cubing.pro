import ColorPalette from '@/pages/Tools/ColorPalette';
import { DownloadOutlined, FileImageOutlined, FileJpgOutlined } from '@ant-design/icons';
import { Card, Col, Divider, Input, Row, Slider } from 'antd';
import html2canvas from 'html2canvas';
import React, { useEffect, useRef, useState } from 'react';

export type pathSvg = {
  key: string;
  d: string;

  baseRotate?: number; // 初始角度
  transform?: number; // 额外添加的角度
  transformPoint?: string; // 角度旋转矛点

  transformStr?: string; // 强制使用旋转， 上面的无效
};

interface DrawPaletteProps {
  presetColors?: string[];
  storageKey?: string;
  svgPoints: pathSvg[];
  viewBox: string;
  strokeWidthNum: number;

  buttons?: JSX.Element;
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
}) => {
  const [colors, setColors] = useState({});
  const [keys, setKeys] = useState<string[]>([]);
  const svgRef = useRef(null);
  const [downloadName, setDownloadName] = useState<string>();
  const [strokeWidth, setStrokeWidth] = useState(1);
  const handleColrChange = (key: string, color: string) => {
    setColors((prevColors) => ({
      ...prevColors,
      [key]: color,
    }));
  };

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
      // @ts-ignore
      if (colors[key] === undefined) {
        // @ts-ignore
        colors[key] = '#777';
        keys.push(key);
      }
    }
    setColors(colors);
    setKeys(keys);
  }, [JSON.stringify(svgPoints)]);

  return (
    <div>
      <Row gutter={24} align="middle">
        <Col xs={24} sm={24} md={16} lg={16} xl={16} style={{ paddingRight: 16 }}>
          <Card>
            {/*save button*/}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Input
                value={downloadName}
                onChange={(e) => setDownloadName(e.target.value)}
                placeholder="输入文件名"
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
                width={400}
                height={400}
                viewBox={viewBox}
                ref={svgRef}
              >
                {svgPoints.map((elem: pathSvg) => {
                  const key = storageKey + '-' + elem.key;
                  let transform = undefined;
                  if (elem.transformStr) {
                    transform = elem.transformStr;
                  } else if (elem.transformPoint) {
                    // @ts-ignore
                    transform = `rotate(${elem.baseRotate + elem.transform} ${
                      elem.transformPoint
                    })`;
                  }
                  return (
                    <path
                      // @ts-ignore
                      fill={colors[key]}
                      key={key}
                      data-key={key}
                      d={elem.d}
                      stroke={'black'}
                      strokeWidth={strokeWidth * strokeWidthNum}
                      strokeLinejoin={'round'}
                      style={{ cursor: 'pointer' }}
                      transform={transform}
                    ></path>
                  );
                })}
              </svg>
            </div>

            {/*add - remove*/}
            <div style={{ textAlign: 'center', marginTop: 30 }}>
              <>{buttons}</>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
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
                粗细设置
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
                颜色设置 & 点击上色
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
