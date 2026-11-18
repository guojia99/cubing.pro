"use client";

import "antd/dist/reset.css";

import { Table } from "antd";
import { PageHeader, SectionHeader, Surface } from "@/components/ui/page";
import "../competition-ui.css";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";

import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import { CubesCn } from "@/components/CubeIcon/cube";
import { useI18n } from "@/contexts/I18nProvider";
import { apiEvents } from "@/services/cubing-pro/events/events";
import type { EventsAPI } from "@/services/cubing-pro/events/typings";

const getColumns = (t: ReturnType<typeof useI18n>['t'], locale: ReturnType<typeof useI18n>['locale']): ColumnsType<EventsAPI.Event> => [
  {
    title: t('competitionExtra.icon'),
    dataIndex: "icon",
    key: "icon",
    render: (_value, event) => CubeIcon(event.name, event.name, {}),
  },
  {
    title: t('competitionAdmin.name'),
    dataIndex: "id",
    key: "id",
    render: (value: string) => CubesCn(value, locale),
  },
  {
    title: t('competitionExtra.eventType'),
    dataIndex: "base_route_typ",
    key: "base_route_typ",
    render: (value: number) => {
      const formats = [
        'competitionExtra.route0', 'competitionExtra.route1', 'competitionExtra.route2',
        'competitionExtra.route3', 'competitionExtra.route4', 'competitionExtra.route5',
        'competitionExtra.route6', 'competitionExtra.route7', 'competitionExtra.route8',
        'competitionExtra.route9', 'competitionExtra.route10',
      ] as const;
      return formats[value] ? t(formats[value]) : String(value);
    },
  },
  {
    title: t('competitionExtra.aliases'),
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
    title: t('competitionAdmin.scramble'),
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
  const { t, locale } = useI18n();
  const columns = getColumns(t, locale);
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
    <div className="competition-page">
      <PageHeader eyebrow={t('competitionAdmin.event')} title={t('competitionExtra.competitionEvents')} />
      <Surface p={{ base: "4", md: "6" }} mb="6">
        <SectionHeader title={t('competitionExtra.wcaEvents')} />
        <Table dataSource={wca} columns={columns} pagination={false} rowKey="id" scroll={{ x: "max-content" }} />
      </Surface>
      <Surface p={{ base: "4", md: "6" }}>
        <SectionHeader title={t('competitionExtra.funEvents')} />
        <Table dataSource={notWca} columns={columns} pagination={false} rowKey="id" scroll={{ x: "max-content" }} />
      </Surface>
    </div>
  );
}
