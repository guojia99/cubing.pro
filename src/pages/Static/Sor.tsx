import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { WCALinkWithCnName } from '@/components/Link/Links';
import EventSelector, { allEvents } from '@/pages/Static/EventSelector';
import { apiDiyRankingSor } from '@/services/cubing-pro/statistics/diy_ranking';
import { StaticAPI } from '@/services/cubing-pro/statistics/typings';
import { ProTable } from '@ant-design/pro-table';
import { Card, Form, Select, Tooltip, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const { Option } = Select;
export type DiyRankingSorProps = {
  keys: string;

  pages: boolean
};

const DiyRankingSor: React.FC<DiyRankingSorProps> = ({ keys , pages}) => {
  const actionRef = useRef();
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  // @ts-ignore
  const [tableParams, setTableParams] = useState<StaticAPI.apiDiyRankingSorRequest>({
    size: 100,
    page: 1,
    age: 0,
    events: allEvents,
    withSingle: false,
    withAvg: true,
  });

  const resetParams = () => {
    setTableParams({
      ...tableParams,
      events: allEvents,
      withSingle: false,
      withAvg: true,
      size: 100,
      page: 1,
      age: 0,
    });
  };

  useEffect(() => {
    setTableParams({
      ...tableParams,
      events: allEvents,
    });
    setSelectedEvents(allEvents);
  }, []);

  const handleUpdateTable = (selectEvents: string[]) => {
    if (selectEvents.length === 0) {
      message.warning('请选择至少一个项目！').then();
      return;
    }
    setTableParams({
      ...tableParams,
      events: selectEvents,
    });
    setSelectedEvents(selectEvents);
    // @ts-ignore
    actionRef.current?.reload();
  };

  const handleSelectChange = (value: string) => {
    let withSingle = false;
    let withAvg = false;

    switch (value) {
      case 'avg':
        withAvg = true;
        withSingle = false;
        break;
      case 'single':
        withAvg = false;
        withSingle = true;
        break;
      case 'both':
        withAvg = true;
        withSingle = true;
        break;
      default:
        break;
    }

    setTableParams((prev) => ({
      ...prev,
      withSingle,
      withAvg,
    }));
    // @ts-ignore
    actionRef.current?.reload();
  };

  // 根据当前状态反向映射选中值（用于受控组件）
  const getCurrentValue = () => {
    const { withAvg, withSingle } = tableParams;
    if (withAvg && !withSingle) return 'avg';
    if (!withAvg && withSingle) return 'single';
    if (withAvg && withSingle) return 'both';
    return 'avg'; // fallback to default
  };

  // 行列
  let columns: any[] = [
    {
      title: '排名',
      dataIndex: 'Rank',
      key: 'Rank',
      width: 40,
      hideInSearch: true,
    },
    {
      title: '选手',
      dataIndex: 'Name',
      key: 'Name',
      render: (value: string, sor: StaticAPI.SorResult) => {
        return <>{WCALinkWithCnName(sor.wca_id, sor.WcaName)}</>;
      },
      hideInSearch: true,
      width: 100,
    },
    {
      title: '总分',
      dataIndex: 'Sor',
      key: 'Sor',
      hideInSearch: true,
      render: (score: number) => {
        return <>{score.toFixed(0)}</>;
      },
      width: 75,
    },
  ];
  for (let i = 0; i < selectedEvents.length; i++) {
    const ev = selectedEvents[i];

    if (tableParams.withSingle) {
      columns.push({
        title: <>{CubeIcon(ev, ev + '__col_single', { color: '#51ebde' })}</>,
        width: 60,
        hideInSearch: true,
        render: (score: number, sor: StaticAPI.SorResult) => {
          const filter = sor.Results.filter((item: StaticAPI.SorResultWithEvent) => {
            return item.Event === ev && item.IsBest;
          });
          if (filter.length === 0) {
            return <span style={{ color: '#ccc' }}>-</span>;
          }
          const find = filter[0];

          if (find.ResultString === '' || find.ResultString === undefined) {
            return <span style={{ color: '#ccc' }}>{find.Rank}</span>;
          }

          if (find.Rank === 1) {
            return (
              <Tooltip title={`单次: ${find.ResultString}`}>
                <strong style={{ color: 'red' }}>{find.Rank}</strong>
              </Tooltip>
            );
          }

          return (
            <Tooltip title={`单次: ${find.ResultString}`}>
              <span style={{ color: '#000000' }}>{find.Rank}</span>
            </Tooltip>
          );
        },
      });
    }

    if (tableParams.withAvg && ev !== '333mbf') {
      columns.push({
        title: <>{CubeIcon(ev, ev + '__col_avg', { color: '#5840df' })}</>,
        width: 60,
        hideInSearch: true,
        render: (score: number, sor: StaticAPI.SorResult) => {
          const filter = sor.Results.filter((item: StaticAPI.SorResultWithEvent) => {
            return item.Event === ev && !item.IsBest;
          });
          if (filter.length === 0) {
            return <span style={{ color: '#ccc' }}>-</span>;
          }

          const find = filter[0];

          if (find.ResultString === '' || find.ResultString === undefined) {
            return <span style={{ color: '#ccc' }}>{find.Rank}</span>;
          }

          if (find.Rank === 1) {
            return (
              <Tooltip title={`平均: ${find.ResultString}`}>
                <strong style={{ color: 'red' }}>{find.Rank}</strong>
              </Tooltip>
            );
          }

          return (
            <Tooltip title={`平均: ${find.ResultString}`}>
              <span style={{ color: '#000000' }}>{find.Rank}</span>
            </Tooltip>
          );
        },
      });
    }
  }

  return (
    <>
      <>
        <EventSelector events={allEvents} isSenior={false} onConfirm={handleUpdateTable} />
        <Card style={{ marginBottom: '20px' }}>
          <Form layout="vertical">
            <Form.Item label="成绩来源">
              <Select
                value={getCurrentValue()}
                onChange={handleSelectChange}
                style={{ width: 200 }}
                placeholder="请选择成绩来源"
              >
                <Option value="avg">仅平均值</Option>
                <Option value="single">仅单次值</Option>
                <Option value="both">单次和平均</Option>
              </Select>
            </Form.Item>
          </Form>
        </Card>
      </>

      <ProTable<StaticAPI.SorResult, StaticAPI.apiDiyRankingSorRequest>
        title={() => {
          return <></>;
        }}
        onReset={resetParams}
        // @ts-ignore
        columns={columns}
        params={tableParams}
        request={async () => {
          let value = undefined;
          value = await apiDiyRankingSor(keys, tableParams);

          return {
            data: value.data.items,
            success: true,
            total: value.data.total,
          };
        }}
        search={false}
        pagination={pages ? {
          showQuickJumper: true,
          current: tableParams.page,
          pageSize: tableParams.size,
        }: false}
        onChange={(pagination) => {
          setTableParams({
            ...tableParams,
            page: pagination.current ? pagination.current : 1,
            size: pagination.pageSize ? pagination.pageSize : 20,
          });
        }}
        options={false}
        actionRef={actionRef}
        size={'small'}
        style={{ fontSize: '14px' }}
        sticky
        scroll={{ x: 'max-content' }}
      />
    </>
  );
};

export default DiyRankingSor;
