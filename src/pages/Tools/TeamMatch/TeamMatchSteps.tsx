import BulkFillSeedingButton from '@/pages/Tools/TeamMatch/components/BulkFillSeedingButton';
import BulkOneUidImportModal from '@/pages/Tools/TeamMatch/components/BulkOneUidImportModal';
import EliminationStage from '@/pages/Tools/TeamMatch/components/EliminationStage';
import LiveSettingsModal from '@/pages/Tools/TeamMatch/components/LiveSettingsModal';
import OneCompPrelimImportCard from '@/pages/Tools/TeamMatch/components/OneCompPrelimImportCard';
import PreliminaryBatchModal from '@/pages/Tools/TeamMatch/components/PreliminaryBatchModal';
import PlayerEditModal from '@/pages/Tools/TeamMatch/components/PlayerEditModal';
import SeedingPlayerModal from '@/pages/Tools/TeamMatch/components/SeedingPlayerModal';
import TeamEditModal from '@/pages/Tools/TeamMatch/components/TeamEditModal';
import SyncCubingAvatarsButton from '@/pages/Tools/TeamMatch/components/SyncCubingAvatarsButton';
import SyncWcaAvatarsButton from '@/pages/Tools/TeamMatch/components/SyncWcaAvatarsButton';
import TeamRosterPasteCard from '@/pages/Tools/TeamMatch/components/TeamRosterPasteCard';
import { buildMainPoolDisplayRows, computeMainBracketTeamIds, isEliminationComplete } from '@/pages/Tools/TeamMatch/eliminationResolve';
import type { LiveUISettings } from '@/pages/Tools/TeamMatch/liveUiSettings';
import { useTeamMatchStore } from '@/pages/Tools/TeamMatch/TeamMatchContext';
import { hasOverSixteenFullTeams } from '@/pages/Tools/TeamMatch/stepAccess';
import { pickSeedTeamIds, rankedBracketTeamIds, sortTeamsBySeedingRank, teamSeedingSum } from '@/pages/Tools/TeamMatch/seedingMath';
import { SEEDING_SOURCE_INLINE } from '@/pages/Tools/TeamMatch/seedingScorePick';
import { teamKindLabel } from '@/pages/Tools/TeamMatch/teamClassify';
import type { EliminationGroupMatch, Player, School, SeedingEntry, Team, TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import {
  BRACKET_TEAM_COUNT,
  MAX_ELIMINATION_BYE_TEAMS,
  MAX_ROSTER_TEAMS,
  MIN_TEAMS,
  TEAM_PLAYERS,
  WIZARD_STEP_MAIN_DRAW,
  WIZARD_STEP_MAIN_LIVE,
  WIZARD_STEP_MAIN_POOL_CONFIRM,
} from '@/pages/Tools/TeamMatch/types';
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
import { v4 as uuidv4 } from 'uuid';

type TeamMatchStepsProps = {
  liveUISettings: LiveUISettings;
  onLiveUISettingsChange: (next: LiveUISettings) => void;
};

/* 子步骤组件定义在文件后部，运行时在渲染前已完成初始化 */
/* eslint-disable @typescript-eslint/no-use-before-define */
const TeamMatchSteps: React.FC<TeamMatchStepsProps> = ({ liveUISettings, onLiveUISettingsChange }) => {
  const { state, dispatch } = useTeamMatchStore();
  const { session } = state;
  const step = session.wizardStep;
  const [elimLiveSettingsOpen, setElimLiveSettingsOpen] = React.useState(false);

  const [schoolForm] = Form.useForm();

  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const openPlayerModal = (p: Player | null) => {
    if (!session.schools.length) {
      message.warning('请先添加学校');
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
        <Card title="1. 学校与选手">
          <Typography.Paragraph type="secondary">
            添加普通学校与选手；另可添加<strong>一个</strong>「自由人池」学校，挂靠于其的选手可参与自由人队。组队时学校队与自由人队规则不同，见步骤 2。可点击「粘贴导入」批量添加学校、选手与队伍。
          </Typography.Paragraph>
          <Space wrap style={{ marginBottom: 16 }}>
            <TeamRosterPasteCard session={session} dispatch={dispatch} />
            <SyncWcaAvatarsButton session={session} dispatch={dispatch} />
            <SyncCubingAvatarsButton session={session} dispatch={dispatch} />
          </Space>
          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
            学校
          </Typography.Title>
          <Form
            layout="inline"
            form={schoolForm}
            initialValues={{ kind: 'standard' as const }}
            onFinish={(v: { name?: string; kind: 'standard' | 'freelancer' }) => {
              if (v.kind === 'freelancer' && session.schools.some((x) => x.kind === 'freelancer')) {
                message.warning('已存在自由人池学校，全场仅保留一个');
                return;
              }
              const raw = v.name?.trim() ?? '';
              if (v.kind === 'standard' && !raw) {
                message.warning('请填写学校名称');
                return;
              }
              const displayName = v.kind === 'freelancer' ? raw || '自由人' : raw;
              const s: School = { id: uuidv4(), name: displayName, kind: v.kind };
              dispatch({ type: 'UPSERT_SCHOOLS', schools: [...session.schools, s] });
              schoolForm.resetFields();
              schoolForm.setFieldsValue({ kind: 'standard' });
            }}
          >
            <Form.Item name="kind" label="类型">
              <Select
                style={{ width: 120 }}
                options={[
                  { label: '普通学校', value: 'standard' },
                  { label: '自由人池', value: 'freelancer' },
                ]}
              />
            </Form.Item>
            <Form.Item name="name" label="名称">
              <Input placeholder="普通校填校名；自由人池可留空默认「自由人」" style={{ width: 220 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
            </Form.Item>
          </Form>
          <Table
            style={{ marginTop: 16 }}
            size="small"
            rowKey="id"
            dataSource={session.schools}
            pagination={false}
            columns={[
              { title: '名称', dataIndex: 'name' },
              {
                title: '类型',
                render: (_, r: School) => (r.kind === 'freelancer' ? '自由人池' : '普通学校'),
              },
              {
                title: '操作',
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
                  >
                    删除
                  </Button>
                ),
              },
            ]}
          />
          <Typography.Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
            选手
          </Typography.Title>
          <Typography.Paragraph type="secondary">通过弹窗新增或编辑选手，头像在弹窗内上传。</Typography.Paragraph>
          <Space style={{ marginBottom: 12 }} wrap>
            <Button type="primary" onClick={() => openPlayerModal(null)} disabled={!session.schools.length}>
              新增选手
            </Button>
            <BulkOneUidImportModal session={session} dispatch={dispatch} disabled={session.players.length === 0} />
          </Space>
          <Table
            size="small"
            rowKey="id"
            dataSource={session.players}
            pagination={false}
            columns={[
              { title: '姓名', dataIndex: 'name' },
              {
                title: '学校',
                render: (_, r: Player) => session.schools.find((s) => s.id === r.schoolId)?.name,
              },
              { title: 'WCA', dataIndex: 'wcaId' },
              { title: 'One', dataIndex: 'oneId' },
              {
                title: '头像',
                render: (_, r: Player) =>
                  r.avatarDataUrl ? (
                    <img alt="" src={r.avatarDataUrl} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#999' }}>—</span>
                  ),
              },
              {
                title: '操作',
                render: (_, r: Player) => (
                  <Space>
                    <Button type="link" size="small" onClick={() => openPlayerModal(r)}>
                      编辑
                    </Button>
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
                    >
                      删除
                    </Button>
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
          <Card title="淘汰赛" className="tmElimStageCard">
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
                  message.success('请确认正赛名单与排序');
                }}
              >
                下一步：确认正赛名单
              </Button>
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
/* eslint-enable @typescript-eslint/no-use-before-define */

type StepDrawProps = {
  session: TeamMatchSession;
  dispatch: ReturnType<typeof useTeamMatchStore>['dispatch'];
};

/** 抽签 / 保送展示：三人正式平均之和（与队伍确认主排序一致；任一人 DNF 或缺成绩则无效） */
function formatTeamAverageSumLine(team: Team, session: TeamMatchSession): string {
  const ev = session.eventIds[0] ?? '333';
  const { sum, valid } = teamSeedingSum(team, session.players, session.seeding, ev, 'average');
  if (!valid) return '合计平均：—';
  return `合计平均：${sum.toFixed(2)}s`;
}

function schoolTagLabelForByeTeam(team: Team, session: TeamMatchSession): string {
  if ((team.kind ?? 'school') === 'freelancer') {
    return teamKindLabel(team, session.schools);
  }
  return session.schools.find((s) => s.id === team.schoolId)?.name ?? '学校';
}

const StepElimDraw: React.FC<StepDrawProps> = ({ session, dispatch }) => {
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
        message.warning(`保送最多 ${MAX_ELIMINATION_BYE_TEAMS} 支队伍`);
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
      <Card title="淘汰赛抽签">
        <Typography.Paragraph type="secondary">
          当前满编有效队伍不超过 {BRACKET_TEAM_COUNT} 支，无需进行预选赛 PK。点击下方按钮进入「正赛名单」核对排序后再抽签。
        </Typography.Paragraph>
        <Button
          type="primary"
          onClick={() => {
            dispatch({ type: 'SKIP_ELIMINATION_TO_MAIN_DRAW' });
            dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_MAIN_POOL_CONFIRM });
            message.success('请确认正赛名单');
          }}
        >
          跳过淘汰赛，进入正赛名单
        </Button>
      </Card>
    );
  }

  return (
    <Card title="淘汰赛抽签">
      <Typography.Paragraph type="secondary">
        超过 {BRACKET_TEAM_COUNT} 支满编队时需决出正赛 {BRACKET_TEAM_COUNT} 强。预选赛按「每场小组」抽签：一场小组 = 多支队伍<strong>同一场地、同一次 PK</strong>比总秒，只晋级 1 队（例如选「3 队同场」即一场 1v1v1，<strong>不是</strong>三场互不相关的 1v1）。
        举例：共 6 支参赛队、每场 3 队同场 → 共 <strong>2 场</strong>小组战（两场 1v1v1），不会变成 3 场 1v1。
        若保送、晋级与轮空合计超过 {BRACKET_TEAM_COUNT} 支，按成绩排序取前 {BRACKET_TEAM_COUNT} 支进入正赛。
      </Typography.Paragraph>
      <div style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary">每场小组上场队数（同场竞技、只晋级 1 队）：</Typography.Text>
        <Radio.Group
          style={{ marginLeft: 12 }}
          value={elim?.groupSize ?? 3}
          onChange={(e) =>
            dispatch({ type: 'SET_ELIM_GROUP_SIZE', value: e.target.value as 2 | 3 | 4 })
          }
          options={[
            { label: '2（一场 1v1）', value: 2 },
            { label: '3（一场 1v1v1）', value: 3 },
            { label: '4（一场 4 队争 1）', value: 4 },
          ]}
        />
      </div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button onClick={openByeModal}>
          保送队伍选择（{elim?.byeTeamIds.length ?? 0}/{MAX_ELIMINATION_BYE_TEAMS}）
        </Button>
        <Button
          type="primary"
          onClick={() => {
            dispatch({ type: 'RANDOMIZE_ELIM_DRAW' });
            message.success('已随机分组');
          }}
        >
          淘汰赛抽签
        </Button>
        <Popconfirm
          title="跳过淘汰赛？"
          description={`将直接按成绩排名前 ${BRACKET_TEAM_COUNT} 进入正赛名单确认，不进行预选赛 PK。`}
          onConfirm={() => {
            dispatch({ type: 'SKIP_ELIMINATION_TO_MAIN_DRAW' });
            dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_MAIN_POOL_CONFIRM });
            message.success('已跳过预选赛，请确认正赛名单');
          }}
          okText="确定跳过"
          cancelText="取消"
        >
          <Button>跳过选择</Button>
        </Popconfirm>
      </Space>
      {previewPoolCount !== null && elim && !elim.skipped && (
        <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
          当前晋级池按规则可得 <strong>{previewPoolCount}</strong> 支正赛名额（至多 {BRACKET_TEAM_COUNT} 支抽签）。
        </Typography.Paragraph>
      )}

      {elim && elim.drawVersion >= 1 && waveBlocks.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Typography.Title level={5}>分组预览（每标签 = 一场多队同场小组）</Typography.Title>
          {waveBlocks.map((row, wi) => (
            <div key={wi} style={{ marginBottom: 16 }}>
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                {waveBlocks.length > 1 ? `第 ${wi + 1} 波 · ` : ''}
                {row.length} 场小组
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
            <Typography.Text type="warning">
              无法成组（仅 1 队）、直接进入晋级池：
              {(elim.naturalByeTeamIds?.length
                ? elim.naturalByeTeamIds
                : elim.naturalByeTeamId
                  ? [elim.naturalByeTeamId]
                  : []
              )
                .map((tid) => session.teams.find((t) => t.id === tid)?.name ?? tid)
                .join('、')}
            </Typography.Text>
          )}
        </div>
      )}

      <Modal
        title={`保送队伍选择（${byeDraft.length}/${MAX_ELIMINATION_BYE_TEAMS}）`}
        open={byeOpen}
        onCancel={() => setByeOpen(false)}
        onOk={() => {
          dispatch({ type: 'SET_ELIM_BYE_TEAM_IDS', teamIds: byeDraft });
          setByeOpen(false);
          message.success('已更新保送名单');
        }}
        width={620}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          顺序与队伍确认一致；最多 {MAX_ELIMINATION_BYE_TEAMS} 支。
        </Typography.Paragraph>
        <div style={{ maxHeight: 360, overflow: 'auto' }}>
          {rankedTeams.map((t) => {
            const full = !t.disabled && t.playerIds.length === TEAM_PLAYERS;
            if (!full) {
              return (
                <div key={t.id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Typography.Text type="secondary">
                    {t.name}
                    {t.disabled ? '（已禁用，不可保送）' : '（未满编，不可保送）'}
                  </Typography.Text>
                </div>
              );
            }
            return (
              <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Checkbox
                  checked={byeDraft.includes(t.id)}
                  disabled={!byeDraft.includes(t.id) && byeDraft.length >= MAX_ELIMINATION_BYE_TEAMS}
                  onChange={(e) => toggleBye(t.id, e.target.checked)}
                >
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Typography.Text strong>{t.name}</Typography.Text>
                    <Space wrap size={6}>
                      <Tag>{schoolTagLabelForByeTeam(t, session)}</Tag>
                      <Tag color="processing">{formatTeamAverageSumLine(t, session)}</Tag>
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
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Space wrap size={6}>
            <Typography.Text strong ellipsis>
              {t ? t.name : '轮空'}
            </Typography.Text>
            {t?.isSeed && (
              <Tag color="success" style={{ marginInlineEnd: 0 }}>
                种子
              </Tag>
            )}
          </Space>
          {t && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }} ellipsis>
              {teamKindLabel(t, session.schools)}
            </Typography.Text>
          )}
          {t && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }} ellipsis>
              {formatTeamAverageSumLine(t, session)}
            </Typography.Text>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            槽位 #{slotLabel}
          </Typography.Text>
        </Space>
      </div>
    );
  };

  return (
    <Card title="正赛抽签 · 分区与抽签">
      <Space wrap align="center" style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary">随机方式：</Typography.Text>
        <Radio.Group
          value={session.drawRandomMode}
          onChange={(e) => dispatch({ type: 'SET_DRAW_RANDOM_MODE', mode: e.target.value })}
          options={[
            { label: '按成绩分区（与种子强弱相关）', value: 'score' },
            { label: '完全随机（不参考成绩）', value: 'pure' },
          ]}
        />
      </Space>
      <div style={{ marginBottom: 12 }}>
        <Checkbox
          checked={session.drawAvoidSameSchool}
          onChange={(e) => dispatch({ type: 'SET_DRAW_AVOID_SAME_SCHOOL', value: e.target.checked })}
        >
          首轮同校避战（学校队尽量不首轮相遇；自由人队不参与）
        </Checkbox>
      </div>
      <Space wrap>
        <Button
          type="primary"
          onClick={() => {
            if (bracketEligibleCount < MIN_TEAMS) {
              message.warning(
                `按成绩排名进入正赛至少 ${MIN_TEAMS} 支队伍（满编未缺席中取前 ${BRACKET_TEAM_COUNT} 名），当前 ${bracketEligibleCount} 支`,
              );
              return;
            }
            dispatch({ type: 'RANDOMIZE_DRAW' });
            message.success('已随机填充分区（种子在四区首位）');
          }}
        >
          重新随机分区
        </Button>
        <Button
          type="primary"
          onClick={() => {
            if (bracketEligibleCount < MIN_TEAMS) {
              message.warning(
                `按成绩排名进入正赛至少 ${MIN_TEAMS} 支队伍（满编未缺席中取前 ${BRACKET_TEAM_COUNT} 名），当前 ${bracketEligibleCount} 支`,
              );
              return;
            }
            if (session.drawVersion < 1) {
              message.warning('请先点击「重新随机分区」生成对阵槽位');
              return;
            }
            dispatch({ type: 'REBUILD_BRACKET' });
            dispatch({ type: 'SET_STATUS', status: 'live' });
            dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_MAIN_LIVE });
          }}
        >
          开始比赛
        </Button>
      </Space>
      <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
        四区 × 四槽，共 16 位；首轮相邻两槽为一组对阵（与正赛首轮一致）。登记队伍可多于 16
        支时，仅「按成绩排名前 {BRACKET_TEAM_COUNT}」的满编未缺席队参与抽签与对阵。选择「按成绩」时：非种子先按总分排序，再在相邻约 4
        队一段内随机打乱，随后填入内部/对位；有种子且人数够时，可在<strong>有合计平均</strong>的队中让成绩最差的 2
        支不进种子对位（无合计平均的不算最差）。选择「完全随机」时：非种子<strong>不按成绩排序</strong>，整体一次真随机分配，<strong>不</strong>做上述「最差 2
        队」剔除，仅依赖勾选时的首轮<strong>同校避战</strong>。不足队伍会产生轮空。
      </Typography.Paragraph>

      <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
        16 槽分区图
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
        从左到右、自上而下为槽位 1–16；绿色框为种子队（四区首位）。每队「合计平均」为三名队员当前正式<strong>平均</strong>成绩之和（秒）；任一人无成绩或 DNF 则显示「—」。
      </Typography.Paragraph>
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
                      <Tag color="success" style={{ margin: 0 }}>
                        种子
                      </Tag>
                    )}
                  </Space>
                  <Typography.Text type="secondary" style={{ fontSize: 10, lineHeight: 1.3 }} ellipsis>
                    {teamKindLabel(t, session.schools)}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 10, lineHeight: 1.3 }} ellipsis>
                    {formatTeamAverageSumLine(t, session)}
                  </Typography.Text>
                  <span style={{ fontSize: 11, color: '#888' }}>#{i + 1}</span>
                </>
              ) : (
                <>轮空</>
              )}
            </div>
          );
        })}
      </div>

      {session.drawVersion >= 1 && (
        <div style={{ marginTop: 20 }}>
          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
            首轮对阵（共 8 场）
          </Typography.Title>
          {firstRoundPairsFromFlat(flat).map((p) => (
            <div key={p.index} className="tmDrawPairBlock">
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                第 {p.index + 1} 场
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
  if (tag === '保送') return 'blue';
  if (tag === '小组赛晋级') return 'green';
  if (tag === '轮空进池') return 'cyan';
  if (tag === '预选赛淘汰') return 'red';
  if (tag === '正赛16强') return 'gold';
  if (tag === '晋级池未出线') return 'orange';
  if (tag === '小组赛待定') return 'processing';
  if (tag === '未进正赛16强') return 'default';
  return undefined;
}

/** 预选赛结束或跳过淘汰后：展示全员成绩榜与预选赛结果，再写入 mainBracketTeamIds 进入抽签 */
const StepMainPoolConfirm: React.FC<StepDrawProps> = ({ session, dispatch }) => {
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
          schoolLine: team ? teamKindLabel(team, session.schools) : '—',
          avgLine: team ? formatTeamAverageSumLine(team, session) : '—',
          seed: seedFromMain16.has(dr.teamId),
        };
      }),
    [displayRows, session, seedFromMain16],
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
    if (!ids.length) return '—（晋级队中暂无足够「三人有效主排序成绩」的队时可能不足 4 支）';
    return ids.map((id) => session.teams.find((t) => t.id === id)?.name ?? id).join(' / ');
  }, [session.teams, session.players, session.seeding, eventId, session.seedingPrimary, poolIds]);

  return (
    <Card title="正赛名单确认">
      <Space wrap style={{ marginBottom: 12 }}>
        <Typography.Text>主排序依据（计算种子用，与步骤 4 一致）：</Typography.Text>
        <Select
          style={{ width: 120 }}
          value={session.seedingPrimary}
          onChange={(v) => dispatch({ type: 'SET_SEEDING_PRIMARY', primary: v })}
          options={[
            { label: '平均', value: 'average' },
            { label: '单次', value: 'single' },
          ]}
        />
        <Button
          type="primary"
          onClick={() => {
            dispatch({ type: 'COMPUTE_SEED_TEAMS' });
            message.success('已按晋级名单与主排序写入种子队');
          }}
        >
          计算种子队
        </Button>
      </Space>
      <Typography.Paragraph type="secondary">
        {elimSkipped ? (
          <>
            当前<strong>已跳过预选赛</strong>，正赛名单按成绩总榜取前 {BRACKET_TEAM_COUNT} 名。下表列出全部队伍及是否进线。
            <strong>种子队</strong>仅从上列晋级队中按主排序取成绩最优的 4 支；可切换主排序后点「计算种子队」预览，点击「确认名单」时会按相同规则再次写入。
          </>
        ) : (
          <>
            下表与「队伍确认」<strong>成绩总榜</strong>同序，标注保送、小组赛晋级、轮空进池、预选赛淘汰及是否进入正赛 {BRACKET_TEAM_COUNT}{' '}
            强（晋级人数多于 {BRACKET_TEAM_COUNT} 时，晋级池内按本榜截取）。
            <strong>种子队</strong>仅从晋级 {BRACKET_TEAM_COUNT} 强中按主排序取 4 支。
            请核对后再进入分区抽签。若在步骤 4「队伍确认」中修改队伍或缺席，后续预选赛与抽签将自动清空，需重新操作。
          </>
        )}
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        当前规则下的四种子：{seedPreviewLine}
      </Typography.Paragraph>
      <Table
        size="small"
        pagination={false}
        dataSource={rows}
        rowKey="key"
        scroll={{ x: 'max-content' }}
        columns={[
          { title: '总榜', dataIndex: 'rankInList', width: 56 },
          { title: '队伍', render: (_, r) => r.team?.name ?? r.key },
          { title: '归属', dataIndex: 'schoolLine', ellipsis: true },
          { title: '合计平均', dataIndex: 'avgLine' },
          {
            title: '预选赛 / 出线',
            render: (_, r) => (
              <Space size={[4, 4]} wrap>
                {r.roleTags.map((t) => (
                  <Tag key={t} color={mainPoolRoleTagColor(t)}>
                    {t}
                  </Tag>
                ))}
              </Space>
            ),
          },
          {
            title: '正赛名次',
            width: 88,
            render: (_, r) => (r.mainBracketRank !== null ? `第 ${r.mainBracketRank} 名` : '—'),
          },
          {
            title: '种子',
            width: 88,
            render: (_, r) => (r.seed ? <Tag color="success">种子</Tag> : '—'),
          },
        ]}
      />
      <div style={{ marginTop: 20 }}>
        <Button
          type="primary"
          disabled={poolIds.length < MIN_TEAMS}
          onClick={() => {
            dispatch({ type: 'CONFIRM_MAIN_BRACKET_POOL' });
            message.success('已确认名单，进入正赛抽签');
          }}
        >
          确认名单，进入正赛抽签
        </Button>
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
        schools: [...session.schools, { id: t.schoolId, name: '自由人', kind: 'freelancer' }],
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
    <Card title="2. 组队（每队 3 人）">
      <Typography.Paragraph type="secondary">
        通过弹窗添加或编辑队伍：可选<strong>学校队</strong>（至少两名队员来自同一普通校，可含外援）或<strong>自由人队</strong>（如三人三校各一人等）。可随时「新增选手」补充名单。需 {MIN_TEAMS}–{MAX_ROSTER_TEAMS}
        支有效队伍；正赛签表固定 {BRACKET_TEAM_COUNT} 槽，超过时在「成绩录入」按排名取前 {BRACKET_TEAM_COUNT} 进入抽签。可删除队伍（选手仍保留）；缺席请在「队伍确认」步骤标记禁用。
      </Typography.Paragraph>
      <Space wrap style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => openPlayerModal(null)}>
          新增选手
        </Button>
        <Button type="primary" onClick={() => openTeamModal(null)}>
          添加队伍
        </Button>
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
          { title: '队名', dataIndex: 'name' },
          {
            title: '归属',
            render: (_, r: Team) => teamKindLabel(r, session.schools),
          },
          {
            title: '队员',
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
            title: '人数',
            render: (_, r: Team) => r.playerIds.length,
          },
          {
            title: '操作',
            width: 160,
            render: (_, r: Team) => (
              <Space size="small">
                <Button type="link" size="small" onClick={() => openTeamModal(r)}>
                  编辑
                </Button>
                <Popconfirm
                  title="删除该队伍？"
                  description="选手不会删除，仍可在「选手」步骤中编辑或编入其他队。"
                  onConfirm={() => dispatch({ type: 'DELETE_TEAM', teamId: r.id })}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button type="link" size="small" danger>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
        当前有效队伍：{activeTeamCount}
      </Typography.Paragraph>
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

    const sourceInline = r.activeSource ? SEEDING_SOURCE_INLINE[r.activeSource] : '—';

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
        <Space direction="vertical" size={2}>
          <Typography.Text type="secondary">
            正式 单次 {fmt(r.single)} · 平均 {fmt(r.average)} 「{sourceInline}」
          </Typography.Text>
          {hasPre && pre && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              初赛 单次 {fmt(pre.single)} · 平均 {fmt(pre.average)}
            </Typography.Text>
          )}
        </Space>
      ),
      action: (
        <Button size="small" type="primary" onClick={() => setSeedingModalPlayer(player)}>
          编辑成绩
        </Button>
      ),
    };
  };

  const columns = [
    { title: '选手', dataIndex: 'playerCell' },
    { title: '成绩', dataIndex: 'scores' },
    { title: '操作', dataIndex: 'action', width: 120 },
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
    <Card title="3. 成绩录入（按队伍分组）">
      {modal}
      <Space wrap style={{ marginBottom: 12 }}>
        <Button onClick={openBatchPrelim}>批量初赛录入</Button>
        <BulkFillSeedingButton session={session} dispatch={dispatch} />
      </Space>
      <OneCompPrelimImportCard session={session} dispatch={dispatch} />
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12, marginTop: 12 }}>
        当前 WCA 项目为页面顶部「比赛项目」所选。按队伍展示队员，点击「编辑成绩」填写单次/平均、DNF，或拉取 WCA / One（需在选手资料中填写对应 ID）。主排序依据在「队伍确认」选择；种子队在「正赛名单确认」从晋级 {BRACKET_TEAM_COUNT} 强中计算。登记超过 {BRACKET_TEAM_COUNT}{' '}
        支有效队时，仅排名前 {BRACKET_TEAM_COUNT} 的进入正赛抽签（见各队标签）。
      </Typography.Paragraph>

      {teamsSorted.map((team) => {
        const schoolName = teamKindLabel(team, session.schools);
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
                {team.disabled && <Typography.Text type="danger">（已禁用）</Typography.Text>}
                {!team.disabled && team.playerIds.length === TEAM_PLAYERS && (
                  <>
                    {bracketEligibleIds.has(team.id) ? (
                      <Tag color="processing">正赛出线</Tag>
                    ) : (
                      <Tag>未进前 {BRACKET_TEAM_COUNT}</Tag>
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
        <Card size="small" type="inner" title="未入任何队伍的选手" style={{ marginBottom: 12 }}>
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
    <Card title="4. 队伍确认">
      {confirmSeedingModal}
      <Space wrap style={{ marginBottom: 12 }}>
        <Typography.Text>主排序依据（列表顺序与出线判定）：</Typography.Text>
        <Select
          style={{ width: 120 }}
          value={session.seedingPrimary}
          onChange={(v) => dispatch({ type: 'SET_SEEDING_PRIMARY', primary: v })}
          options={[
            { label: '平均', value: 'average' },
            { label: '单次', value: 'single' },
          ]}
        />
      </Space>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        确认参赛名单：可标记缺席。列表顺序：满编队内缺主排序成绩人数少的在前，其余按有效成绩之和升序；未满编队靠后。仅「正赛出线」队（满编、未缺席、按上列顺序取前 {BRACKET_TEAM_COUNT}；不足 16 支成绩齐全时会按排名纳入部分缺成绩队）在跳过预选赛时参与抽签。
        <strong>种子队</strong>在「正赛名单确认」步骤从晋级 {BRACKET_TEAM_COUNT} 强中计算，不在本页设置。
      </Typography.Paragraph>

      {teamsSorted.map((team) => {
        const schoolName = teamKindLabel(team, session.schools);
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
                {team.disabled && <Typography.Text type="danger">（已禁用）</Typography.Text>}
                {!team.disabled && team.playerIds.length === TEAM_PLAYERS && (
                  <>
                    {bracketEligibleIds.has(team.id) ? (
                      <Tag color="processing">正赛出线</Tag>
                    ) : (
                      <Tag>未进前 {BRACKET_TEAM_COUNT}</Tag>
                    )}
                  </>
                )}
              </Space>
            }
            extra={
              <Space align="center" size={8}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  缺席
                </Typography.Text>
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
