import BracketFitTeamName from '@/pages/Tools/TeamMatch/components/BracketFitTeamName';
import LiveSettingsButton from '@/pages/Tools/TeamMatch/components/LiveSettingsButton';
import PkGroupArenaFullscreen, {
  type PkGroupArenaColumn,
} from '@/pages/Tools/TeamMatch/components/PkGroupArenaFullscreen';
import PkGroupModal from '@/pages/Tools/TeamMatch/components/PkGroupModal';
import {
  formatPlayerSingleAverageLine,
  schoolNameForPlayer,
  seedingEntryForPlayer,
} from '@/pages/Tools/TeamMatch/playerBracketDisplay';
import type { LiveUISettings } from '@/pages/Tools/TeamMatch/liveUiSettings';
import { buildPkGroupTemplateRows } from '@/pages/Tools/TeamMatch/sessionReducer';
import { useTeamMatchStore } from '@/pages/Tools/TeamMatch/TeamMatchContext';
import type { EliminationGroupMatch, PkPlayerResult, Team } from '@/pages/Tools/TeamMatch/types';
import { Card, Space, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../TeamMatch.less';

type ElimMatchCardProps = {
  m: EliminationGroupMatch;
  teams: Team[];
  onOpenArena: (id: string) => void;
};

function ElimMatchCard({ m, teams, onOpenArena }: ElimMatchCardProps) {
  const done = !!m.winnerId;
  const clickable = !!m.pk;

  return (
    <Card
      size="small"
      className={classNames('tmBracketMatchCard', 'tmElimMatchCard', {
        tmMatchDone: done,
        tmBracketMatchCardClickable: clickable,
        tmBracketMatchCardDisabled: !clickable,
      })}
      title={<span className="tmBracketMatchId">{m.id}</span>}
      onClick={() => {
        if (clickable) onOpenArena(m.id);
      }}
    >
      <div className={classNames('tmMatchTeams', 'tmBracketMatchTeams', 'tmElimMatchTeams')}>
        {m.teamIds.map((tid, idx) => {
          const t = teams.find((x) => x.id === tid);
          const win = !!(done && m.winnerId === tid);
          const lose = !!(done && m.winnerId && m.winnerId !== tid);
          return (
            <React.Fragment key={tid}>
              {idx > 0 && <div className={classNames('tmVs', 'tmBracketVs', 'tmElimGroupSep')}>·</div>}
              <div
                className={classNames('tmBracketTeamLine', {
                  tmLoser: lose,
                  tmBracketWinner: win,
                })}
              >
                <BracketFitTeamName
                  className="tmBracketTeamName"
                  text={t?.name ?? '—'}
                  winner={win}
                  tone="elim"
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
}

type EliminationStageProps = {
  liveSettings: LiveUISettings;
  onOpenLiveSettings: () => void;
};

const EliminationStage: React.FC<EliminationStageProps> = ({ liveSettings, onOpenLiveSettings }) => {
  const { state, dispatch } = useTeamMatchStore();
  const { session } = state;
  const { teams, players, schools, seeding } = session;
  const elim = session.elimination;
  const uiFocusMatchId = session.uiFocusMatchId;
  const eventId = session.eventIds[0] ?? '333';

  const [pkOpen, setPkOpen] = useState(false);
  const [pkDraft, setPkDraft] = useState<PkPlayerResult[]>([]);
  const [arenaOpen, setArenaOpen] = useState(false);
  const [fxKey, setFxKey] = useState(0);

  const playerById = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  const findMatch = useCallback(
    (id: string | null): EliminationGroupMatch | null => {
      if (!id || !elim?.matches) return null;
      return elim.matches.find((x) => x.id === id) ?? null;
    },
    [elim?.matches],
  );

  const focused = findMatch(uiFocusMatchId);

  const groupArenaColumns = useMemo((): PkGroupArenaColumn[] => {
    if (!focused?.pk?.teamIds?.length) return [];
    return focused.pk.teamIds
      .map((tid) => {
        const team = teams.find((t) => t.id === tid);
        if (!team) return null;
        const pl = team.playerIds
          .map((pid) => {
            const p = playerById[pid];
            if (!p) return null;
            const entry = seedingEntryForPlayer(seeding, p.id, eventId);
            return {
              id: p.id,
              name: p.name,
              avatarDataUrl: p.avatarDataUrl,
              schoolName: schoolNameForPlayer(p, schools),
              scoresLine: formatPlayerSingleAverageLine(entry),
              playerBattlecry: (p.battlecry ?? '').trim(),
              wcaId: p.wcaId ?? null,
            };
          })
          .filter(Boolean) as PkGroupArenaColumn['players'];
        return {
          team,
          players: pl,
          dim: !!(focused.winnerId && focused.winnerId !== tid),
        };
      })
      .filter(Boolean) as PkGroupArenaColumn[];
  }, [focused, teams, playerById, seeding, schools, eventId]);

  useEffect(() => {
    if (!pkOpen || !focused?.pk) return;
    const m = focused;
    if (!m.pk?.teamIds?.length) return;
    const ok = m.teamIds.every((id) => teams.some((t) => t.id === id));
    if (!ok) return;
    if (m.pk.currentResults.length) {
      setPkDraft(m.pk.currentResults.map((r) => ({ ...r })));
    } else {
      setPkDraft(buildPkGroupTemplateRows(m.teamIds, teams));
    }
  }, [pkOpen, focused?.id, focused?.pk?.teamIds, teams]);

  const openArenaForMatch = (id: string) => {
    dispatch({ type: 'SET_UI_FOCUS', matchId: id });
    setFxKey((k) => k + 1);
    setArenaOpen(true);
    setPkOpen(false);
  };

  const waves = useMemo(() => {
    if (!elim?.matches.length || !elim.waveSizes.length) return [] as EliminationGroupMatch[][];
    const out: EliminationGroupMatch[][] = [];
    let offset = 0;
    for (const wn of elim.waveSizes) {
      out.push(elim.matches.slice(offset, offset + wn));
      offset += wn;
    }
    return out;
  }, [elim?.matches, elim?.waveSizes]);

  if (!elim?.matches.length) {
    return (
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        请先在「淘汰赛抽签」完成随机分组。
      </Typography.Paragraph>
    );
  }

  return (
    <div className="tmBracketRoot tmElimRoot">
      <div className="tmElimToolbar">
        <Space wrap>
          <Typography.Text type="secondary" className="tmElimToolbarHint">
            每张卡片 = 一场小组（多队同一次 PK）。点击卡片进入<strong>全屏对战</strong>，再点「录入成绩」打开弹窗。
          </Typography.Text>
          <LiveSettingsButton type="default" size="small" onClick={onOpenLiveSettings} />
        </Space>
      </div>

      <div className="tmElimWaves">
        {waves.map((row, wi) => (
          <div key={wi} className="tmElimWaveBlock">
            <Typography.Title level={5} className="tmElimWaveTitle">
              {waves.length > 1 ? `第 ${wi + 1} 波 · ` : ''}
              {row.length} 场小组
            </Typography.Title>
            <div className="tmElimWaveRow">
              {row.map((m) => (
                <ElimMatchCard key={m.id} m={m} teams={teams} onOpenArena={openArenaForMatch} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {arenaOpen && focused?.pk && groupArenaColumns.length > 0 && (
        <PkGroupArenaFullscreen
          key={fxKey}
          open={arenaOpen}
          onClose={() => setArenaOpen(false)}
          onOpenLiveSettings={onOpenLiveSettings}
          settings={liveSettings.arena}
          columns={groupArenaColumns}
          currentResults={focused.pk.currentResults}
          onOpenScoreEntry={() => setPkOpen(true)}
        />
      )}

      <PkGroupModal
        open={pkOpen && !!focused}
        onClose={() => setPkOpen(false)}
        match={focused}
        teams={teams}
        players={players}
        draft={pkDraft}
        onDraftChange={setPkDraft}
        modalTitle="预选赛 · 小组录入"
        onSettle={() => {
          dispatch({ type: 'PK_SETTLE', matchId: focused!.id, results: pkDraft });
        }}
        onManualWinner={(tid) => {
          dispatch({ type: 'PK_MANUAL_WINNER', matchId: focused!.id, winnerTeamId: tid });
          setPkOpen(false);
        }}
        onReplay={() => dispatch({ type: 'PK_REPLAY', matchId: focused!.id })}
        onClearCurrent={() => dispatch({ type: 'PK_CLEAR_CURRENT', matchId: focused!.id })}
      />
    </div>
  );
};

export default EliminationStage;
