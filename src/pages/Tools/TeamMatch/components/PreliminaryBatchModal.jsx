import { resolveOfficialScores } from '@/pages/Tools/TeamMatch/seedingScorePick';
import { Button, InputNumber, Modal, Space, Table, Typography } from 'antd';
import React, { useLayoutEffect, useState } from 'react';
function defaultEntry(playerId, eventId) {
    return {
        playerId,
        eventId,
        single: null,
        average: null,
        adoptStrategy: undefined,
        wcaBest: null,
        oneBest: null,
        preliminary: null,
    };
}
function buildSeedingAfterBatchPreliminary(session, eventId, draft) {
    const players = session.players;
    const map = new Map(session.seeding.map((e) => [`${e.playerId}:${e.eventId}`, e]));
    for (const p of players) {
        const pre = draft[p.id] ?? { single: null, average: null };
        const k = `${p.id}:${eventId}`;
        const base = map.get(k) ?? defaultEntry(p.id, eventId);
        const next = { ...base, preliminary: pre };
        const strat = next.adoptStrategy ?? 'best_average';
        const resolved = resolveOfficialScores(strat, next.wcaBest, next.oneBest, pre);
        if (strat !== 'manual' && resolved) {
            next.single = resolved.single;
            next.average = resolved.average;
            next.activeSource = resolved.activeSource;
        }
        map.set(k, next);
    }
    return [...map.values()].filter((e) => players.some((pl) => pl.id === e.playerId) && session.eventIds.includes(e.eventId));
}
function PrelimCell({ value, onChange, }) {
    if (value === 'DNF') {
        return (<Space size={4}>
        <Typography.Text type="danger">DNF</Typography.Text>
        <Button type="link" size="small" onClick={() => onChange(null)}>
          数字
        </Button>
      </Space>);
    }
    return (<InputNumber min={0} step={0.01} style={{ width: 100 }} value={typeof value === 'number' ? value : undefined} onChange={(v) => onChange(v === null ? null : Number(v))}/>);
}
const PreliminaryBatchModal = ({ open, onClose, session, eventId, dispatch }) => {
    const [draft, setDraft] = useState({});
    useLayoutEffect(() => {
        if (!open)
            return;
        const next = {};
        for (const p of session.players) {
            const e = session.seeding.find((x) => x.playerId === p.id && x.eventId === eventId);
            next[p.id] = e?.preliminary ?? { single: null, average: null };
        }
        setDraft(next);
    }, [open, session.players, session.seeding, eventId]);
    const patch = (pid, part) => {
        setDraft((d) => ({
            ...d,
            [pid]: { ...d[pid], ...part },
        }));
    };
    const handleOk = () => {
        const seeding = buildSeedingAfterBatchPreliminary(session, eventId, draft);
        dispatch({ type: 'SET_SEEDING', seeding });
        onClose();
    };
    const schoolName = (p) => session.schools.find((s) => s.id === p.schoolId)?.name ?? '—';
    const dataSource = session.players.map((p) => ({ ...p, _school: schoolName(p) }));
    return (<Modal title="初赛批量录入" open={open} onCancel={onClose} onOk={handleOk} width={720} destroyOnClose>
      <Table size="small" rowKey="id" pagination={false} scroll={{ y: 480, x: 560 }} dataSource={dataSource} columns={[
            { title: '姓名', dataIndex: 'name', width: 100, ellipsis: true },
            { title: '学校', dataIndex: '_school', width: 120, ellipsis: true },
            {
                title: '初赛单次',
                key: 'ps',
                width: 140,
                render: (_, r) => (<Space size={4} wrap>
                <PrelimCell value={draft[r.id]?.single ?? null} onChange={(v) => patch(r.id, { single: v })}/>
                {draft[r.id]?.single !== 'DNF' && (<Button type="link" size="small" style={{ padding: 0 }} onClick={() => patch(r.id, { single: 'DNF' })}>
                    DNF
                  </Button>)}
              </Space>),
            },
            {
                title: '初赛平均',
                key: 'pa',
                width: 140,
                render: (_, r) => (<Space size={4} wrap>
                <PrelimCell value={draft[r.id]?.average ?? null} onChange={(v) => patch(r.id, { average: v })}/>
                {draft[r.id]?.average !== 'DNF' && (<Button type="link" size="small" style={{ padding: 0 }} onClick={() => patch(r.id, { average: 'DNF' })}>
                    DNF
                  </Button>)}
              </Space>),
            },
        ]}/>
    </Modal>);
};
export default PreliminaryBatchModal;
//# sourceMappingURL=PreliminaryBatchModal.jsx.map