"use client";

import { RecordsTable } from "@/components/Data/cube_record/record_tables";
import type { MRecord, Record as CubeRecord } from "@/components/Data/types/record";
import { apiEvents } from "@/services/cubing-pro/events/events";
import type { EventsAPI } from "@/services/cubing-pro/events/typings";
import { apiPublicCompGroups } from "@/services/cubing-pro/public/orgs";
import { apiRecords } from "@/services/cubing-pro/statistics/records";
import { Select } from "antd";
import { useEffect, useState } from "react";

export type RecordsWithBestProps = {
  groupId: number;
  onGroupIdChange: (id: number) => void;
};

export function RecordsWithBest({ groupId, onGroupIdChange }: RecordsWithBestProps) {
  const [events, setEvents] = useState<EventsAPI.Event[]>([]);
  const [bestRecords, setBestRecords] = useState<Record<string, CubeRecord[]> | undefined>();
  const [avgRecords, setAvgRecords] = useState<Record<string, CubeRecord[]> | undefined>();
  const [orgItems, setOrgItems] = useState<{ label: string; key: string; value: number }[]>([]);

  const fetchRecords = () => {
    apiRecords({
      GroupId: groupId === 0 ? "" : String(groupId),
      EventId: "",
    }).then((value) => {
      setAvgRecords(value.data.Average);
      setBestRecords(value.data.Best);
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
    fetchRecords();
  }, [groupId]);

  useEffect(() => {
    if (orgItems.length === 0) {
      return;
    }
    if (!orgItems.some((o) => o.value === groupId)) {
      onGroupIdChange(0);
    }
  }, [orgItems, groupId, onGroupIdChange]);

  const records: MRecord[] = [];

  for (const ev of events) {
    if (!ev.isComp || bestRecords === undefined) {
      continue;
    }

    const best = bestRecords[ev.id];
    if (best === undefined) {
      continue;
    }
    const avg = avgRecords?.[ev.id];
    const maxLength = Math.max(best?.length ?? 0, avg?.length ?? 0);

    for (let i = 0; i < maxLength; i++) {
      const b = best[i];
      const a = avg?.[i];
      const record = b || a;
      if (!record) {
        continue;
      }

      const mRecord: MRecord = {
        ...record,
        MEventId: record.EventId || "",
        BestUserName: b?.UserName || "",
        BestUserCudaId: b?.CubeId || "",
        BestRank: i + 1,
        Best: b?.Best ?? null,
        Repeatedly: b?.Repeatedly || a?.Repeatedly || null,
        AvgUserName: a?.UserName || "",
        AvgUserCudaId: a?.CubeId || "",
        Average: a?.Average ?? null,
        AvgRank: i + 1,
      };

      records.push(mRecord);
    }
  }

  return (
    <>
      <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
        <strong>最佳记录</strong>
      </h3>

      <Select
        value={groupId}
        style={{ marginBottom: "20px", width: "150px" }}
        options={orgItems}
        onChange={(value) => onGroupIdChange(value)}
      />

      {RecordsTable(records, ["MEventId", "BestUserName", "Best", "Average", "AvgUserName"], false)}
    </>
  );
}
