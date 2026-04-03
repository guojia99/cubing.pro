import LiveSettingsButton from '@/pages/Tools/TeamMatch/components/LiveSettingsButton';
import PkArenaFullscreen from '@/pages/Tools/TeamMatch/components/PkArenaFullscreen';
import PkModal from '@/pages/Tools/TeamMatch/components/PkModal';
import { bracketSettingsToCssVars, type LiveUISettings } from '@/pages/Tools/TeamMatch/liveUiSettings';
import { buildPkTemplateRows } from '@/pages/Tools/TeamMatch/sessionReducer';
import { useTeamMatchStore } from '@/pages/Tools/TeamMatch/TeamMatchContext';
import type { BracketMatch, PkPlayerResult, Team } from '@/pages/Tools/TeamMatch/types';
import { Card, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../TeamMatch.less';

type TeamMedal = 'gold' | 'silver' | 'bronze';

function computeTeamMedals(
  rounds: BracketMatch[][],
  bronzeMatch: BracketMatch | null | undefined,
): Partial<Record<string, TeamMedal>> {
  const out: Partial<Record<string, TeamMedal>> = {};
  const final = rounds[3]?.[0];
  if (final?.winnerId && final.teamAId && final.teamBId) {
    out[final.winnerId] = 'gold';
    const loser = final.winnerId === final.teamAId ? final.teamBId : final.teamAId;
    if (loser) out[loser] = 'silver';
  }
  if (bronzeMatch?.winnerId) {
    out[bronzeMatch.winnerId] = 'bronze';
  }
  return out;
}

function MedalMark({ kind }: { kind: TeamMedal }) {
  const title = kind === 'gold' ? '金牌' : kind === 'silver' ? '银牌' : '铜牌';
  return (
    <span className={classNames('tmBracketMedal', `tmBracketMedal-${kind}`)} title={title} aria-label={title}>
      {kind === 'gold' ? '🥇' : kind === 'silver' ? '🥈' : '🥉'}
    </span>
  );
}

type MatchRenderProps = {
  m: BracketMatch | undefined;
  teams: Team[];
  onOpenArena: (id: string) => void;
  compact?: boolean;
  teamMedals?: Partial<Record<string, TeamMedal>>;
};

function BracketMatchCard({ m, teams, onOpenArena, compact, teamMedals }: MatchRenderProps) {
  if (!m) {
    return (
      <Card size="small" className="tmBracketMatchCard tmBracketMatchCardEmpty tmBracketMatchCardDisabled">
        <Typography.Text type="secondary">待定</Typography.Text>
      </Card>
    );
  }
  const ta = teams.find((t) => t.id === m.teamAId);
  const tb = teams.find((t) => t.id === m.teamBId);
  const done = !!m.winnerId;
  const winA = !!(done && m.winnerId && m.teamAId && m.winnerId === m.teamAId);
  const winB = !!(done && m.winnerId && m.teamBId && m.winnerId === m.teamBId);
  const loseA = done && m.winnerId && m.teamAId && m.winnerId !== m.teamAId;
  const loseB = done && m.winnerId && m.teamBId && m.winnerId !== m.teamBId;
  const clickable = !!m.pk;
  const medalA = m.teamAId ? teamMedals?.[m.teamAId] : undefined;
  const medalB = m.teamBId ? teamMedals?.[m.teamBId] : undefined;

  return (
    <Card
      size="small"
      className={classNames('tmBracketMatchCard', {
        tmMatchDone: done,
        tmBracketMatchCardCompact: compact,
        tmBracketMatchCardClickable: clickable,
        tmBracketMatchCardDisabled: !clickable,
      })}
      title={<span className="tmBracketMatchId">{m.id}</span>}
      onClick={() => {
        if (clickable) onOpenArena(m.id);
      }}
    >
      <div className={classNames('tmMatchTeams', 'tmBracketMatchTeams')}>
        <div
          className={classNames('tmBracketTeamLine', {
            tmLoser: loseA,
            tmBracketWinner: winA,
          })}
        >
          <span className="tmBracketTeamName">{ta?.name ?? '—'}</span>
          {medalA ? <MedalMark kind={medalA} /> : null}
          {m.byeWinnerId === m.teamAId ? (
            <span className="tmBracketByeHint">{done ? '轮空晋级' : '待决出'}</span>
          ) : null}
        </div>
        <div className="tmVs tmBracketVs">VS</div>
        <div
          className={classNames('tmBracketTeamLine', {
            tmLoser: loseB,
            tmBracketWinner: winB,
          })}
        >
          <span className="tmBracketTeamName">{tb?.name ?? '—'}</span>
          {medalB ? <MedalMark kind={medalB} /> : null}
          {m.byeWinnerId === m.teamBId ? (
            <span className="tmBracketByeHint">{done ? '轮空晋级' : '待决出'}</span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

/** 两场首轮垂直叠放，晋级场垂直居中于二者之间（淘汰赛树对齐） */
function BracketPairRow({
  leafA,
  leafB,
  advance,
  mirror,
}: {
  leafA: React.ReactNode;
  leafB: React.ReactNode;
  advance: React.ReactNode;
  mirror?: boolean;
}) {
  return (
    <div className={classNames('tmBracketPairRow', { tmBracketPairRowMirror: mirror })}>
      <div className="tmBracketPairLeaves">
        <div className="tmBracketStageSlot">{leafA}</div>
        <div className="tmBracketStageSlot">{leafB}</div>
      </div>
      <div className="tmBracketPairAdvance">{advance}</div>
    </div>
  );
}

type BracketStageProps = {
  liveSettings: LiveUISettings;
  onOpenLiveSettings: () => void;
};

const BracketStage: React.FC<BracketStageProps> = ({ liveSettings, onOpenLiveSettings }) => {
  const { state, dispatch } = useTeamMatchStore();
  const { session } = state;
  const { rounds, teams, players, uiFocusMatchId, bronzeMatch } = session;

  const [pkOpen, setPkOpen] = useState(false);
  const [pkDraft, setPkDraft] = useState<PkPlayerResult[]>([]);
  const [arenaOpen, setArenaOpen] = useState(false);
  const [fxKey, setFxKey] = useState(0);

  const playerById = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  const findMatch = useCallback(
    (id: string | null): BracketMatch | null => {
      if (!id) return null;
      if (bronzeMatch?.id === id) return bronzeMatch;
      for (const r of rounds) {
        const x = r.find((y) => y.id === id);
        if (x) return x;
      }
      return null;
    },
    [rounds, bronzeMatch],
  );

  const focused = findMatch(uiFocusMatchId);

  useEffect(() => {
    if (!pkOpen || !focused?.pk) return;
    const m = focused;
    if (!m.pk) return;
    const ta = teams.find((t) => t.id === m.pk!.teamAId);
    const tb = teams.find((t) => t.id === m.pk!.teamBId);
    if (!ta || !tb) return;
    if (m.pk.currentResults.length) {
      setPkDraft(m.pk.currentResults.map((r) => ({ ...r })));
    } else {
      setPkDraft(buildPkTemplateRows(ta.id, tb.id, ta, tb));
    }
  }, [pkOpen, focused?.id, teams]);

  const openArenaForMatch = (id: string) => {
    dispatch({ type: 'SET_UI_FOCUS', matchId: id });
    setFxKey((k) => k + 1);
    setArenaOpen(true);
    setPkOpen(false);
  };

  const openPkModal = () => {
    setPkOpen(true);
  };

  const closePk = () => {
    setPkOpen(false);
  };

  const teamMedals = useMemo(() => computeTeamMedals(rounds, bronzeMatch), [rounds, bronzeMatch]);

  const bracketCssVars = useMemo(() => bracketSettingsToCssVars(liveSettings.bracket), [liveSettings.bracket]);

  const renderMatch = (ri: number, mi: number, compact?: boolean) => (
    <BracketMatchCard
      m={rounds[ri]?.[mi]}
      teams={teams}
      teamMedals={teamMedals}
      onOpenArena={openArenaForMatch}
      compact={compact}
    />
  );

  const openArenaBronze = (id: string) => {
    openArenaForMatch(id);
  };

  const focusedPlayersA = useMemo(() => {
    if (!focused?.pk?.teamAId) return [];
    return (
      teams
        .find((t) => t.id === focused.pk!.teamAId)
        ?.playerIds.map((id) => playerById[id])
        .filter(Boolean)
        .map((p) => ({ id: p!.id, name: p!.name, avatarDataUrl: p!.avatarDataUrl })) ?? []
    );
  }, [focused, teams, playerById]);

  const focusedPlayersB = useMemo(() => {
    if (!focused?.pk?.teamBId) return [];
    return (
      teams
        .find((t) => t.id === focused.pk!.teamBId)
        ?.playerIds.map((id) => playerById[id])
        .filter(Boolean)
        .map((p) => ({ id: p!.id, name: p!.name, avatarDataUrl: p!.avatarDataUrl })) ?? []
    );
  }, [focused, teams, playerById]);

  return (
    <div className="tmBracketRoot" style={bracketCssVars}>
      <div className="tmBracketToolbar">
        <LiveSettingsButton type="default" ghost size="small" onClick={onOpenLiveSettings} />
        <Typography.Text className="tmBracketLrHint" type="secondary">
          左右半区由外向内收拢：左为签位 1–8、右为签位 9–16 对应首轮；中间为决赛，铜牌单独占一格。
        </Typography.Text>
      </div>

      <div
        className="tmBracketScaleWrap"
        style={{ transform: `scale(${liveSettings.bracket.scale})`, transformOrigin: 'top center' }}
      >
        <div className="tmBracketLr">
        <div className="tmBracketLrRow">
          {/* 左半区：由外向内 — (r0-m0,m1)→r1-m0、(m2,m3)→r1-m1 → r2-m0 居中于两场 8 强之间 */}
          <div className="tmBracketWing tmBracketWingLeft">
            <Typography.Text className="tmBracketWingTitle">左半区（签位 1–8）</Typography.Text>
            <div className="tmBracketWingCluster">
              <div className="tmBracketWingClusterLeaves">
                <BracketPairRow
                  leafA={renderMatch(0, 0, true)}
                  leafB={renderMatch(0, 1, true)}
                  advance={renderMatch(1, 0, true)}
                />
                <BracketPairRow
                  leafA={renderMatch(0, 2, true)}
                  leafB={renderMatch(0, 3, true)}
                  advance={renderMatch(1, 1, true)}
                />
              </div>
              <div className="tmBracketPairAdvance tmBracketSemiSlot">{renderMatch(2, 0)}</div>
            </div>
          </div>

          {/* 中间：冠军 + 铜牌（独立占格） */}
          <div className="tmBracketCenterColumn">
            <div className="tmBracketCenterChamp">
              <Typography.Text className="tmBracketBlockTitle">冠军战</Typography.Text>
              <div className="tmBracketFinalSlot">{renderMatch(3, 0)}</div>
            </div>
            <div className="tmBracketCenterBronze">
              <Typography.Text className="tmBracketBlockTitle">铜牌战</Typography.Text>
              <div className="tmBracketFinalSlot">
                {bronzeMatch ? (
                  <BracketMatchCard m={bronzeMatch} teams={teams} teamMedals={teamMedals} onOpenArena={openArenaBronze} />
                ) : (
                  <Card size="small" className="tmBracketMatchCard tmBracketMatchCardEmpty">
                    <Typography.Text type="secondary">待定</Typography.Text>
                    <div className="tmBracketBronzeHint">两场半决赛均决出胜负后产生</div>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* 右半区：由内向外 — r2-m1 居中于两场 8 强之间；(m4,m5)→r1-m2、(m6,m7)→r1-m3 */}
          <div className="tmBracketWing tmBracketWingRight">
            <Typography.Text className="tmBracketWingTitle">右半区（签位 9–16）</Typography.Text>
            <div className="tmBracketWingCluster">
              <div className="tmBracketPairAdvance tmBracketSemiSlot">{renderMatch(2, 1)}</div>
              <div className="tmBracketWingClusterLeaves">
                <BracketPairRow
                  mirror
                  leafA={renderMatch(0, 4, true)}
                  leafB={renderMatch(0, 5, true)}
                  advance={renderMatch(1, 2, true)}
                />
                <BracketPairRow
                  mirror
                  leafA={renderMatch(0, 6, true)}
                  leafB={renderMatch(0, 7, true)}
                  advance={renderMatch(1, 3, true)}
                />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {arenaOpen && focused?.pk && focused.teamAId && focused.teamBId && (
        <PkArenaFullscreen
          key={fxKey}
          open={arenaOpen}
          onClose={() => setArenaOpen(false)}
          onOpenLiveSettings={onOpenLiveSettings}
          settings={liveSettings.arena}
          teamA={teams.find((t) => t.id === focused.pk!.teamAId)}
          teamB={teams.find((t) => t.id === focused.pk!.teamBId)}
          playersA={focusedPlayersA}
          playersB={focusedPlayersB}
          dimA={!!focused.winnerId && focused.winnerId !== focused.pk!.teamAId}
          dimB={!!focused.winnerId && focused.winnerId !== focused.pk!.teamBId}
          onOpenScoreEntry={openPkModal}
        />
      )}

      <PkModal
        open={pkOpen && !!focused}
        onClose={closePk}
        match={focused}
        teams={teams}
        players={players}
        draft={pkDraft}
        onDraftChange={setPkDraft}
        onSettle={() => {
          dispatch({ type: 'PK_SETTLE', matchId: focused!.id, results: pkDraft });
        }}
        onManualWinner={(tid) => {
          dispatch({ type: 'PK_MANUAL_WINNER', matchId: focused!.id, winnerTeamId: tid });
          closePk();
        }}
        onReplay={() => dispatch({ type: 'PK_REPLAY', matchId: focused!.id })}
        onClearCurrent={() => dispatch({ type: 'PK_CLEAR_CURRENT', matchId: focused!.id })}
      />
    </div>
  );
};

export default BracketStage;
