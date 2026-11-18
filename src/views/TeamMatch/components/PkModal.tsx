import { computePkSettlement } from '@/views/TeamMatch/pkSettlement';
import type { BracketMatch, Player, Team } from '@/views/TeamMatch/types';
import { TEAM_MATCH_MODAL_Z_INDEX } from '@/views/TeamMatch/uiZIndex';
import { Button, Checkbox, Input, Modal, Space, Table, Typography, message } from 'antd';
import React, { useMemo } from 'react';
import { useTeamMatchI18n } from '../i18n';

type Props = {
  open: boolean;
  onClose: () => void;
  /** 弹窗标题，默认「录入 PK 成绩」 */
  modalTitle?: string;
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
  modalTitle,
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
  const { t, locale } = useTeamMatchI18n();
  const pk = match?.pk;
  const teamA = teams.find((t) => t.id === pk?.teamAId);
  const teamB = teams.find((t) => t.id === pk?.teamBId);

  const playerMap = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  if (!pk || !teamA || !teamB) return null;

  const computed = computePkSettlement(pk.teamAId, pk.teamBId, draft);
  const totalLabel = (value: number | 'dnf_team' | 'incomplete') =>
    typeof value === 'number' ? value.toFixed(2) : value === 'dnf_team' ? 'DNF' : t('teamMatch.incomplete');

  const cols = [
    {
      title: t('teamMatch.player'),
      dataIndex: 'playerId',
      render: (pid: string) => playerMap[pid]?.name ?? pid,
    },
    {
      title: t('teamMatch.team'),
      dataIndex: 'teamId',
      render: (tid: string) => teams.find((t) => t.id === tid)?.name ?? tid,
    },
    {
      title: t('teamMatch.scoreSeconds'),
      render: (_: unknown, row: { playerId: string; teamId: string; value: number | 'DNF' }) => (
        <Space>
          <Input
            style={{ width: 120 }}
            placeholder={t('teamMatch.seconds')}
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
      className="tm-workbench-modal"
      title={modalTitle ?? t('teamMatch.pkEntry')}
      open={open}
      onCancel={onClose}
      width={720}
      zIndex={TEAM_MATCH_MODAL_Z_INDEX}
      footer={
        <Space wrap>
          <Button onClick={onClearCurrent}>{t('teamMatch.clearScores')}</Button>
          <Button onClick={onReplay}>{t('teamMatch.replay')}</Button>
          <Button onClick={() => onManualWinner(teamA.id)}>{t('teamMatch.manualWinner', { name: teamA.name })}</Button>
          <Button onClick={() => onManualWinner(teamB.id)}>{t('teamMatch.manualWinner', { name: teamB.name })}</Button>
          <Button
            type="primary"
            onClick={() => {
              if (draft.some((r) => r.value !== 'DNF' && (typeof r.value !== 'number' || Number.isNaN(r.value)))) {
                message.warning(t('teamMatch.invalidScore'));
                return;
              }
              onSettle();
            }}
          >
            {t('teamMatch.settle')}
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        {t('teamMatch.pkRules')}
      </Typography.Paragraph>
      {computed.bothSidesDnf && (
        <Typography.Paragraph type="danger">
          {t('teamMatch.bothDnf')}
        </Typography.Paragraph>
      )}
      {pk.lastComputed && !computed.bothSidesDnf && (
        <Typography.Text>
          {t('teamMatch.lastComputed', {
            a: totalLabel(computed.teamATotal),
            b: totalLabel(computed.teamBTotal),
          })}
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
        {t('teamMatch.history')}
      </Typography.Title>
      <ul style={{ maxHeight: 160, overflow: 'auto', fontSize: 12 }}>
        {pk.scoreHistory.map((s) => (
          <li key={s.id}>
            {new Date(s.recordedAt).toLocaleString(locale)} · {t(`teamMatch.${s.reason}`)} · {t('teamMatch.records', { count: s.results.length })}
          </li>
        ))}
      </ul>
    </Modal>
  );
};

export default PkModal;
