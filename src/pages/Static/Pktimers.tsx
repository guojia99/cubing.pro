import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Card } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { GetPKTimer, PkTimerGroupRecord, PkTimerPlayer } from '@/services/cubing-pro/pktimer/pktimer';
import { resultString, resultTimeString } from '@/components/Data/types/result';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CubesCn } from '@/components/CubeIcon/cube';

const PKTimerTable: React.FC = () => {
  const [data, setData] = useState<PkTimerGroupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const fetchData = async (page: number, size: number) => {
    setLoading(true);
    try {
      const res = await GetPKTimer({ page, size });
      setData(res.data.items);
      setTotal(res.data.total);

      // ✅ 默认全部展开：加载完成后自动展开所有行
      setExpandedRowKeys(res.data.items.map((item) => item.id));
    } catch (error) {
      console.error('Failed to fetch PK timer data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (newPagination: any) => {
    const { current, pageSize } = newPagination;
    setPagination({ current, pageSize });
    fetchData(current, pageSize);
  };

  const toggleAll = () => {
    if (expandedRowKeys.length === data.length) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(data.map((item) => item.id));
    }
  };

  const expandedRowRender = (record: PkTimerGroupRecord) => {
    const players = record.pkResults.players;

    const playerColumns: ColumnsType<PkTimerPlayer> = [
      { title: '玩家', dataIndex: 'userName', key: 'userName' },
      {
        title: '单次',
        dataIndex: 'best',
        key: 'best',
        render: (_, pp: PkTimerPlayer) => resultTimeString(pp.best),
      },
      {
        title: '平均',
        dataIndex: 'average',
        key: 'average',
        render: (_, pp: PkTimerPlayer) => resultTimeString(pp.average),
      },
      {
        title: '成绩列表',
        key: 'results',
        render: (_, player) => {
          if (player.results.length === 0) return '-';
          const d = resultString(player.results, record.pkResults.event.base_route_typ);
          if (!d || d.length === 0) return '-';
          return (
            <>
              {d.map((time, idx) => (
                <Tag key={`${record.id}-${player.userId}-${idx}`} color="blue">
                  {time}
                </Tag>
              ))}
            </>
          );
        },
      },
    ];

    // ✅ 视觉增强：用 Card 包裹子表格，加 padding 和 border-radius
    return (
      <Card
        size="small"
        style={{
          margin: '8px 16px',
          backgroundColor: '#fafafa',
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Table
          dataSource={players}
          columns={playerColumns}
          pagination={false}
          rowKey={(player) => player.userId}
          size="small"
        />
      </Card>
    );
  };

  const columns: ColumnsType<PkTimerGroupRecord> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '项目',
      key: 'event',
      width: 120,
      render: (_, record) => (
        <>
          {CubesCn(record.pkResults.event.name)}{' '}
          {CubeIcon(record.pkResults.event.name, String(record.id), {})}
        </>
      ),
    },
    {
      title: '总把数',
      dataIndex: ['pkResults', 'count'],
      key: 'count',
      width: 100,
    },
    {
      title: '组名',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (_, record) => {
        return (<Tag color={"cyan"}>{record.groupName}</Tag>)
      }
    },
  ];


  const expandable = {
    expandedRowKeys,
    onExpandedRowsChange: setExpandedRowKeys,
    expandedRowRender,
    // @ts-ignore
    expandIcon: ({ expanded, onExpand, record }) =>
      expanded ? (
        <UpOutlined onClick={(e) => onExpand(record, e)} />
      ) : (
        <DownOutlined onClick={(e) => onExpand(record, e)} />
      ),
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button onClick={toggleAll}>
            {expandedRowKeys.length === data.length ? '收起所有' : '展开所有'}
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
        onChange={handleTableChange}
        // @ts-ignore
        expandable={expandable}
      />
    </div>
  );
};

export default PKTimerTable;
