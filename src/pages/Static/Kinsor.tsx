import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { PlayerLink, WCALinkWithCnName } from '@/components/Link/Links';
import EventSelector, { allEvents } from '@/pages/Static/EventSelector';
import KinchPlayerDetailModal, { getScoreColor } from '@/pages/Static/KinsorPlayerDetail';
import { apiKinch, apiSeniorKinch } from '@/services/cubing-pro/statistics/sor';
import {
  KinChSorResult,
  KinChSorResultWithEvent,
  StaticAPI,
} from '@/services/cubing-pro/statistics/typings';
import { ProTable } from '@ant-design/pro-table';
import { Card, Switch, Tag, Tooltip, Typography, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { CountryAvatar, getCountryNameByIso2 } from '@/pages/WCA/PlayerComponents/region/all_contiry';

const { Text } = Typography;

export type KinChProps = {
  isSenior: boolean;
  isCountry: boolean;

  otherDataFn: ((req: StaticAPI.KinchReq) => Promise<StaticAPI.KinchResp>) | undefined;
};

const KinCh: React.FC<KinChProps> = ({ isSenior, isCountry, otherDataFn }) => {
  const actionRef = useRef();
  const [tableParams, setTableParams] = useState<StaticAPI.KinchReq>({
    size: 100,
    page: 1,
    age: 40,
    events: [],
    country: [],
  });
  const [age, setAge] = useState<number>(40);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [useColor, setUseColor] = useState<boolean>(false);

  const [hasEvents, setHasEvents] = useState<string[]>([]);

  const resetParams = () => {
    setTableParams({
      ...tableParams,
      events: [],
      age: 40,
    });
  };

  // 弹窗
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<KinChSorResult | null>(null);

  // 打开玩家详情弹窗
  const openPlayerDetail = (player: KinChSorResult) => {
    setSelectedPlayer(player);
    setDetailModalVisible(true);
  };

  let columns: any[] = [
    {
      title: '排名',
      dataIndex: 'Rank',
      key: 'Rank',
      width: 40,
      hideInSearch: true,
    },
  ];

  if (isCountry){
    columns.push({
      title: '地区',
      dataIndex: 'CountryIso2',
      key: "CountryIso2",
      width: 100,
      render: (text: string) => {
        return (<>
          {CountryAvatar(text)} {getCountryNameByIso2(text)}
        </>)
      }
    })
  }

  columns.push(
    {
      title: '选手',
      dataIndex: 'Name',
      key: 'Name',
      render: (value: string, sor: KinChSorResult) => {
        if (isSenior || otherDataFn !== undefined) {
          return <>{WCALinkWithCnName(sor.wca_id, sor.WcaName)}</>;
        }
        return <>{PlayerLink(sor.CubeId, sor.PlayerName, 'rgb(29,177,236)')}</>;
      },
      hideInSearch: true,
      width: 100,
    },
    {
      title: '总分',
      dataIndex: 'Result',
      key: 'Result',
      hideInSearch: true,
      render: (score: number) => {
        if (useColor) {
          return (
            <Text
              style={{ color: getScoreColor(score), fontWeight: score > 0 ? 'bold' : 'normal' }}
            >
              {score > 0 ? score.toFixed(3) : '-'}
            </Text>
          );
        }
        return <>{score.toFixed(3)}</>;
      },
      width: 75,
    },
  );
  for (let i = 0; i < hasEvents.length; i++) {
    const ev = hasEvents[i];
    columns.push({
      title: <>{CubeIcon(ev, ev + '__col', {})}</>,
      dataIndex: ev,
      key: ev,
      width: 60,
      hideInSearch: true,
      render: (value: number, sor: KinChSorResult) => {
        const filter = sor.Results.filter((item: KinChSorResultWithEvent) => {
          return item.Event === ev;
        });

        if (filter.length > 0) {
          const find = filter[0];

          // 判断是否有有效成绩：Result 存在且不为 0（根据你的业务逻辑）
          const hasValidResult = find.Result !== undefined && find.Result !== 0;

          // 根据 UseSingle 决定标签文本
          const tagLabel = find.UseSingle ? '单次' : '平均';
          const tagColor = find.UseSingle ? 'green' : 'blue';

          // Tooltip 内容：原始结果字符串 + 类型标签
          const tooltipContent = (
            <>
              {find.ResultString}
              <Tag color={tagColor} style={{ marginLeft: 4 }}>
                {tagLabel}
              </Tag>
            </>
          );

          // 文字样式：无成绩时置灰
          const textStyle: React.CSSProperties = hasValidResult
            ? {}
            : { color: '#ccc', fontStyle: 'italic' };

          // 显示内容
          let displayText: React.ReactNode = '-';
          if (!hasValidResult && find.ResultString) {
            return (
              <Tooltip title={tooltipContent}>
                <span style={{ color: '#ccc' }}>0.0</span>
              </Tooltip>
            );
          }

          if (!hasValidResult) {
            return <span style={{ color: '#ccc' }}>-</span>;
          }

          // 不同颜色
          const formattedResult = find.Result.toFixed(2);
          if (useColor) {
            displayText = find.IsBest ? (
              <strong style={{ color: getScoreColor(find.Result) }}>{formattedResult}</strong>
            ) : (
              <Text style={{ color: getScoreColor(find.Result) }}>{formattedResult}</Text>
            );
          } else {
            displayText = find.IsBest ? (
              <strong style={{ color: '#b40000' }}>{formattedResult}</strong>
            ) : (
              formattedResult
            );
          }

          return (
            <Tooltip title={tooltipContent}>
              <span style={textStyle}>{displayText}</span>
            </Tooltip>
          );
        }

        // 完全没有该 event 的结果数据
        return <span style={{ color: '#ccc' }}>-</span>;
      },
    });
  }

  // 行点击事件
  const handleRowClick = (record: KinChSorResult) => {
    return {
      onClick: (e: React.MouseEvent) => {
        // 如果点击的是选手列，不触发详情弹窗
        if ((e.target as HTMLElement).closest('td')?.className?.includes('ant-table-column-name')) {
          return;
        }

        // 否则打开详情弹窗
        openPlayerDetail(record);
      },
    };
  };

  // 动态加载数据
  useEffect(() => {
    setTableParams({
      ...tableParams,
      events: allEvents,
    });
    setSelectedEvents(allEvents);
  }, []);

  // 变化时
  const handleUpdateTable = (selectEvents: string[], age?: number, country?: string[]) => {
    if (selectEvents.length === 0) {
      message.warning('请选择至少一个项目！').then();
      return;
    }
    setTableParams({
      ...tableParams,
      age: age ? age : 40,
      country: country ? country : [],
      events: selectEvents,
    });
    setAge(age ? age : 40);
    setSelectedEvents(selectEvents);
    // @ts-ignore
    actionRef.current?.reload();
  };

  return (
    <>
      <>
        <EventSelector
          events={allEvents}
          isSenior={isSenior}
          onConfirm={handleUpdateTable}
          isCountry={isCountry}
        />
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Switch
              checkedChildren="开启颜色"
              unCheckedChildren="关闭颜色"
              value={useColor}
              onChange={(e) => setUseColor(e)}
            />
          </div>
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

          if (otherDataFn !== undefined) {
            value = await otherDataFn(tableParams);
          } else if (isSenior) {
            value = await apiSeniorKinch(tableParams);
          } else {
            value = await apiKinch(tableParams);
          }

          if (value && value.data.items){
            const events: string[] = [];
            for (let i = 0; i < value.data.items.length; i++) {
              const item = value.data.items[i]

              for (let j = 0; j < item.Results.length; j++){
                events.push(item.Results[j].Event)
              }
            }
            console.log(events)
            const uniqueEvents: string[] = [...new Set(events)];
            console.log(uniqueEvents)
            setHasEvents(uniqueEvents)
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
            ...tableParams,
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
        scroll={{ x: 'max-content' }}
        onRow={handleRowClick}
      />

      {/* 玩家详细成绩弹窗 */}
      {selectedPlayer && (
        <KinchPlayerDetailModal
          visible={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          player={selectedPlayer}
          isSenior={isSenior}
        />
      )}
    </>
  );
};

export default KinCh;
