import type {
  BracketMatch,
  EliminationGroupMatch,
  ElimGroupSize,
  TeamMatchSession,
} from '@/pages/Tools/TeamMatch/types';

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isEliminationGroupMatch(
  m: BracketMatch | EliminationGroupMatch,
): m is EliminationGroupMatch {
  return Array.isArray((m as EliminationGroupMatch).teamIds);
}

/** 两两配对；奇数时最后一队轮空（无 PK，视为直接晋级池）——仅用于旧逻辑/测试 */
export function pairTeamIdsRandom(teamIds: string[], rng: () => number): { pairs: [string, string][]; byeId: string | null } {
  const shuffled = shuffle(teamIds, rng);
  const pairs: [string, string][] = [];
  let byeId: string | null = null;
  if (shuffled.length % 2 === 1) {
    byeId = shuffled.pop() ?? null;
  }
  for (let i = 0; i < shuffled.length; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];
    if (a && b) pairs.push([a, b]);
  }
  return { pairs, byeId };
}

export function buildEliminationBracketMatches(
  pairs: [string, string][],
  waveSizes: number[],
): BracketMatch[] {
  if (pairs.length !== waveSizes.reduce((s, n) => s + n, 0)) {
    throw new Error('eliminationDraw: waveSizes sum must equal pair count');
  }
  const matches: BracketMatch[] = [];
  let pi = 0;
  for (let wn = 0; wn < waveSizes.length; wn++) {
    for (let j = 0; j < waveSizes[wn]; j++) {
      const [a, b] = pairs[pi];
      pi += 1;
      const id = `elim-m${matches.length}`;
      matches.push({
        id,
        roundIndex: -1,
        indexInRound: matches.length,
        teamAId: a,
        teamBId: b,
        byeWinnerId: null,
        winnerId: null,
        pk: {
          teamAId: a,
          teamBId: b,
          currentResults: [],
          scoreHistory: [],
          resolution: null,
        },
      });
    }
  }
  return matches;
}

/**
 * 主分组后剩余的队：能凑满 groupSize 的继续拆成满组；2～groupSize-1 人合并为一场小组 PK（如 3 人即 1v1v1）；仅剩 1 人才进 naturalByeTeamIds。
 */
export function packRemainderIntoGroupMatches(
  remainder: string[],
  groupSize: ElimGroupSize,
): { extraGroups: string[][]; naturalByeTeamIds: string[] } {
  const r = [...remainder];
  const extraGroups: string[][] = [];
  while (r.length >= groupSize) {
    extraGroups.push(r.splice(0, groupSize));
  }
  if (r.length === 0) return { extraGroups, naturalByeTeamIds: [] };
  if (r.length === 1) return { extraGroups, naturalByeTeamIds: r };
  extraGroups.push([...r]);
  return { extraGroups, naturalByeTeamIds: [] };
}

/**
 * 随机分组：先尽量每组 groupSize 人；剩余按 {@link packRemainderIntoGroupMatches} 再开赛，仅单队轮空进晋级池。
 */
export function groupTeamIdsRandom(
  teamIds: string[],
  groupSize: ElimGroupSize,
  rng: () => number,
): { groups: string[][]; naturalByeTeamIds: string[] } {
  const shuffled = shuffle([...teamIds], rng);
  const groups: string[][] = [];
  while (shuffled.length >= groupSize) {
    groups.push(shuffled.splice(0, groupSize));
  }
  const { extraGroups, naturalByeTeamIds } = packRemainderIntoGroupMatches(shuffled, groupSize);
  return { groups: [...groups, ...extraGroups], naturalByeTeamIds };
}

export function buildElimGroupMatches(groups: string[][], waveSizes: number[]): EliminationGroupMatch[] {
  if (groups.length !== waveSizes.reduce((s, n) => s + n, 0)) {
    throw new Error('eliminationDraw: waveSizes sum must equal group count');
  }
  const matches: EliminationGroupMatch[] = [];
  let gi = 0;
  for (let wn = 0; wn < waveSizes.length; wn++) {
    for (let j = 0; j < waveSizes[wn]; j++) {
      const teamIds = groups[gi];
      gi += 1;
      const id = `elim-m${matches.length}`;
      matches.push({
        id,
        teamIds,
        winnerId: null,
        pk: {
          teamIds,
          currentResults: [],
          scoreHistory: [],
          resolution: null,
        },
      });
    }
  }
  return matches;
}

export function defaultEliminationState(session: TeamMatchSession): NonNullable<TeamMatchSession['elimination']> {
  void session;
  return {
    skipped: false,
    groupSize: 3,
    byeTeamIds: [],
    drawVersion: 0,
    naturalByeTeamIds: [],
    waveSizes: [],
    matches: [],
  };
}
