import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { PlayerLink, WCALinkWithCnName } from '@/components/Link/Links';
import KinchPlayerDetailModal, { getScoreColor } from '@/pages/Static/KinsorPlayerDetail';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { apiKinch, apiSeniorKinch } from '@/services/cubing-pro/statistics/sor';
import {
  KinChSorResult,
  KinChSorResultWithEvent,
  StaticAPI,
} from '@/services/cubing-pro/statistics/typings';
import { BorderOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-table';
import {
  Button,
  Card,
  Checkbox,
  Slider,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const { Text } = Typography;

export type KinChProps = {
  isSenior: boolean;

  otherDataFn: ((req: StaticAPI.KinchReq) => Promise<StaticAPI.KinchResp>) | undefined;
};

const KinCh: React.FC<KinChProps> = ({ isSenior, otherDataFn }) => {
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
  const [useColor, setUseColor] = useState<boolean>(false);

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
      width: 60,
      hideInSearch: true,
    },
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
      width: 150,
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
  ];
  for (let i = 0; i < selectedEvents.length; i++) {
    const ev = selectedEvents[i];
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
    setSelectingEvents([...ps]);
  };

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
            <div style={{ marginBottom: '20px' }}>
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
