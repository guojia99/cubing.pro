import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { MAX_ROSTER_TEAMS, MIN_TEAMS, TEAM_PLAYERS } from '@/pages/Tools/TeamMatch/types';

/** 是否可进入该向导步骤（0–4），用于步骤条点击；正赛为 step 6 不在此条切换 */
export function canAccessWizardStep(session: TeamMatchSession, target: number): boolean {
  if (target < 0 || target > 4) return false;
  if (target === 0) return true;
  if (target >= 1 && session.schools.length === 0) return false;
  if (target >= 1 && session.players.length === 0) return false;
  if (target >= 2) {
    const n = session.teams.filter((t) => !t.disabled && t.playerIds.length === TEAM_PLAYERS).length;
    if (n < MIN_TEAMS || n > MAX_ROSTER_TEAMS) return false;
  }
  if (target >= 4 && !session.seedTeamIds.some(Boolean)) return false;
  return true;
}
