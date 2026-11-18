"use client";

import BracketStage from '@/views/TeamMatch/components/BracketStage';
import LiveSettingsButton from '@/views/TeamMatch/components/LiveSettingsButton';
import LiveSettingsModal from '@/views/TeamMatch/components/LiveSettingsModal';
import PodiumStage from '@/views/TeamMatch/components/PodiumStage';
import { isBracketFullyComplete } from '@/views/TeamMatch/bracketComplete';
import { loadLiveUISettings, saveLiveUISettings, type LiveUISettings } from '@/views/TeamMatch/liveUiSettings';
import {
  canAccessStepBarIndex,
  hasOverSixteenFullTeams,
  stepBarIndexToWizardStep,
  wizardStepToBarIndex,
} from '@/views/TeamMatch/stepAccess';
import { metaFromSession } from '@/views/TeamMatch/storage';
import { TeamMatchProvider, useTeamMatchStore } from '@/views/TeamMatch/TeamMatchContext';
import TeamMatchJsonToolbar from '@/views/TeamMatch/components/TeamMatchJsonToolbar';
import TeamMatchSteps from '@/views/TeamMatch/TeamMatchSteps';
import { teamMatchEventOptions } from '@/views/TeamMatch/wcaCubeEvents';
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
} from '@/views/TeamMatch/types';
import { App, Button, Card, Flex, Input, InputNumber, Modal, Popconfirm, Select, Space, Steps, Typography } from 'antd';
import React from 'react';
import { DarkMode } from '@/components/ui/color-mode';
import { PageHeader } from '@/components/ui/page';
import { useHideAppChrome } from '@/hooks/useHideAppChrome';
import './TeamMatch.css';
import { tm, useTeamMatchI18n, type TeamMatchLocale } from './i18n';

function buildStepBarTitles(over16: boolean, locale: TeamMatchLocale): string[] {
  const titles = (['schoolsPlayers', 'teamsStep', 'scoreEntry', 'teamConfirmation'] as const).map((key) => tm(locale, `teamMatch.${key}`));
  if (over16) {
    return [...titles, ...(['eliminationDraw', 'elimination', 'mainPool', 'mainDraw', 'main'] as const).map((key) => tm(locale, `teamMatch.${key}`))];
  }
  return [...titles, ...(['eliminationDraw', 'mainPool', 'mainDraw', 'main'] as const).map((key) => tm(locale, `teamMatch.${key}`))];
}

function MatchEventField() {
  const { t, locale } = useTeamMatchI18n();
  const { state, dispatch } = useTeamMatchStore();
  const ev = state.session.eventIds[0] ?? '333';
  return (
    <Space wrap align="center">
      <Typography.Text strong type="secondary">
        {t('teamMatch.event')}
      </Typography.Text>
      <Select
        style={{ minWidth: 200 }}
        value={ev}
        options={teamMatchEventOptions(locale)}
        onChange={(v) => dispatch({ type: 'SET_EVENT_IDS', eventIds: [v] })}
        showSearch
        optionFilterProp="label"
      />
    </Space>
  );
}

function MatchNameField({ variant = 'default' }: { variant?: 'default' | 'dark' }) {
  const { t } = useTeamMatchI18n();
  const { state, dispatch } = useTeamMatchStore();
  const [v, setV] = React.useState(state.session.name);
  React.useEffect(() => setV(state.session.name), [state.session.id, state.session.name]);
  const commit = () => dispatch({ type: 'SET_NAME', name: v });
  const dark = variant === 'dark';
  return (
    <Space wrap align="center">
      {!dark && (
        <Typography.Text strong type="secondary">
          {t('teamMatch.matchName')}
        </Typography.Text>
      )}
      {dark && (
        <Typography.Text style={{ color: 'color-mix(in srgb, var(--foreground) 85%, transparent)' }}>
          {t('teamMatch.matchName')}
        </Typography.Text>
      )}
      <Input
        style={{
          maxWidth: 420,
          minWidth: 200,
          ...(dark
            ? {
                background: 'color-mix(in srgb, var(--foreground) 8%, transparent)',
                color: 'var(--foreground)',
                borderColor: 'color-mix(in srgb, var(--foreground) 25%, transparent)',
              }
            : {}),
        }}
        placeholder={t('teamMatch.matchNamePlaceholder')}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onPressEnter={commit}
      />
    </Space>
  );
}

function TeamMatchInner() {
  const { t, locale } = useTeamMatchI18n();
  const { message } = App.useApp();
  const { state, dispatch } = useTeamMatchStore();
  const { session } = state;
  const step = session.wizardStep;
  const [mockModalOpen, setMockModalOpen] = React.useState(false);
  const [mockGroupCount, setMockGroupCount] = React.useState(1);
  const [liveUISettings, setLiveUISettings] = React.useState<LiveUISettings>(() => loadLiveUISettings());
  const [liveSettingsOpen, setLiveSettingsOpen] = React.useState(false);

  const over16 = hasOverSixteenFullTeams(session);
  const stepBarTitles = buildStepBarTitles(over16, locale);
  const isLiveFullscreen =
    session.status === 'live' && (step === WIZARD_STEP_MAIN_LIVE || step === WIZARD_STEP_PODIUM);

  useHideAppChrome(isLiveFullscreen);

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
      message.warning(t('teamMatch.prerequisite'));
      return;
    }
    const w = stepBarIndexToWizardStep(stepIndex, over16);
    if (w === WIZARD_STEP_MAIN_LIVE && session.status !== 'live') {
      message.warning(t('teamMatch.startMainHint'));
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
      ? t('teamMatch.finishWithoutBronze')
      : t('teamMatch.finishWithBronze');
    return (
      <DarkMode>
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
            <Typography.Text style={{ color: 'var(--muted-foreground)' }}>
              {step === WIZARD_STEP_PODIUM ? t('teamMatch.podium') : t('teamMatch.main')}
            </Typography.Text>
            <MatchNameField variant="dark" />
          </Space>
          <Space wrap>
            {step === WIZARD_STEP_PODIUM ? (
              <Button type="primary" onClick={() => dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_MAIN_LIVE })}>
                {t('teamMatch.backMain')}
              </Button>
            ) : (
              <>
                <Button onClick={() => dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_MAIN_DRAW })}>{t('teamMatch.backDraw')}</Button>
                <LiveSettingsButton type="default" ghost onClick={() => setLiveSettingsOpen(true)} />
                <Button
                  type="primary"
                  disabled={!bracketComplete}
                  title={!bracketComplete ? podiumBlockHint : undefined}
                  onClick={() => dispatch({ type: 'SET_WIZARD_STEP', step: WIZARD_STEP_PODIUM })}
                >
                  {t('teamMatch.nextPodium')}
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
      </DarkMode>
    );
  }

  return (
    <div className="tm-workbench">
      <TeamMatchJsonToolbar {...jsonToolbarProps} variant="light" />
      <PageHeader title={t('teamMatch.title')} description={t('teamMatch.description')} />
      <Card className="tm-workbench-main">
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        <Space wrap align="center" size="middle">
          <MatchNameField />
          <MatchEventField />
        </Space>
        <Space wrap>
          <Button onClick={() => dispatch({ type: 'NEW_SESSION' })}>{t('teamMatch.newMatch')}</Button>
          <Popconfirm
            title={t('teamMatch.overwriteTest')}
            description={t('teamMatch.testDescription')}
            onConfirm={() => {
              dispatch({ type: 'MOCK_FILL_TEST_DATA', locale });
              message.success(t('teamMatch.testFilled'));
            }}
            okText={t('teamMatch.overwrite')}
            cancelText={t('teamMatch.cancel')}
          >
            <Button>{t('teamMatch.fillTest')}</Button>
          </Popconfirm>
          <Button onClick={() => setMockModalOpen(true)}>{t('teamMatch.appendTest')}</Button>
          <Modal
            className="tm-workbench-modal"
            title={t('teamMatch.appendTest')}
            open={mockModalOpen}
            onCancel={() => setMockModalOpen(false)}
            onOk={() => {
              const n = Math.max(1, Math.floor(mockGroupCount));
              const room = MAX_ROSTER_TEAMS - session.teams.length;
              if (room <= 0) {
                message.warning(t('teamMatch.teamLimit', { count: MAX_ROSTER_TEAMS }));
                return;
              }
              const add = Math.min(n, room);
              dispatch({ type: 'MOCK_APPEND_GROUPS', count: add, locale });
              message.success(t('teamMatch.appended', { count: add }));
              setMockModalOpen(false);
            }}
            okText={t('teamMatch.append')}
            cancelText={t('teamMatch.cancel')}
          >
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
              {t('teamMatch.appendHint', { count: session.teams.length, max: MAX_ROSTER_TEAMS })}
            </Typography.Paragraph>
            <Space align="center">
              <Typography.Text>{t('teamMatch.groupCount')}</Typography.Text>
              <InputNumber
                min={1}
                max={Math.max(1, MAX_ROSTER_TEAMS - session.teams.length)}
                value={mockGroupCount}
                onChange={(v) => setMockGroupCount(v === null ? 1 : Number(v))}
              />
            </Space>
          </Modal>
        </Space>
        <Flex
          vertical
          gap="small"
          style={{
            width: '100%',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px 16px', background: 'var(--muted)' }}>
            <Typography.Text strong>{t('teamMatch.recent', { count: state.root.historyIds.length })}</Typography.Text>
          </div>
          {state.root.historyIds.map((id) => {
            const s = state.root.sessions[id];
            if (!s) return null;
            const meta = metaFromSession(s, locale);
            return (
              <Flex
                key={id}
                align="center"
                justify="space-between"
                gap="middle"
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Typography.Text strong>{meta.name}</Typography.Text>
                  <div>
                    <Typography.Text type="secondary">
                      {meta.summary} · {new Date(meta.updatedAt).toLocaleString(locale)}
                    </Typography.Text>
                  </div>
                </div>
                <Space size="small" wrap>
                  <Button type="link" size="small" onClick={() => dispatch({ type: 'LOAD_SESSION', id })}>
                    {t('teamMatch.open')}
                  </Button>
                  <Button type="link" danger size="small" onClick={() => dispatch({ type: 'DELETE_SESSION', id })}>
                    {t('teamMatch.delete')}
                  </Button>
                </Space>
              </Flex>
            );
          })}
        </Flex>
        <Steps
          current={wizardStepToBarIndex(step, over16)}
          onChange={goToStepBarIndex}
          items={stepBarTitles.map((t) => ({ title: t }))}
        />
        <TeamMatchSteps liveUISettings={liveUISettings} onLiveUISettingsChange={setLiveUISettings} />
        <Space>
          <Button disabled={step === 0} onClick={prev}>
            {t('teamMatch.previous')}
          </Button>
          <Button type="primary" disabled={step >= 5 || !canNext()} onClick={next}>
            {t('teamMatch.next')}
          </Button>
        </Space>
      </Space>
    </Card>
    </div>
  );
}

export function TeamMatchView() {
  return (
    <App>
    <TeamMatchProvider>
      <TeamMatchInner />
    </TeamMatchProvider>
    </App>
  );
}
