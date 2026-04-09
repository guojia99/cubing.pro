import { isEliminationComplete } from '@/pages/Tools/TeamMatch/eliminationResolve';
import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import {
  BRACKET_TEAM_COUNT,
  MAX_ROSTER_TEAMS,
  MIN_TEAMS,
  TEAM_PLAYERS,
  WIZARD_STEP_ELIM_DRAW,
  WIZARD_STEP_ELIM_LIVE,
  WIZARD_STEP_MAIN_DRAW,
  WIZARD_STEP_MAIN_LIVE,
  WIZARD_STEP_MAIN_POOL_CONFIRM,
  WIZARD_STEP_PODIUM,
} from '@/pages/Tools/TeamMatch/types';

export function activeFullTeamCount(session: TeamMatchSession): number {
  return session.teams.filter((t) => !t.disabled && t.playerIds.length === TEAM_PLAYERS).length;
}

/** 满编有效队是否超过 16（需要打淘汰赛或在本页点「跳过」） */
export function hasOverSixteenFullTeams(session: TeamMatchSession): boolean {
  return activeFullTeamCount(session) > BRACKET_TEAM_COUNT;
}

function schoolsPlayersOk(session: TeamMatchSession): boolean {
  return session.schools.length > 0 && session.players.length > 0;
}

function teamCountOk(session: TeamMatchSession): boolean {
  const n = activeFullTeamCount(session);
  return n >= MIN_TEAMS && n <= MAX_ROSTER_TEAMS;
}

function rosterReady(session: TeamMatchSession): boolean {
  return schoolsPlayersOk(session) && teamCountOk(session);
}

function mainPoolPrereq(session: TeamMatchSession): boolean {
  const ne = session.elimination;
  if (!ne) return false;
  if (ne.skipped) return true;
  return isEliminationComplete(session);
}

/**
 * 步骤条可点击：`stepIndex` 从 0 起。
 * 前 4 项为向导 0–3（学校与选手 → 组队 → 成绩 → 队伍确认）；其后依赖是否超过 16 队。
 */
export function canAccessStepBarIndex(
  session: TeamMatchSession,
  stepIndex: number,
  over16: boolean,
): boolean {
  if (stepIndex < 0) return false;
  if (stepIndex === 0) return true;
  if (stepIndex === 1) return schoolsPlayersOk(session);
  if (stepIndex === 2) return schoolsPlayersOk(session) && teamCountOk(session);
  if (stepIndex === 3) return rosterReady(session);

  if (!rosterReady(session)) return false;

  if (!over16) {
    if (stepIndex === 4) return true;
    if (stepIndex === 5) return !!session.elimination?.skipped;
    if (stepIndex === 6) return (session.mainBracketTeamIds?.length ?? 0) >= MIN_TEAMS;
    if (stepIndex === 7) return session.status === 'live';
    return false;
  }

  const ne = session.elimination;
  const skipped = !!ne?.skipped;
  if (stepIndex === 4) return true;
  if (stepIndex === 5) {
    if (skipped) return false;
    return (ne?.drawVersion ?? 0) >= 1;
  }
  if (stepIndex === 6) return mainPoolPrereq(session);
  if (stepIndex === 7) return (session.mainBracketTeamIds?.length ?? 0) >= MIN_TEAMS;
  if (stepIndex === 8) return session.status === 'live';
  return false;
}

/** 步骤条序号 → wizardStep */
export function stepBarIndexToWizardStep(stepIndex: number, over16: boolean): number {
  if (stepIndex <= 3) return stepIndex;
  if (over16) {
    if (stepIndex === 4) return WIZARD_STEP_ELIM_DRAW;
    if (stepIndex === 5) return WIZARD_STEP_ELIM_LIVE;
    if (stepIndex === 6) return WIZARD_STEP_MAIN_POOL_CONFIRM;
    if (stepIndex === 7) return WIZARD_STEP_MAIN_DRAW;
    return WIZARD_STEP_MAIN_LIVE;
  }
  if (stepIndex === 4) return WIZARD_STEP_ELIM_DRAW;
  if (stepIndex === 5) return WIZARD_STEP_MAIN_POOL_CONFIRM;
  if (stepIndex === 6) return WIZARD_STEP_MAIN_DRAW;
  return WIZARD_STEP_MAIN_LIVE;
}

/** wizardStep → 步骤条高亮序号 */
export function wizardStepToBarIndex(wizardStep: number, over16: boolean): number {
  if (wizardStep >= 0 && wizardStep <= 3) return wizardStep;
  if (over16) {
    if (wizardStep === WIZARD_STEP_ELIM_DRAW) return 4;
    if (wizardStep === WIZARD_STEP_ELIM_LIVE) return 5;
    if (wizardStep === WIZARD_STEP_MAIN_POOL_CONFIRM) return 6;
    if (wizardStep === WIZARD_STEP_MAIN_DRAW) return 7;
    if (wizardStep === WIZARD_STEP_MAIN_LIVE || wizardStep === WIZARD_STEP_PODIUM) return 8;
    return 0;
  }
  if (wizardStep === WIZARD_STEP_ELIM_DRAW || wizardStep === WIZARD_STEP_ELIM_LIVE) return 4;
  if (wizardStep === WIZARD_STEP_MAIN_POOL_CONFIRM) return 5;
  if (wizardStep === WIZARD_STEP_MAIN_DRAW) return 6;
  if (wizardStep === WIZARD_STEP_MAIN_LIVE || wizardStep === WIZARD_STEP_PODIUM) return 7;
  return 0;
}

/** 仅队伍选择子步（0–3）条内跳转（兼容旧逻辑） */
export function canAccessWizardStep(session: TeamMatchSession, target: number): boolean {
  if (target < 0 || target > 3) return false;
  if (target === 0) return true;
  if (target >= 1 && session.schools.length === 0) return false;
  if (target >= 1 && session.players.length === 0) return false;
  if (target >= 2) {
    const n = activeFullTeamCount(session);
    if (n < MIN_TEAMS || n > MAX_ROSTER_TEAMS) return false;
  }
  return true;
}
