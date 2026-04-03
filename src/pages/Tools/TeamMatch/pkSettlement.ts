import type { PkComputedSummary, PkPlayerResult, ResultValue } from '@/pages/Tools/TeamMatch/types';

function hasDnf(teamId: string, results: PkPlayerResult[]): boolean {
  return results.some((r) => r.teamId === teamId && r.value === 'DNF');
}

function sumTeam(teamId: string, results: PkPlayerResult[]): number | 'dnf_team' | 'incomplete' {
  const list = results.filter((r) => r.teamId === teamId);
  if (list.length < 3) return 'incomplete';
  if (list.some((r) => r.value === 'DNF')) return 'dnf_team';
  return list.reduce((acc, r) => acc + (r.value as number), 0);
}

/**
 * 结算规则：
 * - 双方均无 DNF：三人成绩相加，和小者胜
 * - 仅一方有 DNF：另一方胜
 * - 双方均有 DNF：不自动判胜（computedWinnerTeamId = null, bothSidesDnf = true）
 */
export function computePkSettlement(
  teamAId: string,
  teamBId: string,
  results: PkPlayerResult[],
): PkComputedSummary {
  const aDnf = hasDnf(teamAId, results);
  const bDnf = hasDnf(teamBId, results);
  const bothSidesDnf = aDnf && bDnf;

  if (bothSidesDnf) {
    return {
      teamATotal: 'dnf_team',
      teamBTotal: 'dnf_team',
      bothSidesDnf: true,
      computedWinnerTeamId: null,
    };
  }

  if (aDnf && !bDnf) {
    return {
      teamATotal: 'dnf_team',
      teamBTotal: sumTeam(teamBId, results) as number,
      bothSidesDnf: false,
      computedWinnerTeamId: teamBId,
    };
  }

  if (!aDnf && bDnf) {
    return {
      teamATotal: sumTeam(teamAId, results) as number,
      teamBTotal: 'dnf_team',
      bothSidesDnf: false,
      computedWinnerTeamId: teamAId,
    };
  }

  const sumA = sumTeam(teamAId, results);
  const sumB = sumTeam(teamBId, results);
  if (sumA === 'incomplete' || sumB === 'incomplete') {
    return {
      teamATotal: sumA,
      teamBTotal: sumB,
      bothSidesDnf: false,
      computedWinnerTeamId: null,
    };
  }

  if (sumA === sumB) {
    return {
      teamATotal: sumA,
      teamBTotal: sumB,
      bothSidesDnf: false,
      computedWinnerTeamId: null,
    };
  }

  return {
    teamATotal: sumA,
    teamBTotal: sumB,
    bothSidesDnf: false,
    computedWinnerTeamId: sumA < sumB ? teamAId : teamBId,
  };
}

export function formatResultValue(v: ResultValue): string {
  if (v === 'DNF') return 'DNF';
  return v.toFixed(2);
}
