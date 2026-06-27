"use client";

import "antd/dist/reset.css";

import { Input, Table, Typography } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

import { PlayerLink } from "@/components/Link/GcLinks";
import { WCALink } from "@/components/Link/WcaLinks";
import { rowClassNameWithStyleLines } from "@/components/Table/table_style";
import { apiPlayers } from "@/services/cubing-pro/players/players";
import type { PlayersAPI } from "@/services/cubing-pro/players/typings";

const { Title } = Typography;

const columns: ColumnsType<PlayersAPI.Player> = [
  {
    title: "CubeID",
    dataIndex: "CubeID",
    key: "CubeID",
    width: 150,
    render: (value: string, player) => PlayerLink(player.CubeID, value, "var(--foreground)"),
  },
  {
    title: "名称",
    dataIndex: "Name",
    key: "Name",
    render: (_value, player) => PlayerLink(player.CubeID, player.Name, "var(--accent)"),
  },
  {
    title: "WcaID",
    dataIndex: "WcaID",
    key: "WcaID",
    width: 150,
    render: (value: string) => WCALink(value),
  },
];

export function GcPlayersView() {
  const [tableParams, setTableParams] = useState({ page: 1, size: 20, name: "" });
  const [players, setPlayers] = useState<PlayersAPI.Player[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState("");

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const value = await apiPlayers(tableParams);
      setPlayers(value.data.items);
      setTotal(value.data.total);
    } finally {
      setLoading(false);
    }
  }, [tableParams]);

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  const handleSearch = () => {
    setTableParams((prev) => ({ ...prev, page: 1, name: searchName }));
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setTableParams((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      size: pagination.pageSize ?? 20,
    }));
  };

  return (
    <>
      <Title level={2} style={{ marginBottom: 16 }}>
        选手列表
      </Title>
      <div style={{ marginBottom: 16, maxWidth: 400 }}>
        <Input.Search
          placeholder="搜索选手名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onSearch={handleSearch}
          allowClear
          enterButton
        />
      </div>
      <Table<PlayersAPI.Player>
        columns={columns}
        dataSource={players}
        rowKey="CubeID"
        loading={loading}
        rowClassName={rowClassNameWithStyleLines}
        pagination={{
          current: tableParams.page,
          pageSize: tableParams.size,
          total,
          showQuickJumper: true,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
        sticky
      />
    </>
  );
}
