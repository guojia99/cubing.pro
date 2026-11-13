"use client";

import "@/components/Data/table_fixed_column.css";

import { Badge, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import NextLink from "next/link";
import { Fragment } from "react";

import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import type { Comp } from "@/components/Data/types/comps";
import { getThemeColors } from "@/theme/chartColors";
import { beijingDate, isGroupCompetition, publicCompetitionStatus } from "@/lib/groupCompetition";
import { parseDateTime } from "@/utils/time/data_time";

export function getStatusProp(result: Comp) {
  const theme = getThemeColors();
  const now = Date.now();
  const status = publicCompetitionStatus(result, now);
  let color = "default";

  switch (result.Status) {
    case "Running":
      if (status === "已结束") {
        color = theme.faintForeground;
        break;
      }
      if (status === "未开始") {
        color = theme.signalInfo;
      } else if (status === "进行中") {
        color = theme.signalSuccess;
      } else {
        color = theme.signalWarning;
      }
      break;
    case "Reviewing":
      color = theme.signalWarning;
      break;
    case "Reject":
      color = theme.destructive;
      break;
    case "Temporary":
      color = theme.accent;
      break;
    case "Ban":
      color = theme.foreground;
      break;
  }

  return { status, color };
}

export const CompsTableColumns: ColumnsType<Comp> = [
  {
    title: "序号",
    dataIndex: "Index",
    key: "Index",
    width: 65,
    render: (value: number, result: Comp) => {
      const status = getStatusProp(result);
      return (
        <div style={{ textAlign: "center" }}>
          <Badge color={status.color} size="medium" style={{ marginRight: 10 }} />
          {value}
        </div>
      );
    },
  },
  {
    title: "日期",
    dataIndex: "CompStartTime",
    key: "CompStartTime",
    width: 130,
    render: (_text, result: Comp) => {
      if (isGroupCompetition(result)) {
        const start = beijingDate(result.CompStartTime), end = beijingDate(result.CompEndTime);
        return <>{start}{end && end !== start ? ` 至 ${end}` : ""}（北京）</>;
      }
      const days = Math.floor((Date.parse(result.CompEndTime) - Date.parse(result.CompStartTime)) / 86400_000);
      return <>{parseDateTime(result.CompStartTime)}{days > 1 ? `(${days}天)` : ""}</>;
    },
  },
  {
    title: "类型",
    dataIndex: "Genre",
    key: "Genre",
    width: 80,
    render: (_text, result: Comp) => {
      const mp: Record<string, { label: string; color: string; icon?: string }> = {
        "1": { label: "WCA", color: "blue", icon: "https://cubing.com/f/images/wca.png" },
        "2": { label: "线下正式赛", color: "green" },
        "3": { label: "线上正式赛", color: "red" },
        "4": { label: "线下赛", color: "orange" },
        "5": { label: "线上赛", color: "purple" },
      };
      const key = String(result.Genre);
      const { label, color, icon } = mp[key] ?? { label: "", color: "default" };
      return (
        <>
          <Tag color={color}>{label}</Tag>
          {icon && <img src={icon} alt="icon" style={{ width: 16, marginRight: 8 }} />}
        </>
      );
    },
  },
  {
    title: "名称",
    dataIndex: "Name",
    key: "Name",
    width: 360,
    render: (_text, result: Comp) => (
      <>
        <NextLink href={`/competition/${result.id}`} style={{ color: "var(--ant-color-link)" }}>
          {result.Name}
        </NextLink>
        {result.logo && (
          <img
            src={result.logo}
            alt="logo"
            style={{ width: "1em", height: "1em", marginLeft: "0.5em", verticalAlign: "middle" }}
          />
        )}
      </>
    ),
  },
  {
    title: "人数",
    dataIndex: "Count",
    key: "Count",
    width: 70,
  },
  {
    title: "项目",
    dataIndex: "EventMin",
    key: "EventMin",
    width: 150,
    render: (text: string, result: Comp) => {
      const l = (text ?? "").split(";");
      if (!text) {
        return <>暂无项目</>;
      }
      const body: React.ReactNode[] = [];
      for (let i = 0; i < l.length; i++) {
        body.push(
          <Fragment key={`${result.id}-event-${l[i]}-${i}`}>
            {CubeIcon(l[i], `comp_icon_key${result.id}-${l[i]}`, { marginLeft: "3px" })}
          </Fragment>,
        );
        if (l[i] === "") break;
        if (i >= 4) {
          body.push(
            <Fragment key={`${result.id}-event-more`}> 等共{l.length - 1}个项目</Fragment>,
          );
          break;
        }
      }
      return <>{body}</>;
    },
  },
  {
    title: "状态",
    dataIndex: "Status",
    key: "Status",
    width: 70,
    render: (_text, result: Comp) => {
      const status = getStatusProp(result);
      return <Tag color={status.color}>{status.status}</Tag>;
    },
  },
];

export function CompsTable(dataSource: Comp[], keys: string[]) {
  const columns: ColumnsType<Comp> = [];
  for (const key of keys) {
    const col = CompsTableColumns.find((c) => c.key === key);
    if (col) columns.push(col);
  }
  if (columns.length > 0) {
    columns[0] = { ...columns[0], fixed: "left" as const };
  }
  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      size="small"
      className="cube-comps-table"
      scroll={{ x: "max-content" }}
      rowKey="id"
    />
  );
}
