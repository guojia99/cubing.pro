import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { PlayerLink, WCALinkWithCnName } from '@/components/Link/Links';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { apiKinch, apiSeniorKinch } from '@/services/cubing-pro/statistics/sor';
import {
  KinChSorResult,
  KinChSorResultWithEvent,
  StaticAPI,
} from '@/services/cubing-pro/statistics/typings';
import { BorderOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-table';
import { Button, Card, Checkbox, Slider, Space, Tag, message, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

export type KinChProps = {
  isSenior: boolean;
};

const KinCh: React.FC<KinChProps> = ({ isSenior }) => {
  const actionRef = useRef();
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectingEvents, setSelectingEvents] = useState<string[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [age, setAge] = useState<number>(40);
  const [tableParams, setTableParams] = useState<StaticAPI.KinchReq>({
    size: 100,
    page: 1,
    age: 40,
    events: [],
  });

  const resetParams = () => {
    setTableParams({
      ...tableParams,
      events: [],
      age: 40,
    });
  };

  const baseColumns = [
    {
      title: '排名',
      dataIndex: 'Rank',
      key: 'Rank',
      width: 60,
      hideInSearch: true,
    },
    {
      title: '选手',
      dataIndex: 'Name',
      key: 'Name',
      render: (value: string, sor: KinChSorResult) => {
        if (isSenior) {
          return <>{WCALinkWithCnName(sor.wca_id, sor.WcaName)}</>;
        }
        return <>{PlayerLink(sor.CubeId, sor.PlayerName, 'rgb(29,177,236)')}</>;
      },
      hideInSearch: true,
      width: 150,
    },
    {
      title: '总分',
      dataIndex: 'Result',
      key: 'Result',
      hideInSearch: true,
      render: (value: number) => {
        return <>{value.toFixed(3)}</>;
      },
      width: 75,
    },
  ];

  let columns: any[] = baseColumns;
  for (let i = 0; i < selectedEvents.length; i++) {
    const ev = selectedEvents[i];
    columns.push({
      title: <>{CubeIcon(ev, ev + '__col', {})}</>,
      dataIndex: ev,
      key: ev,
      width: 60,
      hideInSearch: true,
      render: (value: number, sor: KinChSorResult) => {
        const filter = sor.Results.filter((value: KinChSorResultWithEvent) => {
          return value.Event === ev;
        });
        if (filter.length > 0) {
          const find = filter[0];
          if (find.Result === 0) {
            return <>-</>;
          }
          if (find.Result === 100) {
            return <Tooltip title={find.ResultString}>
              <strong style={{ color: '#f23f3f' }}>100.0</strong>
            </Tooltip>
          }
          return <Tooltip title={find.ResultString}>{find.Result.toFixed(2)}</Tooltip>;
        }
        return <>-</>;
      },
      // width: 75,
    });
  }

  // 动态加载数据
  useEffect(() => {
    apiEvents().then((value) => {
      let data = value.data.Events;
      data = data.filter((value) => {
        return value.isWCA;
      });
      let ev: string[] = [];
      for (let i = 0; i < data.length; i++) {
        ev.push(data[i].id);
      }

      setEvents(ev);
      setSelectedEvents(ev);
      setSelectingEvents(ev);
      setTableParams({
        ...tableParams,
        events: ev,
      });
    });
  }, []);

  const handleUpdateTable = () => {
    if (selectingEvents.length === 0) {
      message.warning('请选择至少一个项目！').then();
      return;
    }
    setTableParams({
      ...tableParams,
      age: age,
      events: selectingEvents,
    });
    setSelectedEvents(selectingEvents);
    // @ts-ignore
    actionRef.current?.reload();
  };

  // 全选功能
  const handleSelectAll = () => {
    setSelectingEvents([...events]);
  };

  // 取消全选
  const handleUnselectAll = () => {
    setSelectingEvents([]);
  };

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

  const handleSetWithPresets = (name: string) => {
    const ps = presets.get(name) as string[];
    setSelectingEvents([...ps])
  }

  return (
    <>
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
            <div style={{ marginBottom: '20px'}}>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>年龄: {age}岁</div>
              <Slider
                min={40}
                max={100}
                step={10}
                value={age}
                onChange={(e) => {
                  setAge(e);
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

          <Button
            type="primary"
            onClick={handleUpdateTable}
            size="small"
            style={{ float: 'right' }}
          >
            提交
          </Button>
        </Card>
      </>

      <ProTable<KinChSorResult, StaticAPI.KinchReq>
        title={() => {
          return <></>;
        }}
        onReset={resetParams}
        // @ts-ignore
        columns={columns}
        params={tableParams}
        request={async () => {
          let value = undefined;
          if (isSenior) {
            value = await apiSeniorKinch(tableParams);
          } else {
            value = await apiKinch(tableParams);
          }
          return {
            data: value.data.items,
            success: true,
            total: value.data.total,
          };
        }}
        search={false}
        pagination={{
          showQuickJumper: true,
          current: tableParams.page,
          pageSize: tableParams.size,
        }}
        onChange={(pagination) => {
          setTableParams({
            events: selectedEvents,
            age: age,
            page: pagination.current ? pagination.current : 1,
            size: pagination.pageSize ? pagination.pageSize : 20,
          });
        }}
        options={false}
        actionRef={actionRef}
        size={'small'}
        style={{ fontSize: '14px' }}
        sticky
        scroll={{ x: 'max-content' }} // 添加这行
      />
    </>
  );
};

export default KinCh;
