import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { MAX_TEAMS, MIN_TEAMS, TEAM_PLAYERS } from '@/pages/Tools/TeamMatch/types';

/** 是否可进入该向导步骤（0–4），用于步骤条点击 */
export function canAccessWizardStep(session: TeamMatchSession, target: number): boolean {
  if (target < 0 || target > 4) return false;
  if (target === 0) return true;
  if (target >= 1 && session.schools.length === 0) return false;
  if (target >= 2 && session.players.length === 0) return false;
  if (target >= 3) {
    const n = session.teams.filter((t) => !t.disabled && t.playerIds.length === TEAM_PLAYERS).length;
    if (n < MIN_TEAMS || n > MAX_TEAMS) return false;
  }
  if (target >= 4 && !session.seedTeamIds.some(Boolean)) return false;
  return true;
}
