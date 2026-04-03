import { computePkSettlement } from '@/pages/Tools/TeamMatch/pkSettlement';
import type { BracketMatch, Player, Team } from '@/pages/Tools/TeamMatch/types';
import { Button, Checkbox, Input, Modal, Space, Table, Typography, message } from 'antd';
import React, { useMemo } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  match: BracketMatch | null;
  teams: Team[];
  players: Player[];
  draft: { playerId: string; teamId: string; value: number | 'DNF' }[];
  onDraftChange: (rows: { playerId: string; teamId: string; value: number | 'DNF' }[]) => void;
  onSettle: () => void;
  onManualWinner: (teamId: string) => void;
  onReplay: () => void;
  onClearCurrent: () => void;
};

const PkModal: React.FC<Props> = ({
  open,
  onClose,
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
  const teamA = teams.find((t) => t.id === pk?.teamAId);
  const teamB = teams.find((t) => t.id === pk?.teamBId);

  const playerMap = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  if (!pk || !teamA || !teamB) return null;

  const computed = computePkSettlement(pk.teamAId, pk.teamBId, draft);

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
      title="录入 PK 成绩"
      open={open}
      onCancel={onClose}
      width={720}
      footer={
        <Space wrap>
          <Button onClick={onClearCurrent}>全部取消本次成绩</Button>
          <Button onClick={onReplay}>重开一局</Button>
          <Button onClick={() => onManualWinner(teamA.id)}>直接判定：{teamA.name} 胜</Button>
          <Button onClick={() => onManualWinner(teamB.id)}>直接判定：{teamB.name} 胜</Button>
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
        三人成绩相加，和小者胜；任一人 DNF 则该队判负。DNF 可再次点击取消以恢复填写秒数。也可不依赖合计，用底部「直接判定」指定获胜方。
      </Typography.Paragraph>
      {computed.bothSidesDnf && (
        <Typography.Paragraph type="danger">
          双方均有 DNF：无法按成绩自动判胜，请使用下方「直接判定」或重开一局。
        </Typography.Paragraph>
      )}
      {pk.lastComputed && !computed.bothSidesDnf && (
        <Typography.Text>
          上次计算：A 队合计{' '}
          {typeof computed.teamATotal === 'number' ? computed.teamATotal.toFixed(2) : computed.teamATotal} · B 队合计{' '}
          {typeof computed.teamBTotal === 'number' ? computed.teamBTotal.toFixed(2) : computed.teamBTotal}
        </Typography.Text>
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

export default PkModal;
