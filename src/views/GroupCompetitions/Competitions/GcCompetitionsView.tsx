"use client";

import "antd/dist/reset.css";

import { Input, Table, Typography } from "antd";
import type { TablePaginationConfig } from "antd";
import { useCallback, useEffect, useState } from "react";

import { CompsTableColumns } from "@/components/Data/cube_comps/comps_tables";
import type { Comp } from "@/components/Data/types/comps";
import { rowClassNameWithStyleLines } from "@/components/Table/table_style";
import { apiComps } from "@/services/cubing-pro/comps/comps";

const { Title } = Typography;

export function GcCompetitionsView() {
  const [tableParams, setTableParams] = useState({ page: 1, size: 20, name: "" });
  const [comps, setComps] = useState<Comp[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState("");

  const loadComps = useCallback(async () => {
    setLoading(true);
    try {
      const value = await apiComps(tableParams);
      let items = [...value.data.items];
      items = items.sort((a, b) => {
        if (a.IsDone && !b.IsDone) return 1;
        if (!a.IsDone && b.IsDone) return -1;
        return 0;
      });
      for (let i = 0; i < items.length; i++) {
        items[i].Index = (tableParams.page - 1) * tableParams.size + i + 1;
      }
      setComps(items);
      setTotal(value.data.total);
    } finally {
      setLoading(false);
    }
  }, [tableParams]);

  useEffect(() => {
    void loadComps();
  }, [loadComps]);

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
        赛事列表
      </Title>
      <div style={{ marginBottom: 16, maxWidth: 400 }}>
        <Input.Search
          placeholder="搜索赛事名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onSearch={handleSearch}
          allowClear
          enterButton
        />
      </div>
      <Table<Comp>
        size="small"
        columns={CompsTableColumns}
        dataSource={comps}
        rowKey="id"
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
        scroll={{ x: "max-content" }}
        sticky
      />
    </>
  );
}
