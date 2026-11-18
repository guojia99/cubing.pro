"use client";

import "antd/dist/reset.css";

import { Switch } from "antd";
import { PageHeader, Surface } from "@/components/ui/page";
import "../competition-ui.css";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { RecordsWithBest } from "./RecordWithBest";
import { RecordsWithEvents } from "./RecordWithEvents";
import { useI18n } from "@/contexts/I18nProvider";


export const RECORDS_QUERY_MODE = "mode";
export const RECORDS_QUERY_GROUP = "group";
export const RECORDS_QUERY_EVENT = "event";

export const RECORDS_MODE_BEST = "best";
export const RECORDS_MODE_HISTORY = "history";

function parseGroupId(raw: string | null): number {
  if (raw == null || raw === "") {
    return 0;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function GcRecordsView() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname() ?? "/group-competitions/records";
  const searchParams = useSearchParams();

  const patchQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") {
          next.delete(k);
        } else {
          next.set(k, v);
        }
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const mode = useMemo(() => {
    const m = searchParams?.get(RECORDS_QUERY_MODE);
    return m === RECORDS_MODE_HISTORY ? RECORDS_MODE_HISTORY : RECORDS_MODE_BEST;
  }, [searchParams]);

  const groupId = useMemo(
    () => parseGroupId(searchParams?.get(RECORDS_QUERY_GROUP) ?? null),
    [searchParams],
  );

  const eventId = useMemo(
    () => searchParams?.get(RECORDS_QUERY_EVENT) || "333",
    [searchParams],
  );

  const isBest = mode === RECORDS_MODE_BEST;

  const setGroupId = useCallback(
    (id: number) => {
      patchQuery({ [RECORDS_QUERY_GROUP]: String(id) });
    },
    [patchQuery],
  );

  const setEventId = useCallback(
    (id: string) => {
      patchQuery({ [RECORDS_QUERY_EVENT]: id });
    },
    [patchQuery],
  );

  const setBestMode = useCallback(
    (nextBest: boolean) => {
      patchQuery({
        [RECORDS_QUERY_MODE]: nextBest ? RECORDS_MODE_BEST : RECORDS_MODE_HISTORY,
      });
    },
    [patchQuery],
  );

  return (
    <div className="competition-page">
      <PageHeader eyebrow={t('competitionAdmin.records')} title={t('competitionAdmin.records')} actions={
      <Switch
        checked={isBest}
        checkedChildren={t('competitionExtra.overall')}
        unCheckedChildren={t('competitionExtra.history')}
        onChange={setBestMode}
        aria-label={t('competitionExtra.recordMode')}
      />
      } />
      <Surface p={{ base: "3", md: "6" }}>
      {isBest ? (
        <RecordsWithBest groupId={groupId} onGroupIdChange={setGroupId} />
      ) : (
        <RecordsWithEvents
          groupId={groupId}
          eventId={eventId}
          onGroupIdChange={setGroupId}
          onEventIdChange={setEventId}
        />
      )}
      </Surface>
    </div>
  );
}
