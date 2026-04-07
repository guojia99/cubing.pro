import BulkFillSeedingButton from '@/pages/Tools/TeamMatch/components/BulkFillSeedingButton';
import BulkOneUidImportModal from '@/pages/Tools/TeamMatch/components/BulkOneUidImportModal';
import OneCompPrelimImportCard from '@/pages/Tools/TeamMatch/components/OneCompPrelimImportCard';
import PreliminaryBatchModal from '@/pages/Tools/TeamMatch/components/PreliminaryBatchModal';
import PlayerEditModal from '@/pages/Tools/TeamMatch/components/PlayerEditModal';
import SeedingPlayerModal from '@/pages/Tools/TeamMatch/components/SeedingPlayerModal';
import TeamEditModal from '@/pages/Tools/TeamMatch/components/TeamEditModal';
import SyncWcaAvatarsButton from '@/pages/Tools/TeamMatch/components/SyncWcaAvatarsButton';
import TeamRosterPasteCard from '@/pages/Tools/TeamMatch/components/TeamRosterPasteCard';
import { useTeamMatchStore } from '@/pages/Tools/TeamMatch/TeamMatchContext';
import { rankedBracketTeamIds, sortTeamsBySeedingRank, teamSeedingSum } from '@/pages/Tools/TeamMatch/seedingMath';
import { SEEDING_SOURCE_INLINE } from '@/pages/Tools/TeamMatch/seedingScorePick';
import { teamKindLabel } from '@/pages/Tools/TeamMatch/teamClassify';
import type { Player, School, SeedingEntry, Team, TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { BRACKET_TEAM_COUNT, MAX_ROSTER_TEAMS, MIN_TEAMS, TEAM_PLAYERS } from '@/pages/Tools/TeamMatch/types';
import { Avatar, Button, Card, Checkbox, Form, Input, Popconfirm, Radio, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import React, { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const TeamMatchSteps: React.FC = () => {
  const { state, dispatch } = useTeamMatchStore();
  const { session } = state;
  const step = session.wizardStep;

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

      {step === 4 && <StepDraw session={session} dispatch={dispatch} />}
    </>
  );
};

type StepDrawProps = {
  session: TeamMatchSession;
  dispatch: ReturnType<typeof useTeamMatchStore>['dispatch'];
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

/** 抽签展示：三人正式平均成绩之和（与「队伍确认」主排序为平均时排名规则一致；任一人 DNF/缺成绩则无效） */
function formatTeamAverageSumLine(team: Team, session: TeamMatchSession): string {
  const eventId = session.eventIds[0] ?? '333';
  const { sum, valid } = teamSeedingSum(team, session.players, session.seeding, eventId, 'average');
  if (!valid) return '合计平均：—';
  return `合计平均：${sum.toFixed(2)}s`;
}

const StepDraw: React.FC<StepDrawProps> = ({ session, dispatch }) => {
  const bracketEligibleCount = useMemo(
    () =>
      rankedBracketTeamIds(
        session.teams,
        session.players,
        session.seeding,
        session.eventIds[0] ?? '333',
        session.seedingPrimary,
      ).length,
    [session.teams, session.players, session.seeding, session.eventIds, session.seedingPrimary],
  );

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
    <Card title="5. 分区与抽签">
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
            dispatch({ type: 'SET_WIZARD_STEP', step: 6 });
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

function formatSeedTeamNames(session: TeamMatchSession): string {
  const parts = session.seedTeamIds
    .filter((id): id is string => Boolean(id))
    .map((id) => session.teams.find((t) => t.id === id)?.name ?? '（未知队伍）');
  return parts.length ? parts.join(' / ') : '未计算';
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
        当前 WCA 项目为页面顶部「比赛项目」所选。按队伍展示队员，点击「编辑成绩」填写单次/平均、DNF，或拉取 WCA / One（需在选手资料中填写对应 ID）。主排序依据与种子将在「队伍确认」中设置。登记超过 {BRACKET_TEAM_COUNT}{' '}
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

  const activeTeamOptions = useMemo(() => {
    return session.teams
      .filter((t) => !t.disabled && t.playerIds.length === TEAM_PLAYERS && bracketEligibleIds.has(t.id))
      .map((t) => ({ label: t.name, value: t.id }));
  }, [session.teams, bracketEligibleIds]);

  const setSeedAtRegion = (regionIndex: number, teamId: string | null) => {
    const next: [string | null, string | null, string | null, string | null] = [...session.seedTeamIds];
    if (teamId) {
      for (let i = 0; i < 4; i++) {
        if (i !== regionIndex && next[i] === teamId) next[i] = null;
      }
    }
    next[regionIndex] = teamId;
    dispatch({ type: 'SET_SEED_TEAM_IDS', seedTeamIds: next });
  };

  return (
    <Card title="4. 队伍确认">
      {confirmSeedingModal}
      <Space wrap style={{ marginBottom: 12 }}>
        <Typography.Text>主排序依据（用于「计算种子队」）：</Typography.Text>
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
            message.success('已根据成绩确定种子队');
          }}
        >
          计算种子队
        </Button>
      </Space>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        确认参赛名单与种子：可标记缺席。列表顺序：满编队内缺主排序成绩人数少的在前，其余按有效成绩之和升序；未满编队靠后。仅「正赛出线」队（满编、未缺席、按上列顺序取前 {BRACKET_TEAM_COUNT}；不足 16 支成绩齐全时会按排名纳入部分缺成绩队）参与抽签；种子仅可在出线队中选择或「计算种子队」。
      </Typography.Paragraph>

      <Card size="small" type="inner" title="四区种子（各区首位）" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {[0, 1, 2, 3].map((r) => (
            <Space key={r} wrap>
              <Typography.Text style={{ minWidth: 88 }}>第 {r + 1} 区</Typography.Text>
              <Select
                style={{ minWidth: 220 }}
                allowClear
                placeholder="不指定"
                value={session.seedTeamIds[r] ?? undefined}
                options={activeTeamOptions.filter((o) => {
                  const tid = o.value;
                  if (session.seedTeamIds[r] === tid) return true;
                  return !session.seedTeamIds.some((x, i) => i !== r && x === tid);
                })}
                onChange={(v) => setSeedAtRegion(r, v ?? null)}
              />
            </Space>
          ))}
        </Space>
      </Card>

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
            className={team.isSeed ? 'tmSeedTeamCard' : undefined}
            title={
              <Space wrap>
                <Typography.Text strong>{team.name}</Typography.Text>
                <Typography.Text type="secondary">· {schoolName}</Typography.Text>
                {team.isSeed && (
                  <Tag color="success" style={{ marginInlineEnd: 0 }}>
                    种子
                  </Tag>
                )}
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

      <Typography.Paragraph style={{ marginTop: 12 }} type="secondary">
        当前种子队：{formatSeedTeamNames(session)}
      </Typography.Paragraph>
    </Card>
  );
};

export default TeamMatchSteps;
