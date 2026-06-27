"use client";

import { CubesCn } from "@/components/CubeIcon/cube";
import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import { RecordsTable } from "@/components/Data/cube_record/record_tables";
import type { Record } from "@/components/Data/types/record";
import { apiEvents } from "@/services/cubing-pro/events/events";
import type { EventsAPI } from "@/services/cubing-pro/events/typings";
import { apiPublicCompGroups } from "@/services/cubing-pro/public/orgs";
import { apiRecords } from "@/services/cubing-pro/statistics/records";
import { Select } from "antd";
import { useEffect, useState } from "react";

export type RecordsWithEventsProps = {
  groupId: number;
  eventId: string;
  onGroupIdChange: (id: number) => void;
  onEventIdChange: (id: string) => void;
};

export function RecordsWithEvents({
  groupId,
  eventId,
  onGroupIdChange,
  onEventIdChange,
}: RecordsWithEventsProps) {
  const [events, setEvents] = useState<EventsAPI.Event[]>([]);
  const [orgItems, setOrgItems] = useState<{ label: string; key: string; value: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [records, setRecords] = useState<Record[]>([]);

  const fetchRecords = () => {
    setLoading(true);
    apiRecords({
      GroupId: groupId === 0 ? "" : String(groupId),
      EventId: eventId || "333",
    })
      .then((value) => {
        if (value.data.Records) {
          setRecords(value.data.Records);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    apiEvents().then((value) => {
      setEvents(value.data.Events);
    });

    apiPublicCompGroups().then((value) => {
      const ite = [
        {
          label: "CubingPro",
          key: "CubingPro",
          value: 0,
        },
      ];

      if (value.data?.items) {
        for (const item of value.data.items) {
          ite.push({
            label: item.name,
            key: item.name,
            value: item.id,
          });
        }
      }
      setOrgItems(ite);
    });
  }, []);

  useEffect(() => {
    if (events.length === 0) {
      return;
    }
    const comp = events.filter((e) => e.isComp);
    if (comp.length === 0) {
      return;
    }
    if (!comp.some((e) => e.id === eventId)) {
      onEventIdChange(comp[0].id);
    }
  }, [events, eventId, onEventIdChange]);

  useEffect(() => {
    if (orgItems.length === 0) {
      return;
    }
    if (!orgItems.some((o) => o.value === groupId)) {
      onGroupIdChange(0);
    }
  }, [orgItems, groupId, onGroupIdChange]);

  const GroupChildren = (list: EventsAPI.Event[]) => {
    return list.map((item) => ({
      key: item.id,
      value: item.id,
      label: (
        <>
          {CubeIcon(item.id, `${item.id}__menu`, {})} {CubesCn(item.id)}
        </>
      ),
    }));
  };

  useEffect(() => {
    fetchRecords();
  }, [eventId, groupId]);

  const items = [
    {
      label: "WCA项目",
      title: "WCA项目",
      options: GroupChildren(events.filter((value) => value.isWCA && value.isComp)),
    },
    {
      label: "趣味项目",
      title: "趣味项目",
      options: GroupChildren(events.filter((value) => !value.isWCA && value.isComp)),
    },
  ];

  const rc = [...records];
  for (let i = 0; i < rc.length; i++) {
    rc[i].Index = rc.length - i;
  }

  return (
    <>
      <h3 style={{ textAlign: "center" }}>
        <strong>历史记录</strong>
      </h3>

      <Select
        value={eventId}
        style={{ marginBottom: "20px", width: "150px" }}
        loading={loading}
        options={items}
        onChange={(value) => onEventIdChange(value)}
      />

      <Select
        value={groupId}
        style={{ marginBottom: "20px", marginLeft: "20px", width: "150px" }}
        loading={loading}
        options={orgItems}
        onChange={(value) => onGroupIdChange(value)}
      />

      {RecordsTable(rc, ["Index", "UserName", "Best", "Average", "ResultTime", "CompsName"])}
    </>
  );
}
