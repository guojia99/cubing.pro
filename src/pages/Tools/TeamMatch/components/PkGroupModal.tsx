import { computeMultiTeamPkSettlement } from '@/pages/Tools/TeamMatch/pkSettlement';
import type { EliminationGroupMatch, Player, Team } from '@/pages/Tools/TeamMatch/types';
import { Button, Checkbox, Input, Modal, Space, Table, Typography, message } from 'antd';
import React, { useMemo } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  modalTitle?: string;
  match: EliminationGroupMatch | null;
  teams: Team[];
  players: Player[];
  draft: { playerId: string; teamId: string; value: number | 'DNF' }[];
  onDraftChange: (rows: { playerId: string; teamId: string; value: number | 'DNF' }[]) => void;
  onSettle: () => void;
  onManualWinner: (teamId: string) => void;
  onReplay: () => void;
  onClearCurrent: () => void;
};

function formatTotalLabel(v: number | 'dnf_team' | 'incomplete'): string {
  if (v === 'dnf_team') return 'DNF';
  if (v === 'incomplete') return '未完成';
  return v.toFixed(2);
}

const PkGroupModal: React.FC<Props> = ({
  open,
  onClose,
  modalTitle = '预选赛 · 小组录入',
  match,
  teams,
  players,
  draft,
  onDraftChange,
  onSettle,
  onManualWinner,
  onReplay,
  onClearCurrent,
}) => {
  const pk = match?.pk;
  const playerMap = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  if (!pk || !pk.teamIds.length) return null;

  const teamRows = pk.teamIds
    .map((id) => teams.find((t) => t.id === id))
    .filter(Boolean) as Team[];
  if (teamRows.length !== pk.teamIds.length) return null;

  const computed = computeMultiTeamPkSettlement(pk.teamIds, draft);

  const cols = [
    {
      title: '队员',
      dataIndex: 'playerId',
      render: (pid: string) => playerMap[pid]?.name ?? pid,
    },
    {
      title: '队伍',
      dataIndex: 'teamId',
      render: (tid: string) => teams.find((t) => t.id === tid)?.name ?? tid,
    },
    {
      title: '成绩（秒）',
      render: (_: unknown, row: { playerId: string; teamId: string; value: number | 'DNF' }) => (
        <Space>
          <Input
            style={{ width: 120 }}
            placeholder="秒"
            disabled={row.value === 'DNF'}
            value={row.value === 'DNF' ? '' : String(row.value)}
            onChange={(e) => {
              const v = e.target.value;
              const next = draft.map((r) =>
                r.playerId === row.playerId
                  ? { ...r, value: v === '' ? 0 : parseFloat(v) || 0 }
                  : r,
              );
              onDraftChange(next);
            }}
          />
          <Checkbox
            checked={row.value === 'DNF'}
            onChange={(e) => {
              const next = draft.map((r) =>
                r.playerId === row.playerId
                  ? { ...r, value: e.target.checked ? ('DNF' as const) : 0 }
                  : r,
              );
              onDraftChange(next);
            }}
          >
            DNF
          </Checkbox>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onClose}
      width={760}
      footer={
        <Space wrap>
          <Button onClick={onClearCurrent}>全部取消本次成绩</Button>
          <Button onClick={onReplay}>重开一局</Button>
          {teamRows.map((t) => (
            <Button key={t.id} onClick={() => onManualWinner(t.id)}>
              直接判定：{t.name} 晋级
            </Button>
          ))}
          <Button
            type="primary"
            onClick={() => {
              if (draft.some((r) => r.value !== 'DNF' && (typeof r.value !== 'number' || Number.isNaN(r.value)))) {
                message.warning('请填写有效数字成绩');
                return;
              }
              onSettle();
            }}
          >
            按成绩结算
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        同组多队：每队三人成绩相加，总秒数最小者晋级；任一人 DNF 则该队视为 DNF。若无法自动决出唯一胜者，请用「直接判定」指定晋级队。
      </Typography.Paragraph>
      {computed.allTeamsDnf && (
        <Typography.Paragraph type="danger">
          全部参赛队均有 DNF：无法按成绩自动晋级，请使用「直接判定」或重开一局。
        </Typography.Paragraph>
      )}
      {!computed.allTeamsDnf && !computed.computedWinnerTeamId && (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          当前草稿：{pk.teamIds.map((tid) => {
            const name = teams.find((t) => t.id === tid)?.name ?? tid;
            return `${name} 合计 ${formatTotalLabel(computed.teamTotals[tid] ?? 'incomplete')}`;
          }).join(' · ')}
        </Typography.Paragraph>
      )}
      <Table
        size="small"
        rowKey={(r) => r.playerId}
        columns={cols}
        dataSource={draft}
        pagination={false}
        style={{ marginTop: 12 }}
      />
      <Typography.Title level={5} style={{ marginTop: 16 }}>
        成绩回溯
      </Typography.Title>
      <ul style={{ maxHeight: 160, overflow: 'auto', fontSize: 12 }}>
        {pk.scoreHistory.map((s) => (
          <li key={s.id}>
            {new Date(s.recordedAt).toLocaleString()} · {s.reason} · {s.results.length} 条
          </li>
        ))}
      </ul>
    </Modal>
  );
};

export default PkGroupModal;
