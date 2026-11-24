"use client";

import "@/components/Data/table_fixed_column.css";

import { Badge, Table, Tag } from "antd";
import { Image as ChakraImage } from "@chakra-ui/react";
import type { ColumnsType } from "antd/es/table";
import NextLink from "next/link";
import { Fragment } from "react";

import type { Comp } from "@/components/Data/types/comps";
import { getThemeColors } from "@/theme/chartColors";
import { beijingDate, isGroupCompetition, publicCompetitionStatus } from "@/lib/groupCompetition";
import { parseDateTime } from "@/utils/time/data_time";
import { CompetitionEvent, CompetitionMessage } from "@/components/Data/CompetitionMessage";

const statusMessages = {
  已结束: "competitionAdmin.ended", 未开始: "competitionAdmin.upcoming", 进行中: "competitionAdmin.ongoing",
  待结束: "competitionAdmin.awaitingEnd", 审批中: "competitionAdmin.reviewing", 驳回: "competitionAdmin.rejected",
  编辑中: "competitionAdmin.draft", 禁用: "competitionAdmin.banned",
} as const;

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
    title: <CompetitionMessage name="competitionAdmin.index" />,
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
    title: <CompetitionMessage name="competitionAdmin.date" />,
    dataIndex: "CompStartTime",
    key: "CompStartTime",
    width: 130,
    render: (_text, result: Comp) => {
      if (isGroupCompetition(result)) {
        const start = beijingDate(result.CompStartTime), end = beijingDate(result.CompEndTime);
        return <CompetitionMessage name="competitionAdmin.beijingRange" params={{ start, end: end || start }} />;
      }
      const days = Math.floor((Date.parse(result.CompEndTime) - Date.parse(result.CompStartTime)) / 86400_000);
      return <>{parseDateTime(result.CompStartTime)}{days > 1 ? <>(<CompetitionMessage name="competitionAdmin.days" params={{ count: days }} />)</> : ""}</>;
    },
  },
  {
    title: <CompetitionMessage name="competitionAdmin.type" />,
    dataIndex: "Genre",
    key: "Genre",
    width: 80,
    render: (_text, result: Comp) => {
      const mp: Record<string, { label: React.ReactNode; color: string; icon?: string }> = {
        "1": { label: "WCA", color: "blue", icon: "/images/wca.svg" },
        "2": { label: <CompetitionMessage name="competitionAdmin.officialOffline" />, color: "green" },
        "3": { label: <CompetitionMessage name="competitionAdmin.officialOnline" />, color: "red" },
        "4": { label: <CompetitionMessage name="competitionAdmin.offline" />, color: "orange" },
        "5": { label: <CompetitionMessage name="competitionAdmin.online" />, color: "purple" },
      };
      const key = String(result.Genre);
      const { label, color, icon } = mp[key] ?? { label: "", color: "default" };
      return (
        <>
          <Tag color={color}>{label}</Tag>
          {icon && <ChakraImage src={icon} alt="WCA" fit="fill" style={{ width: 16, marginRight: 8 }} />}
        </>
      );
    },
  },
  {
    title: <CompetitionMessage name="competitionAdmin.name" />,
    dataIndex: "Name",
    key: "Name",
    width: 360,
    render: (_text, result: Comp) => (
      <>
        <NextLink href={`/competition/${result.id}`} style={{ color: "var(--accent)" }}>
          {result.Name}
        </NextLink>
        {result.logo && (
          <ChakraImage
            src={result.logo}
            alt={result.Name}
            fit="fill"
            style={{ width: "1em", height: "1em", marginLeft: "0.5em", verticalAlign: "middle" }}
          />
        )}
      </>
    ),
  },
  {
    title: <CompetitionMessage name="competitionAdmin.players" />,
    dataIndex: "Count",
    key: "Count",
    width: 70,
  },
  {
    title: <CompetitionMessage name="competitionAdmin.event" />,
    dataIndex: "EventMin",
    key: "EventMin",
    width: 150,
    render: (text: string, result: Comp) => {
      const l = (text ?? "").split(";");
      if (!text) {
        return <CompetitionMessage name="competitionAdmin.noEvents" />;
      }
      const body: React.ReactNode[] = [];
      for (let i = 0; i < l.length; i++) {
        body.push(
          <Fragment key={`${result.id}-event-${l[i]}-${i}`}>
            <CompetitionEvent event={l[i]} iconOnly style={{ marginLeft: "3px" }} />
          </Fragment>,
        );
        if (l[i] === "") break;
        if (i >= 4) {
          body.push(
            <Fragment key={`${result.id}-event-more`}><CompetitionMessage name="competitionAdmin.eventCount" params={{ count: l.length - 1 }} /></Fragment>,
          );
          break;
        }
      }
      return <>{body}</>;
    },
  },
  {
    title: <CompetitionMessage name="competitionAdmin.status" />,
    dataIndex: "Status",
    key: "Status",
    width: 70,
    render: (_text, result: Comp) => {
      const status = getStatusProp(result);
      const key = statusMessages[status.status as keyof typeof statusMessages];
      return <Tag color={status.color}>{key ? <CompetitionMessage name={key} /> : status.status}</Tag>;
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
