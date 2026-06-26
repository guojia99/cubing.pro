"use client";

import "antd/dist/reset.css";

import { Divider, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";

import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import { CubesCn } from "@/components/CubeIcon/cube";
import { eventRouteM } from "@/components/Data/cube_result/event_route";
import { apiEvents } from "@/services/cubing-pro/events/events";
import type { EventsAPI } from "@/services/cubing-pro/events/typings";

const columns: ColumnsType<EventsAPI.Event> = [
  {
    title: "Icon",
    dataIndex: "icon",
    key: "icon",
    render: (_value, event) => CubeIcon(event.name, event.name, {}),
  },
  {
    title: "名",
    dataIndex: "id",
    key: "id",
    render: (value: string) => CubesCn(value),
  },
  {
    title: "项目类型",
    dataIndex: "base_route_typ",
    key: "base_route_typ",
    render: (value: number) => eventRouteM(value).name,
  },
  {
    title: "别名",
    dataIndex: "otherNames",
    key: "otherNames",
    render: (value: string) => {
      const data = value.split(";");
      return (
        <>
          {data.map((name) => (
            <div
              key={name}
              style={{ display: "inline-block", minWidth: 100, width: 100 }}
            >
              {name}
            </div>
          ))}
        </>
      );
    },
  },
  {
    title: "打乱",
    dataIndex: "scrambleValue",
    key: "scrambleValue",
    render: (_value, event) => {
      if (!event.scrambleValue && !event.autoScrambleKey) {
        return event.id;
      }
      if (event.autoScrambleKey) {
        return event.autoScrambleKey;
      }
      const data = event.scrambleValue.split(",");
      return (
        <>
          {data.map((item) => (
            <div key={item} style={{ display: "inline-block", minWidth: 100, width: 100 }}>
              {item}
            </div>
          ))}
        </>
      );
    },
  },
];

export function GcEventsView() {
  const [events, setEvents] = useState<EventsAPI.Event[]>([]);

  useEffect(() => {
    apiEvents().then((value) => {
      const data = value.data.Events.filter((event) => event.isComp);
      setEvents(data);
    });
  }, []);

  const wca = useMemo(() => events.filter((event) => event.isWCA), [events]);
  const notWca = useMemo(() => events.filter((event) => !event.isWCA), [events]);

  return (
    <>
      <Divider titlePlacement="start">
        <h4>
          <strong>WCA项目</strong>
        </h4>
      </Divider>
      <Table dataSource={wca} columns={columns} pagination={false} rowKey="id" />
      <Divider titlePlacement="start">
        <h4>
          <strong>趣味项目</strong>
        </h4>
      </Divider>
      <Table dataSource={notWca} columns={columns} pagination={false} rowKey="id" />
    </>
  );
}
