import { CheckOutlined } from '@ant-design/icons';
import { Button, Divider, Popover } from 'antd';
import React, { useEffect, useState } from 'react';
import { SketchPicker } from 'react-color';
import {FormattedMessage} from "@@/exports";


export interface ColorPaletteProps {
  onSelectColor: (key: string, color: string) => void;
  presetColors?: string[];
  storageKey?: string;
  allKeys?: string[];
}

function getInvertedColor(hexColor: string): string {
  let hex = hexColor.replace(/^#/, '');

  // 支持 3 位颜色：#abc → #aabbcc
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const ir = (255 - r).toString(16).padStart(2, '0');
  const ig = (255 - g).toString(16).padStart(2, '0');
  const ib = (255 - b).toString(16).padStart(2, '0');

  return `#${ir}${ig}${ib}`;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({
  onSelectColor,
  presetColors = [],
  storageKey = 'color-history',
  allKeys = [],
}) => {
  const [selectedColor, setSelectedColor] = useState<string>();
  const [historyColors, setHistoryColors] = useState<string[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  // 选择颜色
  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
  };

  // 处理自定义颜色选择
  const handleCustomColor = (color: any) => {
    const newColor = color.hex;
    setSelectedColor(newColor);
    setPickerVisible(false);

    const updatedHistory = [newColor, ...historyColors.filter((c) => c !== newColor)].slice(0, 14);
    setHistoryColors(updatedHistory);
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
  };

  const resetColors = () => {
    for (let i = 0; i < allKeys.length; i++) {
      if (allKeys[i].includes("fonts")){
        onSelectColor(allKeys[i], '#000');
      } else {
        onSelectColor(allKeys[i], '#777');
      }
    }
  };

  // 加载历史颜色
  useEffect(() => {
    const storedColors = JSON.parse(localStorage.getItem(storageKey) as string) || [];
    setHistoryColors(storedColors);
    resetColors();
  }, []);

  useEffect(() => {
    const handleSvgClick = (event: any) => {
      const key = event.srcElement.getAttribute('data-key');
      if (!key) return;

      if (key.includes("disable")){
        return;
      }

      if (!key.includes(storageKey)) {
        return;
      }

      if (!selectedColor) {
        // message.warning(intl.formatMessage({ id: 'draws.color.select_color' })).then();
        return;
      }
      if (key) {
        onSelectColor(key, selectedColor);
      }

      const unbindKey = event.srcElement.getAttribute('uncolor-data-key');
      if (unbindKey){
        console.log("unbindKey", unbindKey, getInvertedColor(selectedColor), selectedColor)
        onSelectColor(unbindKey, getInvertedColor(selectedColor))
      }

    };

    document.addEventListener('click', handleSvgClick);
    return () => {
      document.removeEventListener('click', handleSvgClick);
    };
  }, [selectedColor, onSelectColor]);

  // 渲染颜色块
  const renderColorBlock = (color: string) => {
    const isTransparent = color === '#00000000';

    return (
      <div
        key={color}
        className="color-block"
        style={{
          backgroundColor: isTransparent ? 'transparent' : color,
          width: 32,
          height: 32,
          borderRadius: 4,
          margin: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: selectedColor === color ? '2px solid black' : '2px solid #ccc',
          backgroundImage: isTransparent
            ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
            : 'none',
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 4px 4px',
        }}
        onClick={() => handleSelectColor(color)}
      >
        {selectedColor === color && (
          <CheckOutlined style={{ color: isTransparent ? 'black' : 'white' }} />
        )}
      </div>
    );
  };

  // @ts-ignore
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* 预设颜色 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 7 }}>
        {presetColors.map(renderColorBlock)}
      </div>

      <Divider style={{ borderColor: '#7cb305' }} dashed>
        <FormattedMessage id="draws.color.custom_color" />
      </Divider>
      {/* 历史颜色 */}
      {historyColors.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 7 }}>
          {historyColors.map(renderColorBlock)}
        </div>
      )}

      {/* 自定义颜色 */}
      <Popover
        content={<SketchPicker color={selectedColor} onChangeComplete={handleCustomColor} />}
        trigger="click"
        visible={pickerVisible}
        onVisibleChange={setPickerVisible}
      >
        <Button><FormattedMessage id="draws.color.select_custom_color" /></Button>
      </Popover>

      <Divider style={{ borderColor: '#7cb305' }} dashed></Divider>

      <Button onClick={resetColors}><FormattedMessage id="draws.color.reset_color" /></Button>
    </div>
  );
};

export default ColorPalette;
