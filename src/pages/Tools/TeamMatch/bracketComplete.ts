import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';

/** 淘汰赛 + 铜牌战（若已生成）均已分出胜负 */
export function isBracketFullyComplete(session: TeamMatchSession): boolean {
  for (const r of session.rounds) {
    for (const m of r) {
      if (m.teamAId && m.teamBId && !m.winnerId) return false;
    }
  }
  const b = session.bronzeMatch;
  if (b?.teamAId && b?.teamBId && !b.winnerId) return false;
  return true;
}

export type PodiumTeamIds = {
  gold: string;
  silver: string;
  bronze: string | null;
};

/** 全部完赛后：决赛冠亚军 + 铜牌战胜者（无铜牌场次时为 null） */
export function getPodiumTeamIds(session: TeamMatchSession): PodiumTeamIds | null {
  if (!isBracketFullyComplete(session)) return null;
  const final = session.rounds[3]?.[0];
  if (!final?.winnerId || !final.teamAId || !final.teamBId) return null;
  const gold = final.winnerId;
  const silver = final.winnerId === final.teamAId ? final.teamBId : final.teamAId;
  return {
    gold,
    silver,
    bronze: session.bronzeMatch?.winnerId ?? null,
  };
}
