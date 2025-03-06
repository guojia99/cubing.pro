import { CheckOutlined } from '@ant-design/icons';
import { Button, Divider, message, Popover } from 'antd';
import React, { useEffect, useState } from 'react';
import { SketchPicker } from 'react-color';

export interface ColorPaletteProps {
  onSelectColor: (key: string, color: string) => void;
  presetColors?: string[];
  storageKey?: string;
  allKeys?: string[];
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
      onSelectColor(allKeys[i], '#777');
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

      if (key === 'disable'){
        return;
      }


      if (!key.includes(storageKey)) {
        return;
      }

      if (!selectedColor) {
        message.warning('选择一个颜色').then();
        return;
      }
      if (key && selectedColor) {
        onSelectColor(key, selectedColor);
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
        自定义颜色
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
        <Button>选择自定义颜色</Button>
      </Popover>

      <Divider style={{ borderColor: '#7cb305' }} dashed></Divider>

      <Button onClick={resetColors}>重置颜色</Button>
    </div>
  );
};

export default ColorPalette;
