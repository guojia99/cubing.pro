import RecordsWithBest from '@/pages/Static/RecordComponents/RecordWithBest';
import RecordsWithEvents from '@/pages/Static/RecordComponents/RecordWithEvents';
import { useLocation, useNavigate } from '@umijs/max';
import { Switch } from 'antd';
import React, { useCallback, useMemo } from 'react';

export const RECORDS_QUERY_MODE = 'mode';
export const RECORDS_QUERY_GROUP = 'group';
export const RECORDS_QUERY_EVENT = 'event';

export const RECORDS_MODE_BEST = 'best';
export const RECORDS_MODE_HISTORY = 'history';

function parseGroupId(raw: string | null): number {
  if (raw == null || raw === '') {
    return 0;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

const Records: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const patchQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(location.search);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '') {
          next.delete(k);
        } else {
          next.set(k, v);
        }
      }
      const qs = next.toString();
      navigate(qs ? `${location.pathname}?${qs}` : location.pathname, { replace: true });
    },
    [location.pathname, location.search, navigate],
  );

  const mode = useMemo(() => {
    const m = searchParams.get(RECORDS_QUERY_MODE);
    return m === RECORDS_MODE_HISTORY ? RECORDS_MODE_HISTORY : RECORDS_MODE_BEST;
  }, [searchParams]);

  const groupId = useMemo(() => parseGroupId(searchParams.get(RECORDS_QUERY_GROUP)), [searchParams]);

  const eventId = useMemo(() => searchParams.get(RECORDS_QUERY_EVENT) || '333', [searchParams]);

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
    <>
      <h1 style={{ textAlign: 'center' }}>记录</h1>
      <Switch
        checked={isBest}
        checkedChildren="总榜"
        unCheckedChildren="历史"
        onChange={(checked) => setBestMode(checked)}
        style={{ float: 'right' }}
      />
      <br />
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
    </>
  );
};

export default Records;
