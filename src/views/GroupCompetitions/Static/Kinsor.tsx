"use client";

import "antd/dist/reset.css";

import { Card, Switch, Table, Tag, Tooltip, Typography, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import { PlayerLink } from "@/components/Link/GcLinks";
import { WCALinkWithCnName } from "@/components/Link/WcaLinks";
import { apiKinch, apiSeniorKinch } from "@/services/cubing-pro/statistics/sor";
import type {
  KinChSorResult,
  KinChSorResultWithEvent,
} from "@/services/cubing-pro/statistics/typings";
import type { StaticAPI } from "@/services/cubing-pro/statistics/typings";
import {
  CountryAvatar,
  getCountryNameByIso2,
} from "@/views/Wca/PlayerComponents/region/all_contiry";

import { EventSelector, allEvents } from "./EventSelector";
import { KinchPlayerDetailModal, getScoreColor } from "./KinsorPlayerDetail";

const { Text } = Typography;

export type KinChProps = {
  isSenior: boolean;
  isCountry: boolean;
  pages?: boolean;
  otherDataFn?: ((req: StaticAPI.KinchReq) => Promise<StaticAPI.KinchResp>) | undefined;
};

export function KinCh({ isSenior, isCountry, otherDataFn, pages = true }: KinChProps) {
  const [tableParams, setTableParams] = useState<StaticAPI.KinchReq>({
    size: 100,
    page: 1,
    age: 40,
    events: allEvents,
    country: [],
  });
  const [age, setAge] = useState<number>(40);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(allEvents);
  const [useColor, setUseColor] = useState<boolean>(false);
  const [hasEvents, setHasEvents] = useState<string[]>([]);
  const [dataSource, setDataSource] = useState<KinChSorResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<KinChSorResult | null>(null);

  const openPlayerDetail = (player: KinChSorResult) => {
    setSelectedPlayer(player);
    setDetailModalVisible(true);
  };

  const loadData = useCallback(async () => {
    if (tableParams.events.length === 0) {
      return;
    }
    setLoading(true);
    try {
      let value: StaticAPI.KinchResp | undefined;
      if (otherDataFn !== undefined) {
        value = await otherDataFn(tableParams);
      } else if (isSenior) {
        value = await apiSeniorKinch(tableParams);
      } else {
        value = await apiKinch(tableParams);
      }

      if (value?.data.items) {
        const events: string[] = [];
        for (const item of value.data.items) {
          for (const result of item.Results) {
            events.push(result.Event);
          }
        }
        setHasEvents([...new Set(events)]);
        setDataSource(value.data.items);
        setTotal(value.data.total);
      } else {
        setDataSource([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [isSenior, otherDataFn, tableParams]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleUpdateTable = (selectEvents: string[], nextAge?: number, country?: string[]) => {
    if (selectEvents.length === 0) {
      void message.warning("请选择至少一个项目！");
      return;
    }
    const resolvedAge = nextAge ?? 40;
    setTableParams((prev) => ({
      ...prev,
      age: resolvedAge,
      country: country ?? [],
      events: selectEvents,
      page: 1,
    }));
    setAge(resolvedAge);
    setSelectedEvents(selectEvents);
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setTableParams((prev) => ({
      ...prev,
      events: selectedEvents,
      age,
      page: pagination.current ?? 1,
      size: pagination.pageSize ?? prev.size,
    }));
  };

  const eventColumns = useMemo(() => {
    return hasEvents.map((ev) => ({
      title: CubeIcon(ev, `${ev}__col`, {}),
      dataIndex: ev,
      key: ev,
      width: 60,
      render: (_value: number, sor: KinChSorResult) => {
        const filter = sor.Results.filter((item: KinChSorResultWithEvent) => item.Event === ev);
        if (filter.length === 0) {
          return <span style={{ color: "var(--faint-foreground)" }}>-</span>;
        }

        const find = filter[0];
        const hasValidResult = find.Result !== undefined && find.Result !== 0;
        const tagLabel = find.UseSingle ? "单次" : "平均";
        const tagColor = find.UseSingle ? "green" : "blue";
        const tooltipContent = (
          <>
            {find.ResultString}
            <Tag color={tagColor} style={{ marginLeft: 4 }}>
              {tagLabel}
            </Tag>
          </>
        );

        if (!hasValidResult && find.ResultString) {
          return (
            <Tooltip title={tooltipContent}>
              <span style={{ color: "var(--faint-foreground)" }}>0.0</span>
            </Tooltip>
          );
        }

        if (!hasValidResult) {
          return <span style={{ color: "var(--faint-foreground)" }}>-</span>;
        }

        const formattedResult = find.Result.toFixed(2);
        let displayText: React.ReactNode;
        if (useColor) {
          displayText = find.IsBest ? (
            <strong style={{ color: getScoreColor(find.Result) }}>{formattedResult}</strong>
          ) : (
            <Text style={{ color: getScoreColor(find.Result) }}>{formattedResult}</Text>
          );
        } else {
          displayText = find.IsBest ? (
            <strong style={{ color: "var(--destructive)" }}>{formattedResult}</strong>
          ) : (
            formattedResult
          );
        }

        return <Tooltip title={tooltipContent}>{displayText}</Tooltip>;
      },
    }));
  }, [hasEvents, useColor]);

  const columns: ColumnsType<KinChSorResult> = useMemo(() => {
    const base: ColumnsType<KinChSorResult> = [
      {
        title: "排名",
        dataIndex: "Rank",
        key: "Rank",
        width: 40,
      },
    ];

    if (isCountry) {
      base.push({
        title: "地区",
        dataIndex: "CountryIso2",
        key: "CountryIso2",
        width: 100,
        render: (text: string) => (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {CountryAvatar(text)}
            {getCountryNameByIso2(text)}
          </span>
        ),
      });
    }

    base.push(
      {
        title: "选手",
        dataIndex: "Name",
        key: "Name",
        width: 100,
        render: (_value: string, sor: KinChSorResult) => {
          if (isSenior || otherDataFn !== undefined) {
            return <>{WCALinkWithCnName(sor.wca_id, sor.WcaName)}</>;
          }
          return <>{PlayerLink(sor.CubeId, sor.PlayerName, "var(--accent)")}</>;
        },
      },
      {
        title: "总分",
        dataIndex: "Result",
        key: "Result",
        width: 75,
        render: (score: number) => {
          if (useColor) {
            return (
              <Text
                style={{ color: getScoreColor(score), fontWeight: score > 0 ? "bold" : "normal" }}
              >
                {score > 0 ? score.toFixed(3) : "-"}
              </Text>
            );
          }
          return <>{score.toFixed(3)}</>;
        },
      },
    );

    return [...base, ...eventColumns];
  }, [eventColumns, isCountry, isSenior, otherDataFn, useColor]);

  return (
    <>
      <EventSelector
        events={allEvents}
        isSenior={isSenior}
        onConfirm={handleUpdateTable}
        isCountry={isCountry}
      />

      <Card style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Switch
            checkedChildren="开启颜色"
            unCheckedChildren="关闭颜色"
            checked={useColor}
            onChange={setUseColor}
          />
        </div>
      </Card>

      <Table<KinChSorResult>
        columns={columns}
        dataSource={dataSource}
        rowKey={(row) => `${row.Rank}-${row.CubeId || row.wca_id}`}
        loading={loading}
        size="small"
        pagination={
          pages
            ? {
                showQuickJumper: true,
                current: tableParams.page,
                pageSize: tableParams.size,
                total,
              }
            : false
        }
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
        sticky
        onRow={(record) => ({
          onClick: (e: React.MouseEvent) => {
            if ((e.target as HTMLElement).closest("a")) {
              return;
            }
            openPlayerDetail(record);
          },
          style: { cursor: "pointer" },
        })}
      />

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
}
