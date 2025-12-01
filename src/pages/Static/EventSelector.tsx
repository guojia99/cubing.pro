import { BorderOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Checkbox, Select, Slider, Space, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import type { SelectProps } from 'antd';
import { CountryAvatar, countryIso2ToChinese } from '@/pages/WCA/PlayerComponents/region/all_contiry';


export const allEvents = [
  '333', '222', '444', '555', '666', '777',
  'pyram', 'skewb', 'minx', 'sq1', 'clock',
  '333oh',
  '333bf', '333mbf', '444bf', '555bf',
  '333fm'
];


interface EventSelectorProps {
  events: string[]; // 所有可选项
  isSenior?: boolean; // 是否显示年龄滑块
  isCountry?: boolean; // 显示国家地区选择块
  onConfirm: (selectedEvents: string[], age?: number, country?: string[]) => void; // 提交回调
}

const EventSelector: React.FC<EventSelectorProps> = ({
  events = [],
  isSenior = false,
  isCountry= false,
  onConfirm,
}) => {
  const [selectingEvents, setSelectingEvents] = useState<string[]>([]);
  const [age, setAge] = useState<number>(40);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  useEffect(() => {
    setSelectingEvents(events)
  }, [])

  // 预设方案
  const presets = new Map<string, string[]>([
    [
      '速拧',
      ['333', '222', '444', '555', '666', '777', 'pyram', 'skewb', 'minx', 'sq1', 'clock', '333oh'],
    ],
    ['安静', ['333bf', '333mbf', '444bf', '555bf', '333fm']],
    ['盲拧', ['333bf', '333mbf', '444bf', '555bf']],
    ['正阶', ['333', '222', '444', '555', '666', '777', '333oh']],
    ['异型', ['pyram', 'skewb', 'minx', 'sq1', 'clock']],
  ]);

  // 全选
  const handleSelectAll = () => {
    setSelectingEvents([...events]);
  };

  // 取消全选
  const handleUnselectAll = () => {
    setSelectingEvents([]);
  };

  // 应用预设
  const handleSetWithPresets = (name: string) => {
    const ps = presets.get(name);
    if (ps) {
      setSelectingEvents([...ps]);
    }
  };

  // 提交
  const handleUpdateTable = () => {
    onConfirm(selectingEvents, age, selectedCountries);
  };


  const placeholderCountryText = selectedCountries.length === 0
    ? '全部国家或地区'
    : `${selectedCountries.length} 个国家已选择`;


  const countryOptions: SelectProps['options'] = Object.entries(countryIso2ToChinese).map(([code, name]) => ({
    value: code,
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {CountryAvatar(code)}
        {name} ({code})
      </div>
    ),
  }));


  return (
    <>
      <Card style={{ marginBottom: '20px' }}>
        {/* 控制按钮区域 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <Space wrap>
            <Button
              size="small"
              icon={<CheckSquareOutlined />}
              onClick={handleSelectAll}
              disabled={events.length === 0}
            >
              全选
            </Button>
            <Button
              size="small"
              icon={<BorderOutlined />}
              onClick={handleUnselectAll}
              disabled={events.length === 0}
            >
              取消全选
            </Button>
            {[...presets.keys()].map((presetName) => (
              <Button
                key={presetName}
                size="small"
                onClick={() => handleSetWithPresets(presetName)}
              >
                {presetName}
              </Button>
            ))}
          </Space>

          {/* 显示选中项目数量 */}
          <div style={{ fontSize: '14px' }}>
            已选择{' '}
            <Tag color="blue">
              {selectingEvents.length}/{events.length}
            </Tag>{' '}
            个项目
          </div>
        </div>

        {/* 复选框组 - 网格布局 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '10px',
            marginBottom: '20px',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '10px',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
          }}
        >
          {events.map((event) => (
            <div key={event} style={{ textAlign: 'center' }}>
              <Checkbox
                value={event}
                checked={selectingEvents.includes(event)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectingEvents([...selectingEvents, event]);
                  } else {
                    setSelectingEvents(selectingEvents.filter((item) => item !== event));
                  }
                }}
              >
                {CubeIcon(event, event + '__label', {})}
              </Checkbox>
            </div>
          ))}
        </div>

        {isSenior && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>年龄: {age}岁</div>
            <Slider
              min={40}
              max={100}
              step={10}
              value={age}
              onChange={(value) => {
                setAge(value);
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#999',
              }}
            >
              <span>40岁</span>
              <span>100岁</span>
            </div>
          </div>
        )}

        {isCountry && (
          <div style={{marginBottom: '20px'}}>
            <Select
              mode="multiple"
              style={{ width: '50%', marginBottom: '10px' }}
              placeholder={placeholderCountryText}
              value={selectedCountries}
              onChange={(e) => {
                setSelectedCountries(e)
              }}
              options={countryOptions}
              maxTagCount="responsive"
            />
          </div>
        )}

        <Button type="primary" onClick={handleUpdateTable} size="small" style={{ float: 'right' }}>
          提交
        </Button>
        <div style={{ clear: 'both' }} />
      </Card>
    </>
  );
};

export default EventSelector;
