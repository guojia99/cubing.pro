import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { PlayerLink } from '@/components/Link/Links';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { apiKinch } from '@/services/cubing-pro/statistics/sor';
import {
  KinChSorResult,
  KinChSorResultWithEvent,
  StaticAPI,
} from '@/services/cubing-pro/statistics/typings';
import { ProTable } from '@ant-design/pro-table';
import { Button, Card, Checkbox, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const KinCh: React.FC = () => {
  const actionRef = useRef();
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectingEvents, setSelectingEvents] = useState<string[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [tableParams, setTableParams] = useState<StaticAPI.KinchReq>({
    size: 100,
    page: 1,
    events: [],
  });

  const resetParams = () => {
    setTableParams({
      ...tableParams,
      events: [],
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
            return <strong style={{ color: '#f23f3f' }}>100.0</strong>;
          }
          return <>{find.Result.toFixed(2)}</>;
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

  const handleCheckBoxChange = (checkedValues: string[]) => {
    setSelectingEvents(checkedValues);
  };

  const handleUpdateTable = () => {
    if (selectingEvents.length === 0) {
      message.warning('请选择至少一个项目！').then();
      return;
    }
    setTableParams({
      ...tableParams,
      events: selectingEvents,
    });
    setSelectedEvents(selectingEvents);
    // @ts-ignore
    actionRef.current?.reload();
  };

  const checkboxOptions = events.map((event) => ({
    label: <>{CubeIcon(event, event + '__label', {})}</>,
    value: event, // 原始值
  }));

  return (
    <>
      <>
        <Card style={{ marginBottom: '20px'}}>
          <Checkbox.Group
            options={checkboxOptions}
            value={selectingEvents}
            onChange={handleCheckBoxChange}
          />
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
          const value = await apiKinch(tableParams);

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
            page: pagination.current ? pagination.current : 1,
            size: pagination.pageSize ? pagination.pageSize : 20,
          });
        }}
        options={false}
        actionRef={actionRef}
        size={"small"}
        style={{fontSize: "14px"}}
        sticky
      />
    </>
  );
};

export default KinCh;
