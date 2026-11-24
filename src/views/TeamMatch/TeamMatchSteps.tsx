import { tm, useTeamMatchI18n, type TeamMatchLocale } from '@/views/TeamMatch/i18n';
import BulkFillSeedingButton from '@/views/TeamMatch/components/BulkFillSeedingButton';
import BulkOneUidImportModal from '@/views/TeamMatch/components/BulkOneUidImportModal';
import EliminationStage from '@/views/TeamMatch/components/EliminationStage';
import LiveSettingsModal from '@/views/TeamMatch/components/LiveSettingsModal';
import OneCompPrelimImportCard from '@/views/TeamMatch/components/OneCompPrelimImportCard';
import PreliminaryBatchModal from '@/views/TeamMatch/components/PreliminaryBatchModal';
import PlayerEditModal from '@/views/TeamMatch/components/PlayerEditModal';
import SeedingPlayerModal from '@/views/TeamMatch/components/SeedingPlayerModal';
import TeamEditModal from '@/views/TeamMatch/components/TeamEditModal';
import SyncCubingAvatarsButton from '@/views/TeamMatch/components/SyncCubingAvatarsButton';
import SyncWcaAvatarsButton from '@/views/TeamMatch/components/SyncWcaAvatarsButton';
import TeamRosterPasteCard from '@/views/TeamMatch/components/TeamRosterPasteCard';
import { buildMainPoolDisplayRows, computeMainBracketTeamIds, isEliminationComplete } from '@/views/TeamMatch/eliminationResolve';
import type { LiveUISettings } from '@/views/TeamMatch/liveUiSettings';
import { useTeamMatchStore } from '@/views/TeamMatch/TeamMatchContext';
import { hasOverSixteenFullTeams } from '@/views/TeamMatch/stepAccess';
import { pickSeedTeamIds, rankedBracketTeamIds, sortTeamsBySeedingRank, teamSeedingSum } from '@/views/TeamMatch/seedingMath';
import { seedingSourceLabel } from '@/views/TeamMatch/seedingScorePick';
import { teamKindLabel } from '@/views/TeamMatch/teamClassify';
import type { EliminationGroupMatch, Player, School, SeedingEntry, Team, TeamMatchSession } from '@/views/TeamMatch/types';
import {
  BRACKET_TEAM_COUNT,
  MAX_ELIMINATION_BYE_TEAMS,
  MAX_ROSTER_TEAMS,
  MIN_TEAMS,
  TEAM_PLAYERS,
  WIZARD_STEP_MAIN_DRAW,
  WIZARD_STEP_MAIN_LIVE,
  WIZARD_STEP_MAIN_POOL_CONFIRM,
} from '@/views/TeamMatch/types';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { Image } from '@chakra-ui/react';
import { v4 as uuidv4 } from 'uuid';

type TeamMatchStepsProps = {
  liveUISettings: LiveUISettings;
  onLiveUISettingsChange: (next: LiveUISettings) => void;
};

/* 子步骤组件定义在文件后部，运行时在渲染前已完成初始化 */
const TeamMatchSteps: React.FC<TeamMatchStepsProps> = ({ liveUISettings, onLiveUISettingsChange }) => {
  const { t: tr } = useTeamMatchI18n();
  const { state, dispatch } = useTeamMatchStore();
  const { session } = state;
  const step = session.wizardStep;
  const [elimLiveSettingsOpen, setElimLiveSettingsOpen] = React.useState(false);

  const [schoolForm] = Form.useForm();

  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const openPlayerModal = (p: Player | null) => {
    if (!session.schools.length) {
      message.warning(tr('teamMatch.addSchoolFirst'));
      return;
    }
    setEditingPlayer(p);
    setPlayerModalOpen(true);
  };

  const closePlayerModal = () => {
    setPlayerModalOpen(false);
    setEditingPlayer(null);
  };

  const savePlayerFromModal = (p: Player) => {
    if (session.players.some((x) => x.id === p.id)) {
      dispatch({
        type: 'UPSERT_PLAYERS',
        players: session.players.map((x) => (x.id === p.id ? p : x)),
      });
    } else {
      dispatch({ type: 'UPSERT_PLAYERS', players: [...session.players, p] });
    }
  };

  const eventId = session.eventIds[0] ?? '333';

  const activeTeamCount = useMemo(
    () => session.teams.filter((t) => !t.disabled && t.playerIds.length === TEAM_PLAYERS).length,
    [session.teams],
  );

  const playerModal = (
    <PlayerEditModal
      open={playerModalOpen}
      onClose={closePlayerModal}
      editing={editingPlayer}
      schools={session.schools}
      onSave={savePlayerFromModal}
    />
  );

  return (
    <>
      {playerModal}
      {step === 0 && (
        <Card title={tr('teamMatch.schoolsStepTitle')}>
          <Typography.Paragraph type="secondary">{tr('teamMatch.schoolsHelp')}</Typography.Paragraph>
          <Space wrap style={{ marginBottom: 16 }}>
            <TeamRosterPasteCard session={session} dispatch={dispatch} />
            <SyncWcaAvatarsButton session={session} dispatch={dispatch} />
            <SyncCubingAvatarsButton session={session} dispatch={dispatch} />
          </Space>
          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>{tr('teamMatch.school')}</Typography.Title>
          <Form
            layout="inline"
            form={schoolForm}
            initialValues={{ kind: 'standard' as const }}
            onFinish={(v: { name?: string; kind: 'standard' | 'freelancer' }) => {
              if (v.kind === 'freelancer' && session.schools.some((x) => x.kind === 'freelancer')) {
                message.warning(tr('teamMatch.onePoolOnly'));
                return;
              }
              const raw = v.name?.trim() ?? '';
              if (v.kind === 'standard' && !raw) {
                message.warning(tr('teamMatch.schoolNameRequired'));
                return;
              }
              const displayName = v.kind === 'freelancer' ? raw || tr('teamMatch.independentPoolName') : raw;
              const s: School = { id: uuidv4(), name: displayName, kind: v.kind };
              dispatch({ type: 'UPSERT_SCHOOLS', schools: [...session.schools, s] });
              schoolForm.resetFields();
              schoolForm.setFieldsValue({ kind: 'standard' });
            }}
          >
            <Form.Item name="kind" label={tr('teamMatch.type')}>
              <Select
                style={{ width: 120 }}
                options={[
                  { label: tr('teamMatch.standardSchool'), value: 'standard' },
                  { label: tr('teamMatch.independentPool'), value: 'freelancer' },
                ]}
              />
            </Form.Item>
            <Form.Item name="name" label={tr('teamMatch.label')}>
              <Input placeholder={tr('teamMatch.schoolNameHint')} style={{ width: 220 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">{tr('teamMatch.add')}</Button>
            </Form.Item>
          </Form>
          <Table
            style={{ marginTop: 16 }}
            size="small"
            rowKey="id"
            dataSource={session.schools}
            pagination={false}
            columns={[
              { title: tr('teamMatch.label'), dataIndex: 'name' },
              {
                title: tr('teamMatch.type'),
                render: (_, r: School) => (r.kind === 'freelancer' ? tr('teamMatch.independentPool') : tr('teamMatch.standardSchool')),
              },
              {
                title: tr('teamMatch.actions'),
                render: (_, r: School) => (
                  <Button
                    type="link"
                    danger
                    size="small"
                    onClick={() =>
                      dispatch({
                        type: 'UPSERT_SCHOOLS',
                        schools: session.schools.filter((x) => x.id !== r.id),
                      })
                    }
                  >{tr('teamMatch.delete')}</Button>
                ),
              },
            ]}
          />
          <Typography.Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>{tr('teamMatch.players')}</Typography.Title>
          <Typography.Paragraph type="secondary">{tr('teamMatch.playersHelp')}</Typography.Paragraph>
          <Space style={{ marginBottom: 12 }} wrap>
            <Button type="primary" onClick={() => openPlayerModal(null)} disabled={!session.schools.length}>{tr('teamMatch.addPlayer')}</Button>
            <BulkOneUidImportModal session={session} dispatch={dispatch} disabled={session.players.length === 0} />
          </Space>
          <Table
            size="small"
            rowKey="id"
            dataSource={session.players}
            pagination={false}
            columns={[
              { title: tr('teamMatch.name'), dataIndex: 'name' },
              {
                title: tr('teamMatch.school'),
                render: (_, r: Player) => session.schools.find((s) => s.id === r.schoolId)?.name,
              },
              { title: 'WCA', dataIndex: 'wcaId' },
              { title: 'One', dataIndex: 'oneId' },
              {
                title: tr('teamMatch.avatar'),
                render: (_, r: Player) =>
                  r.avatarDataUrl ? (
                    <Image alt="" src={r.avatarDataUrl} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: 'var(--faint-foreground)' }}>—</span>
                  ),
              },
              {
                title: tr('teamMatch.actions'),
                render: (_, r: Player) => (
                  <Space>
                    <Button type="link" size="small" onClick={() => openPlayerModal(r)}>{tr('teamMatch.edit')}</Button>
                    <Button
                      type="link"
                      danger
                      size="small"
                      onClick={() =>
                        dispatch({
                          type: 'UPSERT_PLAYERS',
                          players: session.players.filter((p) => p.id !== r.id),
                        })
                      }
                    >{tr('teamMatch.delete')}</Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      )}

      {step === 1 && (
        <StepTeam
          session={session}
          dispatch={dispatch}
          activeTeamCount={activeTeamCount}
          openPlayerModal={openPlayerModal}
        />
      )}

      {step === 2 && (
        <StepScoreEntry session={session} dispatch={dispatch} eventId={eventId} />
      )}

      {step === 3 && (
        <StepTeamConfirm session={session} dispatch={dispatch} eventId={eventId} />
      )}

      {step === 4 && <StepElimDraw session={session} dispatch={dispatch} />}
      {step === 5 && (
        <>
          <Card title={tr('teamMatch.elimination')} className="tmElimStageCard">
            <EliminationStage
              liveSettings={liveUISettings}
              onOpenLiveSettings={() => setElimLiveSettingsOpen(true)}
            />
            <div style={{ marginTop: 20 }}>
              <Button
                type="primary"
                disabled={!isEliminationComplete(session)}
                onClick={() => {
                  dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_MAIN_POOL_CONFIRM });
                  message.success(tr('teamMatch.confirmMainOrder'));
                }}
              >{tr('teamMatch.nextMainPool')}</Button>
            </div>
          </Card>
          <LiveSettingsModal
            open={elimLiveSettingsOpen}
            onClose={() => setElimLiveSettingsOpen(false)}
            value={liveUISettings}
            onApply={(next) => {
              onLiveUISettingsChange(next);
              setElimLiveSettingsOpen(false);
            }}
          />
        </>
      )}
      {step === WIZARD_STEP_MAIN_POOL_CONFIRM && <StepMainPoolConfirm session={session} dispatch={dispatch} />}
      {step === WIZARD_STEP_MAIN_DRAW && <StepDraw session={session} dispatch={dispatch} />}
    </>
  );
};

type StepDrawProps = {
  session: TeamMatchSession;
  dispatch: ReturnType<typeof useTeamMatchStore>['dispatch'];
};

/** 抽签 / 保送展示：三人正式平均之和（与队伍确认主排序一致；任一人 DNF 或缺成绩则无效） */
function formatTeamAverageSumLine(team: Team, session: TeamMatchSession, locale: TeamMatchLocale): string {
  const ev = session.eventIds[0] ?? '333';
  const { sum, valid } = teamSeedingSum(team, session.players, session.seeding, ev, 'average');
  if (!valid) return tm(locale, 'teamMatch.sumAverageEmpty');
  return tm(locale, 'teamMatch.sumAverageValue', { p0: sum.toFixed(2) });
}

function schoolTagLabelForByeTeam(team: Team, session: TeamMatchSession, locale: TeamMatchLocale): string {
  if ((team.kind ?? 'school') === 'freelancer') {
    return teamKindLabel(team, session.schools, locale);
  }
  return session.schools.find((s) => s.id === team.schoolId)?.name ?? tm(locale, 'teamMatch.school');
}

const StepElimDraw: React.FC<StepDrawProps> = ({ session, dispatch }) => {
  const { t: tr, locale } = useTeamMatchI18n();
  useEffect(() => {
    dispatch({ type: 'ENSURE_ELIMINATION_STATE' });
  }, [dispatch]);

  const eventId = session.eventIds[0] ?? '333';
  const elim = session.elimination;
  const over16 = hasOverSixteenFullTeams(session);
  const [byeOpen, setByeOpen] = useState(false);
  const [byeDraft, setByeDraft] = useState<string[]>([]);

  const rankedTeams = useMemo(
    () =>
      sortTeamsBySeedingRank(
        session.teams,
        session.players,
        session.seeding,
        eventId,
        session.seedingPrimary,
      ),
    [session.teams, session.players, session.seeding, eventId, session.seedingPrimary],
  );

  useEffect(() => {
    if (byeOpen && elim) setByeDraft([...elim.byeTeamIds]);
  }, [byeOpen, elim]);

  const openByeModal = () => {
    setByeDraft([...(elim?.byeTeamIds ?? [])]);
    setByeOpen(true);
  };

  const toggleBye = (teamId: string, checked: boolean) => {
    if (checked) {
      if (byeDraft.length >= MAX_ELIMINATION_BYE_TEAMS) {
        message.warning(tr('teamMatch.byeLimit', { p0: MAX_ELIMINATION_BYE_TEAMS }));
        return;
      }
      setByeDraft((d) => [...d, teamId]);
    } else {
      setByeDraft((d) => d.filter((id) => id !== teamId));
    }
  };

  const waveBlocks = useMemo((): EliminationGroupMatch[][] => {
    if (!elim?.matches.length || !elim.waveSizes.length) return [];
    const out: EliminationGroupMatch[][] = [];
    let o = 0;
    for (const wn of elim.waveSizes) {
      out.push(elim.matches.slice(o, o + wn));
      o += wn;
    }
    return out;
  }, [elim?.matches, elim?.waveSizes]);

  const previewPoolCount =
    elim && elim.drawVersion >= 1 ? computeMainBracketTeamIds(session).length : null;

  if (!over16) {
    return (
      <Card title={tr('teamMatch.eliminationDraw')}>
        <Typography.Paragraph type="secondary">{tr('teamMatch.noPrelimNeeded', { p0: BRACKET_TEAM_COUNT })}</Typography.Paragraph>
        <Button
          type="primary"
          onClick={() => {
            dispatch({ type: 'SKIP_ELIMINATION_TO_MAIN_DRAW' });
            dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_MAIN_POOL_CONFIRM });
            message.success(tr('teamMatch.confirmMain'));
          }}
        >{tr('teamMatch.skipToPool')}</Button>
      </Card>
    );
  }

  return (
    <Card title={tr('teamMatch.eliminationDraw')}>
      <Typography.Paragraph type="secondary">{tr('teamMatch.eliminationRules', { p0: BRACKET_TEAM_COUNT, p1: BRACKET_TEAM_COUNT, p2: BRACKET_TEAM_COUNT, p3: BRACKET_TEAM_COUNT })}</Typography.Paragraph>
      <div style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary">{tr('teamMatch.groupSizeLabel')}</Typography.Text>
        <Radio.Group
          style={{ marginLeft: 12 }}
          value={elim?.groupSize ?? 3}
          onChange={(e) =>
            dispatch({ type: 'SET_ELIM_GROUP_SIZE', value: e.target.value as 2 | 3 | 4 })
          }
          options={[
            { label: tr('teamMatch.groupTwo'), value: 2 },
            { label: tr('teamMatch.groupThree'), value: 3 },
            { label: tr('teamMatch.groupFour'), value: 4 },
          ]}
        />
      </div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button onClick={openByeModal}>
          {tr('teamMatch.byeSelection', { p0: elim?.byeTeamIds.length ?? 0, p1: MAX_ELIMINATION_BYE_TEAMS })}
        </Button>
        <Button
          type="primary"
          onClick={() => {
            dispatch({ type: 'RANDOMIZE_ELIM_DRAW' });
            message.success(tr('teamMatch.randomGroupsDone'));
          }}
        >{tr('teamMatch.eliminationDraw')}</Button>
        <Popconfirm
          title={tr('teamMatch.skipElimQuestion')}
          description={tr('teamMatch.skipElimDescription', { p0: BRACKET_TEAM_COUNT })}
          onConfirm={() => {
            dispatch({ type: 'SKIP_ELIMINATION_TO_MAIN_DRAW' });
            dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_MAIN_POOL_CONFIRM });
            message.success(tr('teamMatch.skippedConfirm'));
          }}
          okText={tr('teamMatch.confirmSkip')}
          cancelText={tr('teamMatch.cancel')}
        >
          <Button>{tr('teamMatch.skipSelection')}</Button>
        </Popconfirm>
      </Space>
      {previewPoolCount !== null && elim && !elim.skipped && (
        <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>{tr('teamMatch.poolCount', { p0: previewPoolCount, p1: BRACKET_TEAM_COUNT })}</Typography.Paragraph>
      )}

      {elim && elim.drawVersion >= 1 && waveBlocks.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Typography.Title level={5}>{tr('teamMatch.groupPreview')}</Typography.Title>
          {waveBlocks.map((row, wi) => (
            <div key={wi} style={{ marginBottom: 16 }}>
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                {waveBlocks.length > 1 ? tr('teamMatch.waveNumber', { p0: wi + 1 }) : ''}
                {tr('teamMatch.groupMatches', { count: row.length })}
              </Typography.Text>
              <Space wrap>
                {row.map((m) => (
                  <Tag key={m.id}>
                    {m.teamIds
                      .map((tid) => session.teams.find((t) => t.id === tid)?.name ?? '?')
                      .join(' / ')}
                  </Tag>
                ))}
              </Space>
            </div>
          ))}
          {(elim.naturalByeTeamIds?.length > 0 || elim.naturalByeTeamId) && (
            <Typography.Text type="warning">{tr('teamMatch.naturalByeLine', { p0: (elim.naturalByeTeamIds?.length
                ? elim.naturalByeTeamIds
                : elim.naturalByeTeamId
                  ? [elim.naturalByeTeamId]
                  : []
              )
                .map((tid) => session.teams.find((t) => t.id === tid)?.name ?? tid)
                .join(' / ') })}</Typography.Text>
          )}
        </div>
      )}

      <Modal
        className="tm-workbench-modal"
        title={tr('teamMatch.byeSelection', { p0: byeDraft.length, p1: MAX_ELIMINATION_BYE_TEAMS })}
        open={byeOpen}
        onCancel={() => setByeOpen(false)}
        onOk={() => {
          dispatch({ type: 'SET_ELIM_BYE_TEAM_IDS', teamIds: byeDraft });
          setByeOpen(false);
          message.success(tr('teamMatch.byeUpdated'));
        }}
        width={620}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>{tr('teamMatch.byeOrderHint', { p0: MAX_ELIMINATION_BYE_TEAMS })}</Typography.Paragraph>
        <div style={{ maxHeight: 360, overflow: 'auto' }}>
          {rankedTeams.map((t) => {
            const full = !t.disabled && t.playerIds.length === TEAM_PLAYERS;
            if (!full) {
              return (
                <div key={t.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-default)' }}>
                  <Typography.Text type="secondary">
                    {t.name}
                    {t.disabled ? tr('teamMatch.disabledNoBye') : tr('teamMatch.incompleteNoBye')}
                  </Typography.Text>
                </div>
              );
            }
            return (
              <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-default)' }}>
                <Checkbox
                  checked={byeDraft.includes(t.id)}
                  disabled={!byeDraft.includes(t.id) && byeDraft.length >= MAX_ELIMINATION_BYE_TEAMS}
                  onChange={(e) => toggleBye(t.id, e.target.checked)}
                >
                  <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                    <Typography.Text strong>{t.name}</Typography.Text>
                    <Space wrap size={6}>
                      <Tag>{schoolTagLabelForByeTeam(t, session, locale)}</Tag>
                      <Tag color="processing">{formatTeamAverageSumLine(t, session, locale)}</Tag>
                    </Space>
                  </Space>
                </Checkbox>
              </div>
            );
          })}
        </div>
      </Modal>
    </Card>
  );
};

/** 淘汰赛首轮与 bracketGen 一致：槽位 2i vs 2i+1 */
function firstRoundPairsFromFlat(flat: (string | null)[]) {
  const pairs: { index: number; slotA: number; slotB: number; a: string | null; b: string | null }[] = [];
  for (let i = 0; i < 8; i++) {
    pairs.push({
      index: i,
      slotA: i * 2,
      slotB: i * 2 + 1,
      a: flat[i * 2] ?? null,
      b: flat[i * 2 + 1] ?? null,
    });
  }
  return pairs;
}

const StepDraw: React.FC<StepDrawProps> = ({ session, dispatch }) => {
  const { t: tr, locale } = useTeamMatchI18n();
  const eventIdDraw = session.eventIds[0] ?? '333';
  const bracketEligibleCount = useMemo(() => {
    const fromMain = session.mainBracketTeamIds;
    if (fromMain && fromMain.length >= MIN_TEAMS) return fromMain.length;
    return rankedBracketTeamIds(
      session.teams,
      session.players,
      session.seeding,
      eventIdDraw,
      session.seedingPrimary,
    ).length;
  }, [
    session.mainBracketTeamIds,
    session.teams,
    session.players,
    session.seeding,
    eventIdDraw,
    session.seedingPrimary,
  ]);

  const flat = useMemo(
    () =>
      session.flatSlots ??
      ([
        ...session.regionSlots[0],
        ...session.regionSlots[1],
        ...session.regionSlots[2],
        ...session.regionSlots[3],
      ] as (string | null)[]),
    [session.flatSlots, session.regionSlots],
  );

  const findTeam = (id: string | null) => (id ? session.teams.find((x) => x.id === id) ?? null : null);

  const renderSide = (tid: string | null, slotLabel: number) => {
    const t = findTeam(tid);
    const seed = t?.isSeed;
    return (
      <div className={`tmDrawPairSide ${seed ? 'tmDrawPairSideSeed' : ''}`}>
        <Space orientation="vertical" size={2} style={{ width: '100%' }}>
          <Space wrap size={6}>
            <Typography.Text strong ellipsis>
              {t ? t.name : tr('teamMatch.bye')}
            </Typography.Text>
            {t?.isSeed && (
              <Tag color="success" style={{ marginInlineEnd: 0 }}>{tr('teamMatch.seed')}</Tag>
            )}
          </Space>
          {t && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }} ellipsis>
              {teamKindLabel(t, session.schools, locale)}
            </Typography.Text>
          )}
          {t && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }} ellipsis>
              {formatTeamAverageSumLine(t, session, locale)}
            </Typography.Text>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{tr('teamMatch.slotNumber', { p0: slotLabel })}</Typography.Text>
        </Space>
      </div>
    );
  };

  return (
    <Card title={tr('teamMatch.drawTitle')}>
      <Space wrap align="center" style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary">{tr('teamMatch.randomMode')}</Typography.Text>
        <Radio.Group
          value={session.drawRandomMode}
          onChange={(e) => dispatch({ type: 'SET_DRAW_RANDOM_MODE', mode: e.target.value })}
          options={[
            { label: tr('teamMatch.scoreDraw'), value: 'score' },
            { label: tr('teamMatch.pureDraw'), value: 'pure' },
          ]}
        />
      </Space>
      <div style={{ marginBottom: 12 }}>
        <Checkbox
          checked={session.drawAvoidSameSchool}
          onChange={(e) => dispatch({ type: 'SET_DRAW_AVOID_SAME_SCHOOL', value: e.target.checked })}
        >{tr('teamMatch.avoidSchool')}</Checkbox>
      </div>
      <Space wrap>
        <Button
          type="primary"
          onClick={() => {
            if (bracketEligibleCount < MIN_TEAMS) {
              message.warning(
                tr('teamMatch.minimumDrawTeams', { p0: MIN_TEAMS, p1: BRACKET_TEAM_COUNT, p2: bracketEligibleCount }),
              );
              return;
            }
            dispatch({ type: 'RANDOMIZE_DRAW' });
            message.success(tr('teamMatch.drawDone'));
          }}
        >{tr('teamMatch.redraw')}</Button>
        <Button
          type="primary"
          onClick={() => {
            if (bracketEligibleCount < MIN_TEAMS) {
              message.warning(
                tr('teamMatch.minimumDrawTeams', { p0: MIN_TEAMS, p1: BRACKET_TEAM_COUNT, p2: bracketEligibleCount }),
              );
              return;
            }
            if (session.drawVersion < 1) {
              message.warning(tr('teamMatch.drawFirst'));
              return;
            }
            dispatch({ type: 'REBUILD_BRACKET' });
            dispatch({ type: 'SET_STATUS', status: 'live' });
            dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_MAIN_LIVE });
          }}
        >{tr('teamMatch.startCompetition')}</Button>
      </Space>
      <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>{tr('teamMatch.drawRules', { p0: BRACKET_TEAM_COUNT })}</Typography.Paragraph>

      <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>{tr('teamMatch.slotMap')}</Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>{tr('teamMatch.slotMapHelp')}</Typography.Paragraph>
      <div className="tmDrawGrid">
        {flat.map((tid, i) => {
          const t = tid ? session.teams.find((x) => x.id === tid) : null;
          const seed = !!t?.isSeed;
          return (
            <div
              key={i}
              className={`tmDrawCell ${!tid ? 'tmDrawCellEmpty' : ''} ${tid && seed ? 'tmDrawCellSeed' : ''}`}
            >
              {t ? (
                <>
                  <Space wrap size={4}>
                    <Typography.Text strong>{t.name}</Typography.Text>
                    {t.isSeed && (
                      <Tag color="success" style={{ margin: 0 }}>{tr('teamMatch.seed')}</Tag>
                    )}
                  </Space>
                  <Typography.Text type="secondary" style={{ fontSize: 10, lineHeight: 1.3 }} ellipsis>
                    {teamKindLabel(t, session.schools, locale)}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 10, lineHeight: 1.3 }} ellipsis>
                    {formatTeamAverageSumLine(t, session, locale)}
                  </Typography.Text>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>#{i + 1}</span>
                </>
              ) : (
                <>{tr('teamMatch.bye')}</>
              )}
            </div>
          );
        })}
      </div>

      {session.drawVersion >= 1 && (
        <div style={{ marginTop: 20 }}>
          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>{tr('teamMatch.firstRound')}</Typography.Title>
          {firstRoundPairsFromFlat(flat).map((p) => (
            <div key={p.index} className="tmDrawPairBlock">
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                {tr('teamMatch.matchNumber', { count: p.index + 1 })}
              </Typography.Text>
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                {renderSide(p.a, p.slotA + 1)}
                <div className="tmDrawPairVs">VS</div>
                {renderSide(p.b, p.slotB + 1)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

function mainPoolRoleTagColor(tag: string): string | undefined {
  if (tag === 'teamMatch.directEntry') return 'blue';
  if (tag === 'teamMatch.groupQualified') return 'green';
  if (tag === 'teamMatch.naturalBye') return 'cyan';
  if (tag === 'teamMatch.prelimEliminated') return 'red';
  if (tag === 'teamMatch.mainSixteen') return 'gold';
  if (tag === 'teamMatch.poolNotQualified') return 'orange';
  if (tag === 'teamMatch.groupPending') return 'processing';
  if (tag === 'teamMatch.outsideSixteen') return 'default';
  return undefined;
}

/** 预选赛结束或跳过淘汰后：展示全员成绩榜与预选赛结果，再写入 mainBracketTeamIds 进入抽签 */
const StepMainPoolConfirm: React.FC<StepDrawProps> = ({ session, dispatch }) => {
  const { t: tr, locale } = useTeamMatchI18n();
  const poolIds = useMemo(() => computeMainBracketTeamIds(session), [session]);
  const displayRows = useMemo(() => buildMainPoolDisplayRows(session), [session]);
  const elimSkipped = !!session.elimination?.skipped;
  const eventId = session.eventIds[0] ?? '333';
  const seedFromMain16 = useMemo(
    () =>
      new Set(
        pickSeedTeamIds(
          session.teams,
          session.players,
          session.seeding,
          eventId,
          session.seedingPrimary,
          poolIds,
        ),
      ),
    [session.teams, session.players, session.seeding, eventId, session.seedingPrimary, poolIds],
  );

  const rows = useMemo(
    () =>
      displayRows.map((dr) => {
        const team = session.teams.find((t) => t.id === dr.teamId);
        return {
          key: dr.teamId,
          rankInList: dr.rankInList,
          mainBracketRank: dr.mainBracketRank,
          roleTags: dr.roleTags,
          team,
          schoolLine: team ? teamKindLabel(team, session.schools, locale) : '—',
          avgLine: team ? formatTeamAverageSumLine(team, session, locale) : '—',
          seed: seedFromMain16.has(dr.teamId),
        };
      }),
    [displayRows, session, seedFromMain16, locale],
  );

  const seedPreviewLine = useMemo(() => {
    const ids = pickSeedTeamIds(
      session.teams,
      session.players,
      session.seeding,
      eventId,
      session.seedingPrimary,
      poolIds,
    );
    if (!ids.length) return tm(locale, 'teamMatch.noSeedsHint');
    return ids.map((id) => session.teams.find((t) => t.id === id)?.name ?? id).join(' / ');
  }, [session.teams, session.players, session.seeding, eventId, session.seedingPrimary, poolIds, locale]);

  return (
    <Card title={tr('teamMatch.mainPoolConfirm')}>
      <Space wrap style={{ marginBottom: 12 }}>
        <Typography.Text>{tr('teamMatch.seedPrimaryLabel')}</Typography.Text>
        <Select
          style={{ width: 120 }}
          value={session.seedingPrimary}
          onChange={(v) => dispatch({ type: 'SET_SEEDING_PRIMARY', primary: v })}
          options={[
            { label: tr('teamMatch.average'), value: 'average' },
            { label: tr('teamMatch.single'), value: 'single' },
          ]}
        />
        <Button
          type="primary"
          onClick={() => {
            dispatch({ type: 'COMPUTE_SEED_TEAMS' });
            message.success(tr('teamMatch.seedsComputed'));
          }}
        >{tr('teamMatch.computeSeeds')}</Button>
      </Space>
      <Typography.Paragraph type="secondary">
        {tr(elimSkipped ? 'teamMatch.mainPoolSkippedHelp' : 'teamMatch.mainPoolHelp', { count: BRACKET_TEAM_COUNT })}
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>{tr('teamMatch.seedPreview', { p0: seedPreviewLine })}</Typography.Paragraph>
      <Table
        size="small"
        pagination={false}
        dataSource={rows}
        rowKey="key"
        scroll={{ x: 'max-content' }}
        columns={[
          { title: tr('teamMatch.overallRank'), dataIndex: 'rankInList', width: 56 },
          { title: tr('teamMatch.team'), render: (_, r) => r.team?.name ?? r.key },
          { title: tr('teamMatch.affiliation'), dataIndex: 'schoolLine', ellipsis: true },
          { title: tr('teamMatch.sumAverage'), dataIndex: 'avgLine' },
          {
            title: tr('teamMatch.prelimQualification'),
            render: (_, r) => (
              <Space size={[4, 4]} wrap>
                {r.roleTags.map((t) => (
                  <Tag key={t} color={mainPoolRoleTagColor(t)}>
                    {tr(t)}
                  </Tag>
                ))}
              </Space>
            ),
          },
          {
            title: tr('teamMatch.mainRank'),
            width: 88,
            render: (_, r) => (r.mainBracketRank !== null ? tr('teamMatch.rankNumber', { p0: r.mainBracketRank }) : '—'),
          },
          {
            title: tr('teamMatch.seed'),
            width: 88,
            render: (_, r) => (r.seed ? <Tag color="success">{tr('teamMatch.seed')}</Tag> : '—'),
          },
        ]}
      />
      <div style={{ marginTop: 20 }}>
        <Button
          type="primary"
          disabled={poolIds.length < MIN_TEAMS}
          onClick={() => {
            dispatch({ type: 'CONFIRM_MAIN_BRACKET_POOL' });
            message.success(tr('teamMatch.rosterConfirmed'));
          }}
        >{tr('teamMatch.confirmRosterDraw')}</Button>
      </div>
    </Card>
  );
};

function usedPlayerIdsExceptTeam(session: TeamMatchSession, excludeTeamId: string | null): Set<string> {
  const s = new Set<string>();
  for (const t of session.teams) {
    if (excludeTeamId && t.id === excludeTeamId) continue;
    for (const id of t.playerIds) s.add(id);
  }
  return s;
}

type StepTeamProps = {
  session: TeamMatchSession;
  dispatch: ReturnType<typeof useTeamMatchStore>['dispatch'];
  activeTeamCount: number;
  openPlayerModal: (p: Player | null) => void;
};

const StepTeam: React.FC<StepTeamProps> = ({ session, dispatch, activeTeamCount, openPlayerModal }) => {
  const { t: tr, locale } = useTeamMatchI18n();
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const openTeamModal = (t: Team | null) => {
    setEditingTeam(t);
    setTeamModalOpen(true);
  };

  const closeTeamModal = () => {
    setTeamModalOpen(false);
    setEditingTeam(null);
  };

  const saveTeam = (t: Team) => {
    if (t.kind === 'freelancer' && !session.schools.some((s) => s.id === t.schoolId)) {
      dispatch({
        type: 'UPSERT_SCHOOLS',
        schools: [...session.schools, { id: t.schoolId, name: tr('teamMatch.independentPoolName'), kind: 'freelancer' }],
      });
    }
    if (session.teams.some((x) => x.id === t.id)) {
      dispatch({
        type: 'UPSERT_TEAMS',
        teams: session.teams.map((x) => (x.id === t.id ? t : x)),
      });
    } else {
      dispatch({ type: 'UPSERT_TEAMS', teams: [...session.teams, t] });
    }
  };

  const usedForModal = usedPlayerIdsExceptTeam(session, editingTeam?.id ?? null);

  return (
    <Card title={tr('teamMatch.teamsStepTitle')}>
      <Typography.Paragraph type="secondary">{tr('teamMatch.teamFormationHelp', { p0: MIN_TEAMS, p1: MAX_ROSTER_TEAMS, p2: BRACKET_TEAM_COUNT, p3: BRACKET_TEAM_COUNT })}</Typography.Paragraph>
      <Space wrap style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => openPlayerModal(null)}>{tr('teamMatch.addPlayer')}</Button>
        <Button type="primary" onClick={() => openTeamModal(null)}>{tr('teamMatch.addTeam')}</Button>
      </Space>
      <TeamEditModal
        open={teamModalOpen}
        onClose={closeTeamModal}
        editing={editingTeam}
        schools={session.schools}
        players={session.players}
        usedPlayerIds={usedForModal}
        activeTeamCount={activeTeamCount}
        onSave={saveTeam}
      />
      <Table
        style={{ marginTop: 16 }}
        size="small"
        rowKey="id"
        dataSource={session.teams}
        pagination={false}
        columns={[
          { title: tr('teamMatch.teamName'), dataIndex: 'name' },
          {
            title: tr('teamMatch.affiliation'),
            render: (_, r: Team) => teamKindLabel(r, session.schools, locale),
          },
          {
            title: tr('teamMatch.player'),
            render: (_, r: Team) => (
              <Space wrap size={[8, 8]}>
                {r.playerIds.map((pid) => {
                  const p = session.players.find((x) => x.id === pid);
                  if (!p) return null;
                  return (
                    <Space key={pid} size={6} align="center">
                      <Avatar src={p.avatarDataUrl ?? undefined} size={32}>
                        {p.name.slice(0, 1)}
                      </Avatar>
                      <span>{p.name}</span>
                    </Space>
                  );
                })}
              </Space>
            ),
          },
          {
            title: tr('teamMatch.playerCount'),
            render: (_, r: Team) => r.playerIds.length,
          },
          {
            title: tr('teamMatch.actions'),
            width: 160,
            render: (_, r: Team) => (
              <Space size="small">
                <Button type="link" size="small" onClick={() => openTeamModal(r)}>{tr('teamMatch.edit')}</Button>
                <Popconfirm
                  title={tr('teamMatch.deleteTeamQuestion')}
                  description={tr('teamMatch.deleteTeamHelp')}
                  onConfirm={() => dispatch({ type: 'DELETE_TEAM', teamId: r.id })}
                  okText={tr('teamMatch.delete')}
                  cancelText={tr('teamMatch.cancel')}
                >
                  <Button type="link" size="small" danger>{tr('teamMatch.delete')}</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>{tr('teamMatch.activeTeams', { p0: activeTeamCount })}</Typography.Paragraph>
    </Card>
  );
};

type StepScoreOrConfirmProps = {
  session: TeamMatchSession;
  dispatch: ReturnType<typeof useTeamMatchStore>['dispatch'];
  eventId: string;
};

function patchSeedingEntry(
  session: TeamMatchSession,
  eventId: string,
  playerId: string,
  patch: Partial<SeedingEntry>,
): SeedingEntry[] {
  const next = [...session.seeding];
  const idx = next.findIndex((e) => e.playerId === playerId && e.eventId === eventId);
  if (idx >= 0) {
    next[idx] = { ...next[idx], ...patch };
  } else {
    next.push({
      playerId,
      eventId,
      single: null,
      average: null,
      adoptStrategy: undefined,
      wcaBest: null,
      oneBest: null,
      preliminary: null,
      ...patch,
    });
  }
  return next;
}

function useSeedingTableHelpers(session: TeamMatchSession, eventId: string, dispatch: StepScoreOrConfirmProps['dispatch']) {
  const { t: tr, locale } = useTeamMatchI18n();
  const [seedingModalPlayer, setSeedingModalPlayer] = useState<Player | null>(null);
  const [batchPrelimOpen, setBatchPrelimOpen] = useState(false);

  const renderPlayerRow = (player: Player) => {
    const r =
      session.seeding.find((e) => e.playerId === player.id && e.eventId === eventId) ?? ({
        playerId: player.id,
        eventId,
        single: null,
        average: null,
        adoptStrategy: undefined,
        wcaBest: null,
        oneBest: null,
        preliminary: null,
      } as SeedingEntry);

    const fmt = (v: number | 'DNF' | null) =>
      v === 'DNF' ? 'DNF' : v === null ? '—' : String(v);

    const sourceInline = r.activeSource ? seedingSourceLabel(r.activeSource, locale) : '—';

    const pre = r.preliminary;
    const hasPre =
      pre &&
      (pre.single !== null ||
        pre.average !== null ||
        pre.single === 'DNF' ||
        pre.average === 'DNF');

    return {
      key: player.id,
      playerCell: (
        <Space>
          <Avatar src={player.avatarDataUrl ?? undefined} size={32}>
            {player.name.slice(0, 1)}
          </Avatar>
          {player.name}
        </Space>
      ),
      scores: (
        <Space orientation="vertical" size={2}>
          <Typography.Text type="secondary">{tr('teamMatch.officialScoreLine', { p0: fmt(r.single), p1: fmt(r.average), p2: sourceInline })}</Typography.Text>
          {hasPre && pre && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{tr('teamMatch.prelimScoreLine', { p0: fmt(pre.single), p1: fmt(pre.average) })}</Typography.Text>
          )}
        </Space>
      ),
      action: (
        <Button size="small" type="primary" onClick={() => setSeedingModalPlayer(player)}>{tr('teamMatch.editScores')}</Button>
      ),
    };
  };

  const columns = [
    { title: tr('teamMatch.players'), dataIndex: 'playerCell' },
    { title: tr('teamMatch.scores'), dataIndex: 'scores' },
    { title: tr('teamMatch.actions'), dataIndex: 'action', width: 120 },
  ];

  const seedingModalEntry: SeedingEntry | null = seedingModalPlayer
    ? session.seeding.find(
        (e) => e.playerId === seedingModalPlayer.id && e.eventId === eventId,
      ) ?? {
        playerId: seedingModalPlayer.id,
        eventId,
        single: null,
        average: null,
        adoptStrategy: undefined,
        wcaBest: null,
        oneBest: null,
        preliminary: null,
      }
    : null;

  const modal = (
    <>
      <SeedingPlayerModal
        open={!!seedingModalPlayer}
        onClose={() => setSeedingModalPlayer(null)}
        player={seedingModalPlayer}
        eventId={eventId}
        entry={seedingModalEntry}
        onSave={(next) =>
          dispatch({
            type: 'SET_SEEDING',
            seeding: patchSeedingEntry(session, eventId, next.playerId, next),
          })
        }
      />
      <PreliminaryBatchModal
        open={batchPrelimOpen}
        onClose={() => setBatchPrelimOpen(false)}
        session={session}
        eventId={eventId}
        dispatch={dispatch}
      />
    </>
  );

  return { renderPlayerRow, columns, modal, openBatchPrelim: () => setBatchPrelimOpen(true) };
}

const StepScoreEntry: React.FC<StepScoreOrConfirmProps> = ({ session, dispatch, eventId }) => {
  const { t: tr, locale } = useTeamMatchI18n();
  const { renderPlayerRow, columns, modal, openBatchPrelim } = useSeedingTableHelpers(session, eventId, dispatch);
  const inAnyTeam = useMemo(() => {
    const s = new Set<string>();
    for (const t of session.teams) {
      for (const id of t.playerIds) s.add(id);
    }
    return s;
  }, [session.teams]);

  const orphanPlayers = useMemo(
    () => session.players.filter((p) => !inAnyTeam.has(p.id)),
    [session.players, inAnyTeam],
  );

  const teamsSorted = useMemo(
    () =>
      sortTeamsBySeedingRank(
        session.teams,
        session.players,
        session.seeding,
        eventId,
        session.seedingPrimary,
      ),
    [session.teams, session.players, session.seeding, eventId, session.seedingPrimary],
  );

  const bracketEligibleIds = useMemo(
    () =>
      new Set(
        rankedBracketTeamIds(
          session.teams,
          session.players,
          session.seeding,
          eventId,
          session.seedingPrimary,
        ),
      ),
    [session.teams, session.players, session.seeding, eventId, session.seedingPrimary],
  );

  return (
    <Card title={tr('teamMatch.scoresStepTitle')}>
      {modal}
      <Space wrap style={{ marginBottom: 12 }}>
        <Button onClick={openBatchPrelim}>{tr('teamMatch.batchPrelimEntry')}</Button>
        <BulkFillSeedingButton session={session} dispatch={dispatch} />
      </Space>
      <OneCompPrelimImportCard session={session} dispatch={dispatch} />
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12, marginTop: 12 }}>{tr('teamMatch.scoreEntryHelp', { p0: BRACKET_TEAM_COUNT, p1: BRACKET_TEAM_COUNT, p2: BRACKET_TEAM_COUNT })}</Typography.Paragraph>

      {teamsSorted.map((team) => {
        const schoolName = teamKindLabel(team, session.schools, locale);
        const rows = team.playerIds
          .map((pid) => session.players.find((p) => p.id === pid))
          .filter((p): p is Player => !!p)
          .map((p) => renderPlayerRow(p));

        return (
          <Card
            key={team.id}
            size="small"
            style={{ marginBottom: 12 }}
            title={
              <Space wrap>
                <Typography.Text strong>{team.name}</Typography.Text>
                <Typography.Text type="secondary">· {schoolName}</Typography.Text>
                {team.disabled && <Typography.Text type="danger">{tr('teamMatch.disabled')}</Typography.Text>}
                {!team.disabled && team.playerIds.length === TEAM_PLAYERS && (
                  <>
                    {bracketEligibleIds.has(team.id) ? (
                      <Tag color="processing">{tr('teamMatch.qualifiedMain')}</Tag>
                    ) : (
                      <Tag>{tr('teamMatch.outsideTop', { p0: BRACKET_TEAM_COUNT })}</Tag>
                    )}
                  </>
                )}
              </Space>
            }
          >
            <Table size="small" rowKey="key" pagination={false} columns={columns} dataSource={rows} scroll={{ x: true }} />
          </Card>
        );
      })}

      {orphanPlayers.length > 0 && (
        <Card size="small" type="inner" title={tr('teamMatch.unassignedPlayers')} style={{ marginBottom: 12 }}>
          <Table
            size="small"
            rowKey="key"
            pagination={false}
            columns={columns}
            dataSource={orphanPlayers.map((p) => renderPlayerRow(p))}
            scroll={{ x: true }}
          />
        </Card>
      )}
    </Card>
  );
};

const StepTeamConfirm: React.FC<StepScoreOrConfirmProps> = ({ session, dispatch, eventId }) => {
  const { t: tr, locale } = useTeamMatchI18n();
  const { renderPlayerRow, columns: confirmColumns, modal: confirmSeedingModal } = useSeedingTableHelpers(
    session,
    eventId,
    dispatch,
  );

  const teamsSorted = useMemo(
    () =>
      sortTeamsBySeedingRank(
        session.teams,
        session.players,
        session.seeding,
        eventId,
        session.seedingPrimary,
      ),
    [session.teams, session.players, session.seeding, eventId, session.seedingPrimary],
  );

  const bracketEligibleIds = useMemo(
    () =>
      new Set(
        rankedBracketTeamIds(
          session.teams,
          session.players,
          session.seeding,
          eventId,
          session.seedingPrimary,
        ),
      ),
    [session.teams, session.players, session.seeding, eventId, session.seedingPrimary],
  );

  return (
    <Card title={tr('teamMatch.confirmStepTitle')}>
      {confirmSeedingModal}
      <Space wrap style={{ marginBottom: 12 }}>
        <Typography.Text>{tr('teamMatch.primaryRankLabel')}</Typography.Text>
        <Select
          style={{ width: 120 }}
          value={session.seedingPrimary}
          onChange={(v) => dispatch({ type: 'SET_SEEDING_PRIMARY', primary: v })}
          options={[
            { label: tr('teamMatch.average'), value: 'average' },
            { label: tr('teamMatch.single'), value: 'single' },
          ]}
        />
      </Space>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>{tr('teamMatch.confirmationHelp', { p0: BRACKET_TEAM_COUNT, p1: BRACKET_TEAM_COUNT })}</Typography.Paragraph>

      {teamsSorted.map((team) => {
        const schoolName = teamKindLabel(team, session.schools, locale);
        const rows = team.playerIds
          .map((pid) => session.players.find((p) => p.id === pid))
          .filter((p): p is Player => !!p)
          .map((p) => renderPlayerRow(p));

        return (
          <Card
            key={team.id}
            size="small"
            style={{ marginBottom: 12 }}
            title={
              <Space wrap>
                <Typography.Text strong>{team.name}</Typography.Text>
                <Typography.Text type="secondary">· {schoolName}</Typography.Text>
                {team.disabled && <Typography.Text type="danger">{tr('teamMatch.disabled')}</Typography.Text>}
                {!team.disabled && team.playerIds.length === TEAM_PLAYERS && (
                  <>
                    {bracketEligibleIds.has(team.id) ? (
                      <Tag color="processing">{tr('teamMatch.qualifiedMain')}</Tag>
                    ) : (
                      <Tag>{tr('teamMatch.outsideTop', { p0: BRACKET_TEAM_COUNT })}</Tag>
                    )}
                  </>
                )}
              </Space>
            }
            extra={
              <Space align="center" size={8}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{tr('teamMatch.absent')}</Typography.Text>
                <Switch
                  checked={team.disabled}
                  onChange={(c) => dispatch({ type: 'SET_TEAM_DISABLED', teamId: team.id, disabled: c })}
                />
              </Space>
            }
          >
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              columns={confirmColumns}
              dataSource={rows}
              scroll={{ x: true }}
            />
          </Card>
        );
      })}
    </Card>
  );
};

export default TeamMatchSteps;
