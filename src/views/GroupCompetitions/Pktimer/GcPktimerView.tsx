"use client";

import "antd/dist/reset.css";

import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Card, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { CubesCn } from "@/components/CubeIcon/cube";
import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import { resultString, resultTimeString } from "@/components/Data/types/result";
import {
  GetPKTimer,
  type PkTimerGroupRecord,
  type PkTimerPlayer,
} from "@/services/cubing-pro/pktimer/pktimer";

export function GcPktimerView() {
  const [data, setData] = useState<PkTimerGroupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const fetchData = async (page: number, size: number) => {
    setLoading(true);
    try {
      const res = await GetPKTimer({ page, size });
      const items = res.data?.items ?? [];
      setData(items);
      setTotal(res.data?.total ?? 0);
      setExpandedRowKeys(items.map((item) => item.id));
    } catch (error) {
      console.error("Failed to fetch PK timer data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableChange = (newPagination: { current?: number; pageSize?: number }) => {
    const current = newPagination.current ?? 1;
    const pageSize = newPagination.pageSize ?? 10;
    setPagination({ current, pageSize });
    void fetchData(current, pageSize);
  };

  const toggleAll = () => {
    if (expandedRowKeys.length === data.length) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(data.map((item) => item.id));
    }
  };

  const expandedRowRender = (record: PkTimerGroupRecord) => {
    const pkResults = record.pkResults;
    const players = pkResults?.players ?? [];
    const eventRoute = pkResults?.event?.base_route_typ ?? 0;

    const playerColumns: ColumnsType<PkTimerPlayer> = [
      { title: "玩家", dataIndex: "userName", key: "userName" },
      {
        title: "单次",
        dataIndex: "best",
        key: "best",
        render: (_value, pp) => resultTimeString(pp.best),
      },
      {
        title: "平均",
        dataIndex: "average",
        key: "average",
        render: (_value, pp) => resultTimeString(pp.average),
      },
      {
        title: "成绩列表",
        key: "results",
        render: (_value, player) => {
          const results = player.results;
          if (!results || results.length === 0) return "-";
          const d = resultString(results, eventRoute);
          if (!d || d.length === 0) return "-";
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

    return (
      <Card
        size="small"
        style={{
          margin: "8px 16px",
          backgroundColor: "var(--background)",
          borderRadius: 8,
          boxShadow: "0 2px 4px color-mix(in srgb, var(--foreground) 5%, transparent)",
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
      title: "时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 200,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "项目",
      key: "event",
      width: 120,
      render: (_value, record) => {
        const eventName = record.pkResults?.event?.name;
        if (!eventName) return "-";
        return (
          <>
            {CubesCn(eventName)} {CubeIcon(eventName, String(record.id), {})}
          </>
        );
      },
    },
    {
      title: "总把数",
      dataIndex: ["pkResults", "count"],
      key: "count",
      width: 100,
    },
    {
      title: "组名",
      dataIndex: "groupName",
      key: "groupName",
      render: (_value, record) => <Tag color="cyan">{record.groupName}</Tag>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button onClick={toggleAll}>
            {expandedRowKeys.length === data.length ? "收起所有" : "展开所有"}
          </Button>
        </Space>
      </div>

      <Table<PkTimerGroupRecord>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
        }}
        onChange={handleTableChange}
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys([...keys]),
          expandedRowRender,
          expandIcon: ({ expanded, onExpand, record }) =>
            expanded ? (
              <UpOutlined onClick={(e) => onExpand(record, e)} />
            ) : (
              <DownOutlined onClick={(e) => onExpand(record, e)} />
            ),
        }}
      />
    </div>
  );
}
