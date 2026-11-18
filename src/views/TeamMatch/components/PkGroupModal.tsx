import { computeMultiTeamPkSettlement } from '@/views/TeamMatch/pkSettlement';
import type { EliminationGroupMatch, Player, Team } from '@/views/TeamMatch/types';
import { TEAM_MATCH_MODAL_Z_INDEX } from '@/views/TeamMatch/uiZIndex';
import { Button, Checkbox, Input, Modal, Space, Table, Typography, message } from 'antd';
import React, { useMemo } from 'react';
import { tm, useTeamMatchI18n, type TeamMatchLocale } from '../i18n';

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

function formatTotalLabel(v: number | 'dnf_team' | 'incomplete', locale: TeamMatchLocale): string {
  if (v === 'dnf_team') return 'DNF';
  if (v === 'incomplete') return tm(locale, 'teamMatch.incomplete');
  return v.toFixed(2);
}

const PkGroupModal: React.FC<Props> = ({
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
  const playerMap = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  if (!pk || !pk.teamIds.length) return null;

  const teamRows = pk.teamIds
    .map((id) => teams.find((t) => t.id === id))
    .filter(Boolean) as Team[];
  if (teamRows.length !== pk.teamIds.length) return null;

  const computed = computeMultiTeamPkSettlement(pk.teamIds, draft);

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
      title={modalTitle ?? t('teamMatch.groupEntry')}
      open={open}
      onCancel={onClose}
      width={760}
      zIndex={TEAM_MATCH_MODAL_Z_INDEX}
      footer={
        <Space wrap>
          <Button onClick={onClearCurrent}>{t('teamMatch.clearScores')}</Button>
          <Button onClick={onReplay}>{t('teamMatch.replay')}</Button>
          {teamRows.map((team) => (
            <Button key={team.id} onClick={() => onManualWinner(team.id)}>
              {t('teamMatch.manualAdvance', { name: team.name })}
            </Button>
          ))}
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
        {t('teamMatch.groupRules')}
      </Typography.Paragraph>
      {computed.allTeamsDnf && (
        <Typography.Paragraph type="danger">
          {t('teamMatch.allDnf')}
        </Typography.Paragraph>
      )}
      {!computed.allTeamsDnf && !computed.computedWinnerTeamId && (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          {t('teamMatch.draft', { results: pk.teamIds.map((tid) => {
            const name = teams.find((t) => t.id === tid)?.name ?? tid;
            return t('teamMatch.teamTotal', { name, total: formatTotalLabel(computed.teamTotals[tid] ?? 'incomplete', locale) });
          }).join(' · ') })}
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

export default PkGroupModal;
