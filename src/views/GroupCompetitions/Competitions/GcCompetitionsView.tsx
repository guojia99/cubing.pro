"use client";

import "antd/dist/reset.css";

import { Input, Table } from "antd";
import { PageHeader, Surface } from "@/components/ui/page";
import "../competition-ui.css";
import type { TablePaginationConfig } from "antd";
import { useCallback, useEffect, useState } from "react";

import { CompsTableColumns } from "@/components/Data/cube_comps/comps_tables";
import type { Comp } from "@/components/Data/types/comps";
import { rowClassNameWithStyleLines } from "@/components/Table/table_style";
import { apiComps } from "@/services/cubing-pro/comps/comps";
import { useI18n } from "@/contexts/I18nProvider";


export function GcCompetitionsView() {
  const { t } = useI18n();
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
    <div className="competition-page">
      <PageHeader eyebrow={t('competitionAdmin.competition')} title={t('competitionAdmin.competitionList')} />
      <div className="competition-toolbar">
        <Input.Search
          placeholder={t('competitionAdmin.searchCompetition')}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onSearch={handleSearch}
          allowClear
          enterButton
        />
      </div>
      <Surface p={{ base: "3", md: "5" }}>
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
      </Surface>
    </div>
  );
}
