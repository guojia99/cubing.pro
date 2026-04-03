import PlayerEditModal from '@/pages/Tools/TeamMatch/components/PlayerEditModal';
import SeedingPlayerModal from '@/pages/Tools/TeamMatch/components/SeedingPlayerModal';
import TeamEditModal from '@/pages/Tools/TeamMatch/components/TeamEditModal';
import { useTeamMatchStore } from '@/pages/Tools/TeamMatch/TeamMatchContext';
import { sortTeamsBySeedingRank } from '@/pages/Tools/TeamMatch/seedingMath';
import type { Player, School, SeedingEntry, Team, TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { MAX_TEAMS, MIN_TEAMS, TEAM_PLAYERS } from '@/pages/Tools/TeamMatch/types';
import { Avatar, Button, Card, Form, Input, Popconfirm, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
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
        <Card title="1. 学校">
          <Typography.Paragraph type="secondary">先添加学校，后续选手与组队需选择学校。</Typography.Paragraph>
          <Form
            layout="inline"
            onFinish={(v: { name: string }) => {
              const s: School = { id: uuidv4(), name: v.name.trim() };
              if (!s.name) return;
              dispatch({ type: 'UPSERT_SCHOOLS', schools: [...session.schools, s] });
              schoolForm.resetFields();
            }}
            form={schoolForm}
          >
            <Form.Item name="name" rules={[{ required: true }]}>
              <Input placeholder="学校名称" />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              添加
            </Button>
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
        </Card>
      )}

      {step === 1 && (
        <Card title="2. 选手">
          <Typography.Paragraph type="secondary">通过弹窗新增或编辑选手，头像在弹窗内上传。</Typography.Paragraph>
          <Space style={{ marginBottom: 12 }}>
            <Button type="primary" onClick={() => openPlayerModal(null)} disabled={!session.schools.length}>
              新增选手
            </Button>
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

      {step === 2 && (
        <StepTeam
          session={session}
          dispatch={dispatch}
          activeTeamCount={activeTeamCount}
          openPlayerModal={openPlayerModal}
        />
      )}

      {step === 3 && (
        <StepSeeding session={session} dispatch={dispatch} eventId={eventId} />
      )}

      {step === 4 && (
        <StepDraw session={session} activeTeamCount={activeTeamCount} dispatch={dispatch} />
      )}
    </>
  );
};

type StepDrawProps = {
  session: TeamMatchSession;
  activeTeamCount: number;
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

const StepDraw: React.FC<StepDrawProps> = ({ session, activeTeamCount, dispatch }) => {
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
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            槽位 #{slotLabel}
          </Typography.Text>
        </Space>
      </div>
    );
  };

  return (
    <Card title="5. 分区与抽签">
      <Space wrap>
        <Button
          type="primary"
          onClick={() => {
            if (activeTeamCount < MIN_TEAMS || activeTeamCount > MAX_TEAMS) {
              message.warning(`有效队伍需在 ${MIN_TEAMS}–${MAX_TEAMS} 之间`);
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
            if (activeTeamCount < MIN_TEAMS || activeTeamCount > MAX_TEAMS) {
              message.warning(`有效队伍需在 ${MIN_TEAMS}–${MAX_TEAMS} 之间`);
              return;
            }
            if (session.drawVersion < 1) {
              message.warning('请先点击「重新随机分区」生成对阵槽位');
              return;
            }
            dispatch({ type: 'REBUILD_BRACKET' });
            dispatch({ type: 'SET_STATUS', status: 'live' });
            dispatch({ type: 'SET_WIZARD_STEP', step: 5 });
          }}
        >
          开始比赛
        </Button>
      </Space>
      <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
        四区 × 四槽，共 16 位；首轮相邻两槽为一组对阵（与正赛首轮一致）。随机分区时：同校队伍尽量不在同一场首轮对阵；有种子时，非种子队按成绩排序，较强者多在「内部」对位成对（成绩相近易相遇），相对较弱者优先落在种子对位。不足队伍会产生轮空。
      </Typography.Paragraph>

      {session.drawVersion >= 1 && (
        <div style={{ marginTop: 16 }}>
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

      <Typography.Title level={5} style={{ marginTop: session.drawVersion >= 1 ? 20 : 12, marginBottom: 12 }}>
        16 槽分区图
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
        从左到右、自上而下为槽位 1–16；绿色框为种子队（四区首位）。
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
                  <span style={{ fontSize: 11, color: '#888' }}>#{i + 1}</span>
                </>
              ) : (
                <>轮空</>
              )}
            </div>
          );
        })}
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
    <Card title="3. 组队（每队 3 人）">
      <Typography.Paragraph type="secondary">
        通过弹窗添加或编辑队伍；可随时「新增选手」补充名单。需 {MIN_TEAMS}–{MAX_TEAMS} 支有效队伍。队员在下方各队行内展示。可删除队伍（选手仍保留在选手步骤中）；缺席队伍请在「种子」步骤中标记禁用。
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
            title: '学校',
            render: (_, r: Team) => session.schools.find((s) => s.id === r.schoolId)?.name,
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

type StepSeedingProps = {
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

const StepSeeding: React.FC<StepSeedingProps> = ({ session, dispatch, eventId }) => {
  const [seedingModalPlayer, setSeedingModalPlayer] = useState<Player | null>(null);
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

  const renderPlayerRow = (player: Player) => {
    const r =
      session.seeding.find((e) => e.playerId === player.id && e.eventId === eventId) ?? ({
        playerId: player.id,
        eventId,
        single: null,
        average: null,
      } as SeedingEntry);

    const fmt = (v: number | 'DNF' | null) =>
      v === 'DNF' ? 'DNF' : v === null ? '—' : String(v);

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
        <Typography.Text type="secondary">
          单次 {fmt(r.single)} · 平均 {fmt(r.average)}
        </Typography.Text>
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
      }
    : null;

  return (
    <Card title="4. 种子成绩（按队伍分组）">
      <SeedingPlayerModal
        open={!!seedingModalPlayer}
        onClose={() => setSeedingModalPlayer(null)}
        player={seedingModalPlayer}
        eventId={eventId}
        entry={seedingModalEntry}
        onSave={(next) =>
          dispatch({
            type: 'SET_SEEDING',
            seeding: patchSeedingEntry(session, eventId, next.playerId, {
              single: next.single,
              average: next.average,
            }),
          })
        }
      />
      <Space wrap style={{ marginBottom: 12 }}>
        <Typography.Text>主排序依据：</Typography.Text>
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
        当前 WCA 项目为页面顶部「比赛项目」所选；种子成绩与拉取 WCA 均针对该项目，可随时修改。按队伍展示队员；点击「编辑成绩」在弹窗中填写单次/平均、DNF 或拉取
        WCA。列表按主排序依据对全队三人成绩求和，从强到弱排列；已禁用队伍排在末尾。缺席不计入有效队伍时，请打开右侧「缺席」开关。
      </Typography.Paragraph>

      {teamsSorted.map((team) => {
        const schoolName = session.schools.find((s) => s.id === team.schoolId)?.name ?? '';
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

      <Typography.Paragraph style={{ marginTop: 12 }} type="secondary">
        种子队：{formatSeedTeamNames(session)}
      </Typography.Paragraph>
    </Card>
  );
};

export default TeamMatchSteps;
