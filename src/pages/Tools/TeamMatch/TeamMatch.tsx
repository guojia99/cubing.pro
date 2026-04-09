import BracketStage from '@/pages/Tools/TeamMatch/components/BracketStage';
import LiveSettingsButton from '@/pages/Tools/TeamMatch/components/LiveSettingsButton';
import LiveSettingsModal from '@/pages/Tools/TeamMatch/components/LiveSettingsModal';
import PodiumStage from '@/pages/Tools/TeamMatch/components/PodiumStage';
import { isBracketFullyComplete } from '@/pages/Tools/TeamMatch/bracketComplete';
import { loadLiveUISettings, saveLiveUISettings, type LiveUISettings } from '@/pages/Tools/TeamMatch/liveUiSettings';
import {
  canAccessStepBarIndex,
  hasOverSixteenFullTeams,
  stepBarIndexToWizardStep,
  wizardStepToBarIndex,
} from '@/pages/Tools/TeamMatch/stepAccess';
import { metaFromSession } from '@/pages/Tools/TeamMatch/storage';
import { TeamMatchProvider, useTeamMatchStore } from '@/pages/Tools/TeamMatch/TeamMatchContext';
import TeamMatchJsonToolbar from '@/pages/Tools/TeamMatch/components/TeamMatchJsonToolbar';
import TeamMatchSteps from '@/pages/Tools/TeamMatch/TeamMatchSteps';
import { TEAM_MATCH_WCA_EVENT_OPTIONS } from '@/pages/Tools/TeamMatch/wcaCubeEvents';
import {
  MAX_ROSTER_TEAMS,
  MIN_TEAMS,
  WIZARD_STEP_ELIM_DRAW,
  WIZARD_STEP_ELIM_LIVE,
  WIZARD_STEP_MAIN_DRAW,
  WIZARD_STEP_MAIN_LIVE,
  WIZARD_STEP_MAIN_POOL_CONFIRM,
  WIZARD_STEP_PODIUM,
  type TeamMatchSession,
} from '@/pages/Tools/TeamMatch/types';
import { Button, Card, Input, InputNumber, List, Modal, Popconfirm, Select, message, Space, Steps, Typography } from 'antd';
import React from 'react';
import './TeamMatch.less';

const ROSTER_STEP_TITLES = ['学校与选手', '组队', '成绩录入', '队伍确认'] as const;

function buildStepBarTitles(over16: boolean): string[] {
  if (over16) {
    return [...ROSTER_STEP_TITLES, '淘汰赛抽签', '淘汰赛', '正赛名单', '正赛抽签', '正赛'];
  }
  return [...ROSTER_STEP_TITLES, '淘汰赛抽签', '正赛名单', '正赛抽签', '正赛'];
}

function MatchEventField() {
  const { state, dispatch } = useTeamMatchStore();
  const ev = state.session.eventIds[0] ?? '333';
  return (
    <Space wrap align="center">
      <Typography.Text strong type="secondary">
        比赛项目
      </Typography.Text>
      <Select
        style={{ minWidth: 200 }}
        value={ev}
        options={TEAM_MATCH_WCA_EVENT_OPTIONS}
        onChange={(v) => dispatch({ type: 'SET_EVENT_IDS', eventIds: [v] })}
        showSearch
        optionFilterProp="label"
      />
    </Space>
  );
}

function MatchNameField({ variant = 'default' }: { variant?: 'default' | 'dark' }) {
  const { state, dispatch } = useTeamMatchStore();
  const [v, setV] = React.useState(state.session.name);
  React.useEffect(() => setV(state.session.name), [state.session.id, state.session.name]);
  const commit = () => dispatch({ type: 'SET_NAME', name: v });
  const dark = variant === 'dark';
  return (
    <Space wrap align="center">
      {!dark && (
        <Typography.Text strong type="secondary">
          比赛名称
        </Typography.Text>
      )}
      {dark && (
        <Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>比赛名称</Typography.Text>
      )}
      <Input
        style={{
          maxWidth: 420,
          minWidth: 200,
          ...(dark
            ? {
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.25)',
              }
            : {}),
        }}
        placeholder="填写比赛名称"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onPressEnter={commit}
      />
    </Space>
  );
}

function TeamMatchInner() {
  const { state, dispatch } = useTeamMatchStore();
  const { session } = state;
  const step = session.wizardStep;
  const [mockModalOpen, setMockModalOpen] = React.useState(false);
  const [mockGroupCount, setMockGroupCount] = React.useState(1);
  const [liveUISettings, setLiveUISettings] = React.useState<LiveUISettings>(() => loadLiveUISettings());
  const [liveSettingsOpen, setLiveSettingsOpen] = React.useState(false);

  const over16 = hasOverSixteenFullTeams(session);
  const stepBarTitles = buildStepBarTitles(over16);

  React.useEffect(() => {
    saveLiveUISettings(liveUISettings);
  }, [liveUISettings]);

  React.useEffect(() => {
    if (step !== WIZARD_STEP_MAIN_LIVE) setLiveSettingsOpen(false);
  }, [step]);

  const activeTeamCount = session.teams.filter(
    (t) => !t.disabled && t.playerIds.length === 3,
  ).length;

  const canNext = () => {
    switch (step) {
      case 0:
        return session.schools.length > 0 && session.players.length > 0;
      case 1:
      case 2:
        return activeTeamCount >= MIN_TEAMS && activeTeamCount <= MAX_ROSTER_TEAMS;
      case 3:
        return activeTeamCount >= MIN_TEAMS && activeTeamCount <= MAX_ROSTER_TEAMS;
      case 4:
        return over16 && (session.elimination?.drawVersion ?? 0) >= 1;
      default:
        return false;
    }
  };

  const next = () => {
    if (!canNext()) return;
    if (step <= 2) {
      dispatch({ type: 'SET_WIZARD_STEP', step: step + 1 });
      return;
    }
    if (step === 3) {
      dispatch({ type: 'ENSURE_ELIMINATION_STATE' });
      dispatch({ type: 'SET_WIZARD_STEP', step: 4 });
      return;
    }
    if (step === 4) {
      dispatch({ type: 'SET_WIZARD_STEP', step: 5 });
    }
  };

  const prev = () => {
    if (step === 0) return;
    if (step === WIZARD_STEP_MAIN_DRAW) {
      dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_MAIN_POOL_CONFIRM });
      return;
    }
    if (step === WIZARD_STEP_MAIN_POOL_CONFIRM) {
      if (over16 && !session.elimination?.skipped) {
        dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_ELIM_LIVE });
      } else {
        dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_ELIM_DRAW });
      }
      return;
    }
    if (step === WIZARD_STEP_ELIM_LIVE) {
      dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_ELIM_DRAW });
      return;
    }
    if (step === WIZARD_STEP_ELIM_DRAW) {
      dispatch({ type: 'SET_WIZARD_STEP', step: 3 });
      return;
    }
    dispatch({ type: 'SET_WIZARD_STEP', step: step - 1 });
  };

  const goToStepBarIndex = (stepIndex: number) => {
    if (!canAccessStepBarIndex(session, stepIndex, over16)) {
      message.warning('请先完成前置步骤');
      return;
    }
    const w = stepBarIndexToWizardStep(stepIndex, over16);
    if (w === WIZARD_STEP_MAIN_LIVE && session.status !== 'live') {
      message.warning('请先在「正赛抽签」中点击「开始比赛」进入正赛');
      return;
    }
    dispatch({ type: 'SET_WIZARD_STEP', step: w });
  };

  const jsonToolbarProps = {
    session,
    liveUISettings,
    onHydrate: (s: TeamMatchSession) => dispatch({ type: 'HYDRATE', session: s }),
    onImportLiveUI: setLiveUISettings,
  };

  if (session.status === 'live' && (step === WIZARD_STEP_MAIN_LIVE || step === WIZARD_STEP_PODIUM)) {
    const bracketComplete = isBracketFullyComplete(session);
    const podiumBlockHint = session.skipBronzeMatch
      ? '请完成全部淘汰赛（已跳过季军赛）'
      : '请完成全部淘汰赛与铜牌战';
    return (
      <div className="tmFullscreen">
        <TeamMatchJsonToolbar {...jsonToolbarProps} variant="dark" />
        <div
          style={{
            padding: '8px 12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space wrap align="center" size="middle">
            <Typography.Text style={{ color: 'rgba(255,255,255,0.65)' }}>
              {step === WIZARD_STEP_PODIUM ? '领奖台' : '正赛'}
            </Typography.Text>
            <MatchNameField variant="dark" />
          </Space>
          <Space wrap>
            {step === WIZARD_STEP_PODIUM ? (
              <Button type="primary" onClick={() => dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_MAIN_LIVE })}>
                返回正赛
              </Button>
            ) : (
              <>
                <Button onClick={() => dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_MAIN_DRAW })}>返回抽签</Button>
                <LiveSettingsButton type="default" ghost onClick={() => setLiveSettingsOpen(true)} />
                <Button
                  type="primary"
                  disabled={!bracketComplete}
                  title={!bracketComplete ? podiumBlockHint : undefined}
                  onClick={() => dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_PODIUM })}
                >
                  下一步：领奖台
                </Button>
              </>
            )}
          </Space>
        </div>
        <div className="tmFullscreenInner">
          {step === WIZARD_STEP_PODIUM ? (
            <PodiumStage />
          ) : (
            <BracketStage liveSettings={liveUISettings} onOpenLiveSettings={() => setLiveSettingsOpen(true)} />
          )}
        </div>
        {step === WIZARD_STEP_MAIN_LIVE && (
          <LiveSettingsModal
            open={liveSettingsOpen}
            onClose={() => setLiveSettingsOpen(false)}
            value={liveUISettings}
            onApply={(next) => {
              setLiveUISettings(next);
              setLiveSettingsOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <TeamMatchJsonToolbar {...jsonToolbarProps} variant="light" />
      <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Typography.Title level={4} style={{ margin: 0 }}>
          组队赛工具
        </Typography.Title>
        <Space wrap align="center" size="middle">
          <MatchNameField />
          <MatchEventField />
        </Space>
        <Space wrap>
          <Button onClick={() => dispatch({ type: 'NEW_SESSION' })}>新比赛</Button>
          <Popconfirm
            title="用测试数据覆盖当前比赛？"
            description="将替换为学校/选手/队伍及随机种子成绩（满16队：广工5队等预设校名）。"
            onConfirm={() => {
              dispatch({ type: 'MOCK_FILL_TEST_DATA' });
              message.success('已填充满16队测试数据');
            }}
            okText="覆盖"
            cancelText="取消"
          >
            <Button>一键填充16队测试数据</Button>
          </Popconfirm>
          <Button onClick={() => setMockModalOpen(true)}>追加测试分组</Button>
          <Modal
            title="追加测试分组"
            open={mockModalOpen}
            onCancel={() => setMockModalOpen(false)}
            onOk={() => {
              const n = Math.max(1, Math.floor(mockGroupCount));
              const room = MAX_ROSTER_TEAMS - session.teams.length;
              if (room <= 0) {
                message.warning(`队伍已达上限 ${MAX_ROSTER_TEAMS}，无法继续添加`);
                return;
              }
              const add = Math.min(n, room);
              dispatch({ type: 'MOCK_APPEND_GROUPS', count: add });
              message.success(`已追加 ${add} 组（学校+选手+队伍），并写入随机种子成绩`);
              setMockModalOpen(false);
            }}
            okText="追加"
          >
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
              按预设校名顺序追加（与「一键填充16队」同一套校名表；满16队时广工共5队）。当前队伍{' '}
              {session.teams.length}/{MAX_ROSTER_TEAMS}。
            </Typography.Paragraph>
            <Space align="center">
              <Typography.Text>组数</Typography.Text>
              <InputNumber
                min={1}
                max={Math.max(1, MAX_ROSTER_TEAMS - session.teams.length)}
                value={mockGroupCount}
                onChange={(v) => setMockGroupCount(v === null ? 1 : Number(v))}
              />
            </Space>
          </Modal>
        </Space>
        <List
          size="small"
          header={<Typography.Text strong>最近 {state.root.historyIds.length} 场</Typography.Text>}
          dataSource={state.root.historyIds}
          renderItem={(id) => {
            const s = state.root.sessions[id];
            if (!s) return null;
            const meta = metaFromSession(s);
            return (
              <List.Item
                actions={[
                  <Button
                    key="load"
                    type="link"
                    size="small"
                    onClick={() => dispatch({ type: 'LOAD_SESSION', id })}
                  >
                    打开
                  </Button>,
                  <Button
                    key="del"
                    type="link"
                    danger
                    size="small"
                    onClick={() => dispatch({ type: 'DELETE_SESSION', id })}
                  >
                    删除
                  </Button>,
                ]}
              >
                <List.Item.Meta title={meta.name} description={`${meta.summary} · ${new Date(meta.updatedAt).toLocaleString()}`} />
              </List.Item>
            );
          }}
        />
        <Steps
          current={wizardStepToBarIndex(step, over16)}
          onChange={goToStepBarIndex}
          items={stepBarTitles.map((t) => ({ title: t }))}
        />
        <TeamMatchSteps liveUISettings={liveUISettings} onLiveUISettingsChange={setLiveUISettings} />
        <Space>
          <Button disabled={step === 0} onClick={prev}>
            上一步
          </Button>
          <Button type="primary" disabled={step >= 5 || !canNext()} onClick={next}>
            下一步
          </Button>
        </Space>
      </Space>
    </Card>
    </>
  );
}

const TeamMatch: React.FC = () => (
  <TeamMatchProvider>
    <TeamMatchInner />
  </TeamMatchProvider>
);

export default TeamMatch;
