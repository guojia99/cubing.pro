import { useTeamMatchI18n } from '@/views/TeamMatch/i18n';
import {
  fetchAndApplyOneCompPreliminary,
  fetchOneCompPrelimPreview,
  type OneCompPrelimPreviewEventBlock,
} from '@/views/TeamMatch/oneCompPrelimImport';
import { fetchOneCommonCompList, type OneCompItem } from '@/views/TeamMatch/oneGradeApi';
import type { TeamMatchStoreAction } from '@/views/TeamMatch/TeamMatchContext';
import type { TeamMatchSession } from '@/views/TeamMatch/types';
import { wcaCentisecondsToSeconds } from '@/views/TeamMatch/wcaSeeding';
import { teamMatchEventOptions } from '@/views/TeamMatch/wcaCubeEvents';
import { Button, Card, Input, InputNumber, Modal, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

const DEFAULT_E_ROUND = 1;

type Props = {
  session: TeamMatchSession;
  dispatch: React.Dispatch<TeamMatchStoreAction>;
};

function formatOneCenti(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (t === 'd' || t === 'dnf') return 'DNF';
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n <= 0) return raw || '—';
  const sec = wcaCentisecondsToSeconds(n);
  return `${sec.toFixed(2)}`;
}

const OneCompPrelimImportCard: React.FC<Props> = ({ session, dispatch }) => {
  const { t: tr, locale } = useTeamMatchI18n();
  const eventLabel = (eventId: string) => teamMatchEventOptions(locale).find(o => o.value === eventId)?.label ?? eventId;
  const imp = session.oneCompImport ?? { cId: null, eRound: DEFAULT_E_ROUND };
  const [cIdDraft, setCIdDraft] = useState<number | null>(imp.cId);
  const [eRoundDraft, setERoundDraft] = useState(imp.eRound ?? DEFAULT_E_ROUND);
  const [listOpen, setListOpen] = useState(false);
  const [list, setList] = useState<OneCompItem[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<OneCompPrelimPreviewEventBlock[]>([]);
  const [previewUnassigned, setPreviewUnassigned] = useState<
    Awaited<ReturnType<typeof fetchOneCompPrelimPreview>>['unassignedApi']
  >([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setCIdDraft(imp.cId);
    setERoundDraft(imp.eRound ?? DEFAULT_E_ROUND);
  }, [imp.cId, imp.eRound]);

  const filteredList = useMemo(() => {
    const s = nameFilter.trim().toLowerCase();
    if (!s) return list;
    return list.filter((x) => (x.c_name ?? '').toLowerCase().includes(s));
  }, [list, nameFilter]);

  const openListModal = async () => {
    setLoadingList(true);
    try {
      const data = await fetchOneCommonCompList(1, 100);
      setList(data);
      setListOpen(true);
    } catch {
      message.error(tr('teamMatch.loadFailed'));
    } finally {
      setLoadingList(false);
    }
  };

  const pickComp = (row: OneCompItem) => {
    setCIdDraft(row.c_id);
    dispatch({
      type: 'SET_ONE_COMP_IMPORT',
      value: { cId: row.c_id, eRound: eRoundDraft },
    });
    setListOpen(false);
    message.success(row.c_name);
  };

  const runPreview = async () => {
    const cId = cIdDraft ?? imp.cId;
    if (cId === null || cId === undefined || !Number.isFinite(Number(cId))) {
      message.warning(tr('teamMatch.needCompetitionId'));
      return;
    }
    if (!session.players.some((p) => p.oneId?.trim() && /^\d+$/.test(p.oneId.trim()))) {
      message.warning(tr('teamMatch.needOneParticipant'));
      return;
    }
    dispatch({
      type: 'SET_ONE_COMP_IMPORT',
      value: { cId: Number(cId), eRound: eRoundDraft },
    });
    setPreviewLoading(true);
    try {
      const { events, unassignedApi } = await fetchOneCompPrelimPreview(session, Number(cId), eRoundDraft);
      setPreviewEvents(events);
      setPreviewUnassigned(unassignedApi);
      setPreviewOpen(true);
    } catch {
      message.error(tr('teamMatch.prelimFetchFailed'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmImport = async () => {
    const cId = cIdDraft ?? imp.cId;
    if (cId === null || cId === undefined) return;
    setImporting(true);
    try {
      const seeding = await fetchAndApplyOneCompPreliminary(session, Number(cId), eRoundDraft);
      dispatch({ type: 'SET_SEEDING', seeding });
      message.success(tr('teamMatch.prelimImported'));
      setPreviewOpen(false);
    } catch {
      message.error(tr('teamMatch.importFailed'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Card size="small" type="inner" title={tr('teamMatch.importPrelim')} style={{ marginBottom: 12 }}>
        <Space wrap align="center">
          <span>{tr('teamMatch.competitionId')}</span>
          <InputNumber
            min={1}
            value={cIdDraft ?? undefined}
            onChange={(v) => {
              const n = v === null ? null : Number(v);
              setCIdDraft(n);
              dispatch({
                type: 'SET_ONE_COMP_IMPORT',
                value: { cId: n, eRound: eRoundDraft },
              });
            }}
            style={{ width: 120 }}
          />
          <span>{tr('teamMatch.round')}</span>
          <InputNumber
            min={1}
            max={20}
            value={eRoundDraft}
            onChange={(v) => {
              const n = v === null ? DEFAULT_E_ROUND : Number(v);
              setERoundDraft(n);
              dispatch({
                type: 'SET_ONE_COMP_IMPORT',
                value: { cId: cIdDraft, eRound: n },
              });
            }}
            style={{ width: 72 }}
          />
          <Button loading={loadingList} onClick={() => void openListModal()}>{tr('teamMatch.selectCompetition')}</Button>
          <Button type="primary" loading={previewLoading} onClick={() => void runPreview()}>{tr('teamMatch.import')}</Button>
        </Space>
        <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>{tr('teamMatch.prelimMatchingHelp')}</Typography.Paragraph>
      </Card>

      <Modal
        className="tm-workbench-modal"
        title={tr('teamMatch.prelimPreviewTitle')}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={900}
        destroyOnHidden
        footer={
          <Space>
            <Button onClick={() => setPreviewOpen(false)}>{tr('teamMatch.cancel')}</Button>
            <Button type="primary" loading={importing} onClick={() => void confirmImport()}>{tr('teamMatch.confirmImport')}</Button>
          </Space>
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>{tr('teamMatch.prelimParticipationHelp')}</Typography.Paragraph>
        <Tabs
          items={previewEvents.map((ev) => ({
            key: ev.eventId,
            label: eventLabel(ev.eventId),
            children: (
              <Table
                size="small"
                pagination={false}
                rowKey={(r) => r.player.id}
                dataSource={ev.playerRows}
                scroll={{ y: 320 }}
                columns={[
                  { title: tr('teamMatch.players'), width: 120, render: (_, r) => r.player.name },
                  {
                    title: 'One ID',
                    width: 100,
                    render: (_, r) => r.player.oneId ?? '—',
                  },
                  {
                    title: tr('teamMatch.status'),
                    width: 140,
                    render: (_, r) => {
                      if (r.status === 'matched') return <Tag color="success">{tr('teamMatch.participated')}</Tag>;
                      if (r.status === 'no_one_id') return <Tag>{tr('teamMatch.noOneId')}</Tag>;
                      return <Tag color="warning">{tr('teamMatch.noResult')}</Tag>;
                    },
                  },
                  {
                    title: tr('teamMatch.prelimSingle'),
                    width: 100,
                    render: (_, r) =>
                      r.preliminary?.single === 'DNF'
                        ? 'DNF'
                        : typeof r.preliminary?.single === 'number'
                          ? r.preliminary.single.toFixed(2)
                          : '—',
                  },
                  {
                    title: tr('teamMatch.prelimAverage'),
                    width: 100,
                    render: (_, r) =>
                      r.preliminary?.average === 'DNF'
                        ? 'DNF'
                        : typeof r.preliminary?.average === 'number'
                          ? r.preliminary.average.toFixed(2)
                          : '—',
                  },
                  {
                    title: tr('teamMatch.platformIdName'),
                    ellipsis: true,
                    render: (_, r) =>
                      r.row ? `${r.row.u_id}${r.row.u_name ? ` · ${r.row.u_name}` : ''}` : '—',
                  },
                ]}
              />
            ),
          }))}
        />
        {previewUnassigned.length > 0 && (
          <>
            <Typography.Title level={5} style={{ marginTop: 16 }}>{tr('teamMatch.unmatchedPlatform')}</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>{tr('teamMatch.unmatchedPlatformHelp')}</Typography.Paragraph>
            <Table
              size="small"
              pagination={{ pageSize: 8 }}
              rowKey={(r) => `${r.eventId}-${r.eidOne}-${r.u_id}`}
              dataSource={previewUnassigned}
              columns={[
                { title: tr('teamMatch.eventShort'), width: 120, render: (_, r) => eventLabel(r.eventId) },
                { title: 'u_id', dataIndex: 'u_id', width: 88 },
                { title: tr('teamMatch.platformName'), dataIndex: 'u_name', ellipsis: true },
                { title: tr('teamMatch.singleSeconds'), render: (_, r) => formatOneCenti(r.t_single) },
                { title: tr('teamMatch.averageSeconds'), render: (_, r) => formatOneCenti(r.t_avg) },
              ]}
            />
          </>
        )}
      </Modal>

      <Modal className="tm-workbench-modal" title={tr('teamMatch.selectCompetition')} open={listOpen} onCancel={() => setListOpen(false)} width={720} footer={null} destroyOnHidden>
        <Input
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          style={{ marginBottom: 12 }}
          allowClear
        />
        <Table<OneCompItem>
          size="small"
          rowKey="c_id"
          pagination={{ pageSize: 10 }}
          dataSource={filteredList}
          scroll={{ y: 360 }}
          columns={[
            { title: tr('teamMatch.competitionId'), dataIndex: 'c_id', width: 88 },
            { title: tr('teamMatch.label'), dataIndex: 'c_name', ellipsis: true },
            { title: tr('teamMatch.date'), dataIndex: 'c_date', width: 120 },
            {
              title: '',
              key: 'act',
              width: 72,
              render: (_, row) => (
                <Button type="link" size="small" onClick={() => pickComp(row)}>{tr('teamMatch.select')}</Button>
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
};

export default OneCompPrelimImportCard;
