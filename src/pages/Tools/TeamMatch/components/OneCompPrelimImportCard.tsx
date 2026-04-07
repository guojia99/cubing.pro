import { fetchAndApplyOneCompPreliminary, fetchOneCompPrelimPreview } from '@/pages/Tools/TeamMatch/oneCompPrelimImport';
import { fetchOneCommonCompList, type OneCompItem } from '@/pages/Tools/TeamMatch/oneGradeApi';
import type { TeamMatchStoreAction } from '@/pages/Tools/TeamMatch/TeamMatchContext';
import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { wcaCentisecondsToSeconds } from '@/pages/Tools/TeamMatch/wcaSeeding';
import { TEAM_MATCH_WCA_EVENT_OPTIONS } from '@/pages/Tools/TeamMatch/wcaCubeEvents';
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

function eventLabel(eventId: string): string {
  return TEAM_MATCH_WCA_EVENT_OPTIONS.find((o) => o.value === eventId)?.label ?? eventId;
}

const OneCompPrelimImportCard: React.FC<Props> = ({ session, dispatch }) => {
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
      message.error('加载失败');
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
      message.warning('请填写或选择比赛ID');
      return;
    }
    if (!session.players.some((p) => p.oneId?.trim() && /^\d+$/.test(p.oneId.trim()))) {
      message.warning('请至少为一名选手填写 One ID（与平台参赛选手 u_id 一致）');
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
      message.error('拉取初赛数据失败');
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
      message.success('已写入初赛成绩');
      setPreviewOpen(false);
    } catch {
      message.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Card size="small" type="inner" title="初赛导入" style={{ marginBottom: 12 }}>
        <Space wrap align="center">
          <span>比赛ID</span>
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
          <span>轮次</span>
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
          <Button loading={loadingList} onClick={() => void openListModal()}>
            选比赛
          </Button>
          <Button type="primary" loading={previewLoading} onClick={() => void runPreview()}>
            导入
          </Button>
        </Space>
        <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
          成绩按平台返回的 <strong>u_id</strong>（参赛选手）与本地选手的 <strong>One ID</strong> 对齐；录入人
          input_u_id 不参与匹配。导入前会弹出预览，确认后再写入。
        </Typography.Paragraph>
      </Card>

      <Modal
        title="初赛导入预览（确认后写入）"
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={900}
        destroyOnClose
        footer={
          <Space>
            <Button onClick={() => setPreviewOpen(false)}>取消</Button>
            <Button type="primary" loading={importing} onClick={() => void confirmImport()}>
              确认导入
            </Button>
          </Space>
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          <strong>已参加初赛</strong>：本地有 One ID 且在当场比赛成绩表中存在对应 u_id；<strong>未参加</strong>
          ：无 One ID，或平台无该 u_id 的成绩。
        </Typography.Paragraph>
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
                  { title: '选手', width: 120, render: (_, r) => r.player.name },
                  {
                    title: 'One ID',
                    width: 100,
                    render: (_, r) => r.player.oneId ?? '—',
                  },
                  {
                    title: '状态',
                    width: 140,
                    render: (_, r) => {
                      if (r.status === 'matched') return <Tag color="success">已参加初赛</Tag>;
                      if (r.status === 'no_one_id') return <Tag>无 One ID</Tag>;
                      return <Tag color="warning">未找到成绩</Tag>;
                    },
                  },
                  {
                    title: '初赛单次',
                    width: 100,
                    render: (_, r) =>
                      r.preliminary?.single === 'DNF'
                        ? 'DNF'
                        : typeof r.preliminary?.single === 'number'
                          ? r.preliminary.single.toFixed(2)
                          : '—',
                  },
                  {
                    title: '初赛平均',
                    width: 100,
                    render: (_, r) =>
                      r.preliminary?.average === 'DNF'
                        ? 'DNF'
                        : typeof r.preliminary?.average === 'number'
                          ? r.preliminary.average.toFixed(2)
                          : '—',
                  },
                  {
                    title: '平台 u_id / 姓名',
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
            <Typography.Title level={5} style={{ marginTop: 16 }}>
              平台有成绩、当前名单无对应 One ID
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
              以下 u_id 在平台有本场成绩，但本地没有填写相同 One ID 的选手，不会写入任何人；需要时请补全选手 One ID 后再导入。
            </Typography.Paragraph>
            <Table
              size="small"
              pagination={{ pageSize: 8 }}
              rowKey={(r) => `${r.eventId}-${r.eidOne}-${r.u_id}`}
              dataSource={previewUnassigned}
              columns={[
                { title: '项目', width: 120, render: (_, r) => eventLabel(r.eventId) },
                { title: 'u_id', dataIndex: 'u_id', width: 88 },
                { title: '平台姓名', dataIndex: 'u_name', ellipsis: true },
                { title: '单次(0.01s)', render: (_, r) => formatOneCenti(r.t_single) },
                { title: '平均(0.01s)', render: (_, r) => formatOneCenti(r.t_avg) },
              ]}
            />
          </>
        )}
      </Modal>

      <Modal title="选比赛" open={listOpen} onCancel={() => setListOpen(false)} width={720} footer={null} destroyOnClose>
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
            { title: '比赛ID', dataIndex: 'c_id', width: 88 },
            { title: '名称', dataIndex: 'c_name', ellipsis: true },
            { title: '日期', dataIndex: 'c_date', width: 120 },
            {
              title: '',
              key: 'act',
              width: 72,
              render: (_, row) => (
                <Button type="link" size="small" onClick={() => pickComp(row)}>
                  选择
                </Button>
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
};

export default OneCompPrelimImportCard;
