import {
  allRankedActiveTeamIds,
  rankedBracketTeamIds,
} from '@/pages/Tools/TeamMatch/seedingMath';
import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { BRACKET_TEAM_COUNT } from '@/pages/Tools/TeamMatch/types';

/**
 * 正赛 16 强 id：跳过预选赛或未定 elimination 时与成绩排名前 16 一致；
 * 打完预选赛后为「保送 ∪ 胜者 ∪ 轮空晋级」按成绩排序取前 16（超过则截断）。
 */
export function computeMainBracketTeamIds(session: TeamMatchSession): string[] {
  const eventId = session.eventIds[0] ?? '333';
  const { teams, players, seeding, seedingPrimary } = session;
  const ranked = allRankedActiveTeamIds(teams, players, seeding, eventId, seedingPrimary);
  const elim = session.elimination;

  if (!elim || elim.skipped) {
    return rankedBracketTeamIds(teams, players, seeding, eventId, seedingPrimary);
  }

  const pool = new Set<string>(elim.byeTeamIds);
  for (const m of elim.matches) {
    if (m.winnerId) pool.add(m.winnerId);
  }
  for (const tid of elim.naturalByeTeamIds ?? []) {
    if (tid) pool.add(tid);
  }
  if (elim.naturalByeTeamId) pool.add(elim.naturalByeTeamId);
  return ranked.filter((id) => pool.has(id)).slice(0, BRACKET_TEAM_COUNT);
}

export function isEliminationComplete(session: TeamMatchSession): boolean {
  const elim = session.elimination;
  if (!elim || elim.skipped || elim.drawVersion < 1) return true;
  if (elim.matches.length === 0) return true;
  return elim.matches.every((m) => !!m.winnerId);
}

/** 正赛名单页：每支队伍的预选赛/正赛标签；表格行顺序可将「预选赛淘汰」置底，rankInList 仍为成绩总榜位次 */
export type MainPoolDisplayRow = {
  teamId: string;
  /** 成绩总榜序号（与「队伍确认」主排序一致） */
  rankInList: number;
  /** 若进入正赛 16 强则为 1-based 名次 */
  mainBracketRank: number | null;
  /** 展示用标签（保送、小组赛晋级、轮空进池、预选赛淘汰、正赛16强、晋级池未出线 等） */
  roleTags: string[];
};

/**
 * 构建正赛名单确认页数据源：含保送、小组赛晋级、轮空进池、被淘汰，以及是否进入正赛 16 强。
 * 跳过预选赛时仅区分「正赛16强」与「未进线」。
 */
export function buildMainPoolDisplayRows(session: TeamMatchSession): MainPoolDisplayRow[] {
  const eventId = session.eventIds[0] ?? '333';
  const { teams, players, seeding, seedingPrimary } = session;
  const ranked = allRankedActiveTeamIds(teams, players, seeding, eventId, seedingPrimary);
  const main16 = computeMainBracketTeamIds(session);
  const mainRankById = new Map(main16.map((id, i) => [id, i + 1]));
  const elim = session.elimination;

  if (!elim || elim.skipped) {
    const mainSet = new Set(main16);
    return ranked.map((id, i) => {
      const roleTags: string[] = mainSet.has(id) ? ['正赛16强'] : ['未进正赛16强'];
      return {
        teamId: id,
        rankInList: i + 1,
        mainBracketRank: mainRankById.get(id) ?? null,
        roleTags,
      };
    });
  }

  const byeSet = new Set(elim.byeTeamIds);
  const naturalSet = new Set<string>();
  for (const tid of elim.naturalByeTeamIds ?? []) {
    if (tid) naturalSet.add(tid);
  }
  if (elim.naturalByeTeamId) naturalSet.add(elim.naturalByeTeamId);

  const wonGroup = new Set<string>();
  const eliminated = new Set<string>();
  const pendingGroup = new Set<string>();
  for (const m of elim.matches) {
    if (m.winnerId) {
      wonGroup.add(m.winnerId);
      for (const tid of m.teamIds) {
        if (tid !== m.winnerId) eliminated.add(tid);
      }
    } else {
      for (const tid of m.teamIds) pendingGroup.add(tid);
    }
  }

  const poolSet = new Set<string>([...byeSet, ...wonGroup, ...naturalSet]);

  const scoreRankById = new Map(ranked.map((id, i) => [id, i + 1]));
  const orderedIds = [
    ...ranked.filter((id) => !eliminated.has(id)),
    ...ranked.filter((id) => eliminated.has(id)),
  ];

  return orderedIds.map((id) => {
    const roleTags: string[] = [];
    if (byeSet.has(id)) roleTags.push('保送');
    if (naturalSet.has(id)) roleTags.push('轮空进池');
    if (wonGroup.has(id)) roleTags.push('小组赛晋级');
    if (eliminated.has(id)) roleTags.push('预选赛淘汰');
    if (pendingGroup.has(id) && !wonGroup.has(id) && !eliminated.has(id)) roleTags.push('小组赛待定');
    const inMain = mainRankById.has(id);
    if (inMain) roleTags.push('正赛16强');
    else if (poolSet.has(id) && !eliminated.has(id)) roleTags.push('晋级池未出线');

    if (roleTags.length === 0) roleTags.push('未编入预选赛');

    return {
      teamId: id,
      rankInList: scoreRankById.get(id)!,
      mainBracketRank: mainRankById.get(id) ?? null,
      roleTags,
    };
  });
}
