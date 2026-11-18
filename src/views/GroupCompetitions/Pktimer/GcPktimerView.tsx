"use client";

import "antd/dist/reset.css";
import { PageHeader, Surface } from "@/components/ui/page";
import "../competition-ui.css";

import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Card, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { CubesCn } from "@/components/CubeIcon/cube";
import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import { useI18n } from "@/contexts/I18nProvider";
import { getIntlLocale } from "@/i18n";
import { resultString, resultTimeString } from "@/components/Data/types/result";
import {
  GetPKTimer,
  type PkTimerGroupRecord,
  type PkTimerPlayer,
} from "@/services/cubing-pro/pktimer/pktimer";

export function GcPktimerView() {
  const { t, locale } = useI18n();
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
      { title: t('competitionAdmin.user'), dataIndex: "userName", key: "userName" },
      {
        title: t('competitionAdmin.single'),
        dataIndex: "best",
        key: "best",
        render: (_value, pp) => resultTimeString(pp.best),
      },
      {
        title: t('competitionAdmin.average'),
        dataIndex: "average",
        key: "average",
        render: (_value, pp) => resultTimeString(pp.average),
      },
      {
        title: t('competitionAdmin.resultList'),
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
          backgroundColor: "var(--card)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-card)",
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
      title: t('competitionAdmin.time'),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 200,
      render: (date: string) => new Date(date).toLocaleString(getIntlLocale(locale)),
    },
    {
      title: t('competitionAdmin.event'),
      key: "event",
      width: 120,
      render: (_value, record) => {
        const eventName = record.pkResults?.event?.id || record.pkResults?.event?.name;
        if (!eventName) return "-";
        return (
          <>
            {CubesCn(eventName, locale)} {CubeIcon(eventName, String(record.id), {})}
          </>
        );
      },
    },
    {
      title: t('competitionExtra.totalAttempts'),
      dataIndex: ["pkResults", "count"],
      key: "count",
      width: 100,
    },
    {
      title: t('competitionExtra.groupName'),
      dataIndex: "groupName",
      key: "groupName",
      render: (_value, record) => <Tag color="cyan">{record.groupName}</Tag>,
    },
  ];

  return (
    <div className="competition-page">
      <PageHeader eyebrow={t('competitionAdmin.history')} title={t('competitionExtra.pkRecords')} />
      <div className="competition-toolbar">
        <Space>
          <Button onClick={toggleAll}>
            {t(expandedRowKeys.length === data.length ? 'competitionExtra.collapseAll' : 'competitionExtra.expandAll')}
          </Button>
        </Space>
      </div>

      <Surface p={{ base: "3", md: "5" }}>
      <Table<PkTimerGroupRecord>
        scroll={{ x: "max-content" }}
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
              <Button type="text" size="small" aria-label={t('competitionExtra.collapseAll')} icon={<UpOutlined />} onClick={(e) => onExpand(record, e)} />
            ) : (
              <Button type="text" size="small" aria-label={t('competitionExtra.expandAll')} icon={<DownOutlined />} onClick={(e) => onExpand(record, e)} />
            ),
        }}
      />
      </Surface>
    </div>
  );
}
