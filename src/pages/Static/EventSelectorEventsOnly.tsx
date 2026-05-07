import { BorderOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';

/** 仅项目多选：无年龄、国家；交互与 EventSelector 一致 */
interface EventSelectorEventsOnlyProps {
  events: string[];
  onConfirm: (selectedEvents: string[]) => void;
}

/** 可选项目集合是否变化（忽略父组件每次传入的新数组引用） */
function eventsCatalogSignature(list: string[]): string {
  return [...list].sort().join('\0');
}

const EventSelectorEventsOnly: React.FC<EventSelectorEventsOnlyProps> = ({ events, onConfirm }) => {
  const catalogSig = useMemo(() => eventsCatalogSignature(events), [events]);
  const [selectingEvents, setSelectingEvents] = useState<string[]>(() => [...events]);

  // 仅当「可选项目」集合内容变化时同步；不依赖 events 引用，避免父组件重渲染后误重置勾选
  useEffect(() => {
    setSelectingEvents((prev) => {
      const allowed = new Set(events);
      const kept = prev.filter((e) => allowed.has(e));
      if (kept.length > 0) return kept;
      return [...events];
    });
  }, [catalogSig]);

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

  const handleSelectAll = () => {
    setSelectingEvents([...events]);
  };

  const handleUnselectAll = () => {
    setSelectingEvents([]);
  };

  const handleSetWithPresets = (name: string) => {
    const ps = presets.get(name);
    if (ps) {
      setSelectingEvents(ps.filter((e) => events.includes(e)));
    }
  };

  const handleUpdateTable = () => {
    onConfirm(selectingEvents);
  };

  return (
    <Card style={{ marginBottom: '20px' }}>
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
            <Button key={presetName} size="small" onClick={() => handleSetWithPresets(presetName)}>
              {presetName}
            </Button>
          ))}
        </Space>

        <div style={{ fontSize: '14px' }}>
          已选择{' '}
          <Tag color="blue">
            {selectingEvents.length}/{events.length}
          </Tag>{' '}
          个项目
        </div>
      </div>

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
              {CubeIcon(event, `${event}__label`, {})}
            </Checkbox>
          </div>
        ))}
      </div>

      <Button type="primary" onClick={handleUpdateTable} size="small" style={{ float: 'right' }}>
        提交
      </Button>
      <div style={{ clear: 'both' }} />
    </Card>
  );
};

export default EventSelectorEventsOnly;
